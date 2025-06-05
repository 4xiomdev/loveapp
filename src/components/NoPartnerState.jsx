import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import FavoriteIcon from '@mui/icons-material/Favorite';

export default function NoPartnerState({ message }) {
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
      <FavoriteIcon
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
        No Partner Linked
      </Typography>
      <Typography
        variant="body1"
        color="text.secondary"
        sx={{ mb: 4, maxWidth: 400 }}
      >
        {message || "This feature requires a partner. Link with your partner to start using this feature together."}
      </Typography>
      <Button
        variant="contained"
        color="primary"
        size="large"
        startIcon={<FavoriteIcon />}
        onClick={() => navigate('/partner')}
        sx={{
          borderRadius: '12px',
          textTransform: 'none',
          px: 4
        }}
      >
        Link with Partner
      </Button>
    </Box>
  );
} 