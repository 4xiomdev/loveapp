import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  IconButton, 
  Paper,
  alpha,
  CircularProgress,
  Tooltip,
  Collapse,
  Fade
} from '@mui/material';
import { 
  Check as CheckIcon,
  Star as StarIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import Confetti from 'react-confetti';

const EnhancedHabitCard = ({ 
  habit, 
  onComplete, 
  weeklyCompletions, 
  weeklyGoal,
  showStarEarned,
  color = '#24c6dc'
}) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);

  const handleToggle = async () => {
    if (isUpdating) return; // Prevent double-clicks
    
    setIsUpdating(true);
    setError(null);
    
    try {
      await onComplete(habit.id, !habit.isTodayComplete);
      
      // Show confetti if completing and reaching goal
      if (!habit.isTodayComplete && weeklyCompletions + 1 >= weeklyGoal) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);
      }
    } catch (error) {
      setError(error.message || 'Failed to update habit');
      setTimeout(() => setError(null), 3000);
    } finally {
      setIsUpdating(false);
    }
  };

  const progress = Math.min(Math.round((weeklyCompletions / weeklyGoal) * 100), 100);
  const isComplete = progress >= 100;

  return (
    <Paper
      component={motion.div}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      sx={{
        p: 2,
        position: 'relative',
        bgcolor: alpha('#fff', 0.05),
        backdropFilter: 'blur(10px)',
        borderRadius: 2,
        border: `1px solid ${alpha('#fff', isComplete ? 0.2 : 0.1)}`,
        overflow: 'hidden',
        transition: 'all 0.3s ease',
        opacity: isUpdating ? 0.8 : 1,
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: `0 4px 20px ${alpha(color, 0.2)}`
        }
      }}
    >
      {/* Confetti Effect */}
      {showConfetti && (
        <Confetti
          width={400}
          height={400}
          recycle={false}
          numberOfPieces={100}
          gravity={0.2}
          colors={[color, '#fff', alpha(color, 0.5)]}
          style={{
            position: 'absolute',
            top: -100,
            left: -100,
            pointerEvents: 'none'
          }}
        />
      )}

      {/* Loading Overlay */}
      <Fade in={isUpdating}>
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: alpha('#000', 0.3),
            backdropFilter: 'blur(4px)',
            zIndex: 2
          }}
        >
          <CircularProgress size={24} sx={{ color }} />
        </Box>
      </Fade>

      {/* Error Message */}
      <Collapse in={!!error}>
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            p: 1,
            bgcolor: alpha('#f44336', 0.9),
            color: '#fff',
            textAlign: 'center',
            zIndex: 3
          }}
        >
          <Typography variant="caption">
            {error}
          </Typography>
        </Box>
      </Collapse>

      {/* Progress Ring */}
      <Box sx={{ 
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        mb: 2
      }}>
        <Typography variant="h6" sx={{ color: '#fff' }}>
          {habit.title}
        </Typography>

        <Box sx={{ position: 'relative' }}>
          <Tooltip 
            title={`${weeklyCompletions}/${weeklyGoal} days completed this week`}
            arrow
          >
            <Box
              component={motion.div}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              sx={{
                width: 40,
                height: 40,
                position: 'relative',
                cursor: 'pointer'
              }}
              onClick={handleToggle}
            >
              <CircularProgress
                variant="determinate"
                value={100}
                size={40}
                sx={{
                  position: 'absolute',
                  color: alpha('#fff', 0.1)
                }}
              />
              <CircularProgress
                variant="determinate"
                value={progress}
                size={40}
                sx={{
                  position: 'absolute',
                  color,
                  transition: 'all 0.3s ease'
                }}
              />
              <Box
                sx={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <AnimatePresence mode="wait">
                  {habit.isTodayComplete ? (
                    <motion.div
                      key="check"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                    >
                      <CheckIcon sx={{ color: '#fff', fontSize: 20 }} />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="empty"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                    >
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          bgcolor: alpha('#fff', 0.5)
                        }}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </Box>
            </Box>
          </Tooltip>

          {/* Star Icon for 100% completion */}
          <AnimatePresence>
            {isComplete && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                style={{
                  position: 'absolute',
                  top: -8,
                  right: -8
                }}
              >
                <StarIcon 
                  sx={{ 
                    color,
                    filter: `drop-shadow(0 0 4px ${alpha(color, 0.5)})`,
                    animation: 'pulse 2s infinite'
                  }} 
                />
              </motion.div>
            )}
          </AnimatePresence>
        </Box>
      </Box>

      {/* Weekly Progress */}
      <Box sx={{ mb: 1 }}>
        <Typography 
          variant="body2" 
          sx={{ 
            color: alpha('#fff', 0.7),
            display: 'flex',
            alignItems: 'center',
            gap: 0.5
          }}
        >
          {weeklyCompletions}/{weeklyGoal} days this week
          {isComplete && (
            <Typography 
              component="span"
              variant="caption"
              sx={{ 
                color: alpha(color, 0.9),
                bgcolor: alpha(color, 0.1),
                px: 1,
                py: 0.25,
                borderRadius: 1,
                ml: 1
              }}
            >
              Weekly Goal Met!
            </Typography>
          )}
        </Typography>
      </Box>

      {/* Last Updated */}
      <Typography 
        variant="caption" 
        sx={{ color: alpha('#fff', 0.5) }}
      >
        Last updated: {format(new Date(habit.updatedAt?.toDate() || new Date()), 'MMM d, yyyy')}
      </Typography>
    </Paper>
  );
};

export default EnhancedHabitCard; 