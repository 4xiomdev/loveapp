import React from 'react';
import {
  Box,
  Typography,
  Grid,
  alpha,
  Tooltip,
  IconButton
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import EditIcon from '@mui/icons-material/Edit';
import { MOOD_TYPES } from '../../pages/MoodTrackerPage';

const formatTimestamp = (timestamp) => {
  if (!timestamp) return 'Just now';
  
  try {
    // Handle Firestore Timestamp
    if (timestamp.toDate) {
      return format(timestamp.toDate(), 'h:mm a');
    }
    // Handle JavaScript Date
    if (timestamp instanceof Date) {
      return format(timestamp, 'h:mm a');
    }
    // Handle timestamp number
    if (typeof timestamp === 'number') {
      return format(new Date(timestamp), 'h:mm a');
    }
    return 'Just now';
  } catch (error) {
    console.error('Error formatting timestamp:', error);
    return 'Just now';
  }
};

// Styled MoodButton component
const MoodButton = ({ mood, selected, onSelect }) => {
  const moodInfo = MOOD_TYPES[mood];
  
  return (
    <Tooltip title={mood} arrow>
      <Box
        component={motion.div}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => onSelect(mood)}
        sx={{
          cursor: 'pointer',
          p: 2,
          borderRadius: 2,
          border: `2px solid ${selected ? moodInfo.color : alpha(moodInfo.color, 0.3)}`,
          backgroundColor: selected ? alpha(moodInfo.color, 0.1) : 'transparent',
          transition: 'all 0.2s ease',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 1,
          '&:hover': {
            backgroundColor: alpha(moodInfo.color, 0.15),
          }
        }}
      >
        <Typography variant="h4" component="span">
          {moodInfo.emoji}
        </Typography>
        <Typography 
          variant="caption" 
          sx={{ 
            color: selected ? moodInfo.color : alpha(moodInfo.color, 0.9),
            fontWeight: selected ? 700 : 600,
            textAlign: 'center'
          }}
        >
          {mood}
        </Typography>
      </Box>
    </Tooltip>
  );
};

export default function MoodSelector({ todayMood, onMoodSelect }) {
  const handleMoodSelect = (mood) => {
    if (onMoodSelect) {
      onMoodSelect(mood);
    }
  };

  const renderCurrentMood = () => {
    if (!todayMood || !MOOD_TYPES[todayMood.mood]) return null;

    return (
      <Box
        component={motion.div}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        sx={{
          mb: 4,
          p: 3,
          borderRadius: 2,
          backgroundColor: alpha(MOOD_TYPES[todayMood.mood].color, 0.1),
          border: `2px solid ${alpha(MOOD_TYPES[todayMood.mood].color, 0.3)}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h3" component="span">
            {MOOD_TYPES[todayMood.mood].emoji}
          </Typography>
          <Box>
            <Typography variant="h6" sx={{ color: alpha(MOOD_TYPES[todayMood.mood].color, 0.9) }}>
              {todayMood.mood}
            </Typography>
            <Typography variant="caption" sx={{ color: alpha('#fff', 0.6) }}>
              Last updated: {formatTimestamp(todayMood.updatedAt)}
            </Typography>
          </Box>
        </Box>
        <IconButton 
          onClick={() => handleMoodSelect(null)}
          sx={{ 
            color: alpha('#fff', 0.6),
            '&:hover': {
              color: '#fff',
              backgroundColor: alpha(MOOD_TYPES[todayMood.mood].color, 0.2)
            }
          }}
        >
          <EditIcon />
        </IconButton>
      </Box>
    );
  };

  return (
    <Box>
      {/* Today's Date */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          {format(new Date(), 'EEEE')}
        </Typography>
        <Typography variant="subtitle1" sx={{ color: alpha('#fff', 0.7) }}>
          {format(new Date(), 'MMMM d, yyyy')}
        </Typography>
      </Box>

      {/* Current Mood Display */}
      {renderCurrentMood()}

      {/* Mood Selection Grid */}
      <AnimatePresence>
        {(!todayMood || todayMood === null) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Typography variant="h6" sx={{ mb: 3, textAlign: 'center' }}>
              {todayMood === null ? 'Change your mood?' : 'How are you feeling today?'}
            </Typography>
            <Grid container spacing={2}>
              {Object.keys(MOOD_TYPES).map((mood) => (
                <Grid item xs={6} sm={4} md={3} key={mood}>
                  <MoodButton
                    mood={mood}
                    selected={todayMood?.mood === mood}
                    onSelect={handleMoodSelect}
                  />
                </Grid>
              ))}
            </Grid>
          </motion.div>
        )}
      </AnimatePresence>
    </Box>
  );
} 