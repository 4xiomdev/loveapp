import React, { useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  alpha,
  Grid,
  Chip,
  Avatar,
  useTheme
} from '@mui/material';
import {
  Timeline as TimelineIcon,
  CheckCircle as CheckCircleIcon,
  Whatshot as WhatshotIcon,
  TrendingUp as TrendingUpIcon,
  EmojiEvents as EmojiEventsIcon,
  Star as StarIcon
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import {
  format,
  startOfWeek,
  endOfWeek,
  isWithinInterval,
  subDays
} from 'date-fns';

// Helper function for weekly completions calculation
const calculateWeeklyCompletions = (weekStart, weekEnd, statuses, includePending = false) => {
  if (!statuses || !statuses.length) return 0;
  
  return statuses.filter(status => {
    const statusDate = new Date(status.date + 'T00:00:00');
    const isInWeek = isWithinInterval(statusDate, { start: weekStart, end: weekEnd });
    return isInWeek && status.done;
  }).length;
};

// Helper functions for calculations
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

const StatsDashboard = ({ tasks, dailyStatus }) => {
  const theme = useTheme();

  const stats = useMemo(() => {
    if (!tasks || !tasks.length) {
      return {
        weeklyData: [],
        habitStats: [],
        overallCompletion: 0,
        bestStreak: 0,
        totalHabits: 0,
        weeklyProgress: 0
      };
    }

    // Calculate overall completion rate
    const habitStats = tasks.map(task => {
      const taskStatus = dailyStatus[task.id] || [];
      const streak = calculateStreak(taskStatus, task.isTodayComplete);
      const completionRate = calculateCompletionRate(taskStatus, task.isTodayComplete);
      
      return {
        id: task.id,
        title: task.title,
        streak: streak.currentStreak,
        longestStreak: streak.longestStreak,
        completionRate
      };
    });

    // Calculate weekly data
    const weeklyData = [...Array(7)].map((_, i) => {
      const date = subDays(new Date(), 6 - i);
      const dateStr = format(date, 'EEE');
      const completed = tasks.reduce((acc, task) => {
        const isDone = dailyStatus[task.id]?.some(s => 
          s.done && s.date === format(date, 'yyyy-MM-dd')
        );
        return acc + (isDone ? 1 : 0);
      }, 0);
      return { date: dateStr, completed, total: tasks.length };
    });

    // Calculate weekly progress
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 0 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 0 });
    
    let totalWeeklyCompletions = 0;
    let totalWeeklyGoals = 0;
    
    tasks.forEach(task => {
      const taskStatuses = dailyStatus[task.id] || [];
      const weeklyCompletions = calculateWeeklyCompletions(
        weekStart, 
        weekEnd, 
        taskStatuses,
        false
      );
      totalWeeklyCompletions += weeklyCompletions;
      totalWeeklyGoals += (task.weeklyGoal || 7);
    });
    
    const weeklyProgress = totalWeeklyGoals > 0 
      ? Math.min(Math.round((totalWeeklyCompletions / totalWeeklyGoals) * 100), 100)
      : 0;

    return {
      weeklyData,
      habitStats,
      overallCompletion: tasks.length > 0 ? Math.round(
        habitStats.reduce((acc, stat) => acc + stat.completionRate, 0) / habitStats.length
      ) : 0,
      bestStreak: habitStats.reduce((max, stat) => Math.max(max, stat.streak), 0),
      totalHabits: tasks.length,
      weeklyProgress
    };
  }, [tasks, dailyStatus]);

  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h5" sx={{ 
        fontWeight: 700, 
        mb: 3,
        display: 'flex',
        alignItems: 'center',
        gap: 1
      }}>
        <TimelineIcon sx={{ color: '#64B5F6' }} />
        Your Progress
      </Typography>

      {/* Touch-friendly stat cards */}
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        gap: 3
      }}>
        {/* Main stats card with circular progress */}
        <Paper sx={{ 
          p: 3, 
          borderRadius: 4,
          background: 'linear-gradient(135deg, rgba(25,118,210,0.1), rgba(121,134,203,0.2))',
          backdropFilter: 'blur(10px)',
          border: `1px solid ${alpha('#fff', 0.1)}`,
          overflow: 'hidden',
          position: 'relative'
        }}>
          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 3
          }}>
            {/* Weekly progress circular indicator */}
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center',
              position: 'relative',
              p: 2
            }}>
              <Box sx={{ position: 'relative', width: 120, height: 120 }}>
                <CircularProgress
                  variant="determinate"
                  value={100}
                  size={120}
                  thickness={4}
                  sx={{ 
                    color: alpha('#fff', 0.1),
                    position: 'absolute',
                    top: 0,
                    left: 0
                  }}
                />
                <CircularProgress
                  variant="determinate"
                  value={stats.weeklyProgress}
                  size={120}
                  thickness={4}
                  sx={{ 
                    color: stats.weeklyProgress >= 100 ? '#4CAF50' : '#2196F3',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    transition: 'all 0.5s ease'
                  }}
                />
                <Box sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  bottom: 0,
                  right: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Typography variant="h3" sx={{ 
                    fontWeight: 700, 
                    color: '#fff',
                    lineHeight: 1
                  }}>
                    {stats.weeklyProgress}%
                  </Typography>
                  <Typography variant="caption" sx={{ color: alpha('#fff', 0.7) }}>
                    Weekly Goal
                  </Typography>
                </Box>
              </Box>
              <Typography variant="body2" sx={{ 
                mt: 2, 
                color: alpha('#fff', 0.7),
                textAlign: 'center'
              }}>
                {(() => {
                  if (stats.weeklyProgress >= 100) return "Goal achieved! 🎉";
                  if (stats.weeklyProgress >= 75) return "Almost there!";
                  if (stats.weeklyProgress >= 50) return "Halfway there";
                  if (stats.weeklyProgress >= 25) return "Good progress";
                  return "Just getting started";
                })()}
              </Typography>
            </Box>

            {/* Weekly chart - simplified for touch */}
            <Box sx={{ 
              flex: 1, 
              height: 160,
              width: '100%',
              overflow: 'hidden'
            }}>
              <Typography variant="subtitle2" sx={{ mb: 1, color: alpha('#fff', 0.7) }}>
                Last 7 Days
              </Typography>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.weeklyData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                  <XAxis 
                    dataKey="date" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: alpha('#fff', 0.7), fontSize: 12 }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: alpha('#000', 0.8),
                      border: `1px solid ${alpha('#fff', 0.1)}`,
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                    formatter={(value, name) => [`${value} completed`, 'Habits']}
                    labelFormatter={(label) => `${label}`}
                  />
                  <Bar 
                    dataKey="completed" 
                    name="Completed" 
                    fill="#64B5F6"
                    radius={[4, 4, 0, 0]}
                    barSize={30}
                  >
                    {stats.weeklyData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.date === format(new Date(), 'EEE') ? '#4CAF50' : '#64B5F6'} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Box>
        </Paper>

        {/* Quick stats cards - touch friendly */}
        <Grid container spacing={2}>
          <Grid item xs={6} sm={3}>
            <Paper sx={{ 
              p: 2, 
              borderRadius: 4,
              background: 'linear-gradient(135deg, rgba(76,175,80,0.1), rgba(76,175,80,0.2))',
              backdropFilter: 'blur(10px)',
              border: `1px solid ${alpha('#fff', 0.1)}`,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              transition: 'transform 0.2s ease',
              '&:hover': {
                transform: 'translateY(-2px)'
              }
            }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                width: 48,
                height: 48,
                borderRadius: '50%',
                bgcolor: alpha('#4CAF50', 0.2),
                mb: 1
              }}>
                <CheckCircleIcon sx={{ color: '#4CAF50', fontSize: 28 }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#4CAF50' }}>
                {stats.overallCompletion}%
              </Typography>
              <Typography variant="body2" sx={{ color: alpha('#fff', 0.7) }}>
                Completion Rate
              </Typography>
            </Paper>
          </Grid>
          
          <Grid item xs={6} sm={3}>
            <Paper sx={{ 
              p: 2, 
              borderRadius: 4,
              background: 'linear-gradient(135deg, rgba(255,152,0,0.1), rgba(255,152,0,0.2))',
              backdropFilter: 'blur(10px)',
              border: `1px solid ${alpha('#fff', 0.1)}`,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              transition: 'transform 0.2s ease',
              '&:hover': {
                transform: 'translateY(-2px)'
              }
            }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                width: 48,
                height: 48,
                borderRadius: '50%',
                bgcolor: alpha('#FF9800', 0.2),
                mb: 1
              }}>
                <WhatshotIcon sx={{ color: '#FF9800', fontSize: 28 }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#FF9800' }}>
                {stats.bestStreak}
              </Typography>
              <Typography variant="body2" sx={{ color: alpha('#fff', 0.7) }}>
                Best Streak
              </Typography>
            </Paper>
          </Grid>
          
          <Grid item xs={6} sm={3}>
            <Paper sx={{ 
              p: 2, 
              borderRadius: 4,
              background: 'linear-gradient(135deg, rgba(33,150,243,0.1), rgba(33,150,243,0.2))',
              backdropFilter: 'blur(10px)',
              border: `1px solid ${alpha('#fff', 0.1)}`,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              transition: 'transform 0.2s ease',
              '&:hover': {
                transform: 'translateY(-2px)'
              }
            }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                width: 48,
                height: 48,
                borderRadius: '50%',
                bgcolor: alpha('#2196F3', 0.2),
                mb: 1
              }}>
                <TrendingUpIcon sx={{ color: '#2196F3', fontSize: 28 }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#2196F3' }}>
                {stats.totalHabits}
              </Typography>
              <Typography variant="body2" sx={{ color: alpha('#fff', 0.7) }}>
                Active Habits
              </Typography>
            </Paper>
          </Grid>
          
          <Grid item xs={6} sm={3}>
            <Paper sx={{ 
              p: 2, 
              borderRadius: 4,
              background: 'linear-gradient(135deg, rgba(233,30,99,0.1), rgba(233,30,99,0.2))',
              backdropFilter: 'blur(10px)',
              border: `1px solid ${alpha('#fff', 0.1)}`,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              transition: 'transform 0.2s ease',
              '&:hover': {
                transform: 'translateY(-2px)'
              }
            }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                width: 48,
                height: 48,
                borderRadius: '50%',
                bgcolor: alpha('#E91E63', 0.2),
                mb: 1
              }}>
                <EmojiEventsIcon sx={{ color: '#E91E63', fontSize: 28 }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#E91E63' }}>
                {(() => {
                  const now = new Date();
                  const weekStart = startOfWeek(now, { weekStartsOn: 0 });
                  const weekEnd = endOfWeek(now, { weekStartsOn: 0 });
                  
                  // Count unique dates in current week where any task was completed
                  const uniqueDates = new Set();
                  tasks.forEach(task => {
                    const taskDailyStatus = dailyStatus[task.id] || [];
                    taskDailyStatus
                      .filter(status => {
                        const statusDate = new Date(status.date + 'T00:00:00');
                        return status.done && isWithinInterval(statusDate, { start: weekStart, end: weekEnd });
                      })
                      .forEach(status => uniqueDates.add(status.date));
                  });
                  
                  return uniqueDates.size;
                })()}
              </Typography>
              <Typography variant="body2" sx={{ color: alpha('#fff', 0.7) }}>
                Days Active
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* Best performing habits - touch friendly */}
        {stats.habitStats.length > 0 && (
          <Paper sx={{ 
            p: 3, 
            borderRadius: 4,
            background: 'linear-gradient(135deg, rgba(25,118,210,0.05), rgba(121,134,203,0.1))',
            backdropFilter: 'blur(10px)',
            border: `1px solid ${alpha('#fff', 0.1)}`
          }}>
            <Typography variant="subtitle1" sx={{ 
              mb: 2, 
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}>
              <StarIcon sx={{ color: '#FFD700', fontSize: 20 }} />
              Top Performing Habits
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {stats.habitStats
                .sort((a, b) => b.completionRate - a.completionRate)
                .slice(0, 3)
                .map((habit) => (
                  <Box 
                    key={habit.id}
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: alpha('#fff', 0.05),
                      '&:hover': {
                        bgcolor: alpha('#fff', 0.08)
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar 
                        sx={{ 
                          bgcolor: alpha('#FFD700', 0.2),
                          color: '#FFD700',
                          width: 40,
                          height: 40
                        }}
                      >
                        {habit.completionRate}%
                      </Avatar>
                      <Typography 
                        variant="body1" 
                        sx={{ 
                          fontWeight: 500,
                          color: '#fff',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          maxWidth: { xs: '120px', sm: '200px', md: '300px' }
                        }}
                      >
                        {habit.title}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip 
                        icon={<WhatshotIcon sx={{ color: '#FF9800' }} />}
                        label={`${habit.streak} day streak`}
                        size="small"
                        sx={{ 
                          bgcolor: alpha('#FF9800', 0.1),
                          color: alpha('#fff', 0.9),
                          borderRadius: '16px'
                        }}
                      />
                    </Box>
                  </Box>
                ))}
            </Box>
          </Paper>
        )}
      </Box>
    </Box>
  );
};

export default StatsDashboard; 