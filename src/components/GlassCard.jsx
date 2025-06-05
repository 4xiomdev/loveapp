import { Paper } from '@mui/material';
import { styled } from '@mui/material/styles';

const GlassCard = styled(Paper)(({ theme }) => ({
  background: 'rgba(255, 255, 255, 0.05)',
  backdropFilter: 'blur(10px)',
  borderRadius: theme.spacing(2),
  border: '1px solid rgba(255, 255, 255, 0.1)',
  transition: 'all 0.2s ease-in-out',
  '&:hover': {
    background: 'rgba(255, 255, 255, 0.08)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
  }
}));

export default GlassCard; 