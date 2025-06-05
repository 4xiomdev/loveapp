import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useGoogleCalendar } from '../../hooks/useGoogleCalendar';
import { 
  Box, 
  Typography, 
  Button, 
  CircularProgress, 
  alpha,
  Chip
} from '@mui/material';
import { format } from 'date-fns';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import SyncIcon from '@mui/icons-material/Sync';
import EventIcon from '@mui/icons-material/Event';

const CalendarWidget = () => {
  const navigate = useNavigate();
  const { 
    events, 
    isAuthenticated, 
    loading, 
    error, 
    login, 
    refreshEvents, 
    clearError 
  } = useGoogleCalendar();

  const formatEventTime = (event) => {
    try {
      if (event.start?.dateTime) {
        return format(new Date(event.start.dateTime), 'MMM d, h:mm a');
      } else if (event.start?.date) {
        return format(new Date(event.start.date), 'MMM d');
      }
      return 'No date';
    } catch (error) {
      console.error('Error formatting event time:', error);
      return 'Invalid date';
    }
  };

  return (
    <Box 
      onClick={(e) => {
        e.preventDefault();
        navigate('/app/schedule');
      }}
      sx={{ 
        height: '100%',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
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
        <CalendarMonthIcon sx={{ fontSize: '1.2em' }} />
        Upcoming Events
      </Typography>

      {!isAuthenticated ? (
        <Box sx={{ 
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
          textAlign: 'center'
        }}>
          <Typography 
            variant="body2" 
            sx={{ 
              color: alpha('#fff', 0.7),
              fontSize: '0.85rem'
            }}
          >
            Connect Google Calendar to see your upcoming events
          </Typography>
          <Button
            onClick={(e) => {
              e.stopPropagation();
              login();
            }}
            variant="outlined"
            size="small"
            sx={{
              borderColor: alpha('#fff', 0.3),
              color: '#fff',
              textTransform: 'none',
              borderRadius: '8px',
              fontSize: '0.8rem',
              '&:hover': {
                borderColor: '#fff',
                bgcolor: alpha('#fff', 0.1)
              }
            }}
          >
            Connect Calendar
          </Button>
        </Box>
      ) : (
        <Box sx={{ 
          flex: 1,
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Refresh Button */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 1
          }}>
            <Chip
              label="Connected"
              size="small"
              sx={{
                bgcolor: alpha('#4CAF50', 0.2),
                color: '#4CAF50',
                fontSize: '0.7rem',
                height: '24px'
              }}
            />
            <Button
              onClick={(e) => {
                e.stopPropagation();
                refreshEvents();
              }}
              size="small"
              disabled={loading}
              sx={{
                minWidth: 'auto',
                p: 0.5,
                color: alpha('#fff', 0.7),
                '&:hover': {
                  color: '#fff',
                  bgcolor: alpha('#fff', 0.1)
                }
              }}
            >
              <SyncIcon sx={{ fontSize: '1rem' }} />
            </Button>
          </Box>

          {/* Events List */}
          <Box sx={{ 
            flex: 1,
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
            {loading ? (
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center',
                py: 2
              }}>
                <CircularProgress size={24} sx={{ color: alpha('#fff', 0.7) }} />
              </Box>
            ) : error ? (
              <Box sx={{ 
                textAlign: 'center',
                py: 2
              }}>
                <Typography 
                  variant="body2" 
                  color="error" 
                  sx={{ fontSize: '0.8rem', mb: 1 }}
                >
                  {error}
                </Typography>
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    clearError();
                    refreshEvents();
                  }}
                  size="small"
                  sx={{
                    color: alpha('#fff', 0.7),
                    fontSize: '0.7rem',
                    textTransform: 'none'
                  }}
                >
                  Try Again
                </Button>
              </Box>
            ) : events.length === 0 ? (
              <Box sx={{ 
                textAlign: 'center',
                py: 2,
                color: alpha('#fff', 0.5)
              }}>
                <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                  No upcoming events
                </Typography>
              </Box>
            ) : (
              events.slice(0, 3).map((event, index) => (
                <Box
                  key={event.id || index}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    p: 1,
                    borderRadius: '8px',
                    bgcolor: alpha('#fff', 0.05),
                    border: `1px solid ${alpha('#fff', 0.1)}`,
                    mb: 1,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      bgcolor: alpha('#fff', 0.08),
                      transform: 'translateX(4px)'
                    }
                  }}
                >
                  <EventIcon 
                    sx={{ 
                      fontSize: '1rem',
                      color: alpha('#fff', 0.7)
                    }} 
                  />
                  <Box sx={{ flex: 1, overflow: 'hidden' }}>
                    <Typography
                      sx={{
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        color: '#fff',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        mb: 0.25
                      }}
                    >
                      {event.summary || 'Untitled Event'}
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: '0.7rem',
                        color: alpha('#fff', 0.6),
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {formatEventTime(event)}
                    </Typography>
                  </Box>
                </Box>
              ))
            )}
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default CalendarWidget; 