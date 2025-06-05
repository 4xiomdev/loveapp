import React from 'react';
import { 
  Grid, 
  Box, 
  Typography, 
  Stack,
  alpha,
  useTheme 
} from '@mui/material';

const QuickStats = ({ stats }) => {
  const theme = useTheme();
  
  return (
    <Grid container spacing={{ xs: 2, md: 3 }} sx={{ mb: { xs: 3, md: 4 } }}>
      <Grid item xs={6} sm={6} md={3}>
        <Box
          sx={{
            p: { xs: 2, sm: 3 },
            borderRadius: 3,
            backgroundColor: alpha('#fff', 0.07),
            backdropFilter: 'blur(10px)',
            border: `1px solid ${alpha('#fff', 0.1)}`,
            transition: 'all 0.3s ease',
            height: '100%',
            '&:hover': {
              backgroundColor: alpha('#fff', 0.09),
              transform: 'translateY(-2px)'
            }
          }}
        >
          <Stack spacing={1}>
            <Typography variant="overline" sx={{ 
              color: alpha('#fff', 0.85),
              fontSize: { xs: '0.65rem', sm: '0.75rem' }
            }}>
              Completion Rate
            </Typography>
            <Typography variant="h4" sx={{ 
              fontWeight: 700, 
              color: '#fff',
              fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' }
            }}>
              {stats?.overallCompletion || 0}%
            </Typography>
          </Stack>
        </Box>
      </Grid>
      
      <Grid item xs={6} sm={6} md={3}>
        <Box
          sx={{
            p: { xs: 2, sm: 3 },
            borderRadius: 3,
            backgroundColor: alpha('#fff', 0.07),
            backdropFilter: 'blur(10px)',
            border: `1px solid ${alpha('#fff', 0.1)}`,
            transition: 'all 0.3s ease',
            height: '100%',
            '&:hover': {
              backgroundColor: alpha('#fff', 0.09),
              transform: 'translateY(-2px)'
            }
          }}
        >
          <Stack spacing={1}>
            <Typography variant="overline" sx={{ 
              color: alpha('#fff', 0.85),
              fontSize: { xs: '0.65rem', sm: '0.75rem' }
            }}>
              Best Streak
            </Typography>
            <Typography variant="h4" sx={{ 
              fontWeight: 700, 
              color: '#fff',
              fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' }
            }}>
              {stats?.bestStreak || 0} days
            </Typography>
          </Stack>
        </Box>
      </Grid>
      
      <Grid item xs={6} sm={6} md={3}>
        <Box
          sx={{
            p: { xs: 2, sm: 3 },
            borderRadius: 3,
            backgroundColor: alpha('#fff', 0.07),
            backdropFilter: 'blur(10px)',
            border: `1px solid ${alpha('#fff', 0.1)}`,
            transition: 'all 0.3s ease',
            height: '100%',
            '&:hover': {
              backgroundColor: alpha('#fff', 0.09),
              transform: 'translateY(-2px)'
            }
          }}
        >
          <Stack spacing={1}>
            <Typography variant="overline" sx={{ 
              color: alpha('#fff', 0.85),
              fontSize: { xs: '0.65rem', sm: '0.75rem' }
            }}>
              Active Habits
            </Typography>
            <Typography variant="h4" sx={{ 
              fontWeight: 700, 
              color: '#fff',
              fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' }
            }}>
              {stats?.totalHabits || 0}
            </Typography>
          </Stack>
        </Box>
      </Grid>
      
      <Grid item xs={6} sm={6} md={3}>
        <Box
          sx={{
            p: { xs: 2, sm: 3 },
            borderRadius: 3,
            backgroundColor: alpha('#fff', 0.07),
            backdropFilter: 'blur(10px)',
            border: `1px solid ${alpha('#fff', 0.1)}`,
            transition: 'all 0.3s ease',
            height: '100%',
            '&:hover': {
              backgroundColor: alpha('#fff', 0.09),
              transform: 'translateY(-2px)'
            }
          }}
        >
          <Stack spacing={1}>
            <Typography variant="overline" sx={{ 
              color: alpha('#fff', 0.85),
              fontSize: { xs: '0.65rem', sm: '0.75rem' }
            }}>
              Weekly Progress
            </Typography>
            <Typography variant="h4" sx={{ 
              fontWeight: 700, 
              color: '#fff',
              fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' }
            }}>
              {stats?.weeklyProgress || 0}%
            </Typography>
          </Stack>
        </Box>
      </Grid>
    </Grid>
  );
};

export default QuickStats; 