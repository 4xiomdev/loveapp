import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { usePartnerData } from '../../hooks/usePartnerData';
import { db } from '../../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { Box, Typography, CircularProgress, alpha } from '@mui/material';
import { format } from 'date-fns';
import { MOOD_TYPES } from '../../pages/MoodTrackerPage';

const MoodWidget = () => {
  const [loading, setLoading] = useState(false);
  const [myMood, setMyMood] = useState(null);
  const [partnerMood, setPartnerMood] = useState(null);
  const { user, userData } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    let unsubUser = null;
    let unsubPartner = null;
    let isMounted = true;

    const setupSubscriptions = async () => {
      try {
        const today = format(new Date(), 'yyyy-MM-dd');
        const moodRef = collection(db, 'moods');

        // Subscribe to user's mood
        unsubUser = onSnapshot(
          query(
            moodRef,
            where('userId', '==', user.uid),
            where('date', '==', today)
          ),
          (snapshot) => {
            if (!isMounted) return;
            
            if (!snapshot.empty) {
              const moodDoc = snapshot.docs[0].data();
              if (moodDoc.mood && MOOD_TYPES[moodDoc.mood]) {
                setMyMood({
                  id: snapshot.docs[0].id,
                  mood: moodDoc.mood,
                  updatedAt: moodDoc.updatedAt,
                  type: {
                    color: MOOD_TYPES[moodDoc.mood].color,
                    emoji: MOOD_TYPES[moodDoc.mood].emoji
                  }
                });
              } else {
                setMyMood(null);
              }
            } else {
              setMyMood(null);
            }
            setLoading(false);
          }
        );

        // Subscribe to partner's mood if available
        if (userData?.partnerId) {
          unsubPartner = onSnapshot(
            query(
              moodRef,
              where('userId', '==', userData.partnerId),
              where('date', '==', today)
            ),
            (snapshot) => {
              if (!isMounted) return;
              
              if (!snapshot.empty) {
                const moodDoc = snapshot.docs[0].data();
                if (moodDoc.mood && MOOD_TYPES[moodDoc.mood]) {
                  setPartnerMood({
                    id: snapshot.docs[0].id,
                    mood: moodDoc.mood,
                    updatedAt: moodDoc.updatedAt,
                    type: {
                      color: MOOD_TYPES[moodDoc.mood].color,
                      emoji: MOOD_TYPES[moodDoc.mood].emoji
                    }
                  });
                } else {
                  setPartnerMood(null);
                }
              } else {
                setPartnerMood(null);
              }
            }
          );
        }
      } catch (error) {
        console.error('Error setting up mood subscriptions:', error);
        if (isMounted) {
          setMyMood(null);
          setPartnerMood(null);
          setLoading(false);
        }
      }
    };

    setupSubscriptions();

    return () => {
      isMounted = false;
      if (unsubUser) unsubUser();
      if (unsubPartner) unsubPartner();
    };
  }, [user?.uid, userData?.partnerId]);

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Just now';
    try {
      if (timestamp.toDate) {
        return format(timestamp.toDate(), 'h:mm a');
      }
      if (timestamp instanceof Date) {
        return format(timestamp, 'h:mm a');
      }
      return 'Just now';
    } catch (error) {
      console.error('Error formatting timestamp:', error);
      return 'Just now';
    }
  };

  const MoodCard = ({ title, mood, defaultMessage = "Not set yet", isPartner = false }) => {
    const moodColor = mood?.type?.color || '#fff';
    const moodEmoji = mood?.type?.emoji;
    
    return (
      <Box
        onClick={() => navigate('/app/mood')}
        sx={{
          position: 'relative',
          cursor: 'pointer',
          height: '100%',
          borderRadius: '16px',
          overflow: 'hidden',
          background: `linear-gradient(135deg, ${alpha(moodColor, 0.12)} 0%, ${alpha(moodColor, 0.05)} 100%)`,
          backdropFilter: 'blur(10px)',
          border: `1px solid ${alpha(moodColor, 0.2)}`,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            background: `linear-gradient(135deg, ${alpha(moodColor, 0.15)} 0%, ${alpha(moodColor, 0.08)} 100%)`,
            boxShadow: `0 8px 32px ${alpha(moodColor, 0.25)}`,
            transform: 'translateY(-4px)'
          }
        }}
      >
        <Box sx={{ p: { xs: 1.5, sm: 2 } }}>
          {/* Header */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            mb: 1
          }}>
            <Typography 
              variant="subtitle2"
              sx={{
                color: alpha(moodColor, 0.9),
                fontSize: '0.7rem',
                fontWeight: 700,
                letterSpacing: '1.5px',
                textTransform: 'uppercase',
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}
            >
              <Box
                component="span"
                sx={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  bgcolor: moodColor,
                  boxShadow: `0 0 10px ${alpha(moodColor, 0.5)}`
                }}
              />
              {title}
            </Typography>
            
            {mood?.updatedAt && (
              <Typography 
                variant="caption"
                sx={{
                  color: alpha(moodColor, 0.7),
                  fontSize: '0.65rem'
                }}
              >
                {formatTimestamp(mood.updatedAt)}
              </Typography>
            )}
          </Box>

          {/* Content */}
          <Box sx={{ 
            display: 'flex',
            alignItems: 'center',
            gap: 1.5
          }}>
            <Box
              sx={{
                fontSize: { xs: '2rem', sm: '2.5rem' },
                lineHeight: 1,
                filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.15))'
              }}
            >
              {moodEmoji || '😊'}
            </Box>

            <Box sx={{ flex: 1 }}>
              <Typography
                variant="h6"
                sx={{
                  color: moodColor,
                  fontWeight: mood ? 700 : 500,
                  fontSize: { xs: '1rem', sm: '1.1rem' },
                  lineHeight: 1.2,
                  textShadow: mood 
                    ? `0 2px 10px ${alpha(moodColor, 0.3)}`
                    : 'none',
                  mb: 0.5
                }}
              >
                {mood ? mood.mood : defaultMessage}
              </Typography>
              
              {!mood && (
                <Typography
                  variant="caption"
                  sx={{
                    color: alpha(moodColor, 0.7),
                    fontSize: '0.7rem',
                    display: 'block'
                  }}
                >
                  Tap to set your mood
                </Typography>
              )}
            </Box>
          </Box>
        </Box>
      </Box>
    );
  };

  if (loading) {
    return (
      <Box sx={{ 
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <CircularProgress size={24} sx={{ color: alpha('#fff', 0.7) }} />
      </Box>
    );
  }

  return (
    <Box sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column'
    }}>
      <Typography 
        variant="h6" 
        sx={{ 
          mb: 1.5,
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}
      >
        <Box 
          component="span" 
          sx={{ 
            fontSize: '1.4em', 
            transform: 'rotate(-5deg)',
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
          }}
        >
          🌈
        </Box>
        Today's Moods
      </Typography>
      
      <Box sx={{ 
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5
      }}>
        <MoodCard 
          title="MY MOOD" 
          mood={myMood} 
          defaultMessage="How are you feeling?"
        />
        <MoodCard 
          title="PARTNER'S MOOD" 
          mood={partnerMood} 
          defaultMessage="Not set yet"
          isPartner
        />
      </Box>
    </Box>
  );
};

export default MoodWidget; 