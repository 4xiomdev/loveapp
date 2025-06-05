import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import PersonIcon from '@mui/icons-material/Person';

export default function SoloModeState({ message }) {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        textAlign: 'center',
        px: 3
      }}
    >
      <PersonIcon
        sx={{
          fontSize: 64,
          mb: 3,
          color: 'primary.main',
          opacity: 0.6
        }}
      />
      <Typography
        variant="h5"
        component="h2"
        gutterBottom
        sx={{ fontWeight: 600 }}
      >
        Solo Mode Active
      </Typography>
      <Typography
        variant="body1"
        color="text.secondary"
        sx={{ mb: 4, maxWidth: 400 }}
      >
        {message || "This feature is not available in solo mode. Switch back to partner mode to access this feature."}
      </Typography>
      <Button
        variant="contained"
        color="primary"
        size="large"
        startIcon={<PersonIcon />}
        onClick={() => navigate('/partner')}
        sx={{
          borderRadius: '12px',
          textTransform: 'none',
          px: 4
        }}
      >
        Switch to Partner Mode
      </Button>
    </Box>
  );
} 