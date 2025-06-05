import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { usePartnerData } from '../hooks/usePartnerData';
import { USER_MODES } from '../config/userConfig';
import { useNavigate } from 'react-router-dom';

// MUI Components
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  CircularProgress,
  Alert,
  Switch,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material';

// MUI Icons
import FavoriteIcon from '@mui/icons-material/Favorite';
import PersonOffIcon from '@mui/icons-material/PersonOff';

/**
 * PartnerLinkPage.jsx
 *
 * This page handles partner linking directly through Firestore.
 * Since this is a two-user app, we've simplified the operations to use direct writes.
 */

export default function PartnerLinkPage() {
  const { 
    user, 
    userData, 
    updateUserSettings,
    handlePartnerLink,
    unlinkPartner,
    loading: authLoading 
  } = useAuth();
  const { partnerData, loading: partnerLoading, error: partnerError } = usePartnerData();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [mode, setMode] = useState(USER_MODES.PARTNER);
  const [unlinkDialogOpen, setUnlinkDialogOpen] = useState(false);
  const [modeDialogOpen, setModeDialogOpen] = useState(false);
  const [localError, setLocalError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [processing, setProcessing] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    setLoading(authLoading || partnerLoading);
  }, [user, navigate, authLoading, partnerLoading]);

  const isSoloMode = userData?.settings?.mode === USER_MODES.SOLO;

  const handleLinkPartner = async (e) => {
    e.preventDefault();
    if (!user?.uid || !inviteEmail.trim()) {
      setLocalError('Please enter a valid email address');
      return;
    }

    setProcessing(true);
    setLocalError(null);
    setSuccess(null);

    try {
      await handlePartnerLink(inviteEmail.trim());
      setSuccess('Successfully linked with partner!');
      setInviteEmail('');
    } catch (err) {
      console.error('Error linking partner:', err);
      setLocalError(err.message || 'Failed to link partner. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleUnlinkConfirm = async () => {
    if (!user?.uid || !userData?.partnerId) return;
    
    try {
      setLocalError(null);
      setSuccess(null);
      
      await unlinkPartner();
      
      setSuccess('Successfully unlinked from partner');
      setUnlinkDialogOpen(false);
    } catch (err) {
      console.error('Error unlinking partner:', err);
      setLocalError(err.message || 'Failed to unlink partner');
    }
  };

  const handleModeToggle = async () => {
    if (!user?.uid) return;

    try {
      setLocalError(null);
      setSuccess(null);
      const newMode = isSoloMode ? USER_MODES.PARTNER : USER_MODES.SOLO;
      
      await updateUserSettings({ mode: newMode });
      
      setSuccess(`Successfully switched to ${newMode} mode. ${
        newMode === USER_MODES.SOLO 
          ? 'Partner features are temporarily disabled but your partner link is preserved.' 
          : 'You now have access to all partner features.'
      }`);
      
      setLocalError(null);
      setModeDialogOpen(false);
    } catch (err) {
      console.error('Error updating mode:', err);
      setLocalError(err.message || 'Failed to update mode. Please try again.');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Partner Settings
      </Typography>

      {localError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {localError}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Partner Mode
        </Typography>
        
        <FormControlLabel
          control={
            <Switch
              checked={!isSoloMode}
              onChange={() => setModeDialogOpen(true)}
              disabled={processing}
            />
          }
          label={isSoloMode ? "Solo Mode" : "Partner Mode"}
        />
        
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {isSoloMode 
            ? "In Solo Mode, partner features are disabled but your partner link is preserved."
            : "In Partner Mode, you have access to all partner features."}
        </Typography>
      </Paper>

      {!userData?.partnerId ? (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Link with Partner
          </Typography>
          
          <Box component="form" onSubmit={handleLinkPartner} sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Partner's Email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              disabled={processing}
              sx={{ mb: 2 }}
            />
            
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={processing}
              startIcon={processing ? <CircularProgress size={20} /> : <FavoriteIcon />}
            >
              Link with Partner
            </Button>
          </Box>
        </Paper>
      ) : (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Current Partner
          </Typography>
          
          {partnerData ? (
            <>
              <Typography>
                Linked with: {partnerData.displayName} ({partnerData.email})
              </Typography>
              
              <Button
                variant="outlined"
                color="error"
                onClick={() => setUnlinkDialogOpen(true)}
                startIcon={<PersonOffIcon />}
                sx={{ mt: 2 }}
              >
                Unlink Partner
              </Button>
            </>
          ) : (
            <Typography color="text.secondary">
              Loading partner data...
            </Typography>
          )}
        </Paper>
      )}

      {/* Mode Change Dialog */}
      <Dialog
        open={modeDialogOpen}
        onClose={() => setModeDialogOpen(false)}
      >
        <DialogTitle>
          Change Mode?
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {isSoloMode
              ? "Switch to Partner Mode? This will enable all partner features."
              : "Switch to Solo Mode? Partner features will be temporarily disabled but your partner link will be preserved."}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModeDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleModeToggle} color="primary">
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      {/* Unlink Dialog */}
      <Dialog
        open={unlinkDialogOpen}
        onClose={() => setUnlinkDialogOpen(false)}
      >
        <DialogTitle>
          Unlink Partner?
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to unlink from your partner? This will remove the connection between your accounts.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUnlinkDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleUnlinkConfirm} color="error">
            Unlink
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 