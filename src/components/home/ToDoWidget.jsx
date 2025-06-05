import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  doc, 
  updateDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { 
  Box, 
  Typography, 
  IconButton, 
  CircularProgress, 
  alpha 
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';

const ToDoWidget = () => {
  const { user, userData } = useAuth();
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user?.uid) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const q = query(
      collection(db, "reminders"),
      where("date", ">=", today.toISOString()),
      where("date", "<", new Date(today.getTime() + 24*60*60*1000).toISOString()),
      orderBy("date", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const remindersList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setReminders(remindersList);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching reminders:", error);
      setError("Failed to load today's tasks");
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  const handleToggle = async (reminder) => {
    if (!user?.uid || reminder.owner !== user.uid) return;

    try {
      const reminderRef = doc(db, "reminders", reminder.id);
      await updateDoc(reminderRef, {
        completed: !reminder.completed,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error toggling reminder:", error);
      setError("Failed to update task");
    }
  };

  const ReminderItem = ({ reminder, isPartner }) => (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        p: 1,
        borderRadius: '8px',
        bgcolor: alpha('#fff', reminder.completed ? 0.03 : 0.05),
        border: `1px solid ${alpha('#fff', reminder.completed ? 0.05 : 0.1)}`,
        mb: 1,
        transition: 'all 0.2s ease',
        opacity: isPartner ? 0.8 : 1,
        '&:hover': {
          bgcolor: alpha('#fff', 0.08),
          transform: isPartner ? 'none' : 'translateX(4px)'
        }
      }}
    >
      <IconButton
        onClick={() => !isPartner && handleToggle(reminder)}
        disabled={isPartner}
        size="small"
        sx={{
          color: reminder.completed ? '#4caf50' : alpha('#fff', 0.7),
          '&:hover': {
            color: isPartner ? undefined : '#fff'
          }
        }}
      >
        {reminder.completed ? 
          <CheckCircleIcon sx={{ fontSize: '1.1rem' }} /> : 
          <RadioButtonUncheckedIcon sx={{ fontSize: '1.1rem' }} />
        }
      </IconButton>
      
      <Typography
        sx={{
          flex: 1,
          fontSize: '0.85rem',
          color: reminder.completed ? alpha('#fff', 0.5) : '#fff',
          textDecoration: reminder.completed ? 'line-through' : 'none',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}
      >
        {reminder.title}
      </Typography>
    </Box>
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
        <CircularProgress size={24} sx={{ color: alpha('#fff', 0.7) }} />
      </Box>
    );
  }

  const myReminders = reminders.filter(r => r.owner === user.uid);
  const partnerReminders = reminders.filter(r => r.owner === userData?.partnerId);

  return (
    <Box 
      onClick={(e) => {
        e.preventDefault();
        navigate('/app/reminders');
      }}
      sx={{ 
        height: '100%',
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
          mb: 1.5,
          fontWeight: 700,
          fontSize: { xs: '1rem', sm: '1.1rem' },
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}
      >
        Today's Tasks
        <Box 
          component="span" 
          sx={{ 
            fontSize: '1.2em',
            transform: 'translateY(-1px)'
          }}
        >
          📋
        </Box>
      </Typography>

      <Box sx={{ 
        height: 'calc(100% - 40px)',
        overflow: 'auto',
        pr: 1,
        mr: -1,
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
      }}>
        {myReminders.length === 0 && partnerReminders.length === 0 ? (
          <Box sx={{ 
            textAlign: 'center', 
            color: alpha('#fff', 0.5),
            py: 2
          }}>
            <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
              No tasks for today
            </Typography>
          </Box>
        ) : (
          <>
            {myReminders.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography 
                  variant="subtitle2" 
                  sx={{ 
                    mb: 1,
                    color: alpha('#fff', 0.7),
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase'
                  }}
                >
                  My Tasks
                </Typography>
                {myReminders.map(reminder => (
                  <ReminderItem 
                    key={reminder.id} 
                    reminder={reminder}
                    isPartner={false}
                  />
                ))}
              </Box>
            )}

            {partnerReminders.length > 0 && (
              <Box>
                <Typography 
                  variant="subtitle2" 
                  sx={{ 
                    mb: 1,
                    color: alpha('#fff', 0.7),
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase'
                  }}
                >
                  Partner's Tasks
                </Typography>
                {partnerReminders.map(reminder => (
                  <ReminderItem 
                    key={reminder.id} 
                    reminder={reminder}
                    isPartner={true}
                  />
                ))}
              </Box>
            )}
          </>
        )}
      </Box>

      {error && (
        <Typography 
          color="error" 
          sx={{ 
            mt: 2,
            fontSize: '0.8rem',
            textAlign: 'center'
          }}
        >
          {error}
        </Typography>
      )}
    </Box>
  );
};

export default ToDoWidget; 