// src/App.jsx

import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';

const LoginPage = React.lazy(() => import('./pages/LoginPage'));
const HomePage = React.lazy(() => import('./pages/HomePage'));
const MessagesPage = React.lazy(() => import('./pages/MessagesPage'));
const StarsPage = React.lazy(() => import('./pages/StarsPage'));
const CouponsPage = React.lazy(() => import('./pages/CouponsPage'));
const RemindersPage = React.lazy(() => import('./pages/RemindersPage'));
const AccountabilityListPage = React.lazy(() => import('./pages/AccountabilityListPage'));
const AccountabilityDetailPage = React.lazy(() => import('./pages/AccountabilityDetailPage'));
const PartnerLinkPage = React.lazy(() => import('./pages/PartnerLinkPage'));
const AdminDashboardPage = React.lazy(() => import('./pages/AdminDashboardPage'));

const FirestoreManagerPage = React.lazy(() => import('./pages/FirestoreManagerPage'));
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/DashboardLayout';
import { GoogleOAuthProvider } from '@react-oauth/google';
const SchedulePage = React.lazy(() => import('./pages/SchedulePage'));
const MoodTrackerPage = React.lazy(() => import('./pages/MoodTrackerPage'));
import ErrorBoundary from './components/ErrorBoundary';
const CalendarCallbackPage = React.lazy(() => import('./pages/CalendarCallbackPage'));
const ValentineProposalPage = React.lazy(() => import('./pages/ValentineProposalPage'));
const SettingsPage = React.lazy(() => import('./pages/SettingsPage'));

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
            <Suspense fallback={<div>Loading...</div>}>
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
            </Suspense>
          </ThemeProvider>
        </AuthProvider>
      </ErrorBoundary>
    </GoogleOAuthProvider>
  );
}

export default App;