import React, { useEffect, useState } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { Box, Typography, alpha } from '@mui/material';

const StarProgress = ({ completedDays, weeklyGoal, color = '#FFD700', onStarEarned }) => {
  const controls = useAnimation();
  const [prevCompleted, setPrevCompleted] = useState(completedDays);
  const progress = Math.min((completedDays / weeklyGoal) * 100, 100);
  const isComplete = completedDays >= weeklyGoal;
  const [hasTriggeredStarEarned, setHasTriggeredStarEarned] = useState(false);

  useEffect(() => {
    const sequence = async () => {
      // Reset the star earned trigger when completedDays changes
      if (completedDays !== weeklyGoal) {
        setHasTriggeredStarEarned(false);
      }

      // If progress increased
      if (completedDays > prevCompleted) {
        await controls.start({
          scale: [1, 1.1, 1],
          transition: { duration: 0.3 }
        });
      }

      // If just completed (exactly at weekly goal)
      if (completedDays === weeklyGoal && !hasTriggeredStarEarned) {
        await controls.start({
          rotate: [0, 360],
          scale: [1, 1.5, 1],
          transition: { 
            duration: 1.5,
            ease: "easeInOut"
          }
        });
        
        // Trigger the star earned callback
        if (onStarEarned) {
          setHasTriggeredStarEarned(true);
          onStarEarned();
        }
      }

      setPrevCompleted(completedDays);
    };

    sequence();
  }, [completedDays, weeklyGoal, controls, prevCompleted, hasTriggeredStarEarned, onStarEarned]);

  // Star path with rounded corners
  const STAR_PATH = "M50,5 C50,5 61,35 61,35 C61,35 95,35 95,35 C95,35 67,55 67,55 C67,55 75,90 75,90 C75,90 50,70 50,70 C50,70 25,90 25,90 C25,90 33,55 33,55 C33,55 5,35 5,35 C5,35 39,35 39,35 C39,35 50,5 50,5";

  return (
    <Box sx={{ 
      position: 'relative',
      width: '200px',
      height: '200px',
      margin: '0 auto',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      {/* Background glow */}
      <Box
        sx={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${alpha(color, 0.3)} 0%, transparent 70%)`,
          filter: 'blur(10px)',
          opacity: isComplete ? 1 : 0.5,
          transition: 'opacity 0.3s ease'
        }}
      />

      {/* Star container */}
      <motion.div
        animate={controls}
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <svg 
          viewBox="0 0 100 100"
          style={{
            width: '80%',
            height: '80%',
            filter: `drop-shadow(0 0 3px ${color})`
          }}
        >
          <defs>
            <linearGradient id="starFill" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset={`${100 - progress}%`} stopColor={alpha(color, 0.1)} />
              <stop offset={`${100 - progress}%`} stopColor={color} />
            </linearGradient>
            
            {/* Glass effect */}
            <filter id="glass">
              <feGaussianBlur in="SourceAlpha" stdDeviation="2" result="blur" />
              <feOffset in="blur" dx="1" dy="1" result="offsetBlur" />
              <feFlood floodColor="white" floodOpacity="0.3" result="offsetColor"/>
              <feComposite in="offsetColor" in2="offsetBlur" operator="in" result="offsetBlurColor"/>
              <feMerge>
                <feMergeNode in="offsetBlurColor"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          {/* Background star */}
          <path
            d={STAR_PATH}
            fill={alpha(color, 0.1)}
            filter="url(#glass)"
          />

          {/* Filled star */}
          <path
            d={STAR_PATH}
            fill="url(#starFill)"
            style={{ transition: 'all 0.3s ease' }}
          />

          {/* Shine effect */}
          <path
            d={STAR_PATH}
            fill="none"
            stroke={alpha('#fff', 0.6)}
            strokeWidth="0.5"
            style={{ transition: 'opacity 0.3s ease' }}
            opacity={progress > 0 ? 1 : 0}
          />
        </svg>

        {/* Progress text */}
        <Typography
          variant="h6"
          sx={{
            position: 'absolute',
            color: '#fff',
            fontWeight: 'bold',
            textShadow: `0 0 5px ${color}`,
            backgroundColor: alpha('#000', 0.3),
            padding: '4px 8px',
            borderRadius: '12px',
            backdropFilter: 'blur(4px)'
          }}
        >
          {completedDays}/{weeklyGoal}
        </Typography>
      </motion.div>
    </Box>
  );
}

export default StarProgress; 