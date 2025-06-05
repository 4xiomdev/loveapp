import React from 'react';
import { Box, Typography, alpha } from '@mui/material';

const GrowthVisualization = ({ score, color }) => (
  <Box sx={{ 
    position: 'relative',
    width: '100%',
    height: 200,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: alpha('#fff', 0.03),
    borderRadius: 2,
    overflow: 'hidden'
  }}>
    <Box sx={{
      position: 'absolute',
      bottom: 0,
      width: '100%',
      height: `${score}%`,
      background: `linear-gradient(180deg, 
        ${alpha(color || '#24c6dc', 0.1)} 0%,
        ${alpha(color || '#24c6dc', 0.3)} 100%)`
    }} />
    
    <Typography variant="h2" sx={{ 
      fontWeight: 700,
      color: '#fff',
      zIndex: 1,
      textShadow: '0 2px 10px rgba(0,0,0,0.2)'
    }}>
      {Math.round(score)}%
    </Typography>
  </Box>
);

export default GrowthVisualization; 