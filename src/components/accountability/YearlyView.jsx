import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Chip, 
  Tooltip,
  alpha 
} from '@mui/material';
import { format } from 'date-fns';

// Constants
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

// Helper function to generate year data
const generateYearData = (selectedYear, dailyStatus) => {
  const months = [];
  
  for (let month = 0; month < 12; month++) {
    const firstDay = new Date(selectedYear, month, 1);
    const lastDay = new Date(selectedYear, month + 1, 0);
    const monthData = [];
    
    // Add empty cells for padding at start of month
    for (let i = 0; i < firstDay.getDay(); i++) {
      monthData.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(selectedYear, month, day);
      const dateStr = format(date, 'yyyy-MM-dd');
      const status = dailyStatus.find(s => s.date === dateStr);
      
      monthData.push({
        day,
        date: dateStr,
        done: status?.done || false,
        notes: status?.notes
      });
    }
    
    // Calculate monthly stats
    const completedDays = monthData.filter(d => d?.done).length;
    const totalDays = monthData.filter(d => d !== null).length;
    const completionRate = totalDays ? Math.round((completedDays / totalDays) * 100) : 0;
    
    months.push({
      name: MONTHS[month],
      days: monthData,
      stats: {
        completed: completedDays,
        total: totalDays,
        rate: completionRate
      }
    });
  }

  return months;
};

const YearlyView = ({ dailyStatus, weeklyGoal, color }) => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const yearData = generateYearData(selectedYear, dailyStatus);
  
  // Calculate year summary
  const yearSummary = {
    completed: yearData.reduce((sum, month) => sum + month.stats.completed, 0),
    total: yearData.reduce((sum, month) => sum + month.stats.total, 0),
    bestMonth: yearData.reduce((best, month) => 
      month.stats.rate > (best?.stats.rate || 0) ? month : best
    , null)
  };
  
  const completionRate = yearSummary.total ? 
    Math.round((yearSummary.completed / yearSummary.total) * 100) : 0;

  return (
    <Box>
      {/* Year Summary */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)' },
        gap: { xs: 2, sm: 3 },
        mb: { xs: 3, sm: 4 }
      }}>
        <Paper sx={{
          p: { xs: 2, sm: 3 },
          bgcolor: alpha('#fff', 0.05),
          borderRadius: 2,
          backdropFilter: 'blur(10px)',
          border: `1px solid ${alpha('#fff', 0.1)}`
        }}>
          <Typography variant="h4" sx={{ 
            fontWeight: 700, 
            color: color || '#fff',
            fontSize: { xs: '1.5rem', sm: '2rem' }
          }}>
            {yearSummary.completed}
          </Typography>
          <Typography variant="body2" sx={{ color: alpha('#fff', 0.7) }}>
            Days Completed
          </Typography>
        </Paper>

        <Paper sx={{
          p: { xs: 2, sm: 3 },
          bgcolor: alpha('#fff', 0.05),
          borderRadius: 2,
          backdropFilter: 'blur(10px)',
          border: `1px solid ${alpha('#fff', 0.1)}`
        }}>
          <Typography variant="h4" sx={{ 
            fontWeight: 700, 
            color: color || '#fff',
            fontSize: { xs: '1.5rem', sm: '2rem' }
          }}>
            {completionRate}%
          </Typography>
          <Typography variant="body2" sx={{ color: alpha('#fff', 0.7) }}>
            Yearly Completion Rate
          </Typography>
        </Paper>

        <Paper sx={{
          p: { xs: 2, sm: 3 },
          bgcolor: alpha('#fff', 0.05),
          borderRadius: 2,
          backdropFilter: 'blur(10px)',
          border: `1px solid ${alpha('#fff', 0.1)}`,
          gridColumn: { xs: '1 / -1', sm: 'auto' }
        }}>
          <Typography variant="h4" sx={{ 
            fontWeight: 700, 
            color: color || '#fff',
            fontSize: { xs: '1.5rem', sm: '2rem' }
          }}>
            {yearSummary.bestMonth?.name}
          </Typography>
          <Typography variant="body2" sx={{ color: alpha('#fff', 0.7) }}>
            Best Month ({yearSummary.bestMonth?.stats.rate}%)
          </Typography>
        </Paper>
      </Box>

      {/* Monthly Calendars Grid */}
      <Box sx={{ 
        display: 'grid',
        gridTemplateColumns: { 
          xs: '1fr',
          sm: 'repeat(2, 1fr)', 
          md: 'repeat(3, 1fr)',
          lg: 'repeat(4, 1fr)'
        },
        gap: 3
      }}>
        {yearData.map((month) => (
          <Paper
            key={month.name}
            sx={{
              p: { xs: 2, sm: 3 },
              bgcolor: alpha('#fff', 0.05),
              borderRadius: 2,
              backdropFilter: 'blur(10px)',
              border: `1px solid ${alpha('#fff', 0.1)}`
            }}
          >
            {/* Month Header */}
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 2
            }}>
              <Typography variant="h6" sx={{ 
                fontSize: { xs: '1rem', sm: '1.25rem' }
              }}>
                {month.name}
              </Typography>
              <Chip 
                label={`${month.stats.rate}%`}
                sx={{
                  bgcolor: alpha(color || '#24c6dc', 0.2),
                  color: '#fff',
                  height: '24px',
                  '& .MuiChip-label': {
                    px: 1,
                    fontSize: '0.75rem'
                  }
                }}
              />
            </Box>

            {/* Calendar Grid */}
            <Box sx={{ 
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: 0.5
            }}>
              {/* Weekday Headers */}
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                <Typography 
                  key={`${day}-${index}`}
                  variant="caption"
                  sx={{ 
                    textAlign: 'center',
                    color: alpha('#fff', 0.7),
                    fontSize: '0.75rem'
                  }}
                >
                  {day}
                </Typography>
              ))}

              {/* Calendar Days */}
              {month.days.map((day, index) => (
                <Box
                  key={`${month.name}-${index}`}
                  sx={{
                    aspectRatio: '1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 0.5,
                    bgcolor: day ? (
                      day.done 
                        ? alpha(color || '#24c6dc', 0.3)
                        : alpha('#fff', 0.05)
                    ) : 'transparent',
                    position: 'relative'
                  }}
                >
                  {day && (
                    <Tooltip
                      title={
                        <Box>
                          <Typography>
                            {format(new Date(day.date), 'MMMM d, yyyy')}
                          </Typography>
                          <Typography>
                            {day.done ? 'Completed' : 'Not completed'}
                          </Typography>
                          {day.notes && (
                            <Typography sx={{ mt: 0.5, fontStyle: 'italic' }}>
                              {day.notes}
                            </Typography>
                          )}
                        </Box>
                      }
                    >
                      <Typography
                        variant="caption"
                        sx={{
                          color: day.done ? '#fff' : alpha('#fff', 0.7),
                          fontWeight: day.done ? 600 : 400,
                          fontSize: '0.75rem'
                        }}
                      >
                        {day.day}
                      </Typography>
                    </Tooltip>
                  )}
                </Box>
              ))}
            </Box>
          </Paper>
        ))}
      </Box>
    </Box>
  );
};

export default YearlyView; 