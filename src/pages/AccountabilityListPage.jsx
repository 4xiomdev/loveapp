// src/pages/AccountabilityListPage.jsx
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { usePartnerData } from '../hooks/usePartnerData';
import { db } from "../firebase";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  serverTimestamp,
  getDoc,
  writeBatch,
  getDocs,
  runTransaction,
  increment
} from "firebase/firestore";
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  alpha,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Tooltip as MuiTooltip,
  Grid,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Stack,
  Alert,
  useTheme,
  Divider,
  Avatar,
  Snackbar
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { motion, AnimatePresence } from "framer-motion";
import DashboardLayout from "../components/DashboardLayout";
import GlassCard from '../components/GlassCard';
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TimelineIcon from '@mui/icons-material/Timeline';
import {
  format,
  startOfWeek,
  endOfWeek,
  subWeeks,
  startOfDay,
  isWithinInterval,
  differenceInDays,
  subDays,
  isAfter,
  isBefore,
  addDays,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  subMonths
} from 'date-fns';
import WhatshotIcon from '@mui/icons-material/Whatshot';
import StarIcon from '@mui/icons-material/Star';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell
} from 'recharts';
import MilitaryTechIcon from '@mui/icons-material/MilitaryTech';
import NoPartnerState from '../components/NoPartnerState';
import SoloModeState from '../components/SoloModeState';
import AddIcon from '@mui/icons-material/Add';
import styled from '@emotion/styled';
import EnhancedStarCompletion from '../components/EnhancedStarCompletion';
import { awardStarsToSelf } from '../utils/starOperations';
import { getFunctions, httpsCallable } from 'firebase/functions';
import PartnerHabitsDialog from '../components/PartnerHabitsDialog';
import VisibilityIcon from '@mui/icons-material/Visibility';
import StatsDashboard from '../components/accountability/StatsDashboard';
import HabitCard from '../components/accountability/HabitCard';
import QuickStats from '../components/accountability/QuickStats';

// Helper functions (defined outside components)
const calculateStreak = (dailyStatus, isTodayComplete) => {
  if (!dailyStatus || !dailyStatus.length) return { currentStreak: 0, longestStreak: 0 };
  
  // Sort by date in descending order (newest first)
  const sortedStatuses = [...dailyStatus].sort((a, b) => 
    new Date(b.date) - new Date(a.date)
  );
  
  // Start with today's status
  let currentStreak = isTodayComplete ? 1 : 0;
  
  // If today is not complete, check if yesterday was
  if (!isTodayComplete) {
    const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');
    const yesterdayStatus = sortedStatuses.find(s => s.date === yesterday);
    if (!yesterdayStatus?.done) {
      return { currentStreak: 0, longestStreak: calculateLongestStreak(sortedStatuses) };
    }
    currentStreak = 1; // Start streak from yesterday
  }
  
  // Check previous days
  const today = new Date();
  let currentDate = subDays(today, currentStreak); // Start from the day before the last counted day
  
  for (let i = 0; i < sortedStatuses.length; i++) {
    const statusDate = new Date(sortedStatuses[i].date);
    const expectedDate = format(currentDate, 'yyyy-MM-dd');
    
    // If this status is for the expected date and it's done
    if (sortedStatuses[i].date === expectedDate && sortedStatuses[i].done) {
      currentStreak++;
      currentDate = subDays(currentDate, 1);
    } 
    // If this status is for the expected date but not done, break
    else if (sortedStatuses[i].date === expectedDate && !sortedStatuses[i].done) {
      break;
    }
    // If we've moved past the expected date (gap in data), break
    else if (isAfter(statusDate, currentDate)) {
      continue; // Skip this status and check the next one
    } else {
      break; // Break on any other condition (like a gap in the streak)
    }
  }
  
  const longestStreak = calculateLongestStreak(sortedStatuses);
  return { currentStreak, longestStreak };
};

