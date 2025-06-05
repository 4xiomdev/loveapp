import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Typography,
  Box,
  alpha
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PartnerHabitsView from './PartnerHabitsView';

export default function PartnerHabitsDialog({ open, onClose, partnerId, partnerName }) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: alpha('#121212', 0.95),
          backdropFilter: 'blur(10px)',
          borderRadius: 3,
          border: `1px solid ${alpha('#fff', 0.1)}`,
          boxShadow: `0 8px 32px ${alpha('#000', 0.4)}`,
          overflow: 'hidden'
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        borderBottom: `1px solid ${alpha('#fff', 0.1)}`,
        pb: 2
      }}>
        <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
          {partnerName}'s Accountability
        </Typography>
        <IconButton
          edge="end"
          color="inherit"
          onClick={onClose}
          aria-label="close"
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ py: 3 }}>
        <PartnerHabitsView partnerId={partnerId} partnerName={partnerName} />
      </DialogContent>
      <DialogActions sx={{ borderTop: `1px solid ${alpha('#fff', 0.1)}`, p: 2 }}>
        <Button 
          onClick={onClose} 
          variant="outlined"
          sx={{
            color: '#fff',
            borderColor: alpha('#fff', 0.3),
            '&:hover': {
              borderColor: '#fff',
              bgcolor: alpha('#fff', 0.1)
            }
          }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
} 