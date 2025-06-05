import React, { useState, useEffect } from 'react';
import { 
  Box, 
  TextField, 
  Button, 
  Typography, 
  Switch, 
  FormControlLabel, 
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  alpha,
  Grid
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

const EventForm = ({ event, open, onClose, onSave, onDelete }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date(new Date().getTime() + 60 * 60 * 1000));
  const [isAllDay, setIsAllDay] = useState(false);

  useEffect(() => {
    if (event) {
      setTitle(event.title || '');
      setDescription(event.description || '');
      setLocation(event.location || '');
      setStartDate(event.start instanceof Date ? event.start : new Date(event.start));
      setEndDate(event.end instanceof Date ? event.end : new Date(event.end));
      setIsAllDay(event.isAllDay || false);
    } else {
      setTitle('');
      setDescription('');
      setLocation('');
      setStartDate(new Date());
      setEndDate(new Date(new Date().getTime() + 60 * 60 * 1000));
      setIsAllDay(false);
    }
  }, [event]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      id: event?.id,
      title,
      description,
      location,
      start: startDate,
      end: endDate,
      isAllDay
    });
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: alpha('#121212', 0.95),
            backdropFilter: 'blur(10px)',
            borderRadius: 2,
            border: `1px solid ${alpha('#fff', 0.1)}`
          }
        }}
      >
        <DialogTitle sx={{ color: '#fff' }}>
          {event ? 'Edit Event' : 'Create New Event'}
        </DialogTitle>
        
        <DialogContent sx={{ pb: 4 }}>
          <Box component="form" sx={{ mt: 2 }}>
            <TextField
              label="Title"
              fullWidth
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              sx={{
                mb: 2,
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
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              sx={{
                mb: 2,
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
              label="Location"
              fullWidth
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  color: '#fff',
                  '& fieldset': { borderColor: alpha('#fff', 0.1) },
                  '&:hover fieldset': { borderColor: alpha('#fff', 0.2) },
                  '&.Mui-focused fieldset': { borderColor: '#9b59b6' }
                },
                '& .MuiInputLabel-root': { color: alpha('#fff', 0.7) }
              }}
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={isAllDay}
                  onChange={(e) => setIsAllDay(e.target.checked)}
                  sx={{
                    '& .MuiSwitch-switchBase': {
                      color: alpha('#fff', 0.7),
                      '&:hover': { backgroundColor: alpha('#fff', 0.1) }
                    },
                    '& .MuiSwitch-switchBase.Mui-checked': {
                      color: '#9b59b6',
                      '&:hover': { backgroundColor: alpha('#9b59b6', 0.1) }
                    },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                      backgroundColor: '#9b59b6'
                    }
                  }}
                />
              }
              label={<Typography sx={{ color: alpha('#fff', 0.7) }}>All Day Event</Typography>}
              sx={{ mb: 2 }}
            />
            
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Start Date & Time"
                  type="datetime-local"
                  value={startDate ? startDate.toISOString().slice(0, 16) : ''}
                  onChange={(e) => setStartDate(new Date(e.target.value))}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
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
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  label="End Date & Time"
                  type="datetime-local"
                  value={endDate ? endDate.toISOString().slice(0, 16) : ''}
                  onChange={(e) => setEndDate(new Date(e.target.value))}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
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
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ px: 3, pb: 3 }}>
          {event && (
            <Button 
              onClick={() => onDelete(event.id)} 
              sx={{ 
                color: alpha('#f44336', 0.9),
                '&:hover': { backgroundColor: alpha('#f44336', 0.1) }
              }}
            >
              Delete
            </Button>
          )}
          <Box sx={{ flexGrow: 1 }} />
          <Button 
            onClick={onClose}
            sx={{ 
              color: alpha('#fff', 0.7),
              '&:hover': { backgroundColor: alpha('#fff', 0.1) }
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            variant="contained"
            sx={{ 
              bgcolor: '#9b59b6',
              '&:hover': { bgcolor: alpha('#9b59b6', 0.8) }
            }}
          >
            {event ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

export default EventForm; 