import React, { useState } from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  CircularProgress, 
  Paper, 
  alpha, 
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Divider,
  Alert,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckIcon from '@mui/icons-material/Check';
import EditIcon from '@mui/icons-material/Edit';
import CloseIcon from '@mui/icons-material/Close';
import { extractEventsFromImage, createEventFromText } from '../services/openaiService';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

const EventExtractor = ({ onEventsExtracted, openaiApiKey, onClose }) => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [textPrompt, setTextPrompt] = useState('');
  const [extractedEvents, setExtractedEvents] = useState([]);
  const [selectedEvents, setSelectedEvents] = useState([]);
  const [mode, setMode] = useState('image'); // 'image' or 'text'
  const [error, setError] = useState('');
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [currentEvent, setCurrentEvent] = useState(null);
  const [extractionNotification, setExtractionNotification] = useState('');

  // Handle file selection
  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      
      // Create a preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  // Convert file to base64
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        // Extract base64 string without the data URI prefix
        const base64String = reader.result.split(',')[1];
        resolve(base64String);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  // Extract events from image
  const handleExtractFromImage = async () => {
    if (!file) return;
    
    setLoading(true);
    setError('');
    setExtractedEvents([]);
    setExtractionNotification('');
    
    try {
      const base64Image = await fileToBase64(file);
      const events = await extractEventsFromImage(base64Image, openaiApiKey);
      
      setExtractedEvents(events);
      setSelectedEvents(events.map((_, index) => index)); // Select all by default
      
      if (events.length > 0) {
        setExtractionNotification(`Successfully extracted ${events.length} events. Review them below and click "Add to Calendar" to save them.`);
      }
    } catch (error) {
      console.error('Error extracting events:', error);
      setError('Failed to extract events from the image. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Extract event from text
  const handleExtractFromText = async () => {
    if (!textPrompt.trim()) return;
    
    setLoading(true);
    setError('');
    setExtractedEvents([]);
    setExtractionNotification('');
    
    try {
      const event = await createEventFromText(textPrompt, openaiApiKey);
      
      setExtractedEvents([...extractedEvents, event]);
      setSelectedEvents([...selectedEvents, extractedEvents.length]);
      setTextPrompt('');
      
      if (extractedEvents.length > 0) {
        setExtractionNotification(`Successfully extracted ${extractedEvents.length} events. Review them below and click "Add to Calendar" to save them.`);
      }
    } catch (error) {
      console.error('Error creating event from text:', error);
      setError('Failed to create event from text. Please try again with more details.');
    } finally {
      setLoading(false);
    }
  };

  // Toggle event selection
  const toggleEventSelection = (index) => {
    if (selectedEvents.includes(index)) {
      setSelectedEvents(selectedEvents.filter(i => i !== index));
    } else {
      setSelectedEvents([...selectedEvents, index]);
    }
  };

  // Handle add to calendar
  const handleAddToCalendar = () => {
    const eventsToAdd = selectedEvents.map(index => extractedEvents[index]);
    onEventsExtracted(eventsToAdd);
    
    // Reset state
    setFile(null);
    setPreview(null);
    setExtractedEvents([]);
    setSelectedEvents([]);
  };

  // Open edit dialog
  const handleEditEvent = (event, index) => {
    setCurrentEvent({ ...event, index });
    setOpenEditDialog(true);
  };

  // Save edited event
  const handleSaveEdit = () => {
    const newEvents = [...extractedEvents];
    newEvents[currentEvent.index] = {
      title: currentEvent.title,
      start: currentEvent.start,
      end: currentEvent.end,
      location: currentEvent.location,
      description: currentEvent.description
    };
    
    setExtractedEvents(newEvents);
    setOpenEditDialog(false);
    setCurrentEvent(null);
  };

  // Add this validation function to the EventExtractor component
  const validateAndFormatEvents = (events) => {
    if (!events || !Array.isArray(events)) {
      return [];
    }
    
    return events.map(event => {
      // Ensure we have the required fields
      if (!event.title) {
        event.title = "Untitled Event";
      }
      
      // Try to parse dates if they're strings
      if (event.start && typeof event.start === 'string') {
        try {
          event.start = new Date(event.start);
        } catch (e) {
          console.error("Invalid start date:", event.start);
          event.start = new Date(); // Fallback to current date
        }
      }
      
      if (event.end && typeof event.end === 'string') {
        try {
          event.end = new Date(event.end);
        } catch (e) {
          console.error("Invalid end date:", event.end);
          // Default to 1 hour after start
          event.end = event.start ? new Date(event.start.getTime() + 60 * 60 * 1000) : new Date(Date.now() + 60 * 60 * 1000);
        }
      }
      
      // If no end date, set it to 1 hour after start
      if (!event.end && event.start) {
        event.end = new Date(event.start.getTime() + 60 * 60 * 1000);
      }
      
      return {
        title: event.title,
        start: event.start || new Date(),
        end: event.end || new Date(Date.now() + 60 * 60 * 1000),
        location: event.location || "",
        description: event.description || "",
        allDay: !!event.allDay
      };
    });
  };

  // Then call this function before passing events to the parent component:
  const handleExtract = async () => {
    try {
      setLoading(true);
      setError("");
      
      // ... existing extraction code ...
      
      // Validate and format the extracted events
      const formattedEvents = validateAndFormatEvents(extractedEvents);
      
      // Pass the formatted events to the parent
      onEventsExtracted(formattedEvents);
      
    } catch (error) {
      // ... error handling ...
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        maxHeight: 'calc(100vh - 120px)',
        overflow: 'hidden'
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" sx={{ color: '#fff' }}>Extract Events</Typography>
        {onClose && (
          <IconButton onClick={onClose} sx={{ color: 'rgba(255,255,255,0.7)' }}>
            <CloseIcon />
          </IconButton>
        )}
      </Box>
      
      <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
        <Button
          variant={mode === 'image' ? 'contained' : 'outlined'}
          onClick={() => setMode('image')}
          sx={{
            bgcolor: mode === 'image' ? alpha('#9b59b6', 0.8) : 'transparent',
            borderColor: alpha('#fff', 0.2),
            color: '#fff',
            '&:hover': {
              bgcolor: mode === 'image' ? alpha('#9b59b6', 0.9) : alpha('#fff', 0.1)
            }
          }}
        >
          From Image
        </Button>
        <Button
          variant={mode === 'text' ? 'contained' : 'outlined'}
          onClick={() => setMode('text')}
          sx={{
            bgcolor: mode === 'text' ? alpha('#9b59b6', 0.8) : 'transparent',
            borderColor: alpha('#fff', 0.2),
            color: '#fff',
            '&:hover': {
              bgcolor: mode === 'text' ? alpha('#9b59b6', 0.9) : alpha('#fff', 0.1)
            }
          }}
        >
          From Text
        </Button>
      </Box>
      
      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 3, bgcolor: alpha('#f44336', 0.1), color: '#fff', border: `1px solid ${alpha('#f44336', 0.3)}` }}
          onClose={() => setError('')}
        >
          {error}
        </Alert>
      )}

      {extractionNotification && (
        <Alert 
          severity="success" 
          sx={{ 
            mb: 2, 
            backgroundColor: alpha('#4CAF50', 0.1),
            color: '#fff' 
          }}
        >
          {extractionNotification}
        </Alert>
      )}

      {mode === 'image' ? (
        <>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              mb: 3
            }}
          >
            <Button
              component="label"
              variant="outlined"
              startIcon={<CloudUploadIcon />}
              sx={{
                mb: 2,
                borderColor: alpha('#fff', 0.2),
                color: '#fff',
                '&:hover': {
                  borderColor: alpha('#fff', 0.4),
                  bgcolor: alpha('#fff', 0.05)
                }
              }}
            >
              Upload Schedule Image
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={handleFileChange}
              />
            </Button>
            
            {preview && (
              <Box sx={{ mt: 2, width: '100%', maxWidth: 400, maxHeight: 300, overflow: 'hidden', borderRadius: 1 }}>
                <img src={preview} alt="Preview" style={{ width: '100%', height: 'auto' }} />
              </Box>
            )}
            
            <Button
              variant="contained"
              onClick={handleExtractFromImage}
              disabled={!file || loading}
              startIcon={loading ? <CircularProgress size={20} /> : null}
              sx={{
                mt: 2,
                bgcolor: alpha('#9b59b6', 0.8),
                '&:hover': {
                  bgcolor: alpha('#9b59b6', 0.9)
                },
                '&.Mui-disabled': {
                  bgcolor: alpha('#9b59b6', 0.3)
                }
              }}
            >
              {loading ? 'Extracting...' : 'Extract Events'}
            </Button>
          </Box>
        </>
      ) : (
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            multiline
            rows={3}
            placeholder="Describe your event, e.g., 'Schedule a team meeting on July 15th at 2pm in Conference Room B to discuss the new project'"
            value={textPrompt}
            onChange={(e) => setTextPrompt(e.target.value)}
            sx={{
              mb: 2,
              '& .MuiOutlinedInput-root': {
                color: '#fff',
                borderColor: alpha('#fff', 0.3),
                '& fieldset': {
                  borderColor: alpha('#fff', 0.1),
                },
                '&:hover fieldset': {
                  borderColor: alpha('#fff', 0.2),
                },
                '&.Mui-focused fieldset': {
                  borderColor: alpha('#9b59b6', 0.6),
                },
              }
            }}
          />
          
          <Button
            variant="contained"
            onClick={handleExtractFromText}
            disabled={!textPrompt.trim() || loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
            sx={{
              bgcolor: alpha('#9b59b6', 0.8),
              '&:hover': {
                bgcolor: alpha('#9b59b6', 0.9)
              },
              '&.Mui-disabled': {
                bgcolor: alpha('#9b59b6', 0.3)
              }
            }}
          >
            {loading ? 'Creating...' : 'Create Event'}
          </Button>
        </Box>
      )}

      {/* Main content area with scrolling */}
      <Box sx={{ 
        flexGrow: 1, 
        overflow: 'auto',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {extractedEvents.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Typography variant="subtitle1" sx={{ mb: 1, color: '#fff' }}>
              Extracted Events:
            </Typography>
            
            <List
              sx={{
                bgcolor: alpha('#000', 0.2),
                borderRadius: 1,
                mb: 3,
                overflow: 'auto',
                maxHeight: '40vh',
                border: '1px solid rgba(155, 89, 182, 0.3)'
              }}
            >
              {extractedEvents.map((event, index) => (
                <React.Fragment key={index}>
                  {index > 0 && <Divider sx={{ bgcolor: alpha('#fff', 0.1) }} />}
                  <ListItem
                    sx={{
                      bgcolor: selectedEvents.includes(index) ? alpha('#9b59b6', 0.1) : 'transparent',
                      '&:hover': {
                        bgcolor: selectedEvents.includes(index) ? alpha('#9b59b6', 0.15) : alpha('#fff', 0.05)
                      }
                    }}
                  >
                    <ListItemText
                      disableTypography
                      primary={
                        <Typography variant="body1" sx={{ color: '#fff' }}>
                          {event.title}
                        </Typography>
                      }
                      secondary={
                        <Typography variant="body2" sx={{ color: alpha('#fff', 0.7) }}>
                          {format(new Date(event.start), 'PPP')} {format(new Date(event.start), 'p')} - {format(new Date(event.end), 'p')}
                          {event.location && ` • ${event.location}`}
                        </Typography>
                      }
                    />
                    <ListItemSecondaryAction>
                      <IconButton 
                        edge="end" 
                        onClick={() => toggleEventSelection(index)}
                        sx={{ color: selectedEvents.includes(index) ? '#4CAF50' : alpha('#fff', 0.5) }}
                      >
                        {selectedEvents.includes(index) ? <CheckIcon /> : <AddIcon />}
                      </IconButton>
                      <IconButton 
                        edge="end" 
                        onClick={() => handleEditEvent(event, index)}
                        sx={{ color: alpha('#fff', 0.5), ml: 1 }}
                      >
                        <EditIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                </React.Fragment>
              ))}
            </List>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Button
                variant="outlined"
                onClick={() => {
                  setExtractedEvents([]);
                  setSelectedEvents([]);
                }}
                sx={{
                  borderColor: alpha('#fff', 0.2),
                  color: '#fff',
                  '&:hover': {
                    borderColor: alpha('#fff', 0.4),
                    bgcolor: alpha('#fff', 0.05)
                  }
                }}
                startIcon={<DeleteIcon />}
              >
                Clear All
              </Button>
            </Box>
          </motion.div>
        )}
      </Box>
      
      {/* Bottom action area */}
      <Box sx={{ mt: 'auto', pt: 2 }}>
        <Button
          onClick={handleAddToCalendar}
          disabled={selectedEvents.length === 0 || loading}
          fullWidth
          variant="contained"
          startIcon={<AddIcon />}
          sx={{
            bgcolor: '#9b59b6',
            '&:hover': {
              bgcolor: alpha('#9b59b6', 0.8)
            }
          }}
        >
          Add to Calendar
        </Button>
      </Box>

      {/* Edit Dialog */}
      <Dialog 
        open={openEditDialog} 
        onClose={() => setOpenEditDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: alpha('#1a1a1a', 0.95),
            backdropFilter: 'blur(20px)',
            border: `1px solid ${alpha('#fff', 0.1)}`,
            borderRadius: '16px'
          }
        }}
      >
        <DialogTitle sx={{ borderBottom: `1px solid ${alpha('#fff', 0.1)}`, color: '#fff' }}>
          Edit Event
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {currentEvent && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <TextField 
                label="Title"
                fullWidth
                value={currentEvent.title}
                onChange={(e) => setCurrentEvent({...currentEvent, title: e.target.value})}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: '#fff',
                    '& fieldset': { borderColor: alpha('#fff', 0.1) },
                    '&:hover fieldset': { borderColor: alpha('#fff', 0.2) },
                    '&.Mui-focused fieldset': { borderColor: '#9b59b6' }
                  },
                  '& .MuiInputLabel-root': { color: alpha('#fff', 0.7) }
                }}
              />
              
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField 
                  label="Start Date/Time"
                  type="datetime-local"
                  fullWidth
                  value={currentEvent.start ? currentEvent.start.replace('Z', '') : ''}
                  onChange={(e) => setCurrentEvent({...currentEvent, start: e.target.value})}
                  InputLabelProps={{ shrink: true }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      color: '#fff',
                      '& fieldset': { borderColor: alpha('#fff', 0.1) },
                      '&:hover fieldset': { borderColor: alpha('#fff', 0.2) },
                      '&.Mui-focused fieldset': { borderColor: '#9b59b6' }
                    },
                    '& .MuiInputLabel-root': { color: alpha('#fff', 0.7) }
                  }}
                />
                
                <TextField 
                  label="End Date/Time"
                  type="datetime-local"
                  fullWidth
                  value={currentEvent.end ? currentEvent.end.replace('Z', '') : ''}
                  onChange={(e) => setCurrentEvent({...currentEvent, end: e.target.value})}
                  InputLabelProps={{ shrink: true }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      color: '#fff',
                      '& fieldset': { borderColor: alpha('#fff', 0.1) },
                      '&:hover fieldset': { borderColor: alpha('#fff', 0.2) },
                      '&.Mui-focused fieldset': { borderColor: '#9b59b6' }
                    },
                    '& .MuiInputLabel-root': { color: alpha('#fff', 0.7) }
                  }}
                />
              </Box>
              
              <TextField 
                label="Location"
                fullWidth
                value={currentEvent.location || ''}
                onChange={(e) => setCurrentEvent({...currentEvent, location: e.target.value})}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: '#fff',
                    '& fieldset': { borderColor: alpha('#fff', 0.1) },
                    '&:hover fieldset': { borderColor: alpha('#fff', 0.2) },
                    '&.Mui-focused fieldset': { borderColor: '#9b59b6' }
                  },
                  '& .MuiInputLabel-root': { color: alpha('#fff', 0.7) }
                }}
              />
              
              <TextField 
                label="Description"
                fullWidth
                multiline
                rows={3}
                value={currentEvent.description || ''}
                onChange={(e) => setCurrentEvent({...currentEvent, description: e.target.value})}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: '#fff',
                    '& fieldset': { borderColor: alpha('#fff', 0.1) },
                    '&:hover fieldset': { borderColor: alpha('#fff', 0.2) },
                    '&.Mui-focused fieldset': { borderColor: '#9b59b6' }
                  },
                  '& .MuiInputLabel-root': { color: alpha('#fff', 0.7) }
                }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: `1px solid ${alpha('#fff', 0.1)}` }}>
          <Button 
            onClick={() => setOpenEditDialog(false)}
            sx={{ color: alpha('#fff', 0.7) }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSaveEdit}
            variant="contained"
            sx={{
              bgcolor: alpha('#9b59b6', 0.8),
              '&:hover': { bgcolor: alpha('#9b59b6', 0.9) }
            }}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EventExtractor; 