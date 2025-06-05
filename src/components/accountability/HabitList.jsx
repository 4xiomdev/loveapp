import React from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Grid,
  alpha 
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import HabitCard from './HabitCard';

const HabitList = ({ habits, onComplete, onEdit, onDelete, onNavigate, dailyStatus, onViewPartnerHabits }) => {
  return (
    <Box>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 3
      }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          My Habits
        </Typography>
        
        {/* Add Partner Habits Button */}
        {onViewPartnerHabits && (
          <Button
            variant="outlined"
            startIcon={<VisibilityIcon />}
            onClick={onViewPartnerHabits}
            size="small"
            sx={{
              color: '#fff',
              borderColor: alpha('#fff', 0.3),
              '&:hover': {
                borderColor: '#fff',
                bgcolor: alpha('#fff', 0.1)
              }
            }}
          >
            Partner's Habits
          </Button>
        )}
      </Box>

      <Grid container spacing={2}>
        {habits.map((habit) => (
          <Grid item xs={12} key={habit.id}>
            <HabitCard
              habit={habit}
              onComplete={onComplete}
              onEdit={onEdit}
              onDelete={onDelete}
              onNavigate={onNavigate}
              dailyStatus={dailyStatus}
            />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default HabitList; 