// Helper function to calculate longest streak
const calculateLongestStreak = (sortedStatuses) => {
  if (!sortedStatuses || !sortedStatuses.length) return 0;
  
  let longestStreak = 0;
  let currentStreak = 0;
  let lastDate = null;
  
  // Process statuses in chronological order for longest streak
  const chronologicalStatuses = [...sortedStatuses].sort((a, b) => 
    new Date(a.date) - new Date(b.date)
  );
  
  for (const status of chronologicalStatuses) {
    if (status.done) {
      if (!lastDate || differenceInDays(new Date(status.date), new Date(lastDate)) === 1) {
        currentStreak++;
      } else {
        currentStreak = 1;
      }
      lastDate = status.date;
      longestStreak = Math.max(longestStreak, currentStreak);
    } else {
      currentStreak = 0;
      lastDate = status.date;
    }
  }
  
  return longestStreak;
};

const calculateCompletionRate = (dailyStatus, isTodayComplete) => {
  if (!dailyStatus || !dailyStatus.length) return 0;
  
  // Get statuses from the last 30 days
  const thirtyDaysAgo = subDays(new Date(), 30);
  const recentStatuses = dailyStatus.filter(status => 
    new Date(status.date) >= thirtyDaysAgo
  );
  
  // Count completed days
  const completedDays = recentStatuses.filter(status => status.done).length;
  
  // Add today if it's complete and not already in the statuses
  const todayString = format(new Date(), 'yyyy-MM-dd');
  const todayInStatuses = recentStatuses.some(status => status.date === todayString);
  
  if (isTodayComplete && !todayInStatuses) {
    return Math.round(((completedDays + 1) / (recentStatuses.length + 1)) * 100);
  }
  
  return Math.round((completedDays / Math.max(recentStatuses.length, 1)) * 100);
};

// Calculate best performing days
const calculateBestDays = (dailyStatuses) => {
  if (!dailyStatuses?.length) return [];
  
  const dayStats = dailyStatuses.reduce((acc, status) => {
    const day = format(new Date(status.date), 'EEEE');
    if (!acc[day]) acc[day] = { total: 0, completed: 0 };
    acc[day].total++;
    if (status.done) acc[day].completed++;
    return acc;
  }, {});

  return Object.entries(dayStats)
    .map(([day, stats]) => ({
      day,
      rate: Math.round((stats.completed / stats.total) * 100)
    }))
    .sort((a, b) => b.rate - a.rate);
};

// Calculate monthly trend
const calculateMonthlyTrend = (dailyStatuses) => {
  if (!dailyStatuses?.length) return 0;
  
  const thisMonth = dailyStatuses.filter(status => 
    isWithinInterval(new Date(status.date), {
      start: startOfMonth(new Date()),
      end: new Date()
    })
  );

  const lastMonth = dailyStatuses.filter(status => 
    isWithinInterval(new Date(status.date), {
      start: startOfMonth(subMonths(new Date(), 1)),
      end: endOfMonth(subMonths(new Date(), 1))
    })
  );

  const thisMonthRate = calculateCompletionRate(thisMonth);
  const lastMonthRate = calculateCompletionRate(lastMonth);

  return lastMonthRate ? ((thisMonthRate - lastMonthRate) / lastMonthRate) * 100 : 0;
};

// Custom hooks
const useWeeklyStats = (tasks) => {
  const [weeklyProgress, setWeeklyProgress] = useState(0);
  const [weeklyCompletions, setWeeklyCompletions] = useState(0);

  useEffect(() => {
    if (!tasks?.length) {
      setWeeklyProgress(0);
      setWeeklyCompletions(0);
      return;
    }

    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 0 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 0 });

    // Calculate completions and goals per task
    const taskStats = tasks.map(task => {
      const weeklyCompletions = task.dailyStatuses?.filter(s => {
        const statusDate = new Date(s.date + 'T00:00:00');
        return s.done && isWithinInterval(statusDate, {
          start: weekStart,
          end: weekEnd
        });
      }).length || 0;

      return {
        completions: weeklyCompletions,
        goal: task.weeklyGoal || 7
      };
    });

    // Sum up all completions and goals
    const totalCompletions = taskStats.reduce((acc, stat) => acc + stat.completions, 0);
    const totalGoal = taskStats.reduce((acc, stat) => acc + stat.goal, 0);

    // Calculate overall progress
    const progress = totalGoal > 0 
      ? Math.min(Math.round((totalCompletions / totalGoal) * 100), 100)
      : 0;

    setWeeklyCompletions(totalCompletions);
    setWeeklyProgress(progress);
  }, [tasks]);

  return { weeklyProgress, weeklyCompletions };
};

