import React, { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db, auth, storage } from '../firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Avatar,
  CircularProgress,
  alpha,
  Paper,
  Snackbar,
  Alert,
  IconButton
} from '@mui/material';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import SaveIcon from '@mui/icons-material/Save';
import { motion } from 'framer-motion';

export default function SettingsPage() {
  const { user, userData } = useAuth();
  const [displayName, setDisplayName] = useState(userData?.displayName || user?.displayName || '');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const fileInputRef = useRef();

  const handleDisplayNameUpdate = async () => {
    if (!displayName.trim() || !user) return;
    
    setLoading(true);
    setError('');
    
    try {
      // Update Auth Profile
      await updateProfile(auth.currentUser, {
        displayName: displayName.trim()
      });

      // Update Firestore User Document
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        displayName: displayName.trim(),
        updatedAt: serverTimestamp()
      });

      setSuccess('Display name updated successfully!');
    } catch (err) {
      console.error('Error updating display name:', err);
      setError('Failed to update display name. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const compressImage = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Calculate new dimensions (max 96x96 for auth profile)
          if (width > height) {
            if (width > 96) {
              height = Math.round((height * 96) / width);
              width = 96;
            }
          } else {
            if (height > 96) {
              width = Math.round((width * 96) / height);
              height = 96;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          // Get compressed image as base64
          resolve(canvas.toDataURL('image/jpeg', 0.7));
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  const handlePhotoUpload = async (event) => {
    const file = event.target.files[0];
    if (!file || !user) return;

    // Check file size (limit to 1MB)
    if (file.size > 1024 * 1024) {
      setError('Image size should be less than 1MB');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Upload original file to Storage
      const storageRef = ref(storage, `users/${user.uid}/profile.jpg`);
      await uploadBytes(storageRef, file, { contentType: file.type });
      const downloadUrl = await getDownloadURL(storageRef);

      // Update Auth Profile with compressed thumbnail for faster auth propagation
      const compressedImage = await compressImage(file);
      await updateProfile(auth.currentUser, { photoURL: compressedImage });

      // Update Firestore with Storage URL
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        photoURL: downloadUrl,
        updatedAt: serverTimestamp()
      });

      setSuccess('Profile picture updated successfully!');
    } catch (err) {
      console.error('Error updating photo:', err);
      setError('Failed to update profile picture. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ 
        py: { xs: 4, sm: 6 },
        px: { xs: 2, sm: 3 }
      }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Typography 
            variant="h4" 
            sx={{ 
              mb: 4,
              color: '#fff',
              fontWeight: 700,
              textAlign: 'center'
            }}
          >
            Profile Settings
          </Typography>

          <Paper
            sx={{
              p: { xs: 2, sm: 4 },
              bgcolor: alpha('#fff', 0.05),
              backdropFilter: 'blur(10px)',
              borderRadius: '24px',
              border: `1px solid ${alpha('#fff', 0.1)}`
            }}
          >
            {/* Profile Picture Section */}
            <Box sx={{ 
              mb: 4,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2
            }}>
              <Box sx={{ position: 'relative' }}>
                <Avatar
                  src={user?.photoURL}
                  alt={user?.displayName}
                  sx={{
                    width: { xs: 100, sm: 120 },
                    height: { xs: 100, sm: 120 },
                    border: `4px solid ${alpha('#fff', 0.1)}`,
                    boxShadow: `0 8px 32px ${alpha('#000', 0.2)}`
                  }}
                />
                <IconButton
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading}
                  sx={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    bgcolor: alpha('#fff', 0.1),
                    backdropFilter: 'blur(10px)',
                    '&:hover': {
                      bgcolor: alpha('#fff', 0.2)
                    }
                  }}
                >
                  <PhotoCameraIcon />
                </IconButton>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handlePhotoUpload}
                />
              </Box>

              <Typography 
                variant="body2" 
                sx={{ 
                  color: alpha('#fff', 0.7),
                  textAlign: 'center'
                }}
              >
                Click the camera icon to update your profile picture (max 1MB)
              </Typography>
            </Box>

            {/* Display Name Section */}
            <Box sx={{ mb: 3 }}>
              <Typography 
                variant="subtitle1" 
                sx={{ 
                  mb: 1,
                  color: alpha('#fff', 0.9),
                  fontWeight: 600
                }}
              >
                Display Name
              </Typography>

              {/* Current Display Name */}
              <Box 
                sx={{ 
                  mb: 2,
                  p: 2,
                  borderRadius: '12px',
                  bgcolor: alpha('#fff', 0.05),
                  border: `1px solid ${alpha('#fff', 0.1)}`
                }}
              >
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: alpha('#fff', 0.7),
                    mb: 0.5
                  }}
                >
                  Current Display Name:
                </Typography>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    color: '#fff',
                    fontWeight: 600
                  }}
                >
                  {userData?.displayName || user?.displayName || 'Not set'}
                </Typography>
              </Box>

              <TextField
                fullWidth
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter your display name"
                disabled={loading}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: '#fff',
                    '& fieldset': {
                      borderColor: alpha('#fff', 0.3),
                    },
                    '&:hover fieldset': {
                      borderColor: alpha('#fff', 0.5),
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#fff',
                    },
                  },
                }}
              />
            </Box>

            {/* Save Button */}
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'center'
            }}>
              <Button
                variant="contained"
                onClick={handleDisplayNameUpdate}
                disabled={loading || !displayName.trim()}
                startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                sx={{
                  py: 1.5,
                  px: 4,
                  bgcolor: alpha('#fff', 0.1),
                  backdropFilter: 'blur(10px)',
                  borderRadius: '12px',
                  '&:hover': {
                    bgcolor: alpha('#fff', 0.2)
                  }
                }}
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </Box>
          </Paper>
        </motion.div>

        {/* Success/Error Messages */}
        <Snackbar 
          open={!!success} 
          autoHideDuration={6000} 
          onClose={() => setSuccess('')}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert 
            onClose={() => setSuccess('')} 
            severity="success"
            sx={{ width: '100%' }}
          >
            {success}
          </Alert>
        </Snackbar>

        <Snackbar 
          open={!!error} 
          autoHideDuration={6000} 
          onClose={() => setError('')}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert 
            onClose={() => setError('')} 
            severity="error"
            sx={{ width: '100%' }}
          >
            {error}
          </Alert>
        </Snackbar>
      </Box>
    </Container>
  );
} 