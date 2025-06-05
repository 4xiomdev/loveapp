// src/pages/AccountabilityDetailPage.jsx
import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { db } from "../firebase";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  serverTimestamp,
  getDocs,
  writeBatch,
  setDoc,
  runTransaction,
  increment
} from "firebase/firestore";
import {
  Box,
  Typography,
  IconButton,
  Button,
  Grid,
  Tabs,
  Tab,
  alpha,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tooltip,
  Snackbar,
  CircularProgress,
  Paper,
  Chip
} from "@mui/material";
import {
  LocalFireDepartment as LocalFireDepartmentIcon,
  TrendingUp as TrendingUpIcon,
  EmojiEvents as EmojiEventsIcon,
  CalendarToday as CalendarTodayIcon,
  ArrowBack as ArrowBackIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Edit as EditIcon,
  Settings as SettingsIcon,
  Check as CheckIcon,
  Note as NoteIcon,
  Star as StarIcon,
  Whatshot as WhatshotIcon,
  Timeline as TimelineIcon
} from '@mui/icons-material';
import { motion } from "framer-motion";
import { format, addMonths, subMonths, startOfWeek, endOfWeek, isSameDay, isWithinInterval, addDays, isSameWeek, isAfter, subDays, differenceInDays } from 'date-fns';
import {
  Timeline,
  TimelineItem,
  TimelineContent,
  TimelineSeparator,
  TimelineDot,
  TimelineConnector
} from '@mui/lab';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  CartesianGrid
} from 'recharts';
import EnhancedStarCompletion from '../components/EnhancedStarCompletion';
import { awardWeeklyStarIfEligible } from "../utils/habitStarAwards";
import { useTheme } from '@mui/material/styles';
import StatCard from '../components/accountability/StatCard';
import GrowthVisualization from '../components/accountability/GrowthVisualization';
import WeeklyView from '../components/accountability/WeeklyView';
import MonthlyView from '../components/accountability/MonthlyView';
import YearlyView from '../components/accountability/YearlyView';

/**
 * AccountabilityDetailPage:
 *  - Habit doc => has daysPerWeek (user's weekly target).
 *  - dailyStatus => { done, notes } for each date.
 *  - 3 modes: monthly, 52weeks, 365days.
 *  - No pen icons; single click on a day => opens a dialog with [done checkbox] + [notes].
 *  - Monthly view => drop-down to pick which month to show. Default to current month.
 *  - 52-weeks => color is gradient from #done / daysPerWeek. 
 */



const getContributionColor = (done, intensity, baseColor) => {
  if (!done) return alpha('#ffffff', 0.05);
  const hslColor = hexToHSL(baseColor || '#24c6dc');
  return `hsl(${hslColor.h}, ${hslColor.s}%, ${Math.min(70, hslColor.l + intensity * 20)}%)`;
};

const hexToHSL = (hex) => {
  // Convert hex to HSL (implementation needed)
  // For now, returning default values
  return { h: 187, s: 70, l: 50 };
};