const useCompletionHistory = (tasks) => {
  return useMemo(() => {
    const last7Days = [...Array(7)].map((_, i) => {
      const date = subDays(new Date(), i);
      const completions = tasks.reduce((acc, task) => {
        const isDone = task.dailyStatuses?.some(s => 
          s.done && s.date === format(date, 'yyyy-MM-dd')
        );
        return acc + (isDone ? 1 : 0);
      }, 0);

      return {
        name: format(date, 'EEE'),
        completions
      };
    }).reverse();

    return last7Days;
  }, [tasks]);
};

const useHabitProgress = (tasks) => {
  return useMemo(() => {
    return tasks.map(task => {
      const completions = task.dailyStatuses?.filter(s => s.done).length || 0;
      const total = task.dailyStatuses?.length || 1;
      const streak = calculateStreak(task.dailyStatuses, task.isTodayComplete);

      return {
        id: task.id,
        title: task.title,
        completionRate: Math.round((completions / total) * 100),
        streak: streak.currentStreak
      };
    });
  }, [tasks]);
};

// Add new styled components
const GlowingText = styled(Typography)(({ theme, color = '#fff' }) => ({
  fontWeight: 800,
  color: color,
  textShadow: `0 0 20px ${alpha(color, 0.5)}`,
  transition: 'all 0.3s ease',
}));

const MinimalisticHabitCard = styled(Paper)(({ theme }) => ({
  padding: '16px',
  borderRadius: '24px',  // Increased border radius to match design
  background: 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))',
  backdropFilter: 'blur(10px)',
  border: `1px solid ${alpha('#fff', 0.1)}`,
  transition: 'all 0.2s ease',
  cursor: 'pointer',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: `0 4px 20px ${alpha('#000', 0.2)}`
  }
}));

const StyledTextField = styled(TextField)({
  '& .MuiOutlinedInput-root': {
    '& fieldset': {
      borderColor: alpha('#fff', 0.3),
      borderRadius: 12,
    },
    '&:hover fieldset': {
      borderColor: alpha('#9b59b6', 0.5),
    },
    '&.Mui-focused fieldset': {
      borderColor: '#9b59b6',
    },
  },
  '& .MuiInputLabel-root': {
    color: alpha('#fff', 0.7),
    '&.Mui-focused': {
      color: '#9b59b6',
    },
  },
  '& .MuiOutlinedInput-input': {
    color: '#fff',
  },
});



// Fix the calculateWeeklyCompletions function
const calculateWeeklyCompletions = (weekStart, weekEnd, statuses, includePending = false) => {
  // Ensure statuses is an array
  if (!Array.isArray(statuses)) {
    console.warn('calculateWeeklyCompletions received non-array statuses:', statuses);
    return 0;
  }
  
  // Parse dates consistently at midnight
  const start = startOfWeek(new Date(weekStart), { weekStartsOn: 0 });
  start.setHours(0, 0, 0, 0);
  const end = endOfWeek(new Date(weekEnd), { weekStartsOn: 0 });
  end.setHours(23, 59, 59, 999);

  const completions = statuses.filter(status => {
    const statusDate = new Date(status.date + 'T00:00:00');
    const isInWeek = isWithinInterval(statusDate, { start, end });
    return status.done && isInWeek;
  }).length;

  return completions;
};

const useOptimisticUpdate = (initialValue) => {
  const [value, setValue] = useState(initialValue);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState(null);

  const update = async (newValue, updateFn) => {
    setIsUpdating(true);
    setError(null);
    // Optimistically update the UI
    setValue(newValue);
    
    try {
      await updateFn();
    } catch (err) {
      // Revert on error
      setValue(initialValue);
      setError(err.message || 'Failed to update');
      throw err;
    } finally {
      setIsUpdating(false);
    }
  };

  return [value, update, isUpdating, error];
};

