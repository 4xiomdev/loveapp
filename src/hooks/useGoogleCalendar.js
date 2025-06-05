import { useState, useEffect, useCallback } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import axios from 'axios';

export const useGoogleCalendar = () => {
  const [events, setEvents] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const checkTokenExpiry = useCallback(() => {
    const token = localStorage.getItem('google_token');
    const expiry = localStorage.getItem('google_token_expiry');
    
    if (!token || !expiry) {
      return false;
    }

    const now = new Date().getTime();
    const expiryTime = parseInt(expiry);
    
    return now < expiryTime;
  }, []);

  const clearTokens = useCallback(() => {
    localStorage.removeItem('google_token');
    localStorage.removeItem('google_token_expiry');
    setIsAuthenticated(false);
  }, []);

  const fetchEvents = useCallback(async (token) => {
    if (!token) {
      setError('No authentication token found');
      setIsAuthenticated(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(
        'https://www.googleapis.com/calendar/v3/calendars/primary/events',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          params: {
            timeMin: new Date().toISOString(),
            maxResults: 5,
            singleEvents: true,
            orderBy: 'startTime',
          },
        }
      );
      
      setEvents(response.data.items || []);
    } catch (error) {
      console.error('Error fetching events:', error);
      if (error.response?.status === 401) {
        clearTokens();
        setError('Google Calendar session expired. Please reconnect.');
      } else {
        setError('Failed to fetch calendar events. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  }, [clearTokens]);

  const login = useGoogleLogin({
    scope: 'https://www.googleapis.com/auth/calendar.readonly',
    onSuccess: async (response) => {
      setError(null);
      setIsAuthenticated(true);
      
      // Store token with expiry time (1 hour from now)
      const expiryTime = new Date().getTime() + (60 * 60 * 1000);
      localStorage.setItem('google_token', response.access_token);
      localStorage.setItem('google_token_expiry', expiryTime.toString());
      
      fetchEvents(response.access_token);
    },
    onError: (error) => {
      console.error('Login Failed:', error);
      setError('Failed to connect to Google Calendar. Please try again.');
      setIsAuthenticated(false);
    },
    flow: 'implicit',
    ux_mode: 'redirect',
  });

  const disconnect = useCallback(() => {
    clearTokens();
    setEvents([]);
    setError(null);
  }, [clearTokens]);

  const refreshEvents = useCallback(() => {
    const token = localStorage.getItem('google_token');
    if (token && checkTokenExpiry()) {
      fetchEvents(token);
    } else {
      clearTokens();
    }
  }, [checkTokenExpiry, fetchEvents, clearTokens]);

  // Check token validity on mount and set up periodic check
  useEffect(() => {
    const token = localStorage.getItem('google_token');
    
    if (token && checkTokenExpiry()) {
      setIsAuthenticated(true);
      fetchEvents(token);
    } else {
      clearTokens();
    }

    // Check token expiry every minute
    const interval = setInterval(() => {
      if (!checkTokenExpiry()) {
        clearTokens();
        setError('Google Calendar session expired. Please reconnect.');
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [checkTokenExpiry, fetchEvents, clearTokens]);

  return {
    events,
    isAuthenticated,
    loading,
    error,
    login,
    disconnect,
    refreshEvents,
    clearError: () => setError(null)
  };
}; 