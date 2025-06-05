import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Box, Typography, Paper, Button, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, alpha, Alert, Tooltip, Switch, FormControlLabel, Tabs, Tab, CircularProgress, Snackbar, Grid, ToggleButtonGroup, ToggleButton, Drawer, Divider, Backdrop, useTheme } from '@mui/material';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './calendar-styles.css';
import { format, parse, startOfWeek, getDay, addMinutes } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, doc, serverTimestamp, orderBy, addDoc, updateDoc, deleteDoc, getDoc, getDocs, writeBatch } from 'firebase/firestore';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import GoogleIcon from '@mui/icons-material/Google';
import { motion } from 'framer-motion';
import { usePartnerData } from '../hooks/usePartnerData';
import { useGoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import SyncIcon from '@mui/icons-material/Sync';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import PersonIcon from '@mui/icons-material/Person';
import ImageIcon from '@mui/icons-material/Image';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import CalendarViewMonthIcon from '@mui/icons-material/CalendarViewMonth';
import CalendarViewWeekIcon from '@mui/icons-material/CalendarViewWeek';
import CalendarViewDayIcon from '@mui/icons-material/CalendarViewDay';
import ViewAgendaIcon from '@mui/icons-material/ViewAgenda';
import ErrorBoundary from '../components/ErrorBoundary';
import EventForm from '../components/EventForm';
import EventExtractor from '../components/EventExtractor';
import MobileFallbackView from '../components/MobileFallbackView';
import TodayIcon from '@mui/icons-material/Today';
import ViewDayIcon from '@mui/icons-material/ViewDay';
import ViewWeekIcon from '@mui/icons-material/ViewWeek';
import ViewComfyIcon from '@mui/icons-material/ViewComfy';

// Setup the localizer for react-big-calendar
const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

// Custom event styling for React Big Calendar
const eventStyleGetter = (event, start, end, isSelected) => {
  const isPartnerEvent = event.isPartnerEvent;
  
  return {
    style: {
      backgroundColor: isPartnerEvent ? '#e74c3c' : '#9b59b6',
      borderRadius: '8px',
      opacity: 0.9,
      color: 'white',
      border: '0px',
      display: 'block',
      padding: '4px 8px',
      boxShadow: `0 2px 8px ${alpha(isPartnerEvent ? '#e74c3c' : '#9b59b6', 0.3)}`,
      transition: 'all 0.2s ease',
    }
  };
};

// Custom toolbar for React Big Calendar
const CustomToolbar = (toolbar) => {
  const { isMobile } = useResponsive();
  
  const goToBack = () => {
    toolbar.onNavigate('PREV');
  };

  const goToNext = () => {
    toolbar.onNavigate('NEXT');
  };

  const goToCurrent = () => {
    toolbar.onNavigate('TODAY');
  };

  const viewNames = {
    month: 'Month',
    week: 'Week',
    day: 'Day',
    agenda: 'Agenda'
  };

  const viewIconsMap = {
    month: <ViewComfyIcon />,
    week: <ViewWeekIcon />,
    day: <ViewDayIcon />,
    agenda: <TodayIcon />
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center',
      mb: 2,
      flexDirection: { xs: 'column', sm: 'row' },
      gap: { xs: 1, sm: 0 }
    }}>
      <Box sx={{ display: 'flex', gap: 1 }}>
        <Button 
          onClick={goToBack}
          variant="contained"
          sx={{ 
            bgcolor: alpha('#9b59b6', 0.2),
            '&:hover': { bgcolor: alpha('#9b59b6', 0.3) },
            color: '#fff'
          }}
        >
          Back
        </Button>
        <Button 
          onClick={goToCurrent}
          variant="contained"
          sx={{ 
            bgcolor: alpha('#9b59b6', 0.2),
            '&:hover': { bgcolor: alpha('#9b59b6', 0.3) },
            color: '#fff'
          }}
        >
          Today
        </Button>
        <Button 
          onClick={goToNext}
          variant="contained"
          sx={{ 
            bgcolor: alpha('#9b59b6', 0.2),
            '&:hover': { bgcolor: alpha('#9b59b6', 0.3) },
            color: '#fff'
          }}
        >
          Next
        </Button>
      </Box>
      
      <Typography variant="h6" sx={{ color: '#fff', fontWeight: 'bold' }}>
        {toolbar.label}
      </Typography>
      
      <Box sx={{ display: 'flex', gap: 1 }}>
        {toolbar.views.map(view => (
          <Button 
            key={view}
            onClick={() => toolbar.onView(view)}
            variant={view === toolbar.view ? "contained" : "outlined"}
            sx={{ 
              bgcolor: view === toolbar.view ? alpha('#9b59b6', 0.4) : 'transparent',
              borderColor: alpha('#9b59b6', 0.3),
              '&:hover': { bgcolor: alpha('#9b59b6', 0.3) },
              color: '#fff'
            }}
          >
            {viewNames[view]}
          </Button>
        ))}
      </Box>
    </Box>
  );
};

// Create a simple SyncStatus component near the top of your file
const SyncStatus = ({ isConnected, lastSynced }) => {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 2 }}>
      <Typography variant="caption" sx={{ color: isConnected ? 'success.main' : 'text.secondary' }}>
        {isConnected ? 'Connected' : 'Not connected'}
        {lastSynced && isConnected ? ` · Last synced ${new Date(lastSynced).toLocaleTimeString()}` : ''}
      </Typography>
      {isConnected ? (
        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'success.main' }} />
      ) : (
        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'text.disabled' }} />
      )}
    </Box>
  );
};

// Create a new MobileCalendarWrapper component to handle the mobile view specifically
const MobileCalendarWrapper = ({ events, title, onEventClick }) => {
  const { isMobile } = useResponsive();
  
  if (isMobile) {
    // On mobile, use a list view instead of the problematic calendar view
    return (
      <Paper sx={{ 
        p: 2,
        borderRadius: 2,
        bgcolor: alpha('#121212', 0.7),
        backdropFilter: 'blur(10px)',
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <Typography variant="h6" sx={{ mb: 2 }}>{title}</Typography>
        
        {events.length === 0 ? (
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            height: '100%',
            opacity: 0.7 
          }}>
            <Typography>No events to display</Typography>
          </Box>
        ) : (
          <Box sx={{ 
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
            flex: 1
          }}>
            {events.map(event => (
              <Box 
                key={event.id} 
                onClick={() => onEventClick(event)}
                sx={{
                  p: 1.5,
                  borderRadius: 1,
                  bgcolor: alpha(event.isPartnerEvent ? '#e74c3c' : '#9b59b6', 0.3),
                  border: `1px solid ${alpha(event.isPartnerEvent ? '#e74c3c' : '#9b59b6', 0.5)}`,
                  cursor: 'pointer',
                  '&:hover': {
                    bgcolor: alpha(event.isPartnerEvent ? '#e74c3c' : '#9b59b6', 0.4),
                  }
                }}
              >
                <Typography variant="subtitle2">{event.title || 'Untitled Event'}</Typography>
                <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
                  {format(new Date(event.start), 'PPp')} - {format(new Date(event.end), 'PPp')}
                </Typography>
                {event.location && (
                  <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                    <LocationOnIcon fontSize="inherit" sx={{ mr: 0.5 }} />
                    {event.location}
                  </Typography>
                )}
              </Box>
            ))}
          </Box>
        )}
      </Paper>
    );
  }
  
  // For non-mobile, return null and let the parent handle rendering
  return null;
};

// Update the renderCalendarWrapper function to handle the mobile case
const renderCalendarWrapper = (events, isPartner, title, onEventClick) => {
  const { isMobile } = useResponsive();
  
  // Ensure all events have required properties
  const safeEvents = events?.map(event => ({
    title: event?.title || 'Untitled Event',
    start: event?.start instanceof Date ? event.start : new Date(event?.start || new Date()),
    end: event?.end instanceof Date ? event.end : new Date(event?.end || new Date()),
    id: event?.id || Math.random().toString(36).substring(2),
    location: event?.location || '',
    description: event?.description || '',
    isAllDay: event?.isAllDay || false,
    isPartnerEvent: isPartner || event?.isPartnerEvent || false
  })) || [];
  
  // On mobile, use the mobile-friendly component
  if (isMobile) {
    return <MobileCalendarWrapper events={safeEvents} title={title} onEventClick={onEventClick} />;
  }
  
  // On desktop, use the Calendar component with proper event validation
  return (
    <Paper sx={{ 
      p: { xs: 0.5, sm: 1, md: 2 },
      borderRadius: 2,
      bgcolor: alpha('#121212', 0.7),
      backdropFilter: 'blur(10px)',
      height: '100%'
    }}>
      <Typography variant="h6" sx={{ mb: 2, px: 2 }}>{title}</Typography>
      
      <Calendar
        localizer={localizer}
        events={safeEvents}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 'calc(100% - 40px)' }}
        eventPropGetter={eventStyleGetter}
        onSelectEvent={onEventClick}
        components={{
          toolbar: CustomToolbar,
          // Add other custom components as needed
        }}
      />
    </Paper>
  );
};

// Add this function to properly format and display calendar views
const CalendarViewWrapper = ({ view, events, onEventClick, isPartner }) => {
  // Create a reference to the calendar
  const calendarRef = useRef(null);
  
  useEffect(() => {
    // Force re-render of the calendar when view changes
    if (calendarRef.current) {
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 200);
    }
  }, [view]);
  
  return (
    <Calendar
      ref={calendarRef}
      localizer={localizer}
      events={events}
      startAccessor="start"
      endAccessor="end"
      style={{ height: '100%' }}
      eventPropGetter={event => ({
        style: {
          backgroundColor: event.isPartnerEvent || isPartner ? '#e74c3c' : '#9b59b6',
          color: 'white',
          borderRadius: '4px',
          border: 'none',
          padding: '2px 4px',
          fontSize: view === 'month' ? '0.7rem' : '0.85rem',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          opacity: 1,
          fontWeight: 'bold',
          zIndex: 10,
        }
      })}
      onSelectEvent={onEventClick}
      defaultView={view}
      view={view}
      popup={true}
      showMultiDayTimes={true}
      toolbar={false}
    />
  );
};

// Update the EnhancedCalendarView component to properly handle events
const EnhancedCalendarView = ({ events = [], isPartner = false, title, onEventClick, view: initialView = 'month' }) => {
  const [calendarView, setCalendarView] = useState(initialView);
  const { isMobile } = useResponsive();
  const theme = useTheme();
  const calendarRef = useRef(null);
  
  // Force re-render when view changes
  useEffect(() => {
    if (calendarRef.current) {
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 100);
    }
  }, [calendarView, events]);
  
  // Debug log to check events
  useEffect(() => {

  }, [events, title]);
  
  // Convert events to the format expected by react-big-calendar
  const sanitizedEvents = useMemo(() => {
    return events.map(event => {
      let startDate = event?.start;
      let endDate = event?.end;
      
      // Handle Firebase Timestamp objects
      if (startDate && typeof startDate.seconds === 'number') {
        startDate = new Date(startDate.seconds * 1000);
      } else if (startDate && typeof startDate === 'string') {
        startDate = new Date(startDate);
      } else if (!(startDate instanceof Date) || isNaN(startDate.getTime())) {
        startDate = new Date();
      }
      
      if (endDate && typeof endDate.seconds === 'number') {
        endDate = new Date(endDate.seconds * 1000);
      } else if (endDate && typeof endDate === 'string') {
        endDate = new Date(endDate);
      } else if (!(endDate instanceof Date) || isNaN(endDate.getTime())) {
        endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
      }
      
      return {
        id: event?.id || Math.random().toString(36).substr(2, 9),
        title: event?.title || 'Untitled Event',
        start: startDate,
        end: endDate,
        isPartnerEvent: isPartner || event?.isPartnerEvent || false,
        allDay: event?.allDay || false,
        location: event?.location || '',
        description: event?.description || ''
      };
    });
  }, [events, isPartner]);
  
  // Debug log to check sanitized events
  useEffect(() => {
    
  }, [sanitizedEvents, title]);
  
  if (isMobile) {
    return <MobileFallbackView events={sanitizedEvents} title={title} onEventClick={onEventClick} />;
  }
  
  return (
    <Paper sx={{ 
      p: { xs: 0.5, sm: 1, md: 2 },
      borderRadius: 2,
      bgcolor: isPartner ? alpha('#3a3a3a', 0.8) : alpha('#9b59b6', 0.15),
      backdropFilter: 'blur(10px)',
      height: '100%',
      border: `1px solid ${alpha(isPartner ? '#555' : '#9b59b6', 0.2)}`
    }}>
      <Typography variant="h6" sx={{ mb: 2, px: 2, color: '#fff', fontWeight: 'bold' }}>{title}</Typography>
      
      <div style={{ 
        height: '500px', // Fixed height
        position: 'relative', 
        minHeight: '500px',
        overflow: 'visible'
      }}>
        <Calendar
          ref={calendarRef}
          localizer={localizer}
          events={sanitizedEvents}
          startAccessor="start"
          endAccessor="end"
          style={{ height: '500px' }} // Fixed height
          eventPropGetter={(event) => ({
            style: {
              backgroundColor: event.isPartnerEvent || isPartner ? '#e74c3c' : '#9b59b6',
              color: 'white',
              borderRadius: '4px',
              border: 'none',
              padding: '2px 4px',
              fontSize: '0.8rem',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              opacity: 1,
              fontWeight: 'bold',
            }
          })}
          onSelectEvent={onEventClick}
          defaultView={calendarView}
          view={calendarView}
          onView={setCalendarView}
          views={['month', 'week', 'day', 'agenda']}
          popup={true}
          components={{
            toolbar: CustomToolbar,
          }}
          step={60}
          showMultiDayTimes
        />
      </div>
    </Paper>
  );
};

// Add this debugging function to your SchedulePage component
const debugEvent = (event) => {
  // Event validation and processing
  
  return event;
};

// Update the SafeCalendarWrapper component
const SafeCalendarWrapper = ({ children, fallback, events, title, onEventClick, isPartner = false }) => {
  const { isMobile } = useResponsive();
  
  // If on mobile, use our mobile-friendly component instead of react-big-calendar
  if (isMobile) {
    return <MobileFallbackView events={events} title={title} onEventClick={onEventClick} />;
  }

  // On desktop, use the react-big-calendar inside ErrorBoundary
  return (
    <ErrorBoundary 
      fallback={fallback || <div>Calendar could not be displayed</div>}
      onError={(error) => console.error('Calendar error:', error)}
    >
      {children}
    </ErrorBoundary>
  );
};

// Add the missing EventDetailsDialog component
const EventDetailsDialog = ({ event, open, onClose, onEdit, onDelete }) => {
  if (!event) return null;
  
  const isUserEvent = !event.isPartnerEvent;
  
  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      PaperProps={{
        sx: {
          bgcolor: alpha('#121212', 0.95),
          backdropFilter: 'blur(10px)',
          color: 'white',
          borderRadius: 2,
          maxWidth: 500,
          width: '100%'
        }
      }}
    >
      <DialogTitle sx={{ 
        borderBottom: `1px solid ${alpha('#fff', 0.1)}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Typography variant="h6">{event.title}</Typography>
        <IconButton onClick={onClose} sx={{ color: 'white' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ py: 2 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CalendarTodayIcon sx={{ color: alpha('#fff', 0.7) }} />
            <Typography>
              {format(new Date(event.start), 'EEEE, MMMM d, yyyy')}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AccessTimeIcon sx={{ color: alpha('#fff', 0.7) }} />
            <Typography>
              {format(new Date(event.start), 'h:mm a')} - {format(new Date(event.end), 'h:mm a')}
            </Typography>
          </Box>
          
          {event.location && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <LocationOnIcon sx={{ color: alpha('#fff', 0.7) }} />
              <Typography>{event.location}</Typography>
            </Box>
          )}
          
          {event.description && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                {event.description}
              </Typography>
            </Box>
          )}
          
          <Box sx={{ 
            mt: 2, 
            p: 1, 
            borderRadius: 1, 
            bgcolor: alpha(event.isPartnerEvent ? '#e74c3c' : '#9b59b6', 0.2),
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}>
            <PersonIcon sx={{ color: event.isPartnerEvent ? '#e74c3c' : '#9b59b6' }} />
            <Typography variant="body2">
              {event.isPartnerEvent ? 'Partner\'s event' : 'Your event'}
            </Typography>
          </Box>
        </Box>
      </DialogContent>
      
      {isUserEvent && (
        <DialogActions sx={{ borderTop: `1px solid ${alpha('#fff', 0.1)}` }}>
          <Button 
            onClick={() => {
              onClose();
              onEdit(event);
            }}
            startIcon={<EditIcon />}
            sx={{ color: '#fff' }}
          >
            Edit
          </Button>
          <Button 
            onClick={() => {
              onClose();
              onDelete(event);
            }}
            startIcon={<DeleteIcon />}
            sx={{ color: '#f44336' }}
          >
            Delete
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
};

const SchedulePage = () => {
  const { user } = useAuth();
  const { partnerData } = usePartnerData();
  const [userEvents, setUserEvents] = useState([]);
  const [partnerEvents, setPartnerEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isEventDetailsOpen, setIsEventDetailsOpen] = useState(false);
  const [isEventFormOpen, setIsEventFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [isGoogleCalendarConnected, setIsGoogleCalendarConnected] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const [openaiApiKey, setOpenaiApiKey] = useState('');
  const theme = useTheme();

  useEffect(() => {
    setOpenaiApiKey(import.meta.env.VITE_OPENAI_API_KEY || '');
  }, []);

  const login = useGoogleLogin({
    scope: 'https://www.googleapis.com/auth/calendar.readonly',
    onSuccess: async (response) => {
      setError(null);
      setIsGoogleCalendarConnected(true);
      
      const expiryTime = new Date().getTime() + (60 * 60 * 1000);
      const tokenData = {
        token: response.access_token,
        expiry: expiryTime,
        userId: user.uid
      };
      
      localStorage.setItem('google_calendar_data', JSON.stringify(tokenData));
      syncGoogleCalendarEvents(response.access_token);
    },
    onError: (error) => {
      console.error('Login Failed:', error);
      setError('Failed to connect to Google Calendar. Please try again.');
      setIsGoogleCalendarConnected(false);
    },
    flow: 'implicit',
    ux_mode: 'popup'
  });

  useEffect(() => {
    const tokenData = localStorage.getItem('google_calendar_data');
    
    if (tokenData && user?.uid) {
      try {
        const { token, expiry, userId } = JSON.parse(tokenData);
        
        if (userId === user.uid && expiry > new Date().getTime()) {
          setIsGoogleCalendarConnected(true);
          
          getDoc(doc(db, 'users', user.uid)).then(docSnap => {
            if (docSnap.exists()) {
              const userData = docSnap.data();
              if (userData.lastCalendarSync) {
                const lastSyncDate = userData.lastCalendarSync.toDate();
                setLastSync(lastSyncDate.getTime());
              }
            }
          });
        } else {
          localStorage.removeItem('google_calendar_data');
          setIsGoogleCalendarConnected(false);
        }
      } catch (error) {
        console.error('Error parsing token data:', error);
        localStorage.removeItem('google_calendar_data');
        setIsGoogleCalendarConnected(false);
      }
    }

    const interval = setInterval(() => {
      const currentTokenData = localStorage.getItem('google_calendar_data');
      if (currentTokenData) {
        try {
          const { expiry, userId } = JSON.parse(currentTokenData);
          if (userId !== user?.uid || expiry <= new Date().getTime()) {
            localStorage.removeItem('google_calendar_data');
            setIsGoogleCalendarConnected(false);
            setMessage('Google Calendar session expired. Please reconnect.');
          }
        } catch (error) {
          localStorage.removeItem('google_calendar_data');
          setIsGoogleCalendarConnected(false);
        }
      }
    }, 60000);

    return () => {
      clearInterval(interval);
    };
  }, [user?.uid]);

  useEffect(() => {
    if (!user) return;
    
    setLoading(true);
    
    // Create a query to get the user's events
    const eventsQuery = query(
      collection(db, 'users', user.uid, 'events'),
      orderBy('start', 'asc')
    );
    
    // Subscribe to the query
    const unsubscribe = onSnapshot(eventsQuery, (snapshot) => {
      const fetchedEvents = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      

      
      // Process events to ensure they have valid dates
      const processedEvents = fetchedEvents.map(event => {
        // Make sure start and end are Date objects
        let start = event.start;
        let end = event.end;
        
        // Handle Firebase Timestamp objects
        if (start && typeof start.seconds === 'number') {
          start = new Date(start.seconds * 1000);
        }
        
        if (end && typeof end.seconds === 'number') {
          end = new Date(end.seconds * 1000);
        }
        
        return {
          ...event,
          start,
          end
        };
      });
      
      setUserEvents(processedEvents);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching events:", error);
      setError("Failed to load events. Please try again later.");
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (userEvents.length === 0 && !loading) {
      // Add a sample event for today
      const today = new Date();
      const sampleEvent = {
        id: 'sample-1',
        title: 'Sample Event',
        start: new Date(today.setHours(10, 0, 0, 0)),
        end: new Date(today.setHours(11, 0, 0, 0)),
        description: 'This is a sample event to show how events appear in the calendar',
        location: 'Sample Location',
        isAllDay: false
      };
      
      // Only add sample in development
      if (process.env.NODE_ENV === 'development') {
        setUserEvents([sampleEvent]);
      }
    }
  }, [userEvents.length, loading]);

  useEffect(() => {
    if (!partnerData?.partnerId) return;
    
    const partnerEventsRef = collection(db, 'users', partnerData.partnerId, 'events');
    const partnerEventsQuery = query(partnerEventsRef, orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(partnerEventsQuery, (snapshot) => {
      const fetchedEvents = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title,
          start: new Date(data.start), // Convert to Date object
          end: new Date(data.end),     // Convert to Date object
          location: data.location || '',
          description: data.description || '',
          isAllDay: data.isAllDay || false,
          isPartnerEvent: true,
          createdAt: data.createdAt
        };
      });
      setPartnerEvents(fetchedEvents);
    });
    
    return () => unsubscribe();
  }, [partnerData?.partnerId]);

  const syncGoogleCalendarEvents = async (token) => {
    if (!token || !user?.uid) {
      setError('No authentication token found');
      setIsGoogleCalendarConnected(false);
      return;
    }

    setSyncLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(
        'https://www.googleapis.com/calendar/v3/calendars/primary/events',
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          params: {
            timeMin: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString(),
            timeMax: new Date(new Date().setMonth(new Date().getMonth() + 6)).toISOString(),
            maxResults: 250,
            singleEvents: true,
            orderBy: 'startTime',
          },
        }
      );

      const formattedEvents = response.data.items.map(event => {
        const isAllDay = !event.start.dateTime;
        
        return {
        googleId: event.id,
        title: event.summary || 'Untitled Event',
          start: event.start.dateTime || `${event.start.date}T00:00:00`,
          end: event.end.dateTime || `${event.end.date}T00:00:00`,
        description: event.description || '',
        location: event.location || '',
          allDay: isAllDay,
        owner: user.uid,
          googleCalendarOwner: user.uid,
        updatedAt: serverTimestamp()
        };
      });

      const batch = writeBatch(db);
      const eventsRef = collection(db, 'calendar_events');

      const oldEventsQuery = query(
        eventsRef, 
        where('owner', '==', user.uid),
        where('googleCalendarOwner', '==', user.uid)
      );
      const oldEventsSnapshot = await getDocs(oldEventsQuery);
      oldEventsSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      formattedEvents.forEach(event => {
        const newEventRef = doc(eventsRef);
        batch.set(newEventRef, event);
      });

      await batch.commit();

      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        lastCalendarSync: serverTimestamp()
      });

      setLastSync(Date.now());
      setMessage('Calendar synced successfully!');
    } catch (error) {
      console.error('Error syncing calendar:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('google_calendar_data');
        setIsGoogleCalendarConnected(false);
        setError('Google Calendar session expired. Please reconnect.');
      } else {
        setError(error.message || 'Failed to sync calendar events');
      }
    } finally {
      setSyncLoading(false);
    }
  };

  const handleManualSync = async () => {
    if (!user?.uid) return;
    
    try {
      const tokenData = localStorage.getItem('google_calendar_data');
      if (!tokenData) {
        throw new Error('No valid calendar connection found');
      }

      const { token, expiry, userId } = JSON.parse(tokenData);
      if (userId !== user.uid || expiry <= new Date().getTime()) {
        throw new Error('Calendar session expired. Please reconnect.');
      }
      
      await syncGoogleCalendarEvents(token);
    } catch (error) {
      console.error('Error syncing calendar:', error);
      setError(error.message || 'Failed to sync calendar');
      if (error && typeof error === 'string' && error.includes('expired')) {
        localStorage.removeItem('google_calendar_data');
        setIsGoogleCalendarConnected(false);
      }
    }
  };

  const handleDateSelect = (selectInfo) => {
    const startDate = selectInfo.start;
    const endDate = selectInfo.end;
    
    setEditingEvent({
      start: startDate.toISOString(),
      end: endDate.toISOString()
    });
    setIsEventFormOpen(true);
  };

  const handleEventClick = (clickInfo) => {
    setSelectedEvent(clickInfo.event);
    setIsEventDetailsOpen(true);
  };

  const handleEditEvent = (event) => {
    setEditingEvent({
      id: event.id,
      title: event.title,
      start: event.start,
      end: event.end,
      description: event.extendedProps?.description || '',
      location: event.extendedProps?.location || '',
      allDay: event.allDay
    });
    setIsEventFormOpen(true);
  };

  const handleSaveEvent = async (eventData) => {
    try {
      const eventToSave = {
        ...eventData,
        // Store as ISO strings in Firestore
        start: eventData.start.toISOString(),
        end: eventData.end.toISOString(),
        createdAt: serverTimestamp()
      };
      
      if (eventData.id) {
        // Update existing event
        await updateDoc(doc(db, 'users', user.uid, 'events', eventData.id), eventToSave);
        setMessage('Event updated successfully');
      } else {
        // Create new event
        await addDoc(collection(db, 'users', user.uid, 'events'), eventToSave);
        setMessage('Event created successfully');
      }
      
      setIsEventFormOpen(false);
      setEditingEvent(null);
    } catch (error) {
      console.error('Error saving event:', error);
      setError('Failed to save event');
    }
  };

  const handleDeleteEvent = async (event) => {
    try {
      setLoading(true);
      
      // Delete from Firestore
      await deleteDoc(doc(db, 'users', user.uid, 'events', event.id));
      
      // Update local state
      setUserEvents(prevEvents => prevEvents.filter(e => e.id !== event.id));
      
      setMessage('Event deleted successfully');
    } catch (error) {
      console.error('Error deleting event:', error);
      setError('Failed to delete event: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExtractedEvents = useCallback(async (extractedEvents) => {
    try {
      setLoading(true);
      setIsDrawerOpen(false);
      

      
      if (!extractedEvents || !Array.isArray(extractedEvents) || extractedEvents.length === 0) {
        setError("No events were extracted. Please try again with a different text.");
        setLoading(false);
        return;
      }
      
      // Properly format the events for Firestore
      const formattedEvents = extractedEvents.map(event => {
        // Ensure we have valid date objects
        let startDate = event.start;
        let endDate = event.end;
        
        // Convert string dates to Date objects if needed
        if (typeof startDate === 'string') {
          startDate = new Date(startDate);
        }
        
        if (typeof endDate === 'string') {
          endDate = new Date(endDate);
        }
        
        // Validate dates - if invalid, use current date + offset
        if (!startDate || isNaN(startDate.getTime())) {
          startDate = new Date();
        }
        
        if (!endDate || isNaN(endDate.getTime())) {
          // Default to 1 hour after start
          endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
        }
        
        // Ensure end is after start
        if (endDate <= startDate) {
          endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
        }
        
        return {
          title: event.title || "Untitled Event",
          start: startDate,
          end: endDate,
          location: event.location || "",
          description: event.description || "",
          allDay: event.allDay || false,
          userId: user.uid,
          createdAt: serverTimestamp()
        };
      });
      

      
      // Add events to Firestore - FIX: Use the correct collection path
      const batch = writeBatch(db);
      
      formattedEvents.forEach(event => {
        // Fix: Use the correct path to the user's events subcollection
        const eventRef = doc(collection(db, 'users', user.uid, 'events'));
        batch.set(eventRef, event);
      });
      
      await batch.commit();
      
      setMessage(`Successfully added ${formattedEvents.length} events to your calendar.`);
      setLoading(false);
    } catch (error) {
      console.error("Error adding extracted events:", error);
      setError(`Error adding events: ${error.message}`);
      setLoading(false);
    }
  }, [user.uid, setError, setLoading, setMessage]);

  // Add clearAllEvents function
  const clearAllEvents = async () => {
    if (!user?.uid) return;
    
    // Ask for confirmation
    if (!window.confirm('Are you sure you want to delete ALL events from your calendar? This cannot be undone.')) {
      return;
    }
    
    try {
      setLoading(true);
      
      // Get all events
      const eventsRef = collection(db, 'users', user.uid, 'events');
      const snapshot = await getDocs(eventsRef);
      
      // Use a batch to delete all events
      const batch = writeBatch(db);
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();

      // Update local state
      setUserEvents([]);
      setMessage(`Successfully cleared all events from your calendar`);
      
    } catch (error) {
      console.error('Error clearing calendar:', error);
      setError('Failed to clear calendar: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Add this function near the top of your file, after the imports and before your components
  const createTestEvents = () => {
    const today = new Date();
    const events = [];
    
    // Create 5 test events
    for (let i = 0; i < 5; i++) {
      const startDate = new Date(today);
      startDate.setDate(today.getDate() + i);
      startDate.setHours(9 + i, 0, 0);
      
      const endDate = new Date(startDate);
      endDate.setHours(startDate.getHours() + 1);
      
      events.push({
        id: `test-event-${i}`,
        title: `Test Event ${i + 1}`,
        start: startDate,
        end: endDate,
        description: `This is a test event ${i + 1}`,
        location: 'Test Location',
        isPartnerEvent: i % 2 === 0
      });
    }
    
    return events;
  };

  return (
    <Box sx={{ p: 3, height: '100%' }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 3,
        flexDirection: { xs: 'column', sm: 'row' },
        gap: { xs: 2, sm: 0 }
      }}>
        <Typography variant="h4" sx={{ color: '#fff', fontWeight: 'bold' }}>
          Schedule
          {!isGoogleCalendarConnected && (
            <Typography component="span" variant="body2" sx={{ ml: 2, color: 'text.secondary' }}>
              Not connected
            </Typography>
          )}
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setEditingEvent(null);
              setIsEventFormOpen(true);
            }}
            sx={{ 
              bgcolor: alpha('#9b59b6', 0.8),
              '&:hover': { bgcolor: '#9b59b6' }
            }}
          >
            Add Event
          </Button>
          
          <Button
            variant="contained"
            startIcon={<TextFieldsIcon />}
            onClick={() => setIsDrawerOpen(true)}
            sx={{ 
              bgcolor: alpha('#9b59b6', 0.8),
              '&:hover': { bgcolor: '#9b59b6' }
            }}
          >
            Import Schedule
          </Button>
          
          <Button
            variant="outlined"
            startIcon={<DeleteIcon />}
            onClick={clearAllEvents}
            sx={{ 
              borderColor: alpha('#f44336', 0.5),
              color: '#f44336',
              '&:hover': { 
                borderColor: '#f44336',
                bgcolor: alpha('#f44336', 0.1)
              }
            }}
          >
            Clear Calendar
          </Button>
        </Box>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box sx={{ 
          display: 'flex',
          flexDirection: 'column',
          gap: 3,
          flex: 1,
          width: '100%'
        }}>
          <Box sx={{ 
            flex: 1,
            minHeight: { xs: '500px', lg: '400px' }
          }}>
            <EnhancedCalendarView 
              events={userEvents} 
              title="Your Schedule" 
              onEventClick={handleEventClick}
            />
          </Box>
          
          <Box sx={{ 
            flex: 1,
            minHeight: { xs: '500px', lg: '400px' }
          }}>
            <EnhancedCalendarView 
              events={partnerEvents} 
              title="Partner's Schedule" 
              onEventClick={handleEventClick}
              isPartner={true}
            />
          </Box>
        </Box>
      )}

      <EventDetailsDialog
        event={selectedEvent}
        open={isEventDetailsOpen}
        onClose={() => setIsEventDetailsOpen(false)}
        onEdit={handleEditEvent}
        onDelete={handleDeleteEvent}
      />

      <EventForm 
        event={editingEvent}
        open={isEventFormOpen}
        onClose={() => {
          setIsEventFormOpen(false);
          setEditingEvent(null);
        }}
        onSave={handleSaveEvent}
        onDelete={handleDeleteEvent}
      />

      <Drawer
        anchor="right"
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        PaperProps={{
          sx: {
            width: { xs: '100%', sm: 450 },
            maxWidth: '100%',
            height: '100%',
            bgcolor: alpha('#121212', 0.95),
            backdropFilter: 'blur(10px)',
            p: 3,
            display: 'flex',
            flexDirection: 'column'
          }
        }}
      >
        <EventExtractor 
          onEventsExtracted={handleExtractedEvents}
          openaiApiKey={openaiApiKey}
          onClose={() => setIsDrawerOpen(false)}
        />
      </Drawer>

      <Snackbar
        open={!!message}
        autoHideDuration={6000}
        onClose={() => setMessage('')}
        message={message}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />

      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          severity="error" 
          onClose={() => setError('')}
          sx={{ width: '100%', bgcolor: alpha('#f44336', 0.9) }}
        >
          {error}
          {error && typeof error === 'string' && error.includes('expired') && (
            <Button 
              size="small" 
              color="inherit" 
              onClick={() => login()}
              sx={{ ml: 2 }}
            >
              Reconnect
            </Button>
          )}
        </Alert>
      </Snackbar>
      
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={loading && isDrawerOpen}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <CircularProgress color="inherit" />
          <Typography>Processing events...</Typography>
        </Box>
      </Backdrop>
    </Box>
  );
};

// Add this hook for responsive design
const useResponsive = () => {
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return {
    isMobile: windowSize.width < 600,
    isTablet: windowSize.width >= 600 && windowSize.width < 960,
    isDesktop: windowSize.width >= 960,
  };
};

export default SchedulePage; 