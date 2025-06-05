import React, { useState, useEffect } from 'react';
import {
  Paper,
  Box,
  Typography,
  IconButton,
  CircularProgress,
  LinearProgress,
  alpha
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  RadioButtonUnchecked as RadioButtonUncheckedIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Whatshot as WhatshotIcon
} from '@mui/icons-material';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import { useTheme } from '@mui/material/styles';
import EnhancedStarCompletion from '../EnhancedStarCompletion';

// Import calculation functions - we'll need to share these
const calculateWeeklyCompletions = (weekStart, weekEnd, statuses, includePending = false) => {
  if (!statuses || !statuses.length) return 0;
  
  return statuses.filter(status => {
    const statusDate = new Date(status.date + 'T00:00:00');
    const isInWeek = statusDate >= weekStart && statusDate <= weekEnd;
    return isInWeek && status.done;
  }).length;
};

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
    const yesterday = format(new Date(Date.now() - 24 * 60 * 60 * 1000), 'yyyy-MM-dd');
    const yesterdayStatus = sortedStatuses.find(s => s.date === yesterday);
    if (!yesterdayStatus?.done) {
      return { currentStreak: 0, longestStreak: calculateLongestStreak(sortedStatuses) };
    }
    currentStreak = 1; // Start streak from yesterday
  }
  
  // Check previous days
  const today = new Date();
  let currentDate = new Date(today.getTime() - currentStreak * 24 * 60 * 60 * 1000);
  
  for (let i = 0; i < sortedStatuses.length; i++) {
    const statusDate = new Date(sortedStatuses[i].date);
    const expectedDate = format(currentDate, 'yyyy-MM-dd');
    
    // If this status is for the expected date and it's done
    if (sortedStatuses[i].date === expectedDate && sortedStatuses[i].done) {
      currentStreak++;
      currentDate = new Date(currentDate.getTime() - 24 * 60 * 60 * 1000);
    } 
    // If this status is for the expected date but not done, break
    else if (sortedStatuses[i].date === expectedDate && !sortedStatuses[i].done) {
      break;
    }
    // If we've moved past the expected date (gap in data), break
    else if (statusDate > currentDate) {
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
      if (!lastDate || ((new Date(status.date) - new Date(lastDate)) / (1000 * 60 * 60 * 24)) === 1) {
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

// Create a more minimalistic habit card
const HabitCard = ({ habit, onComplete, onEdit, onDelete, onNavigate, dailyStatus }) => {
  const theme = useTheme();
  const [isUpdating, setIsUpdating] = useState(false);
  const [localIsTodayComplete, setLocalIsTodayComplete] = useState(false);
  
  // Check if today's status exists in dailyStatus
  useEffect(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const habitStatuses = dailyStatus[habit.id] || [];
    const todayStatus = habitStatuses.find(s => s.date === today);
    setLocalIsTodayComplete(todayStatus?.done || false);
  }, [dailyStatus, habit.id]);

  const handleToggle = async (e) => {
    e.stopPropagation();
    setIsUpdating(true);
    
    try {
      // Toggle the local state immediately for better UX
      setLocalIsTodayComplete(!localIsTodayComplete);
      
      // Call the parent handler to update Firestore
      await onComplete(habit.id, !localIsTodayComplete);
    } catch (error) {
      // Revert local state if there's an error
      setLocalIsTodayComplete(localIsTodayComplete);
      console.error("Error toggling habit:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  // Calculate streak and completion rate
  const habitStatuses = dailyStatus[habit.id] || [];
  const { currentStreak } = calculateStreak(habitStatuses, localIsTodayComplete);
  
  // Calculate weekly progress
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 0 });
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 0 });
  const weeklyCompletions = calculateWeeklyCompletions(weekStart, weekEnd, habitStatuses, false);
  const weeklyGoal = habit.weeklyGoal || 7;

  return (
    <Paper
      sx={{
        p: 2,
        borderRadius: 2,
        backgroundColor: alpha('#fff', 0.05),
        backdropFilter: 'blur(10px)',
        border: `1px solid ${alpha('#fff', 0.1)}`,
        transition: 'all 0.2s ease',
        '&:hover': {
          backgroundColor: alpha('#fff', 0.08),
          boxShadow: `0 4px 12px ${alpha('#000', 0.2)}`
        }
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', flex: 1, cursor: 'pointer' }} onClick={() => onNavigate(habit.id)}>
          <Box sx={{ mr: 2 }}>
            <IconButton
              onClick={(e) => {
                e.stopPropagation();
                handleToggle(e);
              }}
              disabled={isUpdating}
              sx={{ 
                color: localIsTodayComplete ? '#4caf50' : alpha('#fff', 0.7),
                '&:hover': {
                  backgroundColor: alpha('#fff', 0.1)
                }
              }}
            >
              {isUpdating ? (
                <CircularProgress size={24} color="inherit" />
              ) : localIsTodayComplete ? (
                <CheckCircleIcon />
              ) : (
                <RadioButtonUncheckedIcon />
              )}
            </IconButton>
          </Box>
          
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" sx={{ 
              fontWeight: 600,
              color: localIsTodayComplete ? alpha('#fff', 0.7) : '#fff',
              textDecoration: localIsTodayComplete ? 'line-through' : 'none'
            }}>
              {habit.title}
            </Typography>
            
            {habit.description && (
              <Typography variant="body2" sx={{ 
                color: alpha('#fff', 0.7),
                textDecoration: localIsTodayComplete ? 'line-through' : 'none'
              }}>
                {habit.description}
              </Typography>
            )}
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
          <Box sx={{ mr: 2 }}>
            <EnhancedStarCompletion
              weeklyGoal={weeklyGoal}
              completedDays={weeklyCompletions}
              size={40}
              isUpdating={isUpdating}
            />
          </Box>
          
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            mr: 2,
            minWidth: 60
          }}>
            <Typography variant="caption" sx={{ color: alpha('#fff', 0.7) }}>
              {weeklyCompletions}/{weeklyGoal}
            </Typography>
            <Typography variant="caption" sx={{ color: alpha('#fff', 0.5) }}>
              days
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex' }}>
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(habit);
              }}
              sx={{ 
                color: alpha('#fff', 0.6),
                '&:hover': { color: '#fff' }
              }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
            
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(habit.id);
              }}
              sx={{ 
                color: alpha('#fff', 0.6),
                '&:hover': { color: '#f44336' }
              }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>
      </Box>
      
      <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <WhatshotIcon sx={{ color: '#ff9800', fontSize: '1rem', mr: 0.5 }} />
          <Typography variant="caption" sx={{ color: alpha('#fff', 0.7) }}>
            {currentStreak} day streak
          </Typography>
        </Box>
        
        <LinearProgress
          variant="determinate"
          value={(weeklyCompletions / weeklyGoal) * 100}
          sx={{
            width: '40%',
            height: 4,
            borderRadius: 2,
            bgcolor: alpha('#fff', 0.1),
            '& .MuiLinearProgress-bar': {
              bgcolor: weeklyCompletions >= weeklyGoal ? '#4caf50' : '#2196f3'
            }
          }}
        />
      </Box>
    </Paper>
  );
};

export default HabitCard; 