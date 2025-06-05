import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { 
  Box, 
  Typography, 
  TextField, 
  Button, 
  CircularProgress, 
  alpha 
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import SendIcon from '@mui/icons-material/Send';

const QuickMessageWidget = () => {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState(null);
  const { user, userData } = useAuth();
  const navigate = useNavigate();

  const handleSend = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user?.uid || !userData?.partnerId || !message.trim()) return;

    try {
      setSending(true);
      setError(null);
      const messagesRef = collection(db, 'messages');
      await addDoc(messagesRef, {
        text: message.trim(),
        senderId: user.uid,
        receiverId: userData.partnerId,
        participants: [user.uid, userData.partnerId],
        createdAt: serverTimestamp(),
        isRead: false,
        type: 'text'
      });
      
      setMessage('');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (error) {
      console.error("Error sending message:", error);
      setError("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  return (
    <Box
      onClick={(e) => {
        e.preventDefault();
        navigate('/app/messages');
      }}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        gap: 1.5,
        cursor: 'pointer',
        '&:hover': {
          '& .MuiTypography-root': {
            color: alpha('#fff', 0.95)
          }
        }
      }}
    >
      <Typography 
        variant="h6" 
        sx={{ 
          fontWeight: 700,
          fontSize: { xs: '1rem', sm: '1.1rem' },
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          mb: 0.5
        }}
      >
        Quick Message
        <motion.span
          animate={{ 
            rotate: [0, -10, 10, -10, 0],
            scale: [1, 1.1, 1, 1.1, 1]
          }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            repeatType: "reverse"
          }}
          style={{ 
            display: "inline-flex",
            fontSize: "1.2em"
          }}
        >
          💌
        </motion.span>
      </Typography>

      {/* Check if user has a partner */}
      {!userData?.partnerId ? (
        <Box sx={{ 
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          color: alpha('#fff', 0.6),
          py: 2
        }}>
          <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
            Connect with a partner to send messages
          </Typography>
        </Box>
      ) : (
        <>
          {/* Message Input Form */}
          <form 
            onSubmit={handleSend}
            onClick={(e) => e.stopPropagation()}
            style={{ 
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
          >
            <Box
              sx={{
                flex: 1,
                position: 'relative',
                borderRadius: '16px',
                overflow: 'hidden',
                backgroundColor: alpha('#fff', 0.05),
                backdropFilter: 'blur(10px)',
                border: `1px solid ${alpha('#fff', 0.1)}`,
                transition: 'all 0.2s ease',
                '&:hover': {
                  backgroundColor: alpha('#fff', 0.08),
                  border: `1px solid ${alpha('#fff', 0.2)}`
                }
              }}
            >
              <TextField
                multiline
                rows={3}
                placeholder="Send a sweet message to your love..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={sending || showSuccess}
                fullWidth
                variant="standard"
                InputProps={{
                  disableUnderline: true,
                  sx: {
                    height: '100%',
                    p: 1.5,
                    color: '#fff',
                    fontSize: '0.9rem',
                    '&::placeholder': {
                      color: alpha('#fff', 0.5),
                      opacity: 1
                    }
                  }
                }}
                sx={{
                  height: '100%',
                  '& .MuiInputBase-root': {
                    height: '100%'
                  }
                }}
              />
            </Box>

            <Button
              type="submit"
              disabled={sending || !message.trim() || showSuccess}
              sx={{
                borderRadius: '12px',
                background: 'linear-gradient(45deg, #ee7b78 30%, #fbc2eb 90%)',
                color: '#fff',
                textTransform: 'none',
                fontWeight: 600,
                py: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1,
                transition: 'all 0.3s ease',
                '&:hover': {
                  background: 'linear-gradient(45deg, #fbc2eb 30%, #ee7b78 90%)',
                  transform: 'translateY(-2px)',
                  boxShadow: `0 4px 20px ${alpha('#ee7b78', 0.3)}`
                },
                '&.Mui-disabled': {
                  background: alpha('#fff', 0.1),
                  color: alpha('#fff', 0.4)
                }
              }}
            >
              {sending ? (
                <CircularProgress size={20} sx={{ color: '#fff' }} />
              ) : (
                <>
                  Send
                  <SendIcon sx={{ fontSize: '1.1rem' }} />
                </>
              )}
            </Button>
          </form>

          {/* Success Message */}
          <AnimatePresence>
            {showSuccess && (
              <motion.div
                initial={{ opacity: 0, scale: 0.5, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.5, y: 20 }}
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  zIndex: 10,
                }}
              >
                <Box
                  sx={{
                    background: 'linear-gradient(45deg, #4CAF50, #45B649)',
                    padding: '10px 20px',
                    borderRadius: '12px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                    backdropFilter: 'blur(10px)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}
                >
                  <motion.div
                    animate={{ 
                      scale: [1, 1.2, 1],
                      rotate: [0, 10, -10, 0]
                    }}
                    transition={{ duration: 0.5 }}
                  >
                    ✨
                  </motion.div>
                  <Typography sx={{ 
                    color: '#fff', 
                    fontWeight: 600,
                    fontSize: '0.9rem'
                  }}>
                    Message Sent!
                  </Typography>
                </Box>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error Message */}
          {error && (
            <Typography 
              color="error" 
              sx={{ 
                fontSize: '0.8rem',
                textAlign: 'center',
                mt: 1
              }}
            >
              {error}
            </Typography>
          )}
        </>
      )}
    </Box>
  );
};

export default QuickMessageWidget; 