const GrowthTree = ({ score, color }) => {
  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
    >
      <Box sx={{ 
        position: 'relative',
        width: 120,
        height: 160,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center'
      }}>
        {/* Trunk */}
        <Box sx={{
          width: 20,
          height: 60,
          backgroundColor: '#8B4513',
          borderRadius: '5px',
          position: 'relative',
          zIndex: 1
        }} />
        
        {/* Tree Top */}
        <Box
          component={motion.div}
          animate={{
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          sx={{
            position: 'absolute',
            bottom: 40,
            width: 100,
            height: 120,
            borderRadius: '50%',
            background: `linear-gradient(145deg, 
              ${alpha('#2D5A27', score >= 25 ? 1 : 0.3)},
              ${alpha('#4CAF50', score >= 50 ? 1 : 0.3)},
              ${alpha('#81C784', score >= 75 ? 1 : 0.3)})`,
            boxShadow: `0 0 20px ${alpha('#4CAF50', 0.3)}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            '&::before': {
              content: '""',
              position: 'absolute',
              width: '80%',
              height: '80%',
              borderRadius: '50%',
              background: `linear-gradient(145deg, 
                ${alpha('#1B5E20', score >= 25 ? 1 : 0.3)},
                ${alpha('#388E3C', score >= 50 ? 1 : 0.3)})`,
            }
          }}
        >
          {/* Score display */}
          <Typography
            variant="h4"
            sx={{
              color: '#fff',
              fontWeight: 'bold',
              textShadow: '0 2px 4px rgba(0,0,0,0.3)',
              zIndex: 2
            }}
          >
            {Math.round(score)}%
          </Typography>
        </Box>

        {/* Fruits/Achievements */}
        {score >= 30 && [...Array(Math.floor(score/20))].map((_, i) => (
          <Box
            key={i}
            component={motion.div}
            animate={{
              y: [0, -5, 0],
            }}
            transition={{
              duration: 2,
              delay: i * 0.3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            sx={{
              position: 'absolute',
              width: 15,
              height: 15,
              borderRadius: '50%',
              backgroundColor: color || '#24c6dc',
              boxShadow: `0 0 10px ${color || '#24c6dc'}`,
              top: 40 + (i * 20),
              left: 50 + (i % 2 ? 30 : -30),
            }}
          />
        ))}
      </Box>
    </motion.div>
  );
};

// Helper function to get the first day of the month
const getFirstDayOfMonth = (date) => {
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
  return firstDay.getDay(); // 0-6 (Sunday-Saturday)
};

// Helper function to get the number of days in a month
const getDaysInMonth = (date) => {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
};

// Generate calendar days for a given month
const generateCalendarDays = (month, completions) => {
  const firstDayOfMonth = getFirstDayOfMonth(month);
  const daysInMonth = getDaysInMonth(month);
  const days = [];

  // Add empty days for the start of the month
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push({ dayNumber: '', date: null });
  }

  // Add actual days
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(month.getFullYear(), month.getMonth(), day)
      .toISOString()
      .split('T')[0];
    
    const completed = completions?.some(
      completion => completion.date === date && completion.done
    );

    days.push({
      dayNumber: day,
      date,
      completed
    });
  }

  return days;
};

// Helper function to generate weeks for the heat map
const generateWeeks = (data) => {
  const weeks = [];
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - 364); // Go back 52 weeks

  for (let i = 0; i <= 364; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    
    const completed = data?.some(
      item => item.date === dateStr && item.done
    );

    const weekIndex = Math.floor(i / 7);
    const dayIndex = i % 7;

    if (!weeks[weekIndex]) {
      weeks[weekIndex] = [];
    }

    weeks[weekIndex][dayIndex] = {
      date: dateStr,
      completed,
      intensity: completed ? 1 : 0 // You can adjust intensity based on other factors
    };
  }

  return weeks;
};

// Helper function to get color based on intensity
const getIntensityColor = (intensity, baseColor) => {
  const color = baseColor || '#24c6dc';
  return intensity === 0 
    ? alpha('#666', 0.4)
    : alpha(color, 0.3 + (intensity * 0.7));
};

// Update the calculateStats function to properly handle completion rates
const calculateStats = (dailyStatus, weeklyGoal) => {
  if (!dailyStatus?.length) {
    return {
      bestStreak: 0,
      currentStreak: 0,
      completionRate: 0,
      totalDays: 0,
      weeklyCompletions: 0,
      weeklyProgress: 0
    };
  }

  const sortedData = [...dailyStatus].sort((a, b) => 
    new Date(a.date) - new Date(b.date)
  );

  // Calculate streaks
  let currentStreak = 0;
  let bestStreak = 0;
  let tempStreak = 0;

  for (const item of sortedData) {
    if (item.done) {
      tempStreak++;
      bestStreak = Math.max(bestStreak, tempStreak);
    } else {
      tempStreak = 0;
    }
  }

  // Calculate current streak using current date
  const currentDate = new Date().toISOString().split('T')[0];
  for (let i = dailyStatus.length - 1; i >= 0; i--) {
    if (dailyStatus[i].done && dailyStatus[i].date <= currentDate) {
      currentStreak++;
    } else {
      break;
    }
  }

  // Calculate weekly completions
  const now = new Date();
  const weekStart = startOfWeek(now);
  const weekEnd = endOfWeek(now);
  
  // Get only this week's statuses
  const weeklyStatuses = dailyStatus.filter(status => {
    const statusDate = new Date(status.date + 'T00:00:00');
    return isWithinInterval(statusDate, { start: weekStart, end: weekEnd });
  });
  
  const weeklyCompletions = weeklyStatuses.filter(status => status.done).length;
  
  // Calculate completion rate based on actual days in the week so far
  const daysInWeekSoFar = weeklyStatuses.length;
  const completedDaysThisWeek = weeklyStatuses.filter(s => s.done).length;
  
  // Calculate completion rate as a percentage of days completed vs days tracked this week
  const completionRate = daysInWeekSoFar > 0 
    ? Math.round((completedDaysThisWeek / daysInWeekSoFar) * 100)
    : 0;

  // Weekly progress should show 100% if we've met or exceeded the goal
  const weeklyProgress = weeklyCompletions >= weeklyGoal 
    ? 100 
    : Math.round((weeklyCompletions / weeklyGoal) * 100);

  return {
    bestStreak,
    currentStreak,
    completionRate,
    totalDays: daysInWeekSoFar,
    weeklyCompletions,
    weeklyProgress
  };
};

// Monthly score calculation
const calculateMonthlyScore = (data) => {
  if (!data?.length) return 0;
  
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthData = data.filter(item => {
    const itemDate = new Date(item.date);
    return itemDate >= startOfMonth && itemDate <= today;
  });
  
  if (!monthData.length) return 0;
  
  const completedDays = monthData.filter(d => d.done).length;
  return Math.round((completedDays / monthData.length) * 100);
};

// Add this improved tree component
const WeeklyTreeVisualizer = ({ weeklyGoal, completedDays, color, mini = false }) => {
  // Clamp growth percentage between 0 and 100
  const growthPercentage = Math.min((completedDays / weeklyGoal) * 100, 100);
  const scale = mini ? 0.4 : 1;
  
  return (
    <Box sx={{ 
      position: 'relative',
      height: 200 * scale,
      width: 120 * scale,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      transform: `scale(${scale})`,
      transformOrigin: 'bottom'
    }}>
      {/* Ground Shadow */}
      <Box
        component={motion.div}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        sx={{
          position: 'absolute',
          bottom: 0,
          width: 80,
          height: 20,
          background: `radial-gradient(ellipse at center, ${alpha('#000', 0.2)} 0%, transparent 70%)`,
          borderRadius: '50%'
        }}
      />

      {/* Tree Trunk */}
      <motion.div
        initial={{ height: 0 }}
        animate={{ 
          height: 40 + (Math.min(growthPercentage, 100) * 0.6), // Clamp growth for trunk height
          transition: { duration: 0.8, ease: "easeOut" }
        }}
        style={{
          position: 'absolute',
          bottom: 10,
          width: 16,
          display: 'flex',
          justifyContent: 'center',
          zIndex: 1
        }}
      >
        <Box sx={{
          width: '100%',
          height: '100%',
          background: `linear-gradient(90deg, 
            ${alpha('#8B4513', 0.7)} 0%, 
            #8B4513 50%,
            ${alpha('#8B4513', 0.7)} 100%
          )`,
          borderRadius: '4px',
          boxShadow: `0 0 10px ${alpha('#000', 0.2)}`
        }} />
      </motion.div>

      {/* Tree Leaves Layers */}
      {[...Array(3)].map((_, index) => {
        const layerSize = 20 + (growthPercentage * 0.8);
        const yOffset = index * (layerSize * 0.6);
        
        return (
          <motion.div
            key={index}
            initial={{ scale: 0, y: 50 }}
            animate={{ 
              scale: 1,
              y: 80 - yOffset - (growthPercentage * 0.5),
              transition: { 
                duration: 0.8,
                delay: index * 0.2,
                ease: "easeOut"
              }
            }}
            style={{
              position: 'absolute',
              zIndex: 2 - index
            }}
          >
            <Box
              component={motion.div}
              animate={{
                scale: [1, 1.05, 1],
                transition: {
                  duration: 2,
                  repeat: Infinity,
                  repeatType: "reverse",
                  ease: "easeInOut",
                  delay: index * 0.3
                }
              }}
              sx={{
                width: layerSize + (index * 15),
                height: layerSize + (index * 10),
                backgroundColor: color || '#4CAF50',
                borderRadius: '50%',
                filter: 'blur(4px)',
                opacity: 0.7 + (index * 0.1),
                transform: 'scale(1.2)',
                boxShadow: `0 0 20px ${alpha(color || '#4CAF50', 0.3)}`
              }}
            />
          </motion.div>
        );
      })}

      {/* Growth Particles */}
      {growthPercentage > 30 && !mini && (
        <Box sx={{ position: 'absolute', width: '100%', height: '100%' }}>
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              animate={{
                y: [-10, -30],
                x: [-5 + (i * 2), 5 + (i * 2)],
                opacity: [0, 0.8, 0],
                scale: [0.5, 1]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.4,
                ease: "easeOut"
              }}
              style={{
                position: 'absolute',
                bottom: '40%',
                left: '50%',
                width: 4,
                height: 4,
                backgroundColor: alpha(color || '#4CAF50', 0.8),
                borderRadius: '50%'
              }}
            />
          ))}
        </Box>
      )}

      {/* Progress Label */}
      {!mini && (
        <>
          <Typography 
            variant="caption"
            sx={{ 
              position: 'absolute',
              bottom: -25,
              color: alpha('#fff', 0.7)
            }}
          >
            {completedDays}/{weeklyGoal} days {completedDays > weeklyGoal ? '(Goal Exceeded!)' : ''}
          </Typography>
          <Typography 
            variant="caption"
            sx={{ 
              position: 'absolute',
              top: 0,
              color: alpha('#fff', 0.7)
            }}
          >
            {Math.round(Math.min(growthPercentage, 100))}% Growth
          </Typography>
        </>
      )}
    </Box>
  );
};

// Calculate weekly completions for a specific week
const calculateWeeklyCompletions = (weekStart, weekEnd, statuses, includePending = false) => {
  // Simply count all completed statuses within the week range
  const completions = statuses.filter(status => {
    const statusDate = new Date(status.date);
    return status.done && 
           isWithinInterval(statusDate, {
             start: weekStart,
             end: weekEnd
           });
  }).length;

  return completions;
};

// Add getWeekDates function






// Add this enhanced StatisticsView component
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
              <Tooltip
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
              <Tooltip
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

// Update the main component's render section to use the views
export default function AccountabilityDetailPage() {
  // State declarations
  const [task, setTask] = useState(null);
  const [dailyStatus, setDailyStatus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('weekly');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isUpdating, setIsUpdating] = useState(false);
  const { user, userData } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const [editGoalOpen, setEditGoalOpen] = useState(false);
  const [weeklyGoal, setWeeklyGoal] = useState(7);
  const [selectedWeek, setSelectedWeek] = useState(new Date());
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [noteText, setNoteText] = useState('');
  const [weeklyCompletions, setWeeklyCompletions] = useState(0);
  const [myStars, setMyStars] = useState(0);
  const [showStarEarned, setShowStarEarned] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Add effect to listen for star balance changes
  useEffect(() => {
    if (!user?.uid) return;
    
    const unsubStars = onSnapshot(doc(db, "users", user.uid), (doc) => {
      if (doc.exists()) {
        setMyStars(doc.data().stars || 0);
      }
    });
    
    return () => unsubStars();
  }, [user?.uid]);

  // Replace handleToggleStatus function
  const handleToggleStatus = async (date, currentStatus) => {
    if (!user?.uid || !id) return;

    try {
      // Ensure we have a valid date object
      const targetDate = date instanceof Date ? date : new Date(date);
      if (isNaN(targetDate.getTime())) {
        throw new Error('Invalid date');
      }

      // Format dates consistently as YYYY-MM-DD
      const formattedDate = format(targetDate, 'yyyy-MM-dd');
      const today = format(new Date(), 'yyyy-MM-dd');
      const isToday = formattedDate === today;

      // Start a transaction
      await runTransaction(db, async (transaction) => {
        // Get the task document
        const taskRef = doc(db, "accountability", id);
        const taskDoc = await transaction.get(taskRef);
        
        if (!taskDoc.exists()) {
          throw new Error('Task not found');
        }

        const task = taskDoc.data();
        const weeklyGoal = task.weeklyGoal || 7;

        // Query for existing status
        const statusQuery = query(
          collection(db, "dailyStatus"),
          where("habitId", "==", id),
          where("owner", "==", user.uid),
          where("date", "==", formattedDate)
        );
        
        const statusSnapshot = await getDocs(statusQuery);
        const newStatus = !currentStatus;
        
        // Get all statuses for this week to calculate completions
        const weekStart = startOfWeek(new Date());
        const weekEnd = endOfWeek(new Date());
        const weeklyStatusQuery = query(
          collection(db, "dailyStatus"),
          where("habitId", "==", id),
          where("owner", "==", user.uid),
          where("date", ">=", format(weekStart, 'yyyy-MM-dd')),
          where("date", "<=", format(weekEnd, 'yyyy-MM-dd'))
        );
        const weeklyStatusSnapshot = await getDocs(weeklyStatusQuery);
        
        // Calculate weekly completions including the current update
        const weeklyCompletions = weeklyStatusSnapshot.docs.reduce((count, doc) => {
          const status = doc.data();
          // Don't count today's status as it's being updated
          if (status.date === formattedDate) return count;
          return status.done ? count + 1 : count;
        }, newStatus ? 1 : 0); // Add 1 if we're marking as complete

        if (statusSnapshot.empty) {
          // Create new status
          const newStatusRef = doc(collection(db, "dailyStatus"));
          transaction.set(newStatusRef, {
            habitId: id,
            owner: user.uid,
            partnerId: userData?.partnerId || null,
            date: formattedDate,
            done: newStatus,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
        } else {
          // Update existing status
          const statusDoc = statusSnapshot.docs[0];
          transaction.update(doc(db, "dailyStatus", statusDoc.id), {
            done: newStatus,
            updatedAt: serverTimestamp()
          });
        }

        // Always update the task's isTodayComplete field if we're toggling today's status
        if (isToday) {
          transaction.update(taskRef, {
            isTodayComplete: newStatus,
            lastCompletedAt: newStatus ? serverTimestamp() : null,
            updatedAt: serverTimestamp()
          });
        }

        // Check if weekly goal is met and award star if needed
        if (weeklyCompletions >= weeklyGoal && !task.weeklyStarAwarded) {
          // Award star to user
          const userRef = doc(db, "users", user.uid);
          transaction.update(userRef, {
            stars: increment(1),
            updatedAt: serverTimestamp()
          });

          // Create transaction record
          const transactionRef = doc(collection(db, "transactions"));
          transaction.set(transactionRef, {
            from: user.uid,
            to: user.uid,
            amount: 1,
            type: 'HABIT_COMPLETION',
            reason: `Completed weekly goal for ${task.title}`,
            participants: [user.uid],
            weekStartDate: format(weekStart, 'yyyy-MM-dd'),
            weekEndDate: format(weekEnd, 'yyyy-MM-dd'),
            createdAt: serverTimestamp()
          });

          // Mark star as awarded for this week
          transaction.update(taskRef, {
            weeklyStarAwarded: true,
            weeklyStarAwardedAt: serverTimestamp()
          });

          // Show star earned animation
          setShowStarEarned(true);
          setTimeout(() => setShowStarEarned(false), 3000);
        }

        // Check if we need to reset weekly star award for a new week
        const lastAwardedAt = task.weeklyStarAwardedAt?.toDate();
        if (lastAwardedAt && !isSameWeek(lastAwardedAt, new Date())) {
          transaction.update(taskRef, {
            weeklyStarAwarded: false,
            weeklyStarAwardedAt: null
          });
        }
      });

      // Success notification
      setSuccess('Status updated successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Error updating daily status:', error);
      setError(error.message || 'Failed to update status');
      setTimeout(() => setError(null), 3000);
    }
  };

  // Replace handleUpdateTask function
  const handleUpdateTask = async (updates) => {
    try {
      const taskRef = doc(db, "accountability", id);
      await updateDoc(taskRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
      
      // Refresh task data
      const taskDoc = await getDoc(taskRef);
      if (taskDoc.exists()) {
        setTask({ id: taskDoc.id, ...taskDoc.data() });
      }
    } catch (error) {
      console.error("Error updating task:", error);
      setError("Failed to update task");
    }
  };

  // Fetch task data
  useEffect(() => {
    if (!user || !id) return;

    const fetchTask = async () => {
      const taskDoc = await getDoc(doc(db, "accountability", id));
      if (taskDoc.exists()) {
        setTask({ id: taskDoc.id, ...taskDoc.data() });
      }
    };

    fetchTask();
  }, [id, user]);

  // Update effect to fetch daily status
  useEffect(() => {
    if (!user || !id) return;

    const q = query(
      collection(db, "dailyStatus"),
      where("habitId", "==", id),
      where("owner", "==", user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const statuses = [];
      snapshot.forEach((doc) => {
        statuses.push({ id: doc.id, ...doc.data() });
      });
      setDailyStatus(statuses);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [id, user]);

  // Navigation handlers
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const previousMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  // Update renderStats function with better date handling
  const renderStats = () => {
    const weeklyGoal = task?.weeklyGoal || 7;
    
    // Calculate current week's completions with consistent date handling
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 0 }); // Start week on Sunday
    const weekEnd = endOfWeek(now, { weekStartsOn: 0 });
    
    // Log dates for debugging
    console.log('Week interval:', {
      start: format(weekStart, 'yyyy-MM-dd HH:mm:ss'),
      end: format(weekEnd, 'yyyy-MM-dd HH:mm:ss')
    });
    
    const currentWeekCompletions = dailyStatus.filter(status => {
      // Parse the date at midnight to avoid timezone issues
      const statusDate = new Date(status.date + 'T00:00:00');
      const isInWeek = isWithinInterval(statusDate, { start: weekStart, end: weekEnd });
      
      // Log for debugging
      console.log('Status check:', {
        date: status.date,
        parsedDate: format(statusDate, 'yyyy-MM-dd HH:mm:ss'),
        done: status.done,
        isInWeek
      });
      
      return status.done && isInWeek;
    }).length;
    
    // Calculate progress percentage, ensuring 100% when goal is met
    const weeklyProgress = currentWeekCompletions >= weeklyGoal 
      ? 100 
      : Math.round((currentWeekCompletions / weeklyGoal) * 100);

    const habitStats = calculateStats(dailyStatus, weeklyGoal);
    const monthlyScore = calculateMonthlyScore(dailyStatus);

    return (
      <Box sx={{ mb: 4 }}>
        <Grid container spacing={3}>
          {/* Star Progress Visualization */}
          <Grid item xs={12} md={4}>
            <Box sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2
            }}>
              <EnhancedStarCompletion
                completedDays={currentWeekCompletions}
                weeklyGoal={weeklyGoal}
                color={task?.color || '#FFD700'}
                size={160}
                onStarEarned={() => {
                  if (currentWeekCompletions >= weeklyGoal) {
                    setShowStarEarned(true);
                  }
                }}
              />
              <Typography variant="subtitle1" sx={{ color: alpha('#fff', 0.9) }}>
                Weekly Progress: {weeklyProgress}% ({currentWeekCompletions}/{weeklyGoal} days)
              </Typography>
            </Box>
          </Grid>

          {/* Stats Grid */}
          <Grid item xs={12} md={8}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <StatCard
                  title="Current Streak"
                  value={habitStats.currentStreak}
                  icon={LocalFireDepartmentIcon}
                  color={task?.color}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <StatCard
                  title="Best Streak"
                  value={habitStats.bestStreak}
                  icon={EmojiEventsIcon}
                  color={task?.color}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <StatCard
                  title="Completion Rate"
                  value={`${habitStats.completionRate}%`}
                  icon={TrendingUpIcon}
                  color={task?.color}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <StatCard
                  title="Days Tracked"
                  value={habitStats.totalDays}
                  icon={CalendarTodayIcon}
                  color={task?.color}
                />
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Box>
    );
  };



  // Render the main content
  const renderContent = () => {
    switch (activeView) {
      case 'weekly':
        return (
          <WeeklyView
            dailyStatus={dailyStatus}
            weeklyGoal={weeklyGoal}
            color={task?.color}
            onDayClick={handleToggleStatus}
          />
        );
      case 'monthly':
        return (
          <MonthlyView
            dailyStatus={dailyStatus}
            color={task?.color}
            onDayClick={handleToggleStatus}
            currentMonth={currentMonth}
            onPrevMonth={previousMonth}
            onNextMonth={nextMonth}
          />
        );
      case 'yearly':
        return (
          <YearlyView
            dailyStatus={dailyStatus}
            weeklyGoal={weeklyGoal}
            color={task?.color}
          />
        );
      case 'statistics':
        return (
          <StatisticsView
            dailyStatus={dailyStatus}
            task={task}
          />
        );
      default:
        return null;
    }
  };

  if (loading) {
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

  return (
    <Box sx={{ color: "#fff", p: { xs: 2, sm: 3, md: 4 } }}>
      {/* Header */}
      <Box sx={{ 
        mb: { xs: 3, sm: 4 }, 
        display: 'flex', 
        flexDirection: { xs: 'column', sm: 'row' },
        gap: { xs: 2, sm: 0 }
      }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center',
          gap: 2,
          width: '100%'
        }}>
          <IconButton 
            onClick={() => navigate('/accountability')}
            sx={{ 
              color: '#fff',
              bgcolor: alpha('#fff', 0.05),
              '&:hover': {
                bgcolor: alpha('#fff', 0.1)
              }
            }}
          >
            <ArrowBackIcon />
          </IconButton>
          
          <Box sx={{ flex: 1 }}>
            <Typography variant="h4" sx={{ 
              fontWeight: 700,
              fontSize: { xs: '1.5rem', sm: '2rem' }
            }}>
              {task?.title}
            </Typography>
            <Typography variant="body2" sx={{ 
              color: alpha('#fff', 0.7),
              fontSize: { xs: '0.875rem', sm: '1rem' }
            }}>
              Current Goal: {task?.weeklyGoal || 7} days per week
            </Typography>
          </Box>

          <Tooltip title="Edit Weekly Goal">
            <IconButton
              onClick={() => setEditGoalOpen(true)}
              sx={{ 
                color: alpha('#fff', 0.7),
                bgcolor: alpha('#fff', 0.05),
                '&:hover': {
                  bgcolor: alpha('#fff', 0.1)
                }
              }}
            >
              <SettingsIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Stats Overview */}
      {renderStats()}

      {/* View Selection */}
      <Box sx={{ mb: { xs: 3, sm: 4 } }}>
        <Tabs 
          value={activeView}
          onChange={(e, newValue) => setActiveView(newValue)}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          sx={{
            '& .MuiTabs-scrollButtons': {
              color: alpha('#fff', 0.7)
            },
            '& .MuiTab-root': {
              color: alpha('#fff', 0.7),
              fontSize: { xs: '0.875rem', sm: '1rem' },
              minWidth: { xs: 'auto', sm: 120 },
              px: { xs: 2, sm: 3 }
            },
            '& .Mui-selected': {
              color: '#fff'
            }
          }}
        >
          <Tab value="weekly" label="Weekly View" />
          <Tab value="monthly" label="Monthly View" />
          <Tab value="yearly" label="Yearly Overview" />
          <Tab value="statistics" label="Statistics" />
        </Tabs>
      </Box>

      {/* Main Content */}
      <Box sx={{ 
        bgcolor: alpha('#fff', 0.03),
        borderRadius: 2,
        p: { xs: 2, sm: 3 }
      }}>
        {renderContent()}
      </Box>

      {/* Success/Error Messages */}
      <Snackbar
        open={!!success}
        autoHideDuration={3000}
        onClose={() => setSuccess(null)}
        message={success}
        sx={{
          '& .MuiSnackbarContent-root': {
            bgcolor: alpha('#4CAF50', 0.9),
            color: '#fff',
            width: { xs: '100%', sm: 'auto' },
            borderRadius: { xs: 0, sm: '8px' }
          },
          bottom: { xs: 0, sm: 24 },
          left: { xs: 0, sm: 24 },
          right: { xs: 0, sm: 'auto' }
        }}
      />
      
      <Snackbar
        open={!!error}
        autoHideDuration={3000}
        onClose={() => setError(null)}
        message={error}
        sx={{
          '& .MuiSnackbarContent-root': {
            bgcolor: alpha('#ff4444', 0.9),
            color: '#fff',
            width: { xs: '100%', sm: 'auto' },
            borderRadius: { xs: 0, sm: '8px' }
          },
          bottom: { xs: 0, sm: 24 },
          left: { xs: 0, sm: 24 },
          right: { xs: 0, sm: 'auto' }
        }}
      />

      {/* Weekly Goal Edit Dialog */}
      <Dialog
        open={editGoalOpen}
        onClose={() => setEditGoalOpen(false)}
        fullScreen={window.innerWidth < 600}
        PaperProps={{
          sx: {
            backgroundColor: alpha('#1a1a1a', 0.95),
            backdropFilter: 'blur(20px)',
            borderRadius: { xs: 0, sm: '16px' },
            border: `1px solid ${alpha('#fff', 0.1)}`,
            width: { xs: '100%', sm: '90%', md: '600px' },
            maxWidth: '100%',
            margin: { xs: 0, sm: 2 }
          }
        }}
      >
        <DialogTitle sx={{ color: '#fff' }}>
          Edit Weekly Goal
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              type="number"
              label="Days per week"
              value={weeklyGoal}
              onChange={(e) => setWeeklyGoal(Math.max(1, Math.min(7, parseInt(e.target.value) || 7)))}
              fullWidth
              inputProps={{ min: 1, max: 7 }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: '#fff',
                  '& fieldset': {
                    borderColor: alpha('#fff', 0.1)
                  },
                  '&:hover fieldset': {
                    borderColor: alpha('#fff', 0.2)
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: task?.color || '#9b59b6'
                  }
                },
                '& .MuiInputLabel-root': {
                  color: alpha('#fff', 0.7)
                }
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button 
            onClick={() => {
              handleUpdateTask({ weeklyGoal });
              setEditGoalOpen(false);
            }}
            variant="contained"
            sx={{ 
              bgcolor: task?.color || '#9b59b6',
              '&:hover': {
                bgcolor: alpha(task?.color || '#9b59b6', 0.8)
              }
            }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}