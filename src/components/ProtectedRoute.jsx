/* ===========================
   src/components/ProtectedRoute.jsx
=========================== */
import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Box, CircularProgress, Typography } from "@mui/material";

/**
 * ProtectedRoute checks if the user is logged in and has required permissions.
 * - If loading user state, show a spinner or fallback.
 * - If no user, redirect to "/login".
 * - If requireAdmin is true and user is not admin, redirect to home.
 * - Otherwise, render <Outlet /> for the protected content.
 */
export default function ProtectedRoute({ requireAdmin = false }) {
  const auth = useAuth();
  // Gracefully handle edge cases during HMR where context may be temporarily undefined
  if (!auth) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  const { user, loading, isAdmin } = auth;
  const location = useLocation();

  if (loading) {
    // Show a loading screen or fallback while we confirm auth
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          color: "#fff"
        }}
      >
        <CircularProgress size={48} sx={{ mb: 2 }} />
        <Typography variant="body1">Checking authentication…</Typography>
      </Box>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}