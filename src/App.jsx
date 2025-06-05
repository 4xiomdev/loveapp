// src/App.jsx

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import MessagesPage from './pages/MessagesPage';
import StarsPage from './pages/StarsPage';
import CouponsPage from './pages/CouponsPage';
import RemindersPage from './pages/RemindersPage';
import AccountabilityListPage from './pages/AccountabilityListPage';
import AccountabilityDetailPage from './pages/AccountabilityDetailPage';
import PartnerLinkPage from './pages/PartnerLinkPage';
import AdminDashboardPage from './pages/AdminDashboardPage';

import FirestoreManagerPage from './pages/FirestoreManagerPage';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/DashboardLayout';
import { GoogleOAuthProvider } from '@react-oauth/google';
import SchedulePage from './pages/SchedulePage';
import MoodTrackerPage from './pages/MoodTrackerPage';
import ErrorBoundary from './components/ErrorBoundary';
import CalendarCallbackPage from './pages/CalendarCallbackPage';
import ValentineProposalPage from './pages/ValentineProposalPage';
import SettingsPage from './pages/SettingsPage';

// Add this at the top of your file
const MAINTENANCE_MODE = false; // Set to false to restore the site

// Root route component to handle authentication-based redirects
const RootRoute = () => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Navigate to="/app" replace /> : <Navigate to="/login" replace />;
};

function App() {
  // If maintenance mode is enabled, show the maintenance page
  if (MAINTENANCE_MODE) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        backgroundColor: '#121212',
        color: '#ffffff',
        textAlign: 'center',
        padding: '0 1rem'
      }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>
          404 - Page Not Found
        </h1>
        <p style={{ fontSize: '1.2rem', opacity: 0.8, maxWidth: '600px' }}>
          The page you are looking for is currently unavailable.
        </p>
      </div>
    );
  }

  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <ErrorBoundary>
        <AuthProvider>
          <ThemeProvider>
            <Routes>
              {/* Root path checks auth status */}
              <Route path="/" element={<RootRoute />} />
              
              {/* Login page as main public route */}
              <Route path="/login" element={<LoginPage />} />
              
              {/* Valentine page kept as archived route */}
              <Route path="/valentine" element={<ValentineProposalPage />} />
              
              {/* Protected app routes */}
              <Route path="/app/*" element={<ProtectedRoute />}>
                <Route element={<DashboardLayout />}>
                  <Route index element={<HomePage />} />
                  <Route path="messages" element={<MessagesPage />} />
                  <Route path="stars" element={<StarsPage />} />
                  <Route path="coupons" element={<CouponsPage />} />
                  <Route path="reminders" element={<RemindersPage />} />
                  <Route path="accountability" element={<AccountabilityListPage />} />
                  <Route path="accountability/:id" element={<AccountabilityDetailPage />} />
                  <Route path="partner" element={<PartnerLinkPage />} />
                  <Route path="settings" element={<SettingsPage />} />
                  <Route path="admin" element={<ProtectedRoute requireAdmin={true} />}>
                    <Route index element={<AdminDashboardPage />} />
                    <Route path="firestore" element={<FirestoreManagerPage />} />
                  </Route>
                  <Route path="schedule" element={<SchedulePage />} />
                  <Route path="mood" element={<MoodTrackerPage />} />
                </Route>
              </Route>
              <Route path="/calendar-callback" element={<CalendarCallbackPage />} />
              {/* Catch-all route also checks auth status */}
              <Route path="*" element={<RootRoute />} />
            </Routes>
          </ThemeProvider>
        </AuthProvider>
      </ErrorBoundary>
    </GoogleOAuthProvider>
  );
}

export default App;