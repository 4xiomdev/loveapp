import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  alpha,
  Chip,
  Grid,
  LinearProgress,
  Tooltip,
  Divider,
  Avatar
} from '@mui/material';
import { motion } from 'framer-motion';
import { collection, query, where, orderBy, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { format, startOfWeek, endOfWeek, differenceInDays, subDays, isAfter } from 'date-fns';
import WhatshotIcon from '@mui/icons-material/Whatshot';
import StarIcon from '@mui/icons-material/Star';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import TimelineIcon from '@mui/icons-material/Timeline';

// Styled habit card component
const HabitCard = ({ children, ...props }) => (
  <Paper
    elevation={0}
    sx={{
      p: 2.5,
      mb: 2,
      borderRadius: 2,
      backgroundColor: alpha('#fff', 0.05),
      backdropFilter: 'blur(10px)',
      border: `1px solid ${alpha('#fff', 0.1)}`,
      transition: 'all 0.3s ease',
      '&:hover': {
        backgroundColor: alpha('#fff', 0.08),
        transform: 'translateY(-2px)',
        boxShadow: `0 8px 24px ${alpha('#000', 0.2)}`
      },
      ...props.sx
    }}
    {...props}
  >
    {children}
  </Paper>
);

// Helper function to calculate streak
const calculateStreak = (dailyStatus, isTodayComplete) => {
  if (!dailyStatus || !dailyStatus.length) return 0;
  
  // Sort by date in descending order (newest first)
  const sortedStatuses = [...dailyStatus].sort((a, b) => 
    new Date(b.date) - new Date(a.date)
  );
  
  // Start with today's status
  let streak = isTodayComplete ? 1 : 0;
  
  // If today is not complete, check if yesterday was
  if (!isTodayComplete) {
    const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');
    const yesterdayStatus = sortedStatuses.find(s => s.date === yesterday);
    if (!yesterdayStatus?.done) return 0; // No streak if yesterday wasn't done
    streak = 1; // Start streak from yesterday
  }
  
  // Check previous days
  const today = new Date();
  let currentDate = subDays(today, streak); // Start from the day before the last counted day
  
  for (let i = 0; i < sortedStatuses.length; i++) {
    const statusDate = new Date(sortedStatuses[i].date);
    const expectedDate = format(currentDate, 'yyyy-MM-dd');
    
    // If this status is for the expected date and it's done
    if (sortedStatuses[i].date === expectedDate && sortedStatuses[i].done) {
      streak++;
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
  
  return streak;
};

// Helper function to calculate completion rate
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
    return (completedDays + 1) / (recentStatuses.length + 1);
  }
  
  return completedDays / Math.max(recentStatuses.length, 1);
};

// Helper function to calculate weekly completions
const calculateWeeklyCompletions = (weekStart, weekEnd, statuses, includePending = false) => {
  if (!statuses || !statuses.length) return 0;
  
  const weekStartStr = format(weekStart, 'yyyy-MM-dd');
  const weekEndStr = format(weekEnd, 'yyyy-MM-dd');
  
  // Filter statuses within the week
  const weeklyStatuses = statuses.filter(status => {
    return status.date >= weekStartStr && status.date <= weekEndStr;
  });
  
  // Count completed days
  return weeklyStatuses.filter(status => status.done).length;
};

export default function PartnerHabitsView({ partnerId, partnerName }) {
  const [loading, setLoading] = useState(true);
  const [habits, setHabits] = useState([]);
  const [dailyStatus, setDailyStatus] = useState({});
  const [error, setError] = useState(null);

  // Fetch partner's habits
  useEffect(() => {
    if (!partnerId) {
      setLoading(false);
      return;
    }

    const habitsRef = collection(db, 'accountability');
    const q = query(
      habitsRef,
      where('owner', '==', partnerId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const habitsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setHabits(habitsList);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching partner habits:', error);
      setError('Failed to load partner habits');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [partnerId]);

  // Fetch daily status for each habit
  useEffect(() => {
    if (!habits.length || !partnerId) return;

    const unsubscribes = habits.map(habit => {
      // Query for all daily statuses for this habit
      const statusQuery = query(
        collection(db, "dailyStatus"),
        where("habitId", "==", habit.id),
        where("owner", "==", partnerId),
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
          [habit.id]: statuses
        }));

        // Check if today's status exists and update habit's isTodayComplete
        const today = format(new Date(), 'yyyy-MM-dd');
        const todayStatus = statuses.find(s => s.date === today);
        const habitToUpdate = habits.find(h => h.id === habit.id);
        if (habitToUpdate) {
          habitToUpdate.isTodayComplete = todayStatus?.done || false;
        }
      }, (error) => {
        console.error(`Error watching daily status for habit ${habit.id}:`, error);
        setError("Failed to sync habit status");
      });
    });

    // Cleanup subscriptions
    return () => {
      unsubscribes.forEach(unsubscribe => unsubscribe());
    };
  }, [habits, partnerId]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  if (!habits.length) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="body1" sx={{ color: alpha('#fff', 0.7) }}>
          {partnerName || 'Your partner'} hasn't created any habits yet.
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
        {partnerName || 'Partner'}'s Habits
      </Typography>

      {habits.map((habit) => {
        const statuses = dailyStatus[habit.id] || [];
        const streak = calculateStreak(
          statuses.map(s => ({ date: s.date, done: s.done })),
          statuses.some(s => s.date === format(new Date(), 'yyyy-MM-dd') && s.done)
        );
        const completionRate = calculateCompletionRate(
          statuses.map(s => ({ date: s.date, done: s.done })),
          statuses.some(s => s.date === format(new Date(), 'yyyy-MM-dd') && s.done)
        );
        const weekStart = startOfWeek(new Date(), { weekStartsOn: 0 });
        const weekEnd = endOfWeek(new Date(), { weekStartsOn: 0 });
        const weeklyCompletions = calculateWeeklyCompletions(
          weekStart,
          weekEnd,
          statuses.map(s => ({ date: s.date, done: s.done }))
        );
        const weeklyGoal = habit.weeklyGoal || 7;
        const weeklyProgress = Math.min(weeklyCompletions / weeklyGoal, 1);

        return (
          <motion.div
            key={habit.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <HabitCard>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {habit.title}
                </Typography>
                <Chip
                  size="small"
                  label={habit.isTodayComplete ? "Completed Today" : "Not Completed Today"}
                  sx={{
                    bgcolor: habit.isTodayComplete ? alpha('#4caf50', 0.1) : alpha('#ff9800', 0.1),
                    color: habit.isTodayComplete ? '#4caf50' : '#ff9800',
                    fontWeight: 500
                  }}
                />
              </Box>

              {habit.description && (
                <Typography 
                  variant="body2" 
                  sx={{ 
                    mb: 2,
                    color: alpha('#fff', 0.7)
                  }}
                >
                  {habit.description}
                </Typography>
              )}

              <Divider sx={{ my: 2, borderColor: alpha('#fff', 0.1) }} />

              <Grid container spacing={2}>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Tooltip title="Current streak">
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 0.5 }}>
                        <WhatshotIcon sx={{ color: '#ff9800', mr: 0.5 }} />
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                          {streak}
                        </Typography>
                      </Box>
                    </Tooltip>
                    <Typography variant="caption" sx={{ color: alpha('#fff', 0.6) }}>
                      Day Streak
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Tooltip title="Weekly goal progress">
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 0.5 }}>
                        <EmojiEventsIcon sx={{ color: '#ffc107', mr: 0.5 }} />
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                          {weeklyCompletions}/{weeklyGoal}
                        </Typography>
                      </Box>
                    </Tooltip>
                    <Typography variant="caption" sx={{ color: alpha('#fff', 0.6) }}>
                      Weekly Goal
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Tooltip title="30-day completion rate">
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 0.5 }}>
                        <TimelineIcon sx={{ color: '#2196f3', mr: 0.5 }} />
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                          {Math.round(completionRate * 100)}%
                        </Typography>
                      </Box>
                    </Tooltip>
                    <Typography variant="caption" sx={{ color: alpha('#fff', 0.6) }}>
                      Completion Rate
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Tooltip title="Weekly progress">
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 0.5 }}>
                        <StarIcon sx={{ color: '#e91e63', mr: 0.5 }} />
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                          {Math.round(weeklyProgress * 100)}%
                        </Typography>
                      </Box>
                    </Tooltip>
                    <Typography variant="caption" sx={{ color: alpha('#fff', 0.6) }}>
                      Weekly Progress
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              <Box sx={{ mt: 2 }}>
                <LinearProgress
                  variant="determinate"
                  value={weeklyProgress * 100}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    bgcolor: alpha('#fff', 0.1),
                    '& .MuiLinearProgress-bar': {
                      bgcolor: weeklyProgress >= 1 ? '#4caf50' : '#2196f3'
                    }
                  }}
                />
              </Box>
            </HabitCard>
          </motion.div>
        );
      })}
    </Box>
  );
} 