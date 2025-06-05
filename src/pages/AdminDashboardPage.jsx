import React, { useState } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Button, 
  Paper,
  Grid,
  Card,
  CardContent,
  CardActions,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  alpha,
  Alert,
  CircularProgress
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { cleanupFirestoreData } from '../utils/cleanupFirestore';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useNavigate } from 'react-router-dom';
import StorageIcon from '@mui/icons-material/Storage';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import BugReportIcon from '@mui/icons-material/BugReport';
import { setupFirstAdmin } from '../utils/adminUtils';

export default function AdminDashboardPage() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState(null);

  const collections = [
    { name: 'reminders', label: 'Reminders' },
    { name: 'accountability', label: 'Accountability' },
    { name: 'dailyStatus', label: 'Daily Status' },
    { name: 'messages', label: 'Messages' }
  ];

  const handleCleanup = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      await cleanupFirestoreData(selectedCollection);
      setSuccess(`Successfully cleaned up ${selectedCollection} collection`);
      setOpenDialog(false);
    } catch (error) {
      console.error('Cleanup error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (collection) => {
    setSelectedCollection(collection);
    setOpenDialog(true);
  };

  const handleSetupAdmin = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      await setupFirstAdmin();
      setSuccess('Successfully set up admin user. Please sign out and sign back in.');
    } catch (error) {
      console.error('Admin setup error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <Box sx={{ color: "#fff", p: { xs: 2, md: 4 } }}>
        <Typography variant="h3" sx={{ 
          mb: 4,
          background: 'linear-gradient(45deg, #fff, #f0f0f0)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          textAlign: 'center'
        }}>
          Admin Dashboard
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {success}
          </Alert>
        )}

        {/* Admin Setup Card */}
        <Card 
          sx={{ 
            bgcolor: alpha('#fff', 0.05),
            backdropFilter: 'blur(10px)',
            borderRadius: 3,
            border: `1px solid ${alpha('#fff', 0.1)}`,
            mb: 4
          }}
        >
          <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <AdminPanelSettingsIcon sx={{ fontSize: 40, color: '#fff' }} />
            <Box>
              <Typography variant="h5" component="div" sx={{ color: '#fff', mb: 1 }}>
                Admin Setup
              </Typography>
              <Typography variant="body2" sx={{ color: alpha('#fff', 0.7) }}>
                Set up the first admin user (adminj@loveapp.com)
              </Typography>
            </Box>
          </CardContent>
          <CardActions>
            <Button 
              size="large" 
              onClick={handleSetupAdmin}
              disabled={loading}
              sx={{
                color: '#4fc3f7',
                '&:hover': {
                  bgcolor: alpha('#4fc3f7', 0.1)
                }
              }}
            >
              {loading ? 'Setting up...' : 'Setup Admin'}
            </Button>
          </CardActions>
        </Card>

        {/* Firestore Manager Card */}
        <Card 
          sx={{ 
            bgcolor: alpha('#fff', 0.05),
            backdropFilter: 'blur(10px)',
            borderRadius: 3,
            border: `1px solid ${alpha('#fff', 0.1)}`,
            mb: 4
          }}
        >
          <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <StorageIcon sx={{ fontSize: 40, color: '#fff' }} />
            <Box>
              <Typography variant="h5" component="div" sx={{ color: '#fff', mb: 1 }}>
                Firestore Manager
              </Typography>
              <Typography variant="body2" sx={{ color: alpha('#fff', 0.7) }}>
                Advanced database management tools for viewing, exporting, and resetting data
              </Typography>
            </Box>
          </CardContent>
          <CardActions>
            <Button 
              size="large" 
              onClick={() => navigate('/admin/firestore')}
              sx={{
                color: '#4fc3f7',
                '&:hover': {
                  bgcolor: alpha('#4fc3f7', 0.1)
                }
              }}
            >
              Open Manager
            </Button>
          </CardActions>
        </Card>

        {/* Partner Debug Tools Card */}
        <Card 
          sx={{ 
            bgcolor: alpha('#fff', 0.05),
            backdropFilter: 'blur(10px)',
            borderRadius: 3,
            border: `1px solid ${alpha('#fff', 0.1)}`,
            mb: 4
          }}
        >
          <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <BugReportIcon sx={{ fontSize: 40, color: '#fff' }} />
            <Box>
              <Typography variant="h5" component="div" sx={{ color: '#fff', mb: 1 }}>
                Partner Debug Tools
              </Typography>
              <Typography variant="body2" sx={{ color: alpha('#fff', 0.7) }}>
                Tools for fixing partner linking issues and cleaning up partner IDs
              </Typography>
            </Box>
          </CardContent>
          <CardActions>
            <Button 
              size="large" 
              onClick={() => navigate('/admin/debug')}
              sx={{
                color: '#4fc3f7',
                '&:hover': {
                  bgcolor: alpha('#4fc3f7', 0.1)
                }
              }}
            >
              Open Debug Tools
            </Button>
          </CardActions>
        </Card>

        <Typography variant="h5" sx={{ mb: 3, color: '#fff' }}>
          Quick Collection Cleanup
        </Typography>

        <Grid container spacing={3}>
          {collections.map((collection) => (
            <Grid item xs={12} sm={6} md={4} key={collection.name}>
              <Card 
                sx={{ 
                  bgcolor: alpha('#fff', 0.05),
                  backdropFilter: 'blur(10px)',
                  borderRadius: 3,
                  border: `1px solid ${alpha('#fff', 0.1)}`,
                }}
              >
                <CardContent>
                  <Typography variant="h5" component="div" sx={{ color: '#fff', mb: 2 }}>
                    {collection.label}
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button 
                    size="small" 
                    onClick={() => handleOpenDialog(collection.name)}
                    sx={{
                      color: '#ff69b4',
                      '&:hover': {
                        bgcolor: alpha('#ff69b4', 0.1)
                      }
                    }}
                  >
                    Cleanup Data
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Dialog
          open={openDialog}
          onClose={() => setOpenDialog(false)}
          PaperProps={{
            sx: {
              bgcolor: '#1a1a1a',
              color: '#fff',
              borderRadius: 3,
            }
          }}
        >
          <DialogTitle>Confirm Cleanup</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to clean up the {selectedCollection} collection? This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={() => setOpenDialog(false)}
              sx={{ color: '#fff' }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCleanup}
              disabled={loading}
              sx={{
                bgcolor: '#ff69b4',
                color: '#fff',
                '&:hover': {
                  bgcolor: alpha('#ff69b4', 0.8)
                }
              }}
            >
              {loading ? 'Cleaning...' : 'Confirm Cleanup'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
} 