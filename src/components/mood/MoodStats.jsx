import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Grid,
  ButtonGroup,
  Button,
  alpha,
  Paper
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import { MOOD_TYPES } from '../../pages/MoodTrackerPage';
import { motion } from 'framer-motion';

// Helper function to calculate mood distribution
const calculateMoodDistribution = (moodHistory) => {
  const distribution = {};
  
  Object.keys(MOOD_TYPES).forEach(mood => {
    distribution[mood] = 0;
  });

  moodHistory.forEach(entry => {
    distribution[entry.mood]++;
  });

  return Object.entries(distribution)
    .map(([mood, count]) => ({
      name: mood,
      value: count,
      color: MOOD_TYPES[mood].color
    }))
    .filter(item => item.value > 0)
    .sort((a, b) => b.value - a.value);
};

// Helper function to calculate monthly mood trends
const calculateMonthlyTrends = (moodHistory) => {
  const monthlyData = {};
  
  moodHistory.forEach(entry => {
    const month = format(new Date(entry.date), 'MMM yyyy');
    if (!monthlyData[month]) {
      monthlyData[month] = {};
      Object.keys(MOOD_TYPES).forEach(mood => {
        monthlyData[month][mood] = 0;
      });
    }
    monthlyData[month][entry.mood]++;
  });

  return Object.entries(monthlyData).map(([month, moods]) => ({
    month,
    ...moods
  }));
};

// Custom Tooltip for charts
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <Paper
        sx={{
          bgcolor: alpha('#000', 0.8),
          p: 1.5,
          border: `1px solid ${alpha('#fff', 0.1)}`
        }}
      >
        <Typography sx={{ color: '#fff' }}>{label}</Typography>
        {payload.map((entry, index) => (
          <Typography
            key={index}
            sx={{ color: entry.color || entry.payload.color }}
          >
            {entry.name}: {entry.value}
          </Typography>
        ))}
      </Paper>
    );
  }
  return null;
};

export default function MoodStats({ moodHistory }) {
  const [timeRange, setTimeRange] = useState('month');
  
  // Calculate statistics based on time range
  const stats = useMemo(() => {
    const filteredHistory = moodHistory;  // Add time range filtering if needed
    
    return {
      distribution: calculateMoodDistribution(filteredHistory),
      monthlyTrends: calculateMonthlyTrends(filteredHistory),
      totalEntries: filteredHistory.length,
      dominantMood: calculateMoodDistribution(filteredHistory)[0]?.name || 'N/A'
    };
  }, [moodHistory, timeRange]);

  return (
    <Box>
      {/* Time Range Selector */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <ButtonGroup 
          variant="outlined" 
          sx={{ 
            mb: 2,
            '& .MuiButton-root': {
              color: '#fff',
              borderColor: alpha('#fff', 0.3),
              '&:hover': {
                borderColor: alpha('#fff', 0.5),
                bgcolor: alpha('#fff', 0.1)
              },
              '&.Mui-selected': {
                bgcolor: alpha('#fff', 0.2),
                borderColor: alpha('#fff', 0.5)
              }
            }
          }}
        >
          <Button 
            onClick={() => setTimeRange('week')}
            variant={timeRange === 'week' ? 'contained' : 'outlined'}
          >
            Week
          </Button>
          <Button 
            onClick={() => setTimeRange('month')}
            variant={timeRange === 'month' ? 'contained' : 'outlined'}
          >
            Month
          </Button>
          <Button 
            onClick={() => setTimeRange('year')}
            variant={timeRange === 'year' ? 'contained' : 'outlined'}
          >
            Year
          </Button>
        </ButtonGroup>
      </Box>

      {/* Quick Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6}>
          <Box
            sx={{
              p: 3,
              textAlign: 'center',
              backgroundColor: alpha('#fff', 0.08),
              borderRadius: 2,
              border: `1px solid ${alpha('#fff', 0.1)}`,
              transition: 'transform 0.2s ease-in-out',
              '&:hover': {
                transform: 'translateY(-4px)',
                backgroundColor: alpha('#fff', 0.1)
              }
            }}
          >
            <Typography variant="h3" sx={{ 
              mb: 1, 
              background: 'linear-gradient(45deg, #fff, rgba(255,255,255,0.6))', 
              WebkitBackgroundClip: 'text', 
              WebkitTextFillColor: 'transparent' 
            }}>
              {stats.totalEntries}
            </Typography>
            <Typography variant="body1" sx={{ color: alpha('#fff', 0.7) }}>
              Total Entries
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Box
            sx={{
              p: 3,
              textAlign: 'center',
              backgroundColor: alpha('#fff', 0.08),
              borderRadius: 2,
              border: `1px solid ${alpha('#fff', 0.1)}`,
              transition: 'transform 0.2s ease-in-out',
              '&:hover': {
                transform: 'translateY(-4px)',
                backgroundColor: alpha('#fff', 0.1)
              }
            }}
          >
            <Typography variant="h3" sx={{ mb: 1 }}>
              {MOOD_TYPES[stats.dominantMood]?.emoji || '🤔'}
            </Typography>
            <Typography variant="body1" sx={{ color: alpha('#fff', 0.7) }}>
              Most Common: {stats.dominantMood}
            </Typography>
          </Box>
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={4}>
        {/* Mood Distribution Pie Chart */}
        <Grid item xs={12} md={6}>
          <Box 
            sx={{ 
              p: 4,
              height: 400,
              backgroundColor: alpha('#fff', 0.08),
              borderRadius: 2,
              border: `1px solid ${alpha('#fff', 0.1)}`,
              transition: 'all 0.3s ease',
              '&:hover': {
                backgroundColor: alpha('#fff', 0.1),
                transform: 'translateY(-4px)'
              }
            }}
          >
            <Typography variant="h6" gutterBottom sx={{ color: alpha('#fff', 0.9) }}>
              Mood Distribution
            </Typography>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.distribution}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={120}
                  label={({ name, value }) => `${name} (${value})`}
                >
                  {stats.distribution.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Box>
        </Grid>

        {/* Monthly Trends Bar Chart */}
        <Grid item xs={12} md={6}>
          <Box 
            sx={{ 
              p: 4,
              height: 400,
              backgroundColor: alpha('#fff', 0.08),
              borderRadius: 2,
              border: `1px solid ${alpha('#fff', 0.1)}`,
              transition: 'all 0.3s ease',
              '&:hover': {
                backgroundColor: alpha('#fff', 0.1),
                transform: 'translateY(-4px)'
              }
            }}
          >
            <Typography variant="h6" gutterBottom sx={{ color: alpha('#fff', 0.9) }}>
              Monthly Trends
            </Typography>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.monthlyTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke={alpha('#fff', 0.1)} />
                <XAxis 
                  dataKey="month" 
                  stroke={alpha('#fff', 0.7)}
                  tick={{ fill: alpha('#fff', 0.7) }}
                />
                <YAxis 
                  stroke={alpha('#fff', 0.7)}
                  tick={{ fill: alpha('#fff', 0.7) }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                {Object.keys(MOOD_TYPES).map((mood, index) => (
                  <Bar
                    key={mood}
                    dataKey={mood}
                    stackId="a"
                    fill={MOOD_TYPES[mood].color}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
} 