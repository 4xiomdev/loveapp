import React from 'react';
import { Box, Typography, alpha } from '@mui/material';

const StatCard = ({ title, value, icon: Icon, color }) => (
  <Box
    sx={{
      p: 3,
      borderRadius: 2,
      backgroundColor: alpha('#fff', 0.05),
      backdropFilter: 'blur(10px)',
      border: `1px solid ${alpha('#fff', 0.1)}`,
      display: 'flex',
      alignItems: 'center',
      gap: 2
    }}
  >
    <Icon 
      sx={{ 
        fontSize: 40, 
        color: color || alpha('#fff', 0.7)
      }} 
    />
    <Box>
      <Typography variant="h4" sx={{ 
        fontWeight: 700,
        color: color || '#fff'
      }}>
        {value}
      </Typography>
      <Typography variant="body2" sx={{ color: alpha('#fff', 0.7) }}>
        {title}
      </Typography>
    </Box>
  </Box>
);

export default StatCard; 