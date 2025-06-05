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
import HabitList from '../components/accountability/HabitList';
import { StyledTextField } from '../components/accountability/StyledComponents';
import { StatusChip, calculateHabitStats } from '../components/accountability/StatusChip';
import { 
  useWeeklyStats, 
  useCompletionHistory, 
  useHabitProgress, 
  useOptimisticUpdate 
} from '../hooks/useAccountabilityStats';
import { useAccountabilityActions } from '../hooks/useAccountabilityActions';
import { 
  calculateStreak, 
  calculateCompletionRate, 
  calculateBestDays, 
  calculateMonthlyTrend,
  calculateWeeklyCompletions
} from '../utils/accountabilityHelpers';











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
  
  // Add state for partner habits dialog
  const [partnerHabitsOpen, setPartnerHabitsOpen] = useState(false);

  // Use the extracted actions hook
  const {
    handleCompleteTask,
    handleCreateTask: createTask,
    handleUpdateTask: updateTask,
    handleDeleteTask,
    handleToggleComplete,
    isSubmitting
  } = useAccountabilityActions(user, tasks, dailyStatus, setError, setShowStarEarned);

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

  // Wrapper functions to handle form logic
  const handleCreateTaskSubmit = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const formData = {
      title: newTitle,
      description: newDescription,
      weeklyGoal: newWeeklyGoal
    };

    const success = await createTask(e, formData);
    if (success) {
      setNewTitle("");
      setNewDescription("");
      setNewWeeklyGoal(7);
      setOpenCreate(false);
    }
  };

  const handleUpdateTaskSubmit = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const formData = {
      title: newTitle,
      description: newDescription,
      weeklyGoal: newWeeklyGoal
    };

    const success = await updateTask(e, editingTask, formData);
    if (success) {
      setEditingTask(null);
      setNewTitle("");
      setNewDescription("");
      setNewWeeklyGoal(7);
      setOpenDialog(false);
    }
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
        <form onSubmit={handleCreateTaskSubmit}>
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
        <form onSubmit={handleUpdateTaskSubmit}>
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