// Update the HabitList component to be more minimalistic
const HabitList = ({ habits, onComplete, onEdit, onDelete, onNavigate, dailyStatus, onViewPartnerHabits }) => {
  return (
    <Box>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 3
      }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          My Habits
        </Typography>
        
        {/* Add Partner Habits Button */}
        {onViewPartnerHabits && (
          <Button
            variant="outlined"
            startIcon={<VisibilityIcon />}
            onClick={onViewPartnerHabits}
            size="small"
            sx={{
              color: '#fff',
              borderColor: alpha('#fff', 0.3),
              '&:hover': {
                borderColor: '#fff',
                bgcolor: alpha('#fff', 0.1)
              }
            }}
          >
            Partner's Habits
          </Button>
        )}
      </Box>

      <Grid container spacing={2}>
        {habits.map((habit) => (
          <Grid item xs={12} key={habit.id}>
            <HabitCard
              habit={habit}
              onComplete={onComplete}
              onEdit={onEdit}
              onDelete={onDelete}
              onNavigate={onNavigate}
              dailyStatus={dailyStatus}
            />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};





export default function AccountabilityListPage() {
  const { user, userData } = useAuth();
  const navigate = useNavigate();
  const { partnerData, loading: partnerLoading, error: partnerError, isSoloMode } = usePartnerData();
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [openCreate, setOpenCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [editingTask, setEditingTask] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [expandedSection, setExpandedSection] = useState('');
  const [error, setError] = useState("");
  const theme = useTheme();
  const [dailyStatus, setDailyStatus] = useState({});
  const [newWeeklyGoal, setNewWeeklyGoal] = useState(7);
  const [myStars, setMyStars] = useState(0);
  const [showStarEarned, setShowStarEarned] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Add state for partner habits dialog
  const [partnerHabitsOpen, setPartnerHabitsOpen] = useState(false);

  // Force /login if not authenticated
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    setLoading(false);
  }, [user, navigate]);

  // Effect to fetch tasks - keep this real-time watcher
  useEffect(() => {
    if (!user?.uid) return;

    const tasksRef = collection(db, 'accountability');
    const q = query(
      tasksRef,
      where('owner', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tasksList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTasks(tasksList);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching tasks:', error);
      setError('Failed to load tasks');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Effect to fetch daily status - keep this real-time watcher
  useEffect(() => {
    if (!tasks.length || !user?.uid) return;

    const unsubscribes = tasks.map(currentTask => {
      // Query for all daily statuses for this task
      const statusQuery = query(
        collection(db, "dailyStatus"),
        where("habitId", "==", currentTask.id),
        where("owner", "==", user.uid),
        orderBy("date", "desc")
      );

      return onSnapshot(statusQuery, (snapshot) => {
        const statuses = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Update the dailyStatus state with the new data
        setDailyStatus(prev => ({
          ...prev,
          [currentTask.id]: statuses
        }));

        // Check if today's status exists and update task's isTodayComplete
        const today = format(new Date(), 'yyyy-MM-dd');
        const todayStatus = statuses.find(s => s.date === today);
        const taskToUpdate = tasks.find(t => t.id === currentTask.id);
        if (taskToUpdate) {
          taskToUpdate.isTodayComplete = todayStatus?.done || false;
        }
      }, (error) => {
        console.error(`Error watching daily status for task ${currentTask.id}:`, error);
        setError("Failed to sync task status");
      });
    });

    // Cleanup subscriptions
    return () => {
      unsubscribes.forEach(unsubscribe => unsubscribe());
    };
  }, [tasks, user?.uid]);

  // Add debug logging to the star balance effect
  useEffect(() => {
    if (!user?.uid) return;
    
    console.log('Setting up star balance listener for user:', user.uid);
    
    const unsubStars = onSnapshot(doc(db, "users", user.uid), (doc) => {
      if (doc.exists()) {
        const newStars = doc.data().stars || 0;
        console.log('Star balance updated:', { 
          oldStars: myStars, 
          newStars,
          change: newStars - myStars 
        });
        setMyStars(newStars);
      }
    });
    
    return () => unsubStars();
  }, [user?.uid]);

  const handleCompleteTask = async (taskId, isComplete) => {
    if (!user) {
      setError("You must be logged in to complete tasks");
      return;
    }

    try {
      // Get today's date in YYYY-MM-DD format
      const today = format(new Date(), 'yyyy-MM-dd');
      
      // Check if a status for today already exists
      const statusQuery = query(
        collection(db, "dailyStatus"),
        where("habitId", "==", taskId),
        where("owner", "==", user.uid),
        where("date", "==", today)
      );
      
      const statusSnapshot = await getDocs(statusQuery);
      
      // Create a batch to update multiple documents atomically
      const batch = writeBatch(db);
      
      if (statusSnapshot.empty) {
        // No status for today exists, create a new one
        const newStatusRef = doc(collection(db, "dailyStatus"));
        batch.set(newStatusRef, {
          habitId: taskId,
          owner: user.uid,
          date: today,
          done: isComplete,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      } else {
        // Update existing status
        const statusDoc = statusSnapshot.docs[0];
        batch.update(doc(db, "dailyStatus", statusDoc.id), {
          done: isComplete,
          updatedAt: serverTimestamp()
        });
      }
      
      // Update the task's isTodayComplete field
      const taskRef = doc(db, "accountability", taskId);
      batch.update(taskRef, {
        isTodayComplete: isComplete,
        updatedAt: serverTimestamp()
      });
      
      // Commit the batch
      await batch.commit();
      
      // Check if completing this task meets the weekly goal
      const task = tasks.find(t => t.id === taskId);
      if (task && isComplete) {
        const weekStart = startOfWeek(new Date(), { weekStartsOn: 0 });
        const weekEnd = endOfWeek(new Date(), { weekStartsOn: 0 });
        const taskStatuses = dailyStatus[taskId] || [];
        
        // Calculate weekly completions including the one we just added
        const weeklyCompletions = calculateWeeklyCompletions(
          weekStart, 
          weekEnd, 
          [...taskStatuses, { date: today, done: true }],
          false
        );
        
        const weeklyGoal = task.weeklyGoal || 7;
        
        // If weekly goal is met exactly, show star earned notification
        if (weeklyCompletions === weeklyGoal) {
          setShowStarEarned(true);
          setTimeout(() => setShowStarEarned(false), 5000);
        }
      }
    } catch (error) {
      console.error("Error completing task:", error);
      setError("Failed to update task status");
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!user?.uid || !newTitle.trim()) return;

    try {
      setIsSubmitting(true);
      
      // Ensure weeklyGoal is a valid number
      const weeklyGoalValue = parseInt(newWeeklyGoal) || 7;
      
      const taskRef = collection(db, "accountability");
      await addDoc(taskRef, {
        title: newTitle.trim(),
        description: newDescription.trim(),
        weeklyGoal: weeklyGoalValue,
        owner: user.uid,
        isTodayComplete: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      setNewTitle("");
      setNewDescription("");
      setNewWeeklyGoal(7);
      setOpenCreate(false);
      setIsSubmitting(false);
    } catch (error) {
      console.error("Error creating task:", error);
      setError("Failed to create task");
      setIsSubmitting(false);
    }
  };

  const handleUpdateTask = async (e) => {
    e.preventDefault();
    if (!user?.uid || !editingTask || !newTitle.trim()) return;

    try {
      setIsSubmitting(true);
      const taskRef = doc(db, "accountability", editingTask.id);
      
      // Ensure weeklyGoal is a number and has a valid value
      const weeklyGoalValue = parseInt(newWeeklyGoal) || 7;
      
      await updateDoc(taskRef, {
        title: newTitle,
        description: newDescription,
        weeklyGoal: weeklyGoalValue,
        updatedAt: serverTimestamp()
      });

      setEditingTask(null);
      setNewTitle("");
      setNewDescription("");
      setNewWeeklyGoal(7);
      setOpenDialog(false);
      setIsSubmitting(false);
    } catch (error) {
      console.error("Error updating task:", error);
      setError("Failed to update task");
      setIsSubmitting(false);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!user?.uid) return;

    try {
      const taskRef = doc(db, 'accountability', taskId);
      await deleteDoc(taskRef);
    } catch (error) {
      console.error("Error deleting task:", error);
      setError("Failed to delete task");
    }
  };

  const handleToggleComplete = async (task) => {
    if (!user?.uid || !task) return;

    try {
      const taskRef = doc(db, 'accountability', task.id);
      await updateDoc(taskRef, {
        completed: !task.completed,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error toggling task:", error);
      setError("Failed to toggle task");
    }
  };

  // Add these status chip components
  const StatusChip = ({ label, color }) => (
    <Chip
      label={label}
      size="small"
      sx={{
        bgcolor: alpha(color, 0.1),
        color: color,
        borderRadius: '8px',
        '& .MuiChip-label': {
          px: 2,
        }
      }}
    />
  );

  // Helper function to calculate stats for a habit
  const calculateHabitStats = (habitId) => {
    const statuses = dailyStatus[habitId] || [];
    const streak = calculateStreak(
      statuses.map(s => ({ date: s.date, done: s.done })),
      statuses.some(s => s.date === format(new Date(), 'yyyy-MM-dd') && s.done)
    );
    return {
      streak: streak.currentStreak,
      completionRate: statuses.length ? 
        Math.round((statuses.filter(s => s.done).length / statuses.length) * 100) : 0
    };
  };

  if (loading || partnerLoading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        color: '#fff'
      }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || partnerError) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          {error || partnerError}
        </Alert>
      </Box>
    );
  }

  // Main content - always personal
  return (
    <Box sx={{ color: "#fff", p: { xs: 2, sm: 3 } }}>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 700 }}>
        Accountability
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Stats Dashboard - Pass dailyStatus as prop */}
      <StatsDashboard tasks={tasks} dailyStatus={dailyStatus} />

      {/* Create Button */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'center' }}>
        <Button
          variant="contained"
          onClick={() => setOpenCreate(true)}
          sx={{
            bgcolor: alpha('#fff', 0.1),
            color: '#fff',
            py: 1.5,
            px: 4,
            borderRadius: 2,
            '&:hover': {
              bgcolor: alpha('#fff', 0.2)
            }
          }}
        >
          Create New Habit
        </Button>
      </Box>

      {/* Habits List */}
      <HabitList
        habits={tasks}
        onComplete={handleCompleteTask}
        onEdit={(task) => {
          setEditingTask(task);
          setNewTitle(task.title);
          setNewDescription(task.description || "");
          setNewWeeklyGoal(task.weeklyGoal || 7);
          setOpenDialog(true);
        }}
        onDelete={handleDeleteTask}
        onNavigate={(taskId) => navigate(`/app/accountability/${taskId}`)}
        dailyStatus={dailyStatus}
        onViewPartnerHabits={userData?.partnerId && !isSoloMode ? () => setPartnerHabitsOpen(true) : null}
      />

      {/* Create Dialog */}
      <Dialog
        open={openCreate}
        onClose={() => setOpenCreate(false)}
        PaperProps={{
          sx: {
            bgcolor: alpha('#121212', 0.9),
            backdropFilter: 'blur(10px)',
            borderRadius: 3,
            border: `1px solid ${alpha('#fff', 0.1)}`
          }
        }}
      >
        <DialogTitle>Create New Habit</DialogTitle>
        <form onSubmit={handleCreateTask}>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Title"
              fullWidth
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  color: '#fff',
                  '& fieldset': {
                    borderColor: alpha('#fff', 0.3)
                  },
                  '&:hover fieldset': {
                    borderColor: alpha('#fff', 0.5)
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#fff'
                  }
                },
                '& .MuiInputLabel-root': {
                  color: alpha('#fff', 0.7)
                }
              }}
            />
            <TextField
              margin="dense"
              label="Description"
              fullWidth
              multiline
              rows={3}
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  color: '#fff',
                  '& fieldset': {
                    borderColor: alpha('#fff', 0.3)
                  },
                  '&:hover fieldset': {
                    borderColor: alpha('#fff', 0.5)
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#fff'
                  }
                },
                '& .MuiInputLabel-root': {
                  color: alpha('#fff', 0.7)
                }
              }}
            />
            <TextField
              margin="dense"
              label="Weekly Goal (days)"
              type="number"
              fullWidth
              value={newWeeklyGoal}
              onChange={(e) => setNewWeeklyGoal(parseInt(e.target.value) || 1)}
              inputProps={{ min: 1, max: 7 }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: '#fff',
                  '& fieldset': {
                    borderColor: alpha('#fff', 0.3)
                  },
                  '&:hover fieldset': {
                    borderColor: alpha('#fff', 0.5)
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#fff'
                  }
                },
                '& .MuiInputLabel-root': {
                  color: alpha('#fff', 0.7)
                }
              }}
            />
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setOpenCreate(false)}>Cancel</Button>
            <Button type="submit" variant="contained">Create</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        PaperProps={{
          sx: {
            bgcolor: alpha('#121212', 0.9),
            backdropFilter: 'blur(10px)',
            borderRadius: 3,
            border: `1px solid ${alpha('#fff', 0.1)}`
          }
        }}
      >
        <DialogTitle>Edit Habit</DialogTitle>
        <form onSubmit={handleUpdateTask}>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Title"
              fullWidth
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  color: '#fff',
                  '& fieldset': {
                    borderColor: alpha('#fff', 0.3)
                  },
                  '&:hover fieldset': {
                    borderColor: alpha('#fff', 0.5)
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#fff'
                  }
                },
                '& .MuiInputLabel-root': {
                  color: alpha('#fff', 0.7)
                }
              }}
            />
            <TextField
              margin="dense"
              label="Description"
              fullWidth
              multiline
              rows={3}
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  color: '#fff',
                  '& fieldset': {
                    borderColor: alpha('#fff', 0.3)
                  },
                  '&:hover fieldset': {
                    borderColor: alpha('#fff', 0.5)
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#fff'
                  }
                },
                '& .MuiInputLabel-root': {
                  color: alpha('#fff', 0.7)
                }
              }}
            />
            <TextField
              margin="dense"
              label="Weekly Goal (days)"
              type="number"
              fullWidth
              value={newWeeklyGoal}
              onChange={(e) => setNewWeeklyGoal(parseInt(e.target.value) || 1)}
              inputProps={{ min: 1, max: 7 }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: '#fff',
                  '& fieldset': {
                    borderColor: alpha('#fff', 0.3)
                  },
                  '&:hover fieldset': {
                    borderColor: alpha('#fff', 0.5)
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#fff'
                  }
                },
                '& .MuiInputLabel-root': {
                  color: alpha('#fff', 0.7)
                }
              }}
            />
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
            <Button type="submit" variant="contained">Save</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Partner Habits Dialog */}
      {userData?.partnerId && !isSoloMode && (
        <PartnerHabitsDialog
          open={partnerHabitsOpen}
          onClose={() => setPartnerHabitsOpen(false)}
          partnerId={userData.partnerId}
          partnerName={partnerData?.displayName || 'Partner'}
        />
      )}

      {/* Star Earned Snackbar */}
      <Snackbar
        open={showStarEarned}
        autoHideDuration={4000}
        onClose={() => setShowStarEarned(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          severity="success"
          sx={{
            bgcolor: alpha('#FFD700', 0.9),
            color: '#000',
            '& .MuiAlert-icon': {
              color: '#000'
            }
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <StarIcon sx={{ color: '#FFD700' }} />
            <Typography variant="body1" sx={{ fontWeight: 600 }}>
              You earned a star for completing your habit!
            </Typography>
          </Box>
        </Alert>
      </Snackbar>
    </Box>
  );
}