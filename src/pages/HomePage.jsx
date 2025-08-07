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
import { useGoogleCalendar } from '../hooks/useGoogleCalendar';
import { MOOD_TYPES } from './MoodTrackerPage';
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff';
import FavoriteIcon from '@mui/icons-material/Favorite';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import PauseIcon from '@mui/icons-material/Pause';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import LocationOnIcon from '@mui/icons-material/LocationOn';

import { USER_IDS, DEFAULT_USER_SETTINGS } from "../config/userConfig";
import MoodWidget from '../components/home/MoodWidget';
import QuickMessageWidget from '../components/home/QuickMessageWidget';
import ToDoWidget from '../components/home/ToDoWidget';
import CalendarWidget from '../components/home/CalendarWidget';

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
  const { events, isAuthenticated, loading: calendarLoading, error: calendarError, login: loginGoogle } = useGoogleCalendar();

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

  const login = loginGoogle;

  const checkTokenExpiry = () => true; // handled by hook

  // events fetching handled by hook

  // Check token validity on mount and set up periodic check
  useEffect(() => {
    if (calendarError) setError(calendarError);
  }, [calendarError]);

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
                <MoodWidget />
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
                <QuickMessageWidget />
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






