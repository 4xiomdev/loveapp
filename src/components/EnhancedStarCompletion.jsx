import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Box, Tooltip, Typography, alpha, CircularProgress } from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
import Confetti from 'react-confetti';

const EnhancedStarCompletion = ({ 
  weeklyGoal = 7, 
  completedDays = 0, 
  color = '#FFD700', 
  size = 60, 
  onStarEarned,
  isUpdating = false 
}) => {
  const [prevCompleted, setPrevCompleted] = useState(completedDays);
  const [hasTriggeredStarEarned, setHasTriggeredStarEarned] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  
  // Ensure we have valid numbers
  const safeWeeklyGoal = typeof weeklyGoal === 'number' && !isNaN(weeklyGoal) && weeklyGoal > 0 ? weeklyGoal : 7;
  const safeCompletedDays = typeof completedDays === 'number' && !isNaN(completedDays) ? Math.max(0, completedDays) : 0;
  const safeSize = typeof size === 'number' && !isNaN(size) ? Math.max(40, size) : 60;
  
  // Calculate progress based on the habit's weekly goal (not hardcoded 7)
  const progress = Math.min((safeCompletedDays / safeWeeklyGoal) * 100, 100);
  const isComplete = safeCompletedDays >= safeWeeklyGoal;

  // Calculate SVG parameters
  const radius = (safeSize - 10) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;
  const center = safeSize / 2;

  useEffect(() => {
    // Reset star earned trigger when progress drops below goal
    if (safeCompletedDays < safeWeeklyGoal) {
      setHasTriggeredStarEarned(false);
      setShowConfetti(false);
    }
    
    // If just completed and hasn't triggered yet
    if (safeCompletedDays >= safeWeeklyGoal && !hasTriggeredStarEarned) {
      setHasTriggeredStarEarned(true);
      setShowConfetti(true);
      if (onStarEarned) {
        onStarEarned();
      }
      // Hide confetti after animation
      setTimeout(() => setShowConfetti(false), 3000);
    }

    setPrevCompleted(safeCompletedDays);
  }, [safeCompletedDays, safeWeeklyGoal, hasTriggeredStarEarned, onStarEarned]);

  return (
    <Tooltip 
      title={
        <Box sx={{ p: 1 }}>
          <Typography variant="body1" sx={{ fontWeight: 600 }}>
            {safeCompletedDays} of {safeWeeklyGoal} days complete
          </Typography>
          <Typography variant="body2" sx={{ color: alpha('#fff', 0.7) }}>
            {progress.toFixed(0)}% progress
          </Typography>
          {isComplete && (
            <Typography variant="body2" sx={{ color: color, fontWeight: 600 }}>
              Weekly goal achieved! ⭐ Star earned!
            </Typography>
          )}
        </Box>
      }
      arrow
    >
      <Box 
        sx={{ 
          position: 'relative',
          width: safeSize,
          height: safeSize,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          isolation: 'isolate',
          flexShrink: 0
        }}
      >
        {showConfetti && (
          <Confetti
            width={window.innerWidth}
            height={window.innerHeight}
            recycle={false}
            numberOfPieces={150}
            gravity={0.2}
            colors={[color, '#fff', alpha(color, 0.5)]}
            tweenDuration={3000}
          />
        )}

        {/* Background glow effect */}
        <Box
          component={motion.div}
          animate={{
            scale: isComplete ? [1, 1.1, 1] : 1,
            opacity: isComplete ? [0.5, 0.8, 0.5] : 0.3
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          sx={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${alpha(color, isComplete ? 0.4 : 0.2)} 0%, transparent 70%)`,
            filter: 'blur(8px)',
            zIndex: 0
          }}
        />

        {/* SVG Progress Circle */}
        <svg
          width={`${safeSize}px`}
          height={`${safeSize}px`}
          style={{
            transform: 'rotate(-90deg)',
            position: 'absolute',
            zIndex: 1
          }}
        >
          {/* Background circle */}
          <circle
            cx={`${center}`}
            cy={`${center}`}
            r={`${radius}`}
            fill="none"
            stroke={alpha('#fff', 0.1)}
            strokeWidth="4"
          />
          
          {/* Progress circle */}
          <motion.circle
            cx={`${center}`}
            cy={`${center}`}
            r={`${radius}`}
            fill="none"
            stroke={color}
            strokeWidth="4"
            strokeDasharray={`${circumference}`}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: `${strokeDashoffset}` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            style={{
              filter: `drop-shadow(0 0 4px ${color})`,
            }}
          />
        </svg>

        {/* Loading Overlay */}
        <AnimatePresence>
          {isUpdating && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: alpha('#000', 0.3),
                borderRadius: '50%',
                backdropFilter: 'blur(2px)',
                zIndex: 3
              }}
            >
              <CircularProgress size={safeSize * 0.4} sx={{ color }} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Star Icon */}
        <Box
          component={motion.div}
          animate={isComplete ? {
            scale: [1, 1.2, 1],
            rotate: [0, 360],
          } : {
            scale: 1
          }}
          transition={{
            duration: 1.5,
            ease: "easeInOut",
            repeat: isComplete ? Infinity : 0,
            repeatDelay: 1
          }}
          sx={{
            position: 'relative',
            zIndex: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <StarIcon 
            sx={{ 
              fontSize: safeSize * 0.5,
              color: isComplete ? color : alpha(color, 0.5),
              filter: isComplete ? `drop-shadow(0 0 8px ${color})` : 'none',
              transition: 'all 0.3s ease',
              opacity: isUpdating ? 0.5 : 1
            }} 
          />
        </Box>

        {/* Completion particles */}
        <AnimatePresence>
          {isComplete && !isUpdating && (
            <>
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ 
                    x: 0, 
                    y: 0, 
                    scale: 0,
                    opacity: 0 
                  }}
                  animate={{ 
                    x: Math.cos(i * Math.PI / 4) * safeSize * 0.5,
                    y: Math.sin(i * Math.PI / 4) * safeSize * 0.5,
                    scale: [0, 1, 0],
                    opacity: [0, 1, 0]
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: i * 0.2,
                    ease: "easeOut"
                  }}
                  style={{
                    position: 'absolute',
                    width: 4,
                    height: 4,
                    backgroundColor: color,
                    borderRadius: '50%',
                    zIndex: 1
                  }}
                />
              ))}
            </>
          )}
        </AnimatePresence>
      </Box>
    </Tooltip>
  );
};

export default EnhancedStarCompletion; 