import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { Box, Button, Typography, Paper, Alert } from '@mui/material';

export default function AdminDebugPage() {
  const { isAdmin } = useAuth();
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleCleanupPartnerIds = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const functions = getFunctions(undefined, 'us-central1');
      const cleanupPartnerIdsFn = httpsCallable(functions, 'cleanupPartnerIds');
      const response = await cleanupPartnerIdsFn();
      
      console.log('Raw cleanup response:', response);
      setResult(response.data);
      console.log('Cleanup results:', response.data);
    } catch (err) {
      console.error('Error running cleanup:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>You must be an admin to access this page.</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Admin Debug Tools
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Partner ID Cleanup
        </Typography>
        <Typography variant="body2" sx={{ mb: 2 }}>
          This will scan all user documents and fix any partner IDs that have extra quotes.
        </Typography>
        <Button 
          variant="contained" 
          onClick={handleCleanupPartnerIds}
          disabled={loading}
        >
          {loading ? 'Running Cleanup...' : 'Run Cleanup'}
        </Button>

        {result && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle1">
              Cleanup Results:
            </Typography>
            <Typography variant="body2">
              Fixed {result.fixedCount} documents
            </Typography>
            {result.details && result.details.length > 0 && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="subtitle2">
                  Details:
                </Typography>
                {result.details.map((detail, index) => (
                  <Typography key={index} variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                    User {detail.userId}: {detail.from} → {detail.to}
                  </Typography>
                ))}
              </Box>
            )}
          </Box>
        )}
      </Paper>
    </Box>
  );
} 