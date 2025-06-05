import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  IconButton, 
  Grid, 
  alpha 
} from '@mui/material';
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon
} from '@mui/icons-material';
import { 
  format, 
  isSameDay, 
  isSameWeek, 
  isAfter, 
  addDays, 
  subDays, 
  startOfWeek 
} from 'date-fns';

// Helper function to get week dates
const getWeekDates = (date) => {
  // Ensure we start on Sunday
  const weekStart = startOfWeek(date, { weekStartsOn: 0 });
  const dates = [];
  
  // Generate array of 7 dates starting from Sunday
  for (let i = 0; i < 7; i++) {
    dates.push(addDays(weekStart, i));
  }
  
  return dates;
};

const WeeklyView = ({ dailyStatus, weeklyGoal, color, onDayClick }) => {
  const [selectedWeek, setSelectedWeek] = useState(new Date());
  const weekDates = getWeekDates(selectedWeek);
  
  const handlePrevWeek = () => {
    setSelectedWeek(prev => subDays(prev, 7));
  };

  const handleNextWeek = () => {
    setSelectedWeek(prev => addDays(prev, 7));
  };

  const isCurrentWeek = isSameWeek(selectedWeek, new Date());
  
  return (
    <Box>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: { xs: 2, sm: 3 }
      }}>
        <IconButton 
          onClick={handlePrevWeek}
          sx={{ color: '#fff' }}
        >
          <ChevronLeftIcon />
        </IconButton>

        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h6" sx={{ 
            fontSize: { xs: '1rem', sm: '1.25rem' }
          }}>
            {format(weekDates[0], 'MMM d')} - {format(weekDates[6], 'MMM d, yyyy')}
          </Typography>
          {!isCurrentWeek && (
            <Typography 
              variant="caption" 
              sx={{ 
                color: alpha('#fff', 0.7),
                fontSize: { xs: '0.75rem', sm: '0.875rem' }
              }}
            >
              {isAfter(selectedWeek, new Date()) ? 'Future Week' : 'Past Week'}
            </Typography>
          )}
        </Box>

        <IconButton 
          onClick={handleNextWeek}
          sx={{ color: '#fff' }}
        >
          <ChevronRightIcon />
        </IconButton>
      </Box>
      
      <Grid container spacing={{ xs: 1, sm: 2 }}>
        {weekDates.map((date) => {
          const dayStatus = dailyStatus.find(
            status => status.date === format(date, 'yyyy-MM-dd')
          );
          const isToday = isSameDay(date, new Date());
          
          return (
            <Grid item xs key={format(date, 'yyyy-MM-dd')}>
              <Box
                onClick={() => onDayClick(date, dayStatus?.done || false)}
                sx={{
                  p: { xs: 1.5, sm: 2 },
                  textAlign: 'center',
                  cursor: 'pointer',
                  borderRadius: 2,
                  bgcolor: dayStatus?.done ? alpha(color || '#24c6dc', 0.2) : alpha('#fff', 0.05),
                  border: isToday ? `2px solid ${alpha(color || '#fff', 0.5)}` : '2px solid transparent',
                  '&:hover': {
                    bgcolor: dayStatus?.done ? alpha(color || '#24c6dc', 0.3) : alpha('#fff', 0.1),
                    transform: 'scale(1.02)',
                  },
                  transition: 'all 0.2s ease'
                }}
              >
                <Typography 
                  variant="subtitle2" 
                  sx={{ 
                    mb: 1,
                    color: isToday ? '#fff' : alpha('#fff', 0.9),
                    fontWeight: isToday ? 600 : 400,
                    fontSize: { xs: '0.75rem', sm: '0.875rem' }
                  }}
                >
                  {format(date, 'EEE')}
                </Typography>
                <Typography 
                  variant="h6"
                  sx={{
                    fontWeight: isToday ? 700 : 400,
                    fontSize: { xs: '1.25rem', sm: '1.5rem' }
                  }}
                >
                  {format(date, 'd')}
                </Typography>
                {dayStatus?.notes && (
                  <Box
                    sx={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      bgcolor: color || '#24c6dc',
                      mx: 'auto',
                      mt: 1
                    }}
                  />
                )}
              </Box>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
};

export default WeeklyView; 