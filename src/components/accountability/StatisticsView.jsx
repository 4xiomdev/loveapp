import React, { useMemo } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid,
  alpha 
} from '@mui/material';
import {
  Whatshot as WhatshotIcon,
  EmojiEvents as EmojiEventsIcon,
  TrendingUp as TrendingUpIcon,
  Timeline as TimelineIcon
} from '@mui/icons-material';
import { format, differenceInDays } from 'date-fns';
import { useTheme } from '@mui/material/styles';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  CartesianGrid
} from 'recharts';

const StatisticsView = ({ dailyStatus, task }) => {
  const theme = useTheme();

  // Calculate completion patterns by day of week
  const dayOfWeekStats = useMemo(() => {
    const stats = {
      Sunday: { total: 0, completed: 0 },
      Monday: { total: 0, completed: 0 },
      Tuesday: { total: 0, completed: 0 },
      Wednesday: { total: 0, completed: 0 },
      Thursday: { total: 0, completed: 0 },
      Friday: { total: 0, completed: 0 },
      Saturday: { total: 0, completed: 0 }
    };

    dailyStatus.forEach(status => {
      const date = new Date(status.date);
      const dayName = format(date, 'EEEE');
      stats[dayName].total++;
      if (status.done) stats[dayName].completed++;
    });

    return Object.entries(stats).map(([day, data]) => ({
      day,
      completionRate: data.total ? Math.round((data.completed / data.total) * 100) : 0,
      total: data.total,
      completed: data.completed
    }));
  }, [dailyStatus]);

  // Calculate monthly trends
  const monthlyTrends = useMemo(() => {
    const trends = {};
    dailyStatus.forEach(status => {
      const monthYear = format(new Date(status.date), 'MMM yyyy');
      if (!trends[monthYear]) {
        trends[monthYear] = { total: 0, completed: 0 };
      }
      trends[monthYear].total++;
      if (status.done) trends[monthYear].completed++;
    });

    return Object.entries(trends).map(([month, data]) => ({
      month,
      completionRate: Math.round((data.completed / data.total) * 100),
      total: data.total,
      completed: data.completed
    }));
  }, [dailyStatus]);

  // Calculate streak information
  const streakInfo = useMemo(() => {
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    let totalCompletions = 0;
    let streakHistory = [];
    let lastDate = null;

    // Sort statuses by date
    const sortedStatus = [...dailyStatus].sort((a, b) => 
      new Date(a.date) - new Date(b.date)
    );

    sortedStatus.forEach(status => {
      if (status.done) {
        totalCompletions++;
        tempStreak++;
        
        if (lastDate) {
          const dayDiff = differenceInDays(new Date(status.date), new Date(lastDate));
          if (dayDiff > 1) {
            streakHistory.push({ length: tempStreak, endDate: lastDate });
            tempStreak = 1;
          }
        }
        
        longestStreak = Math.max(longestStreak, tempStreak);
        currentStreak = tempStreak;
      } else {
        if (tempStreak > 0) {
          streakHistory.push({ length: tempStreak, endDate: lastDate });
        }
        tempStreak = 0;
        currentStreak = 0;
      }
      lastDate = status.date;
    });

    // Add the final streak if exists
    if (tempStreak > 0) {
      streakHistory.push({ length: tempStreak, endDate: lastDate });
    }

    return {
      currentStreak,
      longestStreak,
      totalCompletions,
      completionRate: dailyStatus.length ? Math.round((totalCompletions / dailyStatus.length) * 100) : 0,
      streakHistory: streakHistory.sort((a, b) => b.length - a.length).slice(0, 5) // Top 5 streaks
    };
  }, [dailyStatus]);

  return (
    <Box>
      {/* Overview Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{
            p: 3,
            bgcolor: alpha('#fff', 0.05),
            borderRadius: 2,
            backdropFilter: 'blur(10px)',
            border: `1px solid ${alpha('#fff', 0.1)}`
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <WhatshotIcon sx={{ color: '#FF9800' }} />
              <Typography variant="h6">Current Streak</Typography>
            </Box>
            <Typography variant="h3" sx={{ 
              fontWeight: 700,
              color: '#FF9800'
            }}>
              {streakInfo.currentStreak}
            </Typography>
            <Typography variant="body2" sx={{ color: alpha('#fff', 0.7) }}>
              days in a row
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{
            p: 3,
            bgcolor: alpha('#fff', 0.05),
            borderRadius: 2,
            backdropFilter: 'blur(10px)',
            border: `1px solid ${alpha('#fff', 0.1)}`
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <EmojiEventsIcon sx={{ color: '#FFD700' }} />
              <Typography variant="h6">Longest Streak</Typography>
            </Box>
            <Typography variant="h3" sx={{ 
              fontWeight: 700,
              color: '#FFD700'
            }}>
              {streakInfo.longestStreak}
            </Typography>
            <Typography variant="body2" sx={{ color: alpha('#fff', 0.7) }}>
              days achieved
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{
            p: 3,
            bgcolor: alpha('#fff', 0.05),
            borderRadius: 2,
            backdropFilter: 'blur(10px)',
            border: `1px solid ${alpha('#fff', 0.1)}`
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <TrendingUpIcon sx={{ color: '#4CAF50' }} />
              <Typography variant="h6">Success Rate</Typography>
            </Box>
            <Typography variant="h3" sx={{ 
              fontWeight: 700,
              color: '#4CAF50'
            }}>
              {streakInfo.completionRate}%
            </Typography>
            <Typography variant="body2" sx={{ color: alpha('#fff', 0.7) }}>
              overall completion
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{
            p: 3,
            bgcolor: alpha('#fff', 0.05),
            borderRadius: 2,
            backdropFilter: 'blur(10px)',
            border: `1px solid ${alpha('#fff', 0.1)}`
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <TimelineIcon sx={{ color: '#2196F3' }} />
              <Typography variant="h6">Total Days</Typography>
            </Box>
            <Typography variant="h3" sx={{ 
              fontWeight: 700,
              color: '#2196F3'
            }}>
              {streakInfo.totalCompletions}
            </Typography>
            <Typography variant="body2" sx={{ color: alpha('#fff', 0.7) }}>
              days completed
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Day of Week Analysis */}
      <Paper sx={{ 
        p: 3, 
        mb: 4,
        bgcolor: alpha('#fff', 0.05),
        borderRadius: 2,
        backdropFilter: 'blur(10px)',
        border: `1px solid ${alpha('#fff', 0.1)}`
      }}>
        <Typography variant="h6" sx={{ mb: 3 }}>Daily Performance Patterns</Typography>
        <Box sx={{ height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dayOfWeekStats}>
              <CartesianGrid strokeDasharray="3 3" stroke={alpha('#fff', 0.1)} />
              <XAxis 
                dataKey="day" 
                stroke={alpha('#fff', 0.7)}
                tick={{ fill: alpha('#fff', 0.7) }}
              />
              <YAxis 
                stroke={alpha('#fff', 0.7)}
                tick={{ fill: alpha('#fff', 0.7) }}
                unit="%"
              />
              <RechartsTooltip
                contentStyle={{
                  backgroundColor: alpha('#000', 0.8),
                  border: 'none',
                  borderRadius: 8,
                  color: '#fff'
                }}
              />
              <Bar 
                dataKey="completionRate" 
                fill={task?.color || '#24c6dc'}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </Box>
      </Paper>

      {/* Monthly Trends */}
      <Paper sx={{ 
        p: 3, 
        mb: 4,
        bgcolor: alpha('#fff', 0.05),
        borderRadius: 2,
        backdropFilter: 'blur(10px)',
        border: `1px solid ${alpha('#fff', 0.1)}`
      }}>
        <Typography variant="h6" sx={{ mb: 3 }}>Monthly Progress</Typography>
        <Box sx={{ height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyTrends}>
              <CartesianGrid strokeDasharray="3 3" stroke={alpha('#fff', 0.1)} />
              <XAxis 
                dataKey="month" 
                stroke={alpha('#fff', 0.7)}
                tick={{ fill: alpha('#fff', 0.7) }}
              />
              <YAxis 
                stroke={alpha('#fff', 0.7)}
                tick={{ fill: alpha('#fff', 0.7) }}
                unit="%"
              />
              <RechartsTooltip
                contentStyle={{
                  backgroundColor: alpha('#000', 0.8),
                  border: 'none',
                  borderRadius: 8,
                  color: '#fff'
                }}
              />
              <Bar 
                dataKey="completionRate" 
                fill={task?.color || '#24c6dc'}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </Box>
      </Paper>

      {/* Best Streaks */}
      <Paper sx={{ 
        p: 3,
        bgcolor: alpha('#fff', 0.05),
        borderRadius: 2,
        backdropFilter: 'blur(10px)',
        border: `1px solid ${alpha('#fff', 0.1)}`
      }}>
        <Typography variant="h6" sx={{ mb: 3 }}>Top Streaks</Typography>
        <Grid container spacing={2}>
          {streakInfo.streakHistory.map((streak, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Box sx={{
                p: 2,
                bgcolor: alpha('#fff', 0.03),
                borderRadius: 2,
                border: `1px solid ${alpha('#fff', 0.05)}`,
                display: 'flex',
                alignItems: 'center',
                gap: 2
              }}>
                <Box sx={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  bgcolor: alpha(task?.color || '#24c6dc', 0.2),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: task?.color || '#24c6dc',
                  fontWeight: 700
                }}>
                  #{index + 1}
                </Box>
                <Box>
                  <Typography variant="h6" sx={{ color: task?.color || '#24c6dc' }}>
                    {streak.length} Days
                  </Typography>
                  <Typography variant="caption" sx={{ color: alpha('#fff', 0.7) }}>
                    Ended {format(new Date(streak.endDate), 'MMM d, yyyy')}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Paper>
    </Box>
  );
};

export default StatisticsView; 