import React, { useState } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Paper,
  alpha,
  Tooltip,
  Grid
} from '@mui/material';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  getDay
} from 'date-fns';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { MOOD_TYPES } from '../../pages/MoodTrackerPage';
import { motion, AnimatePresence } from 'framer-motion';

// Helper function to get mood for a specific date
const getMoodForDate = (date, moodHistory) => {
  return moodHistory.find(mood => isSameDay(new Date(mood.date), date));
};

// Calendar Day component
const CalendarDay = ({ date, mood, isCurrentMonth }) => {
  const moodType = mood ? MOOD_TYPES[mood.mood] : null;
  
  return (
    <Tooltip
      title={mood ? `${mood.mood} - ${format(new Date(mood.date), 'MMM d, yyyy')}` : ''}
      arrow
    >
      <Box
        component={motion.div}
        whileHover={{ scale: 1.05 }}
        sx={{
          p: 1,
          height: '100%',
          minHeight: 80,
          borderRadius: 1,
          backgroundColor: mood 
            ? alpha(moodType?.color || '#fff', 0.1)
            : alpha('#fff', 0.03),
          border: `1px solid ${alpha('#fff', isCurrentMonth ? 0.1 : 0.05)}`,
          opacity: isCurrentMonth ? 1 : 0.5,
          transition: 'all 0.2s ease',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 1,
          cursor: mood ? 'pointer' : 'default',
          '&:hover': {
            backgroundColor: mood 
              ? alpha(moodType?.color || '#fff', 0.15)
              : alpha('#fff', 0.05)
          }
        }}
      >
        <Typography
          variant="caption"
          sx={{
            color: alpha('#fff', 0.7),
            fontWeight: isCurrentMonth ? 500 : 400
          }}
        >
          {format(date, 'd')}
        </Typography>
        {mood && (
          <Typography variant="h6" component="span">
            {moodType?.emoji}
          </Typography>
        )}
      </Box>
    </Tooltip>
  );
};

export default function MoodCalendar({ moodHistory }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const startDate = monthStart;
  const endDate = monthEnd;

  // Generate days for the current month view
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  // Calculate the number of empty cells needed at the start
  const startDay = getDay(monthStart);
  const emptyDays = Array(startDay).fill(null);

  // Navigation handlers
  const previousMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const goToToday = () => setCurrentDate(new Date());

  return (
    <Box>
      {/* Calendar Header */}
      <Box
        sx={{
          mb: 4,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <IconButton onClick={previousMonth} sx={{ color: alpha('#fff', 0.7) }}>
          <ChevronLeftIcon />
        </IconButton>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            {format(currentDate, 'MMMM yyyy')}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: alpha('#fff', 0.7),
              cursor: 'pointer',
              '&:hover': { textDecoration: 'underline' }
            }}
            onClick={goToToday}
          >
            Back to Today
          </Typography>
        </Box>
        <IconButton onClick={nextMonth} sx={{ color: alpha('#fff', 0.7) }}>
          <ChevronRightIcon />
        </IconButton>
      </Box>

      {/* Calendar Grid */}
      <Box
        sx={{
          p: 2,
          backgroundColor: alpha('#fff', 0.08),
          borderRadius: 2,
          border: `1px solid ${alpha('#fff', 0.1)}`
        }}
      >
        {/* Weekday Headers */}
        <Grid container spacing={1} sx={{ mb: 1 }}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <Grid item xs key={day}>
              <Typography
                variant="caption"
                sx={{
                  color: alpha('#fff', 0.7),
                  fontWeight: 600,
                  textAlign: 'center',
                  display: 'block'
                }}
              >
                {day}
              </Typography>
            </Grid>
          ))}
        </Grid>

        {/* Calendar Days */}
        <Grid container spacing={1}>
          {/* Empty cells for alignment */}
          {emptyDays.map((_, index) => (
            <Grid item xs key={`empty-${index}`}>
              <Box sx={{ minHeight: 80 }} />
            </Grid>
          ))}

          {/* Actual days */}
          {days.map((day) => (
            <Grid item xs key={format(day, 'yyyy-MM-dd')}>
              <CalendarDay
                date={day}
                mood={getMoodForDate(day, moodHistory)}
                isCurrentMonth={isSameMonth(day, currentDate)}
              />
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Mood Legend */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="subtitle2" sx={{ mb: 2 }}>
          Mood Legend
        </Typography>
        <Grid container spacing={2}>
          {Object.entries(MOOD_TYPES).map(([mood, { color, emoji }]) => (
            <Grid item xs={6} sm={4} md={3} key={mood}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  p: 1,
                  borderRadius: 1,
                  bgcolor: alpha(color, 0.1)
                }}
              >
                <Typography variant="h6" component="span">
                  {emoji}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: alpha(color, 0.9) }}
                >
                  {mood}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Box>
  );
} 