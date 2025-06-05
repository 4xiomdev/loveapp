import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  TextField,
  Alert,
  Box,
  Typography,
  CircularProgress,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { 
  doc, 
  writeBatch, 
  collection, 
  query, 
  where, 
  getDocs,
  serverTimestamp 
} from 'firebase/firestore';

export default function DeleteAccountDialog({ open, onClose }) {
  const { user, userData } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleDelete = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);

    try {
      const batch = writeBatch(db);
      const userRef = doc(db, 'users', user.uid);

      // 1. Mark user document as deleted
      batch.update(userRef, {
        isDeleted: true,
        deletedAt: serverTimestamp(),
        partnerId: null,
        'settings.mode': 'SOLO',
        'settings.updatedAt': serverTimestamp()
      });

      // 2. If user has a partner, unlink them
      if (userData?.partnerId) {
        const partnerRef = doc(db, 'users', userData.partnerId);
        batch.update(partnerRef, {
          partnerId: null,
          'settings.mode': 'SOLO',
          'settings.updatedAt': serverTimestamp()
        });
      }

      // 3. Clean up user's data in various collections
      const collections = [
        'messages',
        'coupons',
        'transactions',
        'accountability',
        'dailyStatus',
        'reminders',
        'moods',
        'events'
      ];

      for (const collectionName of collections) {
        const q = query(
          collection(db, collectionName),
          where('userId', '==', user.uid)
        );
        const docs = await getDocs(q);
        docs.forEach(doc => batch.delete(doc.ref));

        // Also clean up docs where user is a participant
        const participantQ = query(
          collection(db, collectionName),
          where('participants', 'array-contains', user.uid)
        );
        const participantDocs = await getDocs(participantQ);
        participantDocs.forEach(doc => batch.delete(doc.ref));
      }

      // 4. Commit all changes
      await batch.commit();

      // 5. Delete the user's authentication account
      await user.delete();
      
      onClose();
    } catch (err) {
      console.error('Error deleting account:', err);
      setError(err.message || 'Failed to delete account. Please try again.');
      setLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle sx={{ color: 'error.main' }}>
        Delete Account
      </DialogTitle>
      <DialogContent>
        <Typography variant="body1" gutterBottom>
          Warning: This action is permanent and cannot be undone. When you delete your account:
        </Typography>
        
        <List sx={{ mb: 2 }}>
          <ListItem>
            <ListItemText primary="Your account will be permanently deleted" />
          </ListItem>
          <ListItem>
            <ListItemText primary="All your data will be marked as deleted" />
          </ListItem>
          <ListItem>
            <ListItemText primary="Your partner link will be removed" />
          </ListItem>
          <ListItem>
            <ListItemText primary="You will be signed out immediately" />
          </ListItem>
        </List>

        <Typography variant="body1" gutterBottom>
          To confirm deletion, please type "delete my account" below:
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <TextField
          fullWidth
          value={''}
          onChange={(e) => {}}
          placeholder="delete my account"
          disabled={loading}
          sx={{ mt: 1 }}
        />
      </DialogContent>
      <DialogActions>
        <Button 
          onClick={handleClose}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          onClick={handleDelete}
          color="error"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? 'Deleting...' : 'Delete Account'}
        </Button>
      </DialogActions>
    </Dialog>
  );
} 
