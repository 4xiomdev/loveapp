import React from 'react';
import { Chip, alpha } from '@mui/material';
import { format } from 'date-fns';
import { calculateStreak } from '../../utils/accountabilityHelpers';

export const StatusChip = ({ label, color }) => (
  <Chip
    label={label}
    size="small"
    sx={{
      bgcolor: alpha(color, 0.1),
      color: color,
      borderRadius: '8px',
      '& .MuiChip-label': {
        px: 2,
      }
    }}
  />
);

// Helper function to calculate stats for a habit
export const calculateHabitStats = (habitId, dailyStatus) => {
  const statuses = dailyStatus[habitId] || [];
  const streak = calculateStreak(
    statuses.map(s => ({ date: s.date, done: s.done })),
    statuses.some(s => s.date === format(new Date(), 'yyyy-MM-dd') && s.done)
  );
  return {
    streak: streak.currentStreak,
    completionRate: statuses.length ? 
      Math.round((statuses.filter(s => s.done).length / statuses.length) * 100) : 0
  };
}; 