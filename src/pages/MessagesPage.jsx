// src/pages/MessagesPage.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { usePartnerData } from '../hooks/usePartnerData';
import { db } from "../firebase";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  serverTimestamp,
  addDoc,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import {
  Box,
  Typography,
  TextField,
  IconButton,
  alpha,
  Avatar,
  Skeleton,
  useMediaQuery,
  useTheme,
  Alert,
} from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import EmojiPicker from 'emoji-picker-react';
import InsertEmoticonIcon from '@mui/icons-material/InsertEmoticon';
import SendIcon from "@mui/icons-material/Send";
import KeyboardBackspaceIcon from '@mui/icons-material/KeyboardBackspace';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import { styled } from "@mui/material/styles";
import NoPartnerState from '../components/NoPartnerState';

// Styled components
const ChatContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  height: '100vh',
  position: 'relative',
  backgroundColor: 'transparent',
  [theme.breakpoints.up('sm')]: {
    height: 'calc(100vh - 48px)',
    maxWidth: '100%',
    margin: '0 auto',
  },
  [theme.breakpoints.up('md')]: {
    maxWidth: '900px',
  },
}));

const Header = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(2),
  backdropFilter: 'blur(20px)',
  backgroundColor: alpha('#fff', 0.03),
  borderBottom: `1px solid ${alpha('#fff', 0.1)}`,
  position: 'sticky',
  top: 0,
  zIndex: 10,
}));

const MessagesList = styled(Box)(({ theme }) => ({
  flex: 1,
  overflowY: 'auto',
  padding: theme.spacing(2),
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1),
  '&::-webkit-scrollbar': {
    width: '4px',
  },
  '&::-webkit-scrollbar-track': {
    background: 'transparent',
  },
  '&::-webkit-scrollbar-thumb': {
    background: alpha('#fff', 0.2),
    borderRadius: '4px',
  },
}));

const InputContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  paddingBottom: theme.spacing(4),
  backdropFilter: 'blur(20px)',
  backgroundColor: alpha('#fff', 0.03),
  borderTop: `1px solid ${alpha('#fff', 0.1)}`,
  position: 'sticky',
  bottom: 0,
}));

const ChatInput = styled(TextField)({
  '& .MuiOutlinedInput-root': {
    backgroundColor: alpha('#fff', 0.05),
    borderRadius: '24px',
    '& fieldset': {
      borderColor: alpha('#fff', 0.2),
      borderRadius: '24px',
    },
    '&:hover fieldset': {
      borderColor: alpha('#ee7b78', 0.5),
    },
    '&.Mui-focused fieldset': {
      borderColor: '#ee7b78',
    },
  },
  '& .MuiOutlinedInput-input': {
    color: '#fff',
    padding: '14px 20px',
    fontSize: '0.95rem',
    lineHeight: '1.4',
    '&::placeholder': {
      color: alpha('#fff', 0.5),
      opacity: 1,
    },
  },
});

const MessageBubble = ({ message, isMe, showTail = true, isLastInGroup = true }) => {
  const { text, createdAt, isRead } = message;
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: isMe ? "flex-end" : "flex-start",
        mb: isLastInGroup ? 1 : 0.3,
        position: 'relative',
      }}
    >
      <Box
        sx={{
          p: 2,
          maxWidth: isMobile ? "85%" : "70%",
          borderRadius: showTail
            ? isMe 
              ? "20px 20px 4px 20px"
              : "20px 20px 20px 4px"
            : "20px",
          background: isMe 
            ? 'linear-gradient(135deg, #ee7b78 30%, #fbc2eb 90%)'
            : alpha('#fff', 0.1),
          color: '#fff',
          backdropFilter: 'blur(10px)',
          border: `1px solid ${alpha(isMe ? '#ee7b78' : '#fff', 0.1)}`,
          transition: 'all 0.3s ease',
          position: 'relative',
          '&:hover': {
            transform: 'translateY(-1px)',
            boxShadow: `0 4px 20px ${alpha('#000', 0.15)}`,
            background: isMe 
              ? 'linear-gradient(135deg, #ee7b78 40%, #fbc2eb 100%)'
              : alpha('#fff', 0.15),
          }
        }}
      >
        <Typography 
          variant="body1"
          sx={{
            fontSize: '0.95rem',
            lineHeight: 1.4,
            wordBreak: 'break-word',
          }}
        >
          {text}
        </Typography>

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 0.5,
            mt: 0.5,
          }}
        >
          <Typography
            variant="caption"
            sx={{
              color: isMe ? alpha('#fff', 0.7) : alpha('#fff', 0.5),
              fontSize: '0.7rem',
            }}
          >
            {createdAt?.seconds
              ? new Date(createdAt.seconds * 1000).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : ""}
          </Typography>
          
          {isMe && (
            <Box 
              component={motion.div}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.2 }}
            >
              <DoneAllIcon 
                sx={{ 
                  fontSize: '0.9rem',
                  color: isRead ? '#4CAF50' : alpha('#fff', 0.5),
                }} 
              />
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default function MessagesPage() {
  const { user, userData } = useAuth();
  const { partnerData, loading: partnerLoading, error: partnerError, isSoloMode } = usePartnerData();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // State
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [typing, setTyping] = useState(false);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  
  // Refs
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const messagesListRef = useRef(null);

  // Group messages by date
  const groupedMessages = messages.reduce((groups, message) => {
    const date = message.createdAt?.seconds 
      ? new Date(message.createdAt.seconds * 1000).toLocaleDateString()
      : 'Pending';
    
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {});

  // Handle scroll
  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    const isBottom = Math.abs(scrollHeight - clientHeight - scrollTop) < 1;
    setIsAtBottom(isBottom);
  };

  // Add back the message subscription and typing status
  useEffect(() => {
    let unsubMessages = null;
    let unsubTyping = null;
    let isMounted = true;

    const setupSubscriptions = async () => {
      try {
        // Early return if not ready or in solo mode
        if (!user?.uid || !userData?.partnerId || isSoloMode) {
          if (isMounted) {
            setLoading(false);
          }
          return;
        }

        // Subscribe to messages between the user and their partner
        const q = query(
          collection(db, 'messages'),
          where('participants', 'array-contains', user.uid),
          orderBy('createdAt', 'asc')
        );

        unsubMessages = onSnapshot(q, (snapshot) => {
          if (!isMounted) return;
          const newMessages = snapshot.docs
            .map(doc => ({
              id: doc.id,
              ...doc.data()
            }))
            .filter(msg => 
              msg.participants.includes(userData.partnerId)
            );
          setMessages(newMessages);
          setLoading(false);

          // Mark received messages as read
          const batch = writeBatch(db);
          let hasUnread = false;
          
          newMessages.forEach(msg => {
            if (msg.senderId === userData.partnerId && !msg.isRead) {
              hasUnread = true;
              const msgRef = doc(db, 'messages', msg.id);
              batch.update(msgRef, { 
                isRead: true,
                updatedAt: serverTimestamp()
              });
            }
          });

          if (hasUnread) {
            batch.commit().catch(err => {
              console.error('Error marking messages as read:', err);
            });
          }
        }, (err) => {
          if (!isMounted) return;
          console.error('Error fetching messages:', err);
          setError('Failed to load messages');
          setLoading(false);
        });

        // Subscribe to partner's typing status
        if (userData.partnerId) {
          const partnerRef = doc(db, 'users', userData.partnerId);
          unsubTyping = onSnapshot(partnerRef, (doc) => {
            if (!isMounted) return;
            const data = doc.data();
            setPartnerTyping(data?.typing?.isTyping && Date.now() - data.typing.lastTyped < 5000);
          });
        }
      } catch (err) {
        if (isMounted) {
          console.error('Error setting up subscriptions:', err);
          setError('Failed to set up message subscriptions');
          setLoading(false);
        }
      }
    };

    setupSubscriptions();

    return () => {
      isMounted = false;
      if (unsubMessages) unsubMessages();
      if (unsubTyping) unsubTyping();
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [user?.uid, userData?.partnerId, isSoloMode]);

  // Add back typing status handler
  const handleTyping = async () => {
    if (!user?.uid || !userData?.partnerId) return;

    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        typing: {
          isTyping: true,
          lastTyped: serverTimestamp()
        }
      });

      // Clear typing status after 5 seconds
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(async () => {
        await updateDoc(userRef, {
          typing: {
            isTyping: false,
            lastTyped: serverTimestamp()
          }
        });
      }, 5000);
    } catch (err) {
      console.error('Error updating typing status:', err);
    }
  };

  // Update the ChatInput onChange to include typing status
  const handleMessageChange = (e) => {
    setNewMessage(e.target.value);
    handleTyping();
  };

  // Update the handleSend function to include proper error handling and cleanup
  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !user?.uid || !userData?.partnerId) return;

    try {
      setSending(true);

      // Clear typing status when sending
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        typing: {
          isTyping: false,
          lastTyped: serverTimestamp()
        }
      });

      await addDoc(collection(db, 'messages'), {
        text: newMessage.trim(),
        type: 'text',
        senderId: user.uid,
        receiverId: userData.partnerId,
        participants: [user.uid, userData.partnerId],
        createdAt: serverTimestamp(),
        isRead: false
      });

      setNewMessage('');
      
      // Scroll to bottom after sending
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (error) {
      console.error("Error sending message:", error);
      setError("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  // Render functions
  const renderDateDivider = (date) => (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        my: 2,
      }}
    >
      <Typography
        variant="caption"
        sx={{
          color: alpha('#fff', 0.5),
          fontSize: '0.8rem',
          px: 2,
          py: 0.5,
          borderRadius: '12px',
          backdropFilter: 'blur(10px)',
          backgroundColor: alpha('#fff', 0.1),
        }}
      >
        {date === new Date().toLocaleDateString() ? 'Today' : date}
      </Typography>
    </Box>
  );

  const renderTypingIndicator = () => (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        p: 1,
        pl: 2,
      }}
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.2 }}
      >
        <Box
          sx={{
            display: 'flex',
            gap: 0.5,
            alignItems: 'center',
          }}
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{
                y: [0, -5, 0],
              }}
              transition={{
                duration: 0.5,
                repeat: Infinity,
                delay: i * 0.1,
              }}
            >
              <Box
                sx={{
                  width: 4,
                  height: 4,
                  borderRadius: '50%',
                  backgroundColor: alpha('#fff', 0.5),
                }}
              />
            </motion.div>
          ))}
        </Box>
      </motion.div>
      <Typography
        variant="caption"
        sx={{
          color: alpha('#fff', 0.5),
          fontSize: '0.8rem',
        }}
      >
        {partnerData?.displayName} is typing...
      </Typography>
    </Box>
  );

  // If loading, show skeleton
  if (loading) {
    return (
      <ChatContainer>
        <Header>
          <Skeleton 
            variant="circular" 
            width={40} 
            height={40} 
            sx={{ bgcolor: alpha('#fff', 0.1) }} 
          />
          <Box sx={{ ml: 2, flex: 1 }}>
            <Skeleton 
              variant="text" 
              width={120} 
              sx={{ bgcolor: alpha('#fff', 0.1) }} 
            />
          </Box>
        </Header>
        <MessagesList>
          {[...Array(6)].map((_, i) => (
            <Box
              key={i}
              sx={{
                display: "flex",
                justifyContent: i % 2 === 0 ? "flex-start" : "flex-end",
                mb: 1,
              }}
            >
              <Skeleton
                variant="rounded"
                width={200}
                height={60}
                sx={{ 
                  borderRadius: '20px',
                  bgcolor: alpha('#fff', 0.1)
                }}
              />
            </Box>
          ))}
        </MessagesList>
        <InputContainer>
          <Skeleton 
            variant="rounded" 
            height={50}
            sx={{ 
              borderRadius: '24px',
              bgcolor: alpha('#fff', 0.1)
            }}
          />
        </InputContainer>
      </ChatContainer>
    );
  }

  // If no partner, show no partner state
  if (isSoloMode || !userData?.partnerId) {
    return <NoPartnerState />;
  }

  return (
    <ChatContainer>
      {/* Header */}
      <Header>
        <IconButton 
          onClick={() => navigate(-1)}
          sx={{ 
            mr: 1,
            color: '#fff',
            display: { xs: 'flex', sm: 'none' }
          }}
        >
          <KeyboardBackspaceIcon />
        </IconButton>
        
        <Avatar 
          src={partnerData?.photoURL}
          alt={partnerData?.displayName}
          sx={{ 
            width: 40, 
            height: 40,
            border: `2px solid ${alpha('#fff', 0.2)}`
          }}
        />
        
        <Box sx={{ ml: 2, flex: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            {partnerData?.displayName}
          </Typography>
          {partnerTyping && (
            <Typography 
              variant="caption" 
              sx={{ 
                color: alpha('#fff', 0.7),
                display: 'flex',
                alignItems: 'center',
                gap: 0.5
              }}
            >
              typing...
            </Typography>
          )}
        </Box>
      </Header>

      {/* Messages List */}
      <MessagesList
        ref={messagesListRef}
        onScroll={handleScroll}
      >
        {/* Messages */}
        {Object.entries(groupedMessages).map(([date, dateMessages]) => (
          <React.Fragment key={date}>
            {renderDateDivider(date)}
            {dateMessages.map((message, index) => {
              const isLastInGroup = index === dateMessages.length - 1 ||
                dateMessages[index + 1]?.senderId !== message.senderId;
              
              return (
                <MessageBubble
                  key={message.id}
                  message={message}
                  isMe={message.senderId === user.uid}
                  showTail={isLastInGroup}
                  isLastInGroup={isLastInGroup}
                />
              );
            })}
          </React.Fragment>
        ))}

        {/* Typing indicator */}
        {partnerTyping && renderTypingIndicator()}

        {/* Invisible element for scroll to bottom */}
        <div ref={messagesEndRef} />
      </MessagesList>

      {/* Input Area */}
      <InputContainer>
        <form onSubmit={handleSend}>
          <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1 }}>
            <IconButton
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              sx={{ 
                color: alpha('#fff', 0.7),
                '&:hover': { color: '#fff' }
              }}
            >
              <InsertEmoticonIcon />
            </IconButton>

            <Box sx={{ position: 'relative', flex: 1 }}>
              <ChatInput
                multiline
                maxRows={4}
                placeholder="Type a message..."
                value={newMessage}
                onChange={handleMessageChange}
                disabled={sending}
                fullWidth
              />
              
              {/* Emoji picker popover */}
              <AnimatePresence>
                {showEmojiPicker && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    style={{
                      position: 'absolute',
                      bottom: '100%',
                      left: 0,
                      marginBottom: '8px',
                      zIndex: 100,
                    }}
                  >
                    <Box
                      sx={{
                        bgcolor: alpha('#000', 0.9),
                        backdropFilter: 'blur(20px)',
                        border: `1px solid ${alpha('#fff', 0.1)}`,
                        borderRadius: '12px',
                        overflow: 'hidden'
                      }}
                    >
                      <EmojiPicker
                        onEmojiClick={(emojiData) => {
                          setNewMessage((prev) => prev + emojiData.emoji);
                          setShowEmojiPicker(false);
                        }}
                        width={isMobile ? 300 : 350}
                        height={400}
                        theme="dark"
                      />
                    </Box>
                  </motion.div>
                )}
              </AnimatePresence>
            </Box>

            <IconButton
              type="submit"
              disabled={sending || !newMessage.trim()}
              sx={{
                bgcolor: sending ? alpha('#fff', 0.1) : '#ee7b78',
                color: '#fff',
                width: 40,
                height: 40,
                '&:hover': {
                  bgcolor: sending ? alpha('#fff', 0.1) : alpha('#ee7b78', 0.8),
                },
                '&.Mui-disabled': {
                  bgcolor: alpha('#fff', 0.1),
                  color: alpha('#fff', 0.3),
                },
              }}
            >
              {sending ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <SendIcon />
                </motion.div>
              ) : (
                <SendIcon />
              )}
            </IconButton>
          </Box>
        </form>
      </InputContainer>

      {/* Error alert */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            style={{
              position: 'fixed',
              bottom: 20,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 1000,
            }}
          >
            <Alert 
              severity="error"
              onClose={() => setError(null)}
              sx={{
                bgcolor: alpha('#f44336', 0.1),
                backdropFilter: 'blur(10px)',
                color: '#fff',
                '& .MuiAlert-icon': {
                  color: '#f44336'
                }
              }}
            >
              {error}
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>
    </ChatContainer>
  );
}
