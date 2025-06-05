import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Alert,
  CircularProgress,
  Box
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { getFunctions, httpsCallable } from 'firebase/functions';

export default function FirestoreManagerPage() {
  const { isAdmin } = useAuth();
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, collection: null });
  const [resetDialog, setResetDialog] = useState(false);

  useEffect(() => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }
    loadCollections();
  }, [isAdmin]);

  const loadCollections = async () => {
    try {
      setLoading(true);
      setError(null);
      const functions = getFunctions();
      const listCollections = httpsCallable(functions, 'listCollections');
      const result = await listCollections();
      
      if (!result.data.success) {
        throw new Error(result.data.error || 'Failed to list collections');
      }
      
      setCollections(result.data.collections);
    } catch (err) {
      console.error('Error loading collections:', err);
      setError(err.message || 'Failed to load collections');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (collectionName) => {
    try {
      setLoading(true);
      setError(null);
      const functions = getFunctions();
      const exportCollection = httpsCallable(functions, 'exportCollection');
      const result = await exportCollection({ collectionName });
      
      if (!result.data.success) {
        throw new Error(result.data.error || 'Failed to export collection');
      }
      
      // Create and download the JSON file
      const dataStr = JSON.stringify(result.data.documents, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
      const exportFileDefaultName = `${collectionName}_${new Date().toISOString()}.json`;

      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      
      setSuccessMessage(`Successfully exported ${collectionName}`);
    } catch (err) {
      console.error('Error exporting collection:', err);
      setError(err.message || 'Failed to export collection');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (collectionName) => {
    try {
      setLoading(true);
      setError(null);
      const functions = getFunctions();
      const deleteCollection = httpsCallable(functions, 'deleteCollection');
      const result = await deleteCollection({ collectionName });
      
      if (!result.data.success) {
        throw new Error(result.data.error || 'Failed to delete collection');
      }
      
      await loadCollections();
      setSuccessMessage(`Successfully deleted collection ${collectionName}`);
    } catch (err) {
      console.error('Error deleting collection:', err);
      setError(err.message || 'Failed to delete collection');
    } finally {
      setLoading(false);
      setDeleteDialog({ open: false, collection: null });
    }
  };

  const handleReset = async () => {
    try {
      setLoading(true);
      setError(null);
      const functions = getFunctions();
      const resetAllData = httpsCallable(functions, 'resetAllData');
      const result = await resetAllData();
      
      if (!result.data.success) {
        throw new Error(result.data.error || 'Failed to reset data');
      }
      
      await loadCollections();
      setSuccessMessage('Successfully reset all collections');
    } catch (err) {
      console.error('Error resetting data:', err);
      setError(err.message || 'Failed to reset data');
    } finally {
      setLoading(false);
      setResetDialog(false);
    }
  };

  if (!isAdmin) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error">
          You don't have permission to access this page.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          Firestore Manager
        </Typography>
        <Button
          variant="contained"
          color="error"
          onClick={() => setResetDialog(true)}
          disabled={loading}
        >
          Reset All Data
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {successMessage && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMessage(null)}>
          {successMessage}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Collection</TableCell>
                <TableCell align="right">Documents</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {collections.map((collection) => (
                <TableRow key={collection.name}>
                  <TableCell component="th" scope="row">
                    {collection.name}
                  </TableCell>
                  <TableCell align="right">{collection.count}</TableCell>
                  <TableCell align="right">
                    <Button
                      size="small"
                      onClick={() => handleExport(collection.name)}
                      disabled={!collection.exists || loading}
                    >
                      Export
                    </Button>
                    <Button
                      size="small"
                      color="error"
                      onClick={() => setDeleteDialog({ open: true, collection: collection.name })}
                      disabled={!collection.exists || loading}
                      sx={{ ml: 1 }}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Delete Collection Dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, collection: null })}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete all documents in the {deleteDialog.collection} collection?
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, collection: null })}>
            Cancel
          </Button>
          <Button 
            onClick={() => handleDelete(deleteDialog.collection)} 
            color="error"
            disabled={loading}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reset All Data Dialog */}
      <Dialog
        open={resetDialog}
        onClose={() => setResetDialog(false)}
      >
        <DialogTitle>Confirm Reset</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to reset all data? This will delete all documents from all collections.
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResetDialog(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleReset} 
            color="error"
            disabled={loading}
          >
            Reset All Data
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
} 