import styled from '@emotion/styled';
import { Typography, Paper, TextField, alpha } from '@mui/material';

export const GlowingText = styled(Typography)(({ theme, color = '#fff' }) => ({
  fontWeight: 800,
  color: color,
  textShadow: `0 0 20px ${alpha(color, 0.5)}`,
  transition: 'all 0.3s ease',
}));

export const MinimalisticHabitCard = styled(Paper)(({ theme }) => ({
  padding: '16px',
  borderRadius: '24px',  // Increased border radius to match design
  background: 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))',
  backdropFilter: 'blur(10px)',
  border: `1px solid ${alpha('#fff', 0.1)}`,
  transition: 'all 0.2s ease',
  cursor: 'pointer',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: `0 4px 20px ${alpha('#000', 0.2)}`
  }
}));

export const StyledTextField = styled(TextField)({
  '& .MuiOutlinedInput-root': {
    '& fieldset': {
      borderColor: alpha('#fff', 0.3),
      borderRadius: 12,
    },
    '&:hover fieldset': {
      borderColor: alpha('#9b59b6', 0.5),
    },
    '&.Mui-focused fieldset': {
      borderColor: '#9b59b6',
    },
  },
  '& .MuiInputLabel-root': {
    color: alpha('#fff', 0.7),
    '&.Mui-focused': {
      color: '#9b59b6',
    },
  },
  '& .MuiOutlinedInput-input': {
    color: '#fff',
  },
}); 