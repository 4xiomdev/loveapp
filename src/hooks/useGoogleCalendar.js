import { useState, useEffect, useCallback } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import axios from 'axios';

export const useGoogleCalendar = () => {
  const [events, setEvents] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const readToken = useCallback(() => {
    // New format
    const data = localStorage.getItem('google_calendar_data');
    if (data) {
      try {
        const { token, expiry } = JSON.parse(data);
        return { token, expiry };
      } catch {}
    }
    // Back-compat
    const token = localStorage.getItem('google_token');
    const expiry = localStorage.getItem('google_token_expiry');
    if (token && expiry) return { token, expiry: parseInt(expiry) };
    return { token: null, expiry: 0 };
  }, []);

  const writeToken = useCallback((token, expiryMs) => {
    const payload = { token, expiry: expiryMs };
    localStorage.setItem('google_calendar_data', JSON.stringify(payload));
    // Back-compat
    localStorage.setItem('google_token', token);
    localStorage.setItem('google_token_expiry', `${expiryMs}`);
  }, []);

  const clearTokens = useCallback(() => {
    localStorage.removeItem('google_calendar_data');
    localStorage.removeItem('google_token');
    localStorage.removeItem('google_token_expiry');
    setIsAuthenticated(false);
  }, []);

  const checkTokenExpiry = useCallback(() => {
    const { token, expiry } = readToken();
    if (!token || !expiry) return false;
    return Date.now() < Number(expiry);
  }, [readToken]);

  const getToken = useCallback(() => {
    const { token, expiry } = readToken();
    if (!token || Date.now() >= Number(expiry)) return null;
    return token;
  }, [readToken]);

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

  const fetchEventsInRange = useCallback(async (timeMin, timeMax, maxResults = 250) => {
    const token = getToken();
    if (!token) {
      setError('No authentication token found');
      setIsAuthenticated(false);
      return [];
    }

    try {
      const response = await axios.get('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          timeMin: timeMin ?? new Date().toISOString(),
          ...(timeMax ? { timeMax } : {}),
          maxResults,
          singleEvents: true,
          orderBy: 'startTime',
        },
      });
      return response.data.items || [];
    } catch (err) {
      console.error('Error fetching events in range:', err);
      if (err.response?.status === 401) {
        clearTokens();
        setError('Google Calendar session expired. Please reconnect.');
      } else {
        setError('Failed to fetch calendar events. Please try again later.');
      }
      return [];
    }
  }, [getToken, clearTokens]);

  const login = useGoogleLogin({
    scope: 'https://www.googleapis.com/auth/calendar.readonly',
    onSuccess: async (response) => {
      setError(null);
      setIsAuthenticated(true);
      
      // Store token with expiry time (1 hour from now)
      const expiryTime = Date.now() + 60 * 60 * 1000;
      writeToken(response.access_token, expiryTime);
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
    const token = getToken();
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
  }, [checkTokenExpiry, fetchEvents, clearTokens, getToken]);

  return {
    events,
    isAuthenticated,
    loading,
    error,
    login,
    disconnect,
    refreshEvents,
    clearError: () => setError(null),
    fetchEventsInRange,
    getToken
  };
}; 