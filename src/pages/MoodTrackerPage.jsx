import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Grid,
  alpha,
  CircularProgress,
  Paper,
  Button
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  getDocs,
  serverTimestamp,
  limit,
  startAfter,
  setDoc
} from 'firebase/firestore';
import { format, startOfDay, endOfDay, subDays, eachDayOfInterval } from 'date-fns';

// Import components
import MoodSelector from '../components/mood/MoodSelector';
import MoodStats from '../components/mood/MoodStats';
import MoodCalendar from '../components/mood/MoodCalendar';

// Mood types with their colors
export const MOOD_TYPES = {
  Happy: { color: '#FFD700', emoji: '😊' },      // Yellow
  Productive: { color: '#9370DB', emoji: '💪' },  // Purple
  Disappointed: { color: '#000000', emoji: '😞' }, // Black
  Angry: { color: '#FF0000', emoji: '😠' },       // Red
  Stressed: { color: '#FFA500', emoji: '😰' },    // Orange
  Sad: { color: '#0000FF', emoji: '😢' },         // Blue
  Neutral: { color: '#F5F5DC', emoji: '😐' },     // Beige
  Sick: { color: '#8B4513', emoji: '🤒' },        // Brown
  Relaxed: { color: '#89CFF0', emoji: '😌' },     // Baby Blue
  Lazy: { color: '#90EE90', emoji: '😴' },        // Light Green
  Depressed: { color: '#808080', emoji: '😔' },   // Grey
  Excited: { color: '#006400', emoji: '🤩' },     // Dark Green
  Grateful: { color: '#FFB6C1', emoji: '🙏' },    // Baby Pink
  Silly: { color: '#FFFFFF', emoji: '🤪' },       // White
  Loving: { color: '#FF1493', emoji: '🥰' }       // Dark Pink
};

// Styled components
const GlassCard = styled(Paper)(({ theme }) => ({
  backdropFilter: 'blur(20px)',
  backgroundColor: alpha('#fff', 0.05),
  borderRadius: '24px',
  border: `1px solid ${alpha('#fff', 0.12)}`,
  padding: theme.spacing(3),
  transition: 'all 0.3s ease',
  '&:hover': {
    backgroundColor: alpha('#fff', 0.08),
    transform: 'translateY(-4px)',
    boxShadow: `0 8px 32px -1px ${alpha('#000000', 0.14)}, 0 4px 16px -1px ${alpha('#000000', 0.08)}`
  }
}));

const GradientText = styled(Typography)(({ theme }) => ({
  fontWeight: 700,
  background: 'linear-gradient(45deg, #fff 30%, rgba(255,255,255,0.8) 90%)',
  backgroundClip: 'text',
  WebkitBackgroundClip: 'text',
  color: 'transparent',
  textShadow: '0 2px 10px rgba(0,0,0,0.1)',
  letterSpacing: '-0.02em'
}));

// Tab Panel component
function TabPanel({ children, value, index, ...other }) {
  return (
    <Box
      role="tabpanel"
      hidden={value !== index}
      id={`mood-tabpanel-${index}`}
      aria-labelledby={`mood-tab-${index}`}
      {...other}
      sx={{ mt: 3 }}
    >
      {value === index && children}
    </Box>
  );
}

// Update the mood history item styling
const MoodHistoryItem = ({ mood }) => {
  const moodType = MOOD_TYPES[mood.mood];
  return (
    <Box
      sx={{
        p: 2,
        mb: 2,
        borderRadius: 2,
        backgroundColor: alpha('#fff', 0.08),
        border: `1px solid ${alpha('#fff', 0.1)}`,
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        transition: 'all 0.2s ease',
        '&:hover': {
          backgroundColor: alpha('#fff', 0.12),
          transform: 'translateY(-2px)'
        }
      }}
    >
      <Typography variant="h4" component="span">
        {moodType.emoji}
      </Typography>
      <Box sx={{ flex: 1 }}>
        <Typography 
          variant="h6" 
          sx={{ 
            color: alpha(moodType.color, 0.9),
            fontWeight: 600,
            mb: 0.5
          }}
        >
          {mood.mood}
        </Typography>
        <Typography 
          variant="caption" 
          sx={{ 
            color: alpha('#fff', 0.6)
          }}
        >
          {format(new Date(mood.date), 'MMMM d, yyyy - h:mm a')}
        </Typography>
      </Box>
    </Box>
  );
};

export default function MoodTrackerPage() {
  const { user, userData } = useAuth();
  const [activeTab, setActiveTab] = useState('daily');
  const [loading, setLoading] = useState(true);
  const [todayMood, setTodayMood] = useState(null);
  const [moodHistory, setMoodHistory] = useState([]);
  const [error, setError] = useState(null);
  const [moodNote, setMoodNote] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [lastVisible, setLastVisible] = useState(null);
  const [hasMore, setHasMore] = useState(true);

  // Function to handle mood selection
  const handleMoodSelect = async (moodName) => {
    if (!user) return;
    
    try {
      // If moodName is null, we're just clearing the selection
      if (moodName === null) {
        setTodayMood(null);
        return;
      }

      // Only proceed if we have a valid mood name
      if (!MOOD_TYPES[moodName]) {
        console.error('Invalid mood name:', moodName);
        setError('Invalid mood selection');
        return;
      }

      const today = format(new Date(), 'yyyy-MM-dd');
      const moodRef = collection(db, 'moods');
      const timestamp = serverTimestamp();
      
      const newMood = {
        mood: moodName,
        userId: user.uid,
        date: today,
        updatedAt: timestamp,
        type: {
          color: MOOD_TYPES[moodName].color,
          emoji: MOOD_TYPES[moodName].emoji
        }
      };

      try {
        // Check if there's already a mood for today
        const todayQuery = query(
          moodRef,
          where('userId', '==', user.uid),
          where('date', '==', today)
        );

        const querySnapshot = await getDocs(todayQuery);
        
        if (!querySnapshot.empty) {
          // Update existing mood
          const existingMoodDoc = querySnapshot.docs[0];
          await updateDoc(doc(db, 'moods', existingMoodDoc.id), newMood);
        } else {
          // Create new mood
          await addDoc(moodRef, {
            ...newMood,
            createdAt: timestamp
          });
        }
        
        // Update local state with the new mood
        setTodayMood({
          mood: moodName,
          updatedAt: new Date(), // Use local date for immediate UI update
          type: MOOD_TYPES[moodName]
        });

        setError(null); // Clear any existing errors
      } catch (error) {
        console.error("Error updating mood in Firestore:", error);
        setError("Failed to save mood to database");
      }
    } catch (error) {
      console.error("Error in handleMoodSelect:", error);
      setError("An unexpected error occurred");
    }
  };

  // Effect to fetch today's mood and mood history
  useEffect(() => {
    if (!user?.uid) return;
    
    const today = format(new Date(), 'yyyy-MM-dd');
    const moodRef = collection(db, 'moods');
    
    // Subscribe to today's mood
    const unsubscribe = onSnapshot(
      query(
        moodRef,
        where('userId', '==', user.uid),
        where('date', '==', today)
      ),
      (snapshot) => {
        if (!snapshot.empty) {
          const moodDoc = snapshot.docs[0].data();
          if (moodDoc.mood && MOOD_TYPES[moodDoc.mood]) {
            setTodayMood({
              id: snapshot.docs[0].id,
              mood: moodDoc.mood,
              updatedAt: moodDoc.updatedAt,
              type: MOOD_TYPES[moodDoc.mood]
            });
          } else {
            setTodayMood(null);
          }
        } else {
          setTodayMood(null);
        }
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching today's mood:", error);
        setError("Failed to load today's mood");
        setLoading(false);
      }
    );

    // Fetch mood history
    const historyQuery = query(
      moodRef,
      where('userId', '==', user.uid),
      orderBy('date', 'desc'),
      limit(30)
    );

    const unsubHistory = onSnapshot(historyQuery, (snapshot) => {
      const moods = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        type: MOOD_TYPES[doc.data().mood]
      }));
      setMoodHistory(moods);
      setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
      setHasMore(snapshot.docs.length === 30);
    });

    return () => {
      unsubscribe();
      unsubHistory();
    };
  }, [user?.uid]);

  const loadMoreMoods = async () => {
    if (!user || !lastVisible || !hasMore) return;

    const moreHistoryQuery = query(
      collection(db, "moods"),
      where("userId", "==", user.uid),
      orderBy("date", "desc"),
      startAfter(lastVisible),
      limit(30)
    );

    const snapshot = await getDocs(moreHistoryQuery);
    const moreMoods = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      type: MOOD_TYPES[doc.data().mood]
    }));

    setMoodHistory(prev => [...prev, ...moreMoods]);
    setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
    setHasMore(snapshot.docs.length === 30);
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleAddMood = async (mood) => {
    if (!user?.uid) return;

    try {
      const moodRef = doc(db, 'moods', user.uid);
      await setDoc(moodRef, {
        mood: mood,
        userId: user.uid,
        updatedAt: serverTimestamp()
      }, { merge: true });
      
      setTodayMood(MOOD_TYPES[mood]);
    } catch (error) {
      console.error("Error adding mood:", error);
      setError("Failed to add mood");
    }
  };

  const handleUpdateMood = async (moodId, updates) => {
    try {
      const moodRef = doc(db, 'moods', user.uid);
      await setDoc(moodRef, {
        mood: updates.mood,
        userId: user.uid,
        updatedAt: serverTimestamp()
      }, { merge: true });
      
      setTodayMood(MOOD_TYPES[updates.mood]);
    } catch (error) {
      console.error("Error updating mood:", error);
      setError("Failed to update mood");
    }
  };

  const handleDeleteMood = async (moodId) => {
    try {
      const moodRef = doc(db, 'moods', user.uid);
      await deleteDoc(moodRef);
      
      setTodayMood(null);
    } catch (error) {
      console.error("Error deleting mood:", error);
      setError("Failed to delete mood");
    }
  };

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, color: '#fff' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <GradientText variant="h4" sx={{ mb: 4 }}>
          Mood Tracker <span style={{ fontSize: "1.2em" }}>🌈</span>
        </GradientText>

        {/* Main Content */}
        <GlassCard>
          {/* Tabs */}
          <Tabs 
            value={activeTab}
            onChange={handleTabChange}
            sx={{
              borderBottom: 1,
              borderColor: alpha('#fff', 0.1),
              '& .MuiTab-root': {
                color: alpha('#fff', 0.7),
                '&.Mui-selected': {
                  color: '#fff'
                }
              }
            }}
          >
            <Tab value="daily" label="Daily Log" />
            <Tab value="stats" label="Statistics" />
            <Tab value="calendar" label="Calendar View" />
          </Tabs>

          {/* Tab Panels */}
          <TabPanel value={activeTab} index="daily">
            <MoodSelector 
              todayMood={todayMood}
              onMoodSelect={handleMoodSelect}
              setTodayMood={setTodayMood}
            />
          </TabPanel>
          <TabPanel value={activeTab} index="stats">
            <MoodStats moodHistory={moodHistory} />
          </TabPanel>
          <TabPanel value={activeTab} index="calendar">
            <MoodCalendar moodHistory={moodHistory} />
          </TabPanel>

          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Mood History
            </Typography>
            {moodHistory.map((mood) => (
              <MoodHistoryItem key={mood.id} mood={mood} />
            ))}
            {hasMore && (
              <Button
                fullWidth
                variant="outlined"
                onClick={loadMoreMoods}
                sx={{ 
                  mt: 2,
                  color: '#fff',
                  borderColor: alpha('#fff', 0.3),
                  '&:hover': {
                    borderColor: '#fff',
                    bgcolor: alpha('#fff', 0.1)
                  }
                }}
              >
                Load More History
              </Button>
            )}
          </Box>
        </GlassCard>
      </motion.div>
    </Box>
  );
} 