import styled from "@emotion/styled";
import { Typography, Paper, alpha } from '@mui/material';

export const GlowingText = styled(Typography)(({ theme, color = '#fff' }) => ({
  fontWeight: 800,
  color: color,
  textShadow: `0 0 20px ${alpha(color, 0.5)}`,
  transition: 'all 0.3s ease',
}));

export const ReminderCard = styled(Paper)(({ theme, completed, isPartnerView }) => ({
  padding: '12px',
  marginBottom: '12px',
  backgroundColor: alpha('#fff', 0.03),
  backdropFilter: 'blur(10px)',
  borderRadius: '16px',
  transition: 'all 0.3s ease',
  border: `1px solid ${alpha('#fff', completed === 'true' ? 0.1 : 0.2)}`,
  '&:hover': {
    backgroundColor: alpha('#fff', 0.06),
    transform: 'translateY(-2px)',
    boxShadow: `0 8px 24px ${alpha('#000', 0.2)}`
  }
})); 