import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, CircularProgress, Typography, Alert, Paper, alpha } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { doc, updateDoc, serverTimestamp, collection, writeBatch, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import axios from 'axios';

export default function CalendarCallbackPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [error, setError] = useState(null);
  const [status, setStatus] = useState('Connecting to Google Calendar...');

  // Function to sync events with database
  const syncEvents = async (token) => {
    try {
      setStatus('Fetching your calendar events...');
      
      // 1. Fetch events from Google Calendar
      const response = await axios.get(
        'https://www.googleapis.com/calendar/v3/calendars/primary/events',
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          params: {
            timeMin: new Date().toISOString(),
            maxResults: 100,
            singleEvents: true,
            orderBy: 'startTime',
          },
        }
      );

      setStatus('Processing events...');

      // 2. Format events
      const formattedEvents = response.data.items.map(event => ({
        googleId: event.id,
        title: event.summary || 'Untitled Event',
        start: event.start.dateTime || event.start.date,
        end: event.end.dateTime || event.end.date,
        description: event.description || '',
        location: event.location || '',
        owner: user.uid,
        updatedAt: serverTimestamp()
      }));

      setStatus('Saving to database...');

      // 3. Batch update in Firebase
      const batch = writeBatch(db);
      const eventsRef = collection(db, 'calendar_events');

      // First, delete old events
      const oldEventsQuery = query(eventsRef, where('owner', '==', user.uid));
      const oldEventsSnapshot = await getDocs(oldEventsQuery);
      oldEventsSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      // Then add new events
      formattedEvents.forEach(event => {
        const newEventRef = doc(eventsRef);
        batch.set(newEventRef, event);
      });

      await batch.commit();

      setStatus('Almost done...');
      return formattedEvents.length;
    } catch (error) {
      console.error('Error syncing events:', error);
      throw new Error('Failed to sync calendar events');
    }
  };

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the code and state from URL
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const stateStr = urlParams.get('state');
        
        if (!code) {
          throw new Error('No authorization code received');
        }

        // Parse state to get return URL
        const state = stateStr ? JSON.parse(atob(stateStr)) : { returnTo: '/schedule' };
        
        setStatus('Getting access token...');

        // Prepare token request data
        const tokenRequestData = {
          code,
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
          client_secret: import.meta.env.VITE_GOOGLE_CLIENT_SECRET,
          redirect_uri: `${window.location.origin}/calendar-callback`,
          grant_type: 'authorization_code'
        };

        // Log the request for debugging (without client secret)
        console.log('Token request:', {
          ...tokenRequestData,
          client_secret: '[REDACTED]'
        });
        
        // Exchange code for tokens
        const tokenResponse = await axios({
          method: 'post',
          url: 'https://oauth2.googleapis.com/token',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          data: new URLSearchParams(tokenRequestData).toString()
        });

        console.log('Token response received');

        // Store tokens securely
        const tokens = {
          access_token: tokenResponse.data.access_token,
          refresh_token: tokenResponse.data.refresh_token,
          expiry: Date.now() + (tokenResponse.data.expires_in * 1000),
          scope: tokenResponse.data.scope
        };

        // Store in localStorage
        localStorage.setItem('calendar_data', btoa(JSON.stringify(tokens)));

        setStatus('Syncing your calendar...');

        // Sync events
        const eventCount = await syncEvents(tokens.access_token);

        // Update Firebase user status
        if (user?.uid) {
          const userRef = doc(db, 'users', user.uid);
          await updateDoc(userRef, {
            calendarConnected: true,
            lastCalendarSync: serverTimestamp(),
            calendarScope: tokens.scope
          });
        }

        setStatus(`Successfully synced ${eventCount} events!`);
        
        // Navigate back after a short delay to show success message
        setTimeout(() => {
          navigate(state.returnTo || '/schedule');
        }, 1500);
      } catch (error) {
        console.error('Error handling calendar callback:', error);
        let errorMessage = 'Failed to connect calendar';
        
        if (error.response) {
          console.error('Error response:', {
            status: error.response.status,
            data: error.response.data
          });
          
          if (error.response.status === 400) {
            errorMessage = 'Invalid authorization code. Please try connecting again.';
          } else if (error.response.status === 401) {
            errorMessage = 'Authentication failed. Please try connecting again.';
          } else {
            errorMessage = error.response.data?.error_description || 'Failed to connect to Google Calendar';
          }
        }
        
        setError(errorMessage);
        setTimeout(() => navigate('/schedule'), 3000);
      }
    };

    handleCallback();
  }, [navigate, user]);

  return (
    <Box 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '100vh',
        bgcolor: '#1a1a1a',
        color: '#fff',
        p: 3
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 4,
          borderRadius: 2,
          bgcolor: alpha('#fff', 0.05),
          backdropFilter: 'blur(10px)',
          border: `1px solid ${alpha('#fff', 0.1)}`,
          maxWidth: '400px',
          width: '100%'
        }}
      >
        {error ? (
          <Alert 
            severity="error" 
            sx={{ 
              mb: 2,
              bgcolor: alpha('#ff0000', 0.1),
              color: '#fff',
              '& .MuiAlert-icon': {
                color: '#fff'
              }
            }}
          >
            {error}
          </Alert>
        ) : (
          <Box sx={{ textAlign: 'center' }}>
            <CircularProgress sx={{ color: '#9b59b6', mb: 2 }} />
            <Typography variant="body1" sx={{ color: alpha('#fff', 0.9) }}>
              {status}
            </Typography>
          </Box>
        )}
      </Paper>
    </Box>
  );
} 