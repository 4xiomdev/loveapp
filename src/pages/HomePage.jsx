// src/pages/HomePage.jsx
import React, { useEffect, useState, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import { usePartnerData } from "../hooks/usePartnerData";
import { useNavigate } from "react-router-dom";
import { db, auth } from "../firebase";
import { 
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  limit,
  serverTimestamp,
  getDoc,
  setDoc,
  updateDoc,
  addDoc,
  getDocs
} from "firebase/firestore";
import { signOut } from "firebase/auth";
import { getFunctions, httpsCallable } from "firebase/functions";

import {
  Box,
  Typography,
  Paper,
  Grid,
  alpha,
  Button,
  CircularProgress,
  TextField,
  IconButton,
  Stack,
  Alert,
  Tooltip,
  Menu,
  MenuItem,
  Chip
} from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import SendIcon from "@mui/icons-material/Send";
import StarIcon from "@mui/icons-material/Star";
import Confetti from "react-confetti";
import { styled, keyframes, useTheme } from "@mui/material/styles";
import { Link } from "react-router-dom";
import { format, startOfDay, differenceInDays } from "date-fns";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import SyncIcon from '@mui/icons-material/Sync';
import EventIcon from '@mui/icons-material/Event';
import MoodIcon from '@mui/icons-material/Mood';
import { useGoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import { MOOD_TYPES } from './MoodTrackerPage';
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff';
import FavoriteIcon from '@mui/icons-material/Favorite';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import PauseIcon from '@mui/icons-material/Pause';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import LocationOnIcon from '@mui/icons-material/LocationOn';

import { USER_IDS, DEFAULT_USER_SETTINGS } from "../config/userConfig";

// Animation keyframes
const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const floatAnimation = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
  100% { transform: translateY(0px); }
`;

const glowAnimation = keyframes`
  0% { filter: drop-shadow(0 0 5px rgba(255,215,0,0.5)); }
  50% { filter: drop-shadow(0 0 15px rgba(255,215,0,0.8)); }
  100% { filter: drop-shadow(0 0 5px rgba(255,215,0,0.5)); }
`;

// Add new keyframe for subtle floating
const subtleFloat = keyframes`
  0% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
  100% { transform: translateY(0); }
`;

// Styled components
const GlassCard = styled(Paper)(({ theme }) => ({
  backdropFilter: 'blur(20px)',
  backgroundColor: alpha('#fff', 0.05),
  borderRadius: '24px',
  border: `1px solid ${alpha('#fff', 0.12)}`,
  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
  overflow: 'hidden',
  '&:hover': {
    backgroundColor: alpha('#fff', 0.08),
    transform: 'translateY(-4px)',
    boxShadow: `
      0 8px 32px -1px ${alpha('#000000', 0.14)},
      0 4px 16px -1px ${alpha('#000000', 0.08)}
    `
  }
}));

const GradientText = styled(Typography)(({ theme }) => ({
  fontWeight: 700,
  background: 'linear-gradient(45deg, #fff 30%, rgba(255,255,255,0.8) 90%)',
  backgroundClip: 'text',
  WebkitBackgroundClip: 'text',
  color: 'transparent',
  textShadow: '0 2px 10px rgba(0,0,0,0.1)',
  letterSpacing: '-0.02em',
  animation: `${fadeIn} 0.6s ease-out`
}));

// Framer Motion variants
const hoverScale = {
  rest: { scale: 1 },
  hover: { scale: 1.02 }
};

// Add new animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  show: { 
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

function HomeMoodWidget() {
  const [loading, setLoading] = useState(false);
  const [myMood, setMyMood] = useState(null);
  const [partnerMood, setPartnerMood] = useState(null);
  const { user, userData } = useAuth();
  const { partnerData } = usePartnerData();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    let unsubUser = null;
    let unsubPartner = null;
    let isMounted = true;

    const setupSubscriptions = async () => {
      try {
        const today = format(new Date(), 'yyyy-MM-dd');
        const moodRef = collection(db, 'moods');

        // Subscribe to user's mood
        unsubUser = onSnapshot(
          query(
            moodRef,
            where('userId', '==', user.uid),
            where('date', '==', today)
          ),
          (snapshot) => {
            if (!isMounted) return;
            
            if (!snapshot.empty) {
              const moodDoc = snapshot.docs[0].data();
              if (moodDoc.mood && MOOD_TYPES[moodDoc.mood]) {
                setMyMood({
                  id: snapshot.docs[0].id,
                  mood: moodDoc.mood,
                  updatedAt: moodDoc.updatedAt,
                  type: {
                    color: MOOD_TYPES[moodDoc.mood].color,
                    emoji: MOOD_TYPES[moodDoc.mood].emoji
                  }
                });
              } else {
                setMyMood(null);
              }
            } else {
              setMyMood(null);
            }
            setLoading(false);
          }
        );

        // Subscribe to partner's mood if available
        if (userData?.partnerId) {
          unsubPartner = onSnapshot(
            query(
              moodRef,
              where('userId', '==', userData.partnerId),
              where('date', '==', today)
            ),
            (snapshot) => {
              if (!isMounted) return;
              
              if (!snapshot.empty) {
                const moodDoc = snapshot.docs[0].data();
                if (moodDoc.mood && MOOD_TYPES[moodDoc.mood]) {
                  setPartnerMood({
                    id: snapshot.docs[0].id,
                    mood: moodDoc.mood,
                    updatedAt: moodDoc.updatedAt,
                    type: {
                      color: MOOD_TYPES[moodDoc.mood].color,
                      emoji: MOOD_TYPES[moodDoc.mood].emoji
                    }
                  });
                } else {
                  setPartnerMood(null);
                }
              } else {
                setPartnerMood(null);
              }
            }
          );
        }
      } catch (error) {
        console.error('Error setting up mood subscriptions:', error);
        if (isMounted) {
          setMyMood(null);
          setPartnerMood(null);
          setLoading(false);
        }
      }
    };

    setupSubscriptions();

    return () => {
      isMounted = false;
      if (unsubUser) unsubUser();
      if (unsubPartner) unsubPartner();
    };
  }, [user?.uid, userData?.partnerId]);

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Just now';
    try {
      if (timestamp.toDate) {
        return format(timestamp.toDate(), 'h:mm a');
      }
      if (timestamp instanceof Date) {
        return format(timestamp, 'h:mm a');
      }
      return 'Just now';
    } catch (error) {
      console.error('Error formatting timestamp:', error);
      return 'Just now';
    }
  };

  const MoodCard = ({ title, mood, defaultMessage = "Not set yet", isPartner = false }) => {
    const moodColor = mood?.type?.color || '#fff';
    const moodEmoji = mood?.type?.emoji;
    
    return (
      <Box
        onClick={() => navigate('/app/mood')}
        sx={{
          position: 'relative',
          cursor: 'pointer',
          height: '100%',
          borderRadius: '16px',
          overflow: 'hidden',
          background: `linear-gradient(135deg, ${alpha(moodColor, 0.12)} 0%, ${alpha(moodColor, 0.05)} 100%)`,
          backdropFilter: 'blur(10px)',
          border: `1px solid ${alpha(moodColor, 0.2)}`,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            background: `linear-gradient(135deg, ${alpha(moodColor, 0.15)} 0%, ${alpha(moodColor, 0.08)} 100%)`,
            boxShadow: `0 8px 32px ${alpha(moodColor, 0.25)}`,
            transform: 'translateY(-4px)'
          }
        }}
      >
        <Box sx={{ p: { xs: 1.5, sm: 2 } }}>
          {/* Header */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            mb: 1
          }}>
            <Typography 
              variant="subtitle2"
              sx={{
                color: alpha(moodColor, 0.9),
                fontSize: '0.7rem',
                fontWeight: 700,
                letterSpacing: '1.5px',
                textTransform: 'uppercase',
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}
            >
              <Box
                component="span"
                sx={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  bgcolor: moodColor,
                  boxShadow: `0 0 10px ${alpha(moodColor, 0.5)}`
                }}
              />
              {title}
            </Typography>
            
            {mood?.updatedAt && (
              <Typography 
                variant="caption"
                sx={{
                  color: alpha(moodColor, 0.7),
                  fontSize: '0.65rem'
                }}
              >
                {formatTimestamp(mood.updatedAt)}
              </Typography>
            )}
          </Box>

          {/* Content */}
          <Box sx={{ 
            display: 'flex',
            alignItems: 'center',
            gap: 1.5
          }}>
            <Box
              sx={{
                fontSize: { xs: '2rem', sm: '2.5rem' },
                lineHeight: 1,
                filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.15))'
              }}
            >
              {moodEmoji || '😊'}
            </Box>

            <Box sx={{ flex: 1 }}>
              <Typography
                variant="h6"
                sx={{
                  color: moodColor,
                  fontWeight: mood ? 700 : 500,
                  fontSize: { xs: '1rem', sm: '1.1rem' },
                  lineHeight: 1.2,
                  textShadow: mood 
                    ? `0 2px 10px ${alpha(moodColor, 0.3)}`
                    : 'none',
                  mb: 0.5
                }}
              >
                {mood ? mood.mood : defaultMessage}
              </Typography>
              
              {!mood && (
                <Typography
                  variant="caption"
                  sx={{
                    color: alpha(moodColor, 0.7),
                    fontSize: '0.7rem',
                    display: 'block'
                  }}
                >
                  Tap to set your mood
                </Typography>
              )}
            </Box>
          </Box>
        </Box>
      </Box>
    );
  };

  if (loading) {
    return (
      <Box sx={{ 
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <CircularProgress size={24} sx={{ color: alpha('#fff', 0.7) }} />
      </Box>
    );
  }

  return (
    <Box sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column'
    }}>
      <Typography 
        variant="h6" 
        sx={{ 
          mb: 1.5,  // Reduced from 2
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}
      >
        <Box 
          component="span" 
          sx={{ 
            fontSize: '1.4em', 
            transform: 'rotate(-5deg)',
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
          }}
        >
          🌈
        </Box>
        Today's Moods
      </Typography>
      
      <Box sx={{ 
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5  // Reduced from 2
      }}>
        <MoodCard 
          title="MY MOOD" 
          mood={myMood} 
          defaultMessage="How are you feeling?"
        />
        <MoodCard 
          title="PARTNER'S MOOD" 
          mood={partnerMood} 
          defaultMessage="Not set yet"
          isPartner
        />
      </Box>
    </Box>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const { user, userData } = useAuth();
  const { partnerData } = usePartnerData();
  const theme = useTheme();
  
  // State declarations
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reminders, setReminders] = useState([]);
  const [lastPartnerMsg, setLastPartnerMsg] = useState(null);
  const [todayMood, setTodayMood] = useState(null);
  const [partnerMood, setPartnerMood] = useState(null);
  const [moodLoading, setMoodLoading] = useState(true);
  const [stars, setStars] = useState(null);
  const [events, setEvents] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [calendarLoading, setCalendarLoading] = useState(false);

  // Unsubscribe functions
  let unsubscribePartner = null;
  let unsubscribeMessages = null;
  let unsubscribeReminders = null;
  let unsubscribeMood = null;

  const quotes = [
    "“Love recognizes no barriers.” — Maya Angelou",
    "“At the touch of love everyone becomes a poet.” — Plato",
    "“If I know what love is, it is because of you.” — Hermann Hesse",
    "“Love is composed of a single soul inhabiting two bodies.” — Aristotle",
    "“Where there is love there is life.” — Mahatma Gandhi",
  ];
  const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];

  const login = useGoogleLogin({
    scope: 'https://www.googleapis.com/auth/calendar.readonly',
    onSuccess: async (response) => {
      setError(null);
      setIsAuthenticated(true);
      // Store token with expiry time (1 hour from now)
      const expiryTime = new Date().getTime() + (60 * 60 * 1000);
      localStorage.setItem('google_token', response.access_token);
      localStorage.setItem('google_token_expiry', expiryTime.toString());
      fetchEvents(response.access_token);
    },
    onError: (error) => {
      console.error('Login Failed:', error);
      setError('Failed to connect to Google Calendar. Please try again.');
      setIsAuthenticated(false);
    },
    flow: 'implicit',
    ux_mode: 'redirect',
  });

  const checkTokenExpiry = () => {
    const token = localStorage.getItem('google_token');
    const expiry = localStorage.getItem('google_token_expiry');
    
    if (!token || !expiry) {
      return false;
    }

    const now = new Date().getTime();
    const expiryTime = parseInt(expiry);
    
    // Token is valid if current time is less than expiry time
    return now < expiryTime;
  };

  const fetchEvents = async (token) => {
    if (!token) {
      setError('No authentication token found');
      setIsAuthenticated(false);
      return;
    }

    setCalendarLoading(true);
    setError(null);
    try {
      const response = await axios.get(
        'https://www.googleapis.com/calendar/v3/calendars/primary/events',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          params: {
            timeMin: new Date().toISOString(),
            maxResults: 5,
            singleEvents: true,
            orderBy: 'startTime',
          },
        }
      );
      setEvents(response.data.items || []);
    } catch (error) {
      console.error('Error fetching events:', error);
      if (error.response?.status === 401) {
        // Token expired or invalid
        localStorage.removeItem('google_token');
        localStorage.removeItem('google_token_expiry');
        setIsAuthenticated(false);
        setError('Google Calendar session expired. Please reconnect.');
      } else {
        setError('Failed to fetch calendar events. Please try again later.');
      }
    } finally {
      setCalendarLoading(false);
    }
  };

  // Check token validity on mount and set up periodic check
  useEffect(() => {
    const token = localStorage.getItem('google_token');
    
    if (token && checkTokenExpiry()) {
      setIsAuthenticated(true);
      fetchEvents(token);
    } else {
      // Clear invalid token
      localStorage.removeItem('google_token');
      localStorage.removeItem('google_token_expiry');
      setIsAuthenticated(false);
    }

    // Check token expiry every minute
    const interval = setInterval(() => {
      if (!checkTokenExpiry()) {
        localStorage.removeItem('google_token');
        localStorage.removeItem('google_token_expiry');
        setIsAuthenticated(false);
        setError('Google Calendar session expired. Please reconnect.');
      }
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!user || !userData) return;
    setLoading(false);

    return () => {
      setLoading(true);
    };
  }, [user, userData]);

  useEffect(() => {
    if (!user) return;
    let isMounted = true;

    const initializeUser = async () => {
      if (!user?.uid) return;
      
      try {
        const userRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userRef);
        
        if (!userDoc.exists()) {
          await setDoc(userRef, {
            email: user.email,
            displayName: user.displayName || user.email.split('@')[0],
            photoURL: user.photoURL,
            partnerId: null,
            stars: 0,
            settings: {
              mode: 'SOLO',
              theme: 'light',
              notifications: true,
              updatedAt: serverTimestamp()
            },
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
          console.log('User document initialized');
        }
      } catch (error) {
        console.error('Error initializing user data:', error);
      }
    };

    initializeUser();

    return () => {
      isMounted = false;
    };
  }, [user]);

  useEffect(() => {
    if (!user) return;
    let isMounted = true;

    const userRef = doc(db, "users", user.uid);
    const unsubUser = onSnapshot(userRef, (snap) => {
      if (snap.exists() && isMounted) {
        setStars(snap.data().stars ?? 0);
      }
    }, (error) => {
      console.error("Error fetching user data:", error);
    });

    return () => {
      unsubUser();
      isMounted = false;
      setStars(null);
    };
  }, [user]);

  // Cleanup function for Firestore listeners
  const cleanupListeners = () => {
    try {
      if (typeof unsubscribePartner === 'function') unsubscribePartner();
      if (typeof unsubscribeMessages === 'function') unsubscribeMessages();
      if (typeof unsubscribeReminders === 'function') unsubscribeReminders();
      if (typeof unsubscribeMood === 'function') unsubscribeMood();
    } catch (error) {
      console.warn('Error during cleanup:', error);
    }
  };

  useEffect(() => {
    if (!user || !userData) return;

    let unsubscribePartner = () => {};
    let unsubscribeMessages = () => {};
    let unsubscribeReminders = () => {};
    let unsubscribeMood = () => {};
    let isMounted = true;

    const setupListeners = async () => {
      try {
        // Partner listener
        if (userData.partnerId) {
          const partnerRef = doc(db, "users", userData.partnerId);
          unsubscribePartner = onSnapshot(partnerRef, (doc) => {
            if (!isMounted) return;
            if (doc.exists()) {
              setPartnerMood(doc.data()?.mood);
            }
          });
        }

        // Messages listener
        const messageQuery = query(
          collection(db, "messages"),
          where("participants", "array-contains", user.uid),
          where("senderId", "==", userData.partnerId),
          orderBy("createdAt", "desc"),
          limit(5)
        );
        unsubscribeMessages = onSnapshot(messageQuery, (snapshot) => {
          if (!isMounted) return;
          if (!snapshot.empty) {
            setLastPartnerMsg(snapshot.docs[0].data());
          } else {
            setLastPartnerMsg(null);
          }
        });

        // Reminders listener
        const remindersQuery = query(
          collection(db, "reminders"),
          where("owner", "==", user.uid),
          orderBy("createdAt", "desc"),
          limit(5)
        );
        unsubscribeReminders = onSnapshot(remindersQuery, (snapshot) => {
          if (!isMounted) return;
          const remindersData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setReminders(remindersData);
        });

        // Mood listener
        const today = startOfDay(new Date());
        const userMoodQuery = query(
          collection(db, "moods"),
          where("userId", "==", user.uid),
          where("date", ">=", today)
        );
        const partnerMoodQuery = userData?.partnerId ? query(
          collection(db, "moods"),
          where("userId", "==", userData.partnerId),
          where("date", ">=", today)
        ) : null;
        unsubscribeMood = onSnapshot(userMoodQuery, (snapshot) => {
          if (!isMounted) return;
          if (!snapshot.empty) {
            setTodayMood(snapshot.docs[0].data().mood);
          }
          setMoodLoading(false);
        });

        if (partnerMoodQuery) {
          const unsubPartnerMood = onSnapshot(partnerMoodQuery, (snapshot) => {
            if (!isMounted) return;
            if (!snapshot.empty) {
              setPartnerMood(snapshot.docs[0].data().mood);
            }
          });
          // Combine unsubscribe functions
          const originalUnsubMood = unsubscribeMood;
          unsubscribeMood = () => {
            originalUnsubMood();
            unsubPartnerMood();
          };
        }

      } catch (error) {
        console.error("Error setting up listeners:", error);
        if (isMounted) {
          setError("Failed to load some data. Please refresh the page.");
        }
      }
    };

    setupListeners();
    setLoading(false);

    return () => {
      isMounted = false;
      if (typeof unsubscribePartner === 'function') unsubscribePartner();
      if (typeof unsubscribeMessages === 'function') unsubscribeMessages();
      if (typeof unsubscribeReminders === 'function') unsubscribeReminders();
      if (typeof unsubscribeMood === 'function') unsubscribeMood();
    };
  }, [user, userData]);

  const toggleComplete = async (e, reminder) => {
    e.preventDefault();
    if (!user) return;

    try {
      const functions = getFunctions();
      const toggleReminder = httpsCallable(functions, 'toggleReminder');
      const result = await toggleReminder({ 
        reminderId: reminder.id,
        completed: !reminder.completed
      });
      
      if (!result.data.success) {
        throw new Error(result.data.error || 'Failed to toggle reminder');
      }
    } catch (error) {
      console.error("Error toggling reminder:", error);
      setError("Failed to update reminder");
    }
  };

  // Get the 4 most recent reminders for each person
  const myReminders = reminders
    .filter(r => r.owner === user.uid)
    .slice(0, 4);
  const partnerReminders = reminders
    .filter(r => r.owner === userData?.partnerId)
    .slice(0, 4);

  async function handleLogout() {
    await signOut(auth);
    navigate("/login");
  }

  function formatTimestamp(ts) {
    if (!ts?.seconds) return "";
    const d = new Date(ts.seconds * 1000);
    return d.toLocaleString("default", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  // The main content
  const DashboardContent = (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      style={{ 
        position: 'relative',
        minHeight: '100vh',
        width: '100%',
        padding: '16px'
      }}
    >
      <Box 
        sx={{ 
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          width: '100%',
          maxWidth: '1400px',
          mx: 'auto'
        }}
      >
        {/* Welcome Text */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <GradientText 
            variant="h1" 
            sx={{ 
              fontSize: {
                xs: 'clamp(1.6rem, 4vw, 2rem)',
                sm: 'clamp(2rem, 4vw, 2.3rem)',
                md: 'clamp(2.3rem, 4vw, 2.8rem)'
              },
              textAlign: 'center',
              mb: { xs: 2, sm: 3 }
            }}
          >
            i miss you...
          </GradientText>
        </motion.div>

        {/* Main Content Grid */}
        <Box
          sx={{
            display: 'grid',
            gap: 2,
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(3, 1fr)',
              md: 'repeat(3, 1fr)'
            }
          }}
        >
          {/* Last Message Card */}
          <Box sx={{ 
            gridColumn: { 
              xs: 'span 1',
              sm: 'span 2',
              md: 'span 2'
            }
          }}>
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <GlassCard
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/app/messages');
                }}
                sx={{
                  height: '100%',
                  minHeight: { xs: '140px', sm: '180px' },
                  background: 'linear-gradient(135deg, rgba(238,123,120,0.1) 0%, rgba(255,255,255,0.05) 100%)',
                  p: { xs: 2.5, sm: 3 },
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {/* Floating Hearts Background Animation */}
                <Box sx={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
                  {[...Array(4)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ 
                        opacity: 0.4,
                        y: '120%',
                        x: `${Math.random() * 100}%`,
                        rotate: Math.random() * 360
                      }}
                      animate={{ 
                        y: '-120%',
                        rotate: [0, 360],
                        opacity: [0.4, 0.6, 0.4]
                      }}
                      transition={{ 
                        duration: 15 + Math.random() * 5,
                        repeat: Infinity,
                        delay: i * 3,
                        ease: 'linear'
                      }}
                      style={{
                        position: 'absolute',
                        fontSize: `${1.2 + Math.random() * 1.2}rem`,
                        color: 'rgba(255,255,255,0.6)'
                      }}
                    >
                      ❤️
                    </motion.div>
                  ))}
                </Box>

                {lastPartnerMsg ? (
                  <motion.div 
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    style={{ 
                      position: 'relative',
                      zIndex: 1,
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '1rem'
                    }}
                  >
                    <Typography
                      variant="h6"
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        color: '#fff',
                        fontWeight: 600,
                        fontSize: { xs: '1rem', sm: '1.1rem' },
                        textTransform: 'uppercase',
                        letterSpacing: '1px'
                      }}
                    >
                      From {partnerData?.displayName || 'Partner'} ❤️
                    </Typography>

                    <Typography
                      variant="h5"
                      sx={{
                        color: '#fff',
                        textAlign: 'center',
                        fontSize: { xs: '1.2rem', sm: '1.4rem' },
                        fontWeight: 500,
                        maxWidth: '90%',
                        wordBreak: 'break-word'
                      }}
                    >
                      {lastPartnerMsg.text}
                    </Typography>

                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        background: alpha('#000', 0.2),
                        backdropFilter: 'blur(10px)',
                        py: 0.75,
                        px: 2,
                        borderRadius: '12px',
                        mt: 1
                      }}
                    >
                      <Box 
                        component="span" 
                        sx={{ 
                          width: 4,
                          height: 4,
                          borderRadius: '50%',
                          bgcolor: '#4CAF50'
                        }}
                      />
                      <Typography
                        variant="caption"
                        sx={{
                          fontSize: '0.75rem',
                          color: alpha('#fff', 0.7),
                          fontWeight: 500
                        }}
                      >
                        {formatTimestamp(lastPartnerMsg.createdAt)}
                      </Typography>
                    </Box>
                  </motion.div>
                ) : (
                  <motion.div 
                    style={{ 
                      position: 'relative',
                      zIndex: 1,
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '1rem'
                    }}
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <motion.div
                      animate={{ 
                        scale: [1, 1.1, 1],
                        rotate: [0, 5, -5, 0],
                        y: [0, -5, 0]
                      }}
                      transition={{ 
                        duration: 3,
                        repeat: Infinity,
                        repeatType: "reverse"
                      }}
                    >
                      <Box 
                        component="span" 
                        sx={{ 
                          fontSize: '2.5rem',
                          filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.2))'
                        }}
                      >
                        💌
                      </Box>
                    </motion.div>
                    <Typography 
                      sx={{ 
                        color: alpha('#fff', 0.7),
                        fontSize: { xs: '0.9rem', sm: '1rem' },
                        fontWeight: 500,
                        textAlign: 'center'
                      }}
                    >
                      No messages yet from your love
                    </Typography>
                  </motion.div>
                )}

                {/* Hover Indicator */}
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: 12,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    color: alpha('#fff', 0.5),
                    fontSize: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    opacity: 0,
                    transition: 'opacity 0.2s ease',
                    '.MuiPaper-root:hover &': {
                      opacity: 1
                    }
                  }}
                >
                  <motion.span
                    animate={{ x: [0, 3, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    Click to view all messages
                  </motion.span>
                </Box>
              </GlassCard>
            </motion.div>
          </Box>

          {/* Stars Widget */}
          <Box sx={{ 
            gridColumn: { 
              xs: 'span 1',
              sm: 'span 1',
              md: 'span 1'
            }
          }}>
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <GlassCard
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/app/stars');
                }}
                sx={{
                  height: '100%',
                  minHeight: { xs: '140px', sm: '180px' },
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))',
                  p: { xs: 2.5, sm: 3 },
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: 2
                }}
              >
                <motion.div
                  animate={{ 
                    y: [0, -5, 0],
                    filter: [
                      'drop-shadow(0 0 10px rgba(255,255,255,0.3))',
                      'drop-shadow(0 0 20px rgba(255,255,255,0.6))',
                      'drop-shadow(0 0 10px rgba(255,255,255,0.3))'
                    ]
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    repeatType: "reverse"
                  }}
                >
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    gap: 1
                  }}>
                    <Typography
                      variant="h2"
                      sx={{
                        fontWeight: 800,
                        color: '#fff',
                        fontSize: { xs: '2.5rem', sm: '3rem' }
                      }}
                    >
                      {stars || 0}
                    </Typography>
                    <StarIcon sx={{ 
                      fontSize: { xs: '2.5rem', sm: '3rem' },
                      color: '#fff'
                    }} />
                  </Box>
                </motion.div>
                <Typography
                  variant="subtitle1"
                  sx={{
                    color: alpha('#fff', 0.9),
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    fontSize: '0.8rem'
                  }}
                >
                  Star Balance
                </Typography>
              </GlassCard>
            </motion.div>
          </Box>

          {/* Today's Moods Widget */}
          <Box sx={{ 
            gridColumn: { 
              xs: 'span 1',
              sm: 'span 1',
              md: 'span 1'
            }
          }}>
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <GlassCard sx={{ 
                height: '100%',
                minHeight: { xs: '280px', sm: '320px' },
                p: { xs: 2.5, sm: 3 }
              }}>
                <HomeMoodWidget />
              </GlassCard>
            </motion.div>
          </Box>

          {/* To-Do Widget */}
          <Box sx={{ 
            gridColumn: { 
              xs: 'span 1',
              sm: 'span 1',
              md: 'span 1'
            }
          }}>
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <GlassCard sx={{ 
                height: '100%',
                minHeight: { xs: '280px', sm: '320px' },
                p: { xs: 2.5, sm: 3 }
              }}>
                <ToDoWidget />
              </GlassCard>
            </motion.div>
          </Box>

          {/* Quick Message Widget */}
          <Box sx={{ 
            gridColumn: { 
              xs: 'span 1',
              sm: 'span 1',
              md: 'span 1'
            }
          }}>
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <GlassCard sx={{ 
                height: '100%',
                minHeight: { xs: '280px', sm: '320px' },
                p: { xs: 2.5, sm: 3 }
              }}>
                <MessagesMiniSend />
              </GlassCard>
            </motion.div>
          </Box>

          {/* Action Buttons - Each takes 1/3 width */}
          {[
            { icon: '🎁', title: 'Coupons', path: '/app/coupons', color: '#FF69B4' },
            { icon: '🎯', title: 'Goals', path: '/app/accountability', color: '#FF6B6B' },
            { icon: '📅', title: 'Schedule', path: '/app/schedule', color: '#40C4FF' }
          ].map((item, index) => (
            <Box key={item.path} sx={{ 
              gridColumn: {
                xs: 'span 1',
                sm: 'span 1',
                md: 'span 1'
              }
            }}>
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.6 + (index * 0.1) }}
              >
                <GlassCard
                  onClick={(e) => {
                    e.preventDefault();
                    navigate(item.path);
                  }}
                  sx={{
                    height: '100%',
                    minHeight: { xs: 100, sm: 120 },
                    p: { xs: 2.5, sm: 3 },
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    background: `linear-gradient(135deg, ${alpha(item.color, 0.1)} 0%, transparent 100%)`
                  }}
                >
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: [0, -5, 5, 0] }}
                    transition={{ duration: 0.3 }}
                  >
                    <Typography sx={{ fontSize: '2.5rem', mb: 1 }}>
                      {item.icon}
                    </Typography>
                  </motion.div>
                  <Typography
                    sx={{
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      color: alpha('#fff', 0.9),
                      textTransform: 'uppercase',
                      letterSpacing: '1px'
                    }}
                  >
                    {item.title}
                  </Typography>
                </GlassCard>
              </motion.div>
            </Box>
          ))}
        </Box>

        {/* Logout Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 1 }}
          style={{ 
            display: 'flex',
            justifyContent: 'center',
            marginTop: '24px'
          }}
        >
          <Button
            variant="outlined"
            onClick={handleLogout}
            sx={{
              color: '#fff',
              borderColor: alpha('#fff', 0.3),
              borderRadius: '16px',
              fontWeight: 600,
              px: { xs: 4, sm: 6 },
              py: { xs: 1, sm: 1.5 },
              fontSize: { xs: '0.9rem', sm: '1rem' },
              textTransform: 'none',
              backdropFilter: 'blur(10px)',
              '&:hover': {
                borderColor: '#ee7b78',
                backgroundColor: alpha('#ee7b78', 0.15),
                boxShadow: `0 4px 20px ${alpha('#ee7b78', 0.3)}`
              }
            }}
          >
            Log Out
          </Button>
        </motion.div>
      </Box>
    </motion.div>
  );

  // If loading, show centered spinner
  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        width: '100%'
      }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box 
      component="main"
      role="main"
      tabIndex="-1"
      sx={{ 
        p: { xs: 1.5, sm: 2, md: 3 },
        color: "#fff",
        minHeight: "100vh",
        '&:focus': {
          outline: 'none'
        }
      }}
    >
      {DashboardContent}
    </Box>
  );
}

/**
 * "MessagesMiniSend": ephemeral mini-chat
 *  - Type text => bubble appears ~2s => disappears
 *  - hearts float up
 */
function MessagesMiniSend() {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const { user, userData } = useAuth();
  const navigate = useNavigate();

  const handleSend = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user?.uid || !userData?.partnerId || !message.trim()) return;

    try {
      setSending(true);
      const messagesRef = collection(db, 'messages');
      await addDoc(messagesRef, {
        text: message.trim(),
        senderId: user.uid,
        receiverId: userData.partnerId,
        participants: [user.uid, userData.partnerId],
        createdAt: serverTimestamp(),
        isRead: false,
        type: 'text'
      });
      
      setMessage('');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (error) {
      console.error("Error sending message:", error);
      setError("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  return (
    <Box
      onClick={(e) => {
        e.preventDefault();
        navigate('/app/messages');
      }}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        gap: 1.5,
        cursor: 'pointer',
        '&:hover': {
          '& .MuiTypography-root': {
            color: alpha('#fff', 0.95)
          }
        }
      }}
    >
      <Typography 
        variant="h6" 
        sx={{ 
          fontWeight: 700,
          fontSize: { xs: '1rem', sm: '1.1rem' },
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          mb: 0.5
        }}
      >
        Quick Message
        <motion.span
          animate={{ 
            rotate: [0, -10, 10, -10, 0],
            scale: [1, 1.1, 1, 1.1, 1]
          }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            repeatType: "reverse"
          }}
          style={{ 
            display: "inline-flex",
            fontSize: "1.2em"
          }}
        >
          💌
        </motion.span>
      </Typography>

      {/* Message Input Form */}
      <form 
        onSubmit={handleSend}
        onClick={(e) => e.stopPropagation()}
        style={{ 
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}
      >
        <Box
          sx={{
            flex: 1,
            position: 'relative',
            borderRadius: '16px',
            overflow: 'hidden',
            backgroundColor: alpha('#fff', 0.05),
            backdropFilter: 'blur(10px)',
            border: `1px solid ${alpha('#fff', 0.1)}`,
            transition: 'all 0.2s ease',
            '&:hover': {
              backgroundColor: alpha('#fff', 0.08),
              border: `1px solid ${alpha('#fff', 0.2)}`
            }
          }}
        >
          <TextField
            multiline
            rows={3}
            placeholder="Send a sweet message to your love..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={sending || showSuccess}
            fullWidth
            variant="standard"
            InputProps={{
              disableUnderline: true,
              sx: {
                height: '100%',
                p: 1.5,
                color: '#fff',
                fontSize: '0.9rem',
                '&::placeholder': {
                  color: alpha('#fff', 0.5),
                  opacity: 1
                }
              }
            }}
            sx={{
              height: '100%',
              '& .MuiInputBase-root': {
                height: '100%'
              }
            }}
          />
        </Box>

        <Button
          type="submit"
          disabled={sending || !message.trim() || showSuccess}
          sx={{
            borderRadius: '12px',
            background: 'linear-gradient(45deg, #ee7b78 30%, #fbc2eb 90%)',
            color: '#fff',
            textTransform: 'none',
            fontWeight: 600,
            py: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1,
            transition: 'all 0.3s ease',
            '&:hover': {
              background: 'linear-gradient(45deg, #fbc2eb 30%, #ee7b78 90%)',
              transform: 'translateY(-2px)',
              boxShadow: `0 4px 20px ${alpha('#ee7b78', 0.3)}`
            },
            '&.Mui-disabled': {
              background: alpha('#fff', 0.1),
              color: alpha('#fff', 0.4)
            }
          }}
        >
          {sending ? (
            <CircularProgress size={20} sx={{ color: '#fff' }} />
          ) : (
            <>
              Send
              <SendIcon sx={{ fontSize: '1.1rem' }} />
            </>
          )}
        </Button>
      </form>

      {/* Success Message */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: 20 }}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 10,
            }}
          >
            <Box
              sx={{
                background: 'linear-gradient(45deg, #4CAF50, #45B649)',
                padding: '10px 20px',
                borderRadius: '12px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                backdropFilter: 'blur(10px)',
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}
            >
              <motion.div
                animate={{ 
                  scale: [1, 1.2, 1],
                  rotate: [0, 10, -10, 0]
                }}
                transition={{ duration: 0.5 }}
              >
                ✨
              </motion.div>
              <Typography sx={{ 
                color: '#fff', 
                fontWeight: 600,
                fontSize: '0.9rem'
              }}>
                Message Sent!
              </Typography>
            </Box>
          </motion.div>
        )}
      </AnimatePresence>
    </Box>
  );
}

function ToDoWidget() {
  const { user, userData } = useAuth();
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user?.uid) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const q = query(
      collection(db, "reminders"),
      where("date", ">=", today.toISOString()),
      where("date", "<", new Date(today.getTime() + 24*60*60*1000).toISOString()),
      orderBy("date", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const remindersList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setReminders(remindersList);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching reminders:", error);
      setError("Failed to load today's tasks");
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  const handleToggle = async (reminder) => {
    if (!user?.uid || reminder.owner !== user.uid) return;

    try {
      const reminderRef = doc(db, "reminders", reminder.id);
      await updateDoc(reminderRef, {
        completed: !reminder.completed,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error toggling reminder:", error);
      setError("Failed to update task");
    }
  };

  const ReminderItem = ({ reminder, isPartner }) => (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        p: 1,
        borderRadius: '8px',
        bgcolor: alpha('#fff', reminder.completed ? 0.03 : 0.05),
        border: `1px solid ${alpha('#fff', reminder.completed ? 0.05 : 0.1)}`,
        mb: 1,
        transition: 'all 0.2s ease',
        opacity: isPartner ? 0.8 : 1,
        '&:hover': {
          bgcolor: alpha('#fff', 0.08),
          transform: isPartner ? 'none' : 'translateX(4px)'
        }
      }}
    >
      <IconButton
        onClick={() => !isPartner && handleToggle(reminder)}
        disabled={isPartner}
        size="small"
        sx={{
          color: reminder.completed ? '#4caf50' : alpha('#fff', 0.7),
          '&:hover': {
            color: isPartner ? undefined : '#fff'
          }
        }}
      >
        {reminder.completed ? 
          <CheckCircleIcon sx={{ fontSize: '1.1rem' }} /> : 
          <RadioButtonUncheckedIcon sx={{ fontSize: '1.1rem' }} />
        }
      </IconButton>
      
      <Typography
        sx={{
          flex: 1,
          fontSize: '0.85rem',
          color: reminder.completed ? alpha('#fff', 0.5) : '#fff',
          textDecoration: reminder.completed ? 'line-through' : 'none',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}
      >
        {reminder.title}
      </Typography>
    </Box>
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
        <CircularProgress size={24} sx={{ color: alpha('#fff', 0.7) }} />
      </Box>
    );
  }

  const myReminders = reminders.filter(r => r.owner === user.uid);
  const partnerReminders = reminders.filter(r => r.owner === userData?.partnerId);

  return (
    <Box 
      onClick={(e) => {
        e.preventDefault();
        navigate('/app/reminders');
      }}
      sx={{ 
        height: '100%',
        cursor: 'pointer',
        '&:hover': {
          '& .MuiTypography-root': {
            color: alpha('#fff', 0.95)
          }
        }
      }}
    >
      <Typography 
        variant="h6" 
        sx={{ 
          mb: 1.5,  // Reduced from 2
          fontWeight: 700,
          fontSize: { xs: '1rem', sm: '1.1rem' },
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}
      >
        Today's Tasks
        <Box 
          component="span" 
          sx={{ 
            fontSize: '1.2em',
            transform: 'translateY(-1px)'
          }}
        >
          📋
        </Box>
      </Typography>

      <Box sx={{ 
        height: 'calc(100% - 40px)',  // Adjusted to account for header
        overflow: 'auto',
        pr: 1,
        mr: -1,
        '&::-webkit-scrollbar': {
          width: '4px',
        },
        '&::-webkit-scrollbar-track': {
          background: 'transparent',
        },
        '&::-webkit-scrollbar-thumb': {
          background: alpha('#fff', 0.2),
          borderRadius: '4px',
        },
      }}>
        {myReminders.length === 0 && partnerReminders.length === 0 ? (
          <Box sx={{ 
            textAlign: 'center', 
            color: alpha('#fff', 0.5),
            py: 2
          }}>
            <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
              No tasks for today
            </Typography>
          </Box>
        ) : (
          <>
            {myReminders.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography 
                  variant="subtitle2" 
                  sx={{ 
                    mb: 1,
                    color: alpha('#fff', 0.7),
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase'
                  }}
                >
                  My Tasks
                </Typography>
                {myReminders.map(reminder => (
                  <ReminderItem 
                    key={reminder.id} 
                    reminder={reminder}
                    isPartner={false}
                  />
                ))}
              </Box>
            )}

            {partnerReminders.length > 0 && (
              <Box>
                <Typography 
                  variant="subtitle2" 
                  sx={{ 
                    mb: 1,
                    color: alpha('#fff', 0.7),
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase'
                  }}
                >
                  Partner's Tasks
                </Typography>
                {partnerReminders.map(reminder => (
                  <ReminderItem 
                    key={reminder.id} 
                    reminder={reminder}
                    isPartner={true}
                  />
                ))}
              </Box>
            )}
          </>
        )}
      </Box>

      {error && (
        <Typography 
          color="error" 
          sx={{ 
            mt: 2,
            fontSize: '0.8rem',
            textAlign: 'center'
          }}
        >
          {error}
        </Typography>
      )}
    </Box>
  );
}


