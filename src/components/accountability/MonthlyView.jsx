import React from 'react';
import { 
  Box, 
  Typography, 
  IconButton, 
  alpha 
} from '@mui/material';
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon
} from '@mui/icons-material';
import { format } from 'date-fns';

const MonthlyView = ({ dailyStatus, color, onDayClick, currentMonth, onPrevMonth, onNextMonth }) => {
  const days = [];
  const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  const lastDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
  const startPadding = firstDay.getDay();
  const totalDays = lastDay.getDate();

  // Add empty cells for padding at start of month
  for (let i = 0; i < startPadding; i++) {
    days.push(null);
  }

  // Add all days of the month
  for (let day = 1; day <= totalDays; day++) {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const formattedDate = format(date, 'yyyy-MM-dd');
    const dayStatus = dailyStatus.find(status => status.date === formattedDate);
    days.push({ date, dayStatus });
  }

  // Add padding at end to complete the grid
  const endPadding = Math.ceil(days.length / 7) * 7 - days.length;
  for (let i = 0; i < endPadding; i++) {
    days.push(null);
  }

  return (
    <Box>
      {/* Month Navigation */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: { xs: 2, sm: 3 }
      }}>
        <IconButton onClick={onPrevMonth} sx={{ color: '#fff' }}>
          <ChevronLeftIcon />
        </IconButton>
        <Typography variant="h5" sx={{ 
          fontWeight: 600,
          fontSize: { xs: '1.25rem', sm: '1.5rem' }
        }}>
          {format(currentMonth, 'MMMM yyyy')}
        </Typography>
        <IconButton onClick={onNextMonth} sx={{ color: '#fff' }}>
          <ChevronRightIcon />
        </IconButton>
      </Box>

      {/* Calendar Grid */}
      <Box sx={{ 
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: { xs: 0.5, sm: 1 },
        bgcolor: alpha('#fff', 0.05),
        p: { xs: 1, sm: 2 },
        borderRadius: 2
      }}>
        {/* Weekday Headers */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <Box 
            key={day}
            sx={{ 
              textAlign: 'center',
              p: { xs: 0.5, sm: 1 },
              color: alpha('#fff', 0.7),
              fontWeight: 500,
              fontSize: { xs: '0.75rem', sm: '0.875rem' }
            }}
          >
            {day}
          </Box>
        ))}

        {/* Calendar Days */}
        {days.map((dayData, index) => {
          if (!dayData) {
            return (
              <Box 
                key={`empty-${index}`}
                sx={{ 
                  aspectRatio: '1',
                  bgcolor: alpha('#fff', 0.02),
                  borderRadius: 1
                }}
              />
            );
          }

          const { date, dayStatus } = dayData;
          const isToday = format(new Date(), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');

          return (
            <Box
              key={format(date, 'yyyy-MM-dd')}
              onClick={() => onDayClick(date, dayStatus?.done || false)}
              sx={{
                position: 'relative',
                aspectRatio: '1',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                borderRadius: 1,
                bgcolor: dayStatus?.done 
                  ? alpha(color || '#24c6dc', 0.2) 
                  : alpha('#fff', 0.05),
                border: isToday 
                  ? `2px solid ${alpha(color || '#fff', 0.5)}`
                  : '2px solid transparent',
                transition: 'all 0.2s ease',
                p: { xs: 0.5, sm: 1 },
                '&:hover': {
                  bgcolor: dayStatus?.done 
                    ? alpha(color || '#24c6dc', 0.3) 
                    : alpha('#fff', 0.1),
                  transform: 'scale(1.02)'
                }
              }}
            >
              <Typography 
                variant="body1"
                sx={{ 
                  fontWeight: isToday ? 700 : 400,
                  color: isToday ? '#fff' : alpha('#fff', 0.9),
                  fontSize: { xs: '0.875rem', sm: '1rem' }
                }}
              >
                {date.getDate()}
              </Typography>
              {dayStatus?.notes && (
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: { xs: 2, sm: 4 },
                    right: { xs: 2, sm: 4 },
                    width: 4,
                    height: 4,
                    borderRadius: '50%',
                    bgcolor: color || '#24c6dc'
                  }}
                />
              )}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};

export default MonthlyView; 