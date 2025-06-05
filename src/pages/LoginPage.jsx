// src/pages/LoginPage.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  Box,
  Paper,
  Container,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Alert,
  alpha,
  Divider,
  IconButton,
} from "@mui/material";
import { motion } from "framer-motion";
import Lottie from "lottie-react";
import heartAnimation from "../assets/myHeartAnimation.json";
import GoogleIcon from '@mui/icons-material/Google';
import { useGoogleLogin } from '@react-oauth/google';
import { hasPartner } from '../utils/partnerHelpers';
import { db, auth } from '../firebase';

// MUI styling system
import { styled, keyframes } from "@mui/system";

/** Enhanced swirling background animation */
const swirlGradient = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

/** Enhanced styled background container */
const HeroBackground = styled("div")({
  minHeight: "100vh",
  width: "100%",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  position: "relative",
  overflow: "hidden",
  background: "linear-gradient(-45deg, #ee7b78, #fbc2eb, #b89ee5, #ee7b78)",
  backgroundSize: "400% 400%",
  animation: `${swirlGradient} 15s ease infinite`,
  padding: { xs: 2, sm: 3 }
});

/** Subtle animated overlay */
const Overlay = styled("div")({
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: "radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.2) 100%)",
  opacity: 0.7,
});

// Custom styled TextField
const StyledTextField = styled(TextField)({
  '& .MuiOutlinedInput-root': {
    '& fieldset': {
      borderColor: alpha('#fff', 0.3),
      borderRadius: 12,
    },
    '&:hover fieldset': {
      borderColor: alpha('#ee7b78', 0.5),
    },
    '&.Mui-focused fieldset': {
      borderColor: '#ee7b78',
    },
  },
  '& .MuiInputLabel-root': {
    color: alpha('#fff', 0.7),
    '&.Mui-focused': {
      color: '#ee7b78',
    },
  },
  '& .MuiOutlinedInput-input': {
    color: '#fff',
  },
});

export default function LoginPage() {
  const navigate = useNavigate();
  const { isAuthenticated, loading, signIn, signUp, signInWithGoogle } = useAuth();

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  
  // UI states
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Only redirect to /app if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/app");
    }
  }, [isAuthenticated, navigate]);

  async function handleEmailSubmit(e) {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (isRegistering) {
        await signUp(email, password, displayName);
      } else {
        await signIn(email, password);
      }
      navigate("/app");
    } catch (err) {
      console.error("Auth error:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (response) => {
      try {
        setIsLoading(true);
        await signInWithGoogle(response);
        navigate('/app');
      } catch (error) {
        console.error('Google Login Error:', error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    },
    onError: (error) => {
      console.error('Google Login Error:', error);
      setError('Failed to sign in with Google');
      setIsLoading(false);
    }
  });

  // If global auth is still loading user state, show spinner
  if (loading) {
    return (
      <Box 
        sx={{ 
          display: "flex", 
          justifyContent: "center", 
          alignItems: "center", 
          height: "100vh",
          background: "linear-gradient(-45deg, #ee7b78, #fbc2eb)",
        }}
      >
        <CircularProgress sx={{ color: '#fff' }} />
      </Box>
    );
  }

  return (
    <HeroBackground>
      <Overlay />
      <Container 
        maxWidth="sm"
        sx={{
          width: '100%',
          px: { xs: 2, sm: 3 }
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <Paper
            elevation={24}
            sx={{
              p: { xs: 2, sm: 4 },
              borderRadius: { xs: '16px', sm: '24px' },
              backdropFilter: "blur(20px)",
              backgroundColor: alpha('#fff', 0.1),
              border: `1px solid ${alpha('#fff', 0.2)}`,
              boxShadow: `
                0 4px 30px ${alpha('#000', 0.1)},
                0 1px 4px ${alpha('#fff', 0.1)}
              `,
              width: '100%'
            }}
          >
            <Box sx={{ mb: { xs: 2, sm: 4 }, textAlign: "center" }}>
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Box sx={{ 
                  height: { xs: 120, sm: 180 },
                  '& > div': { height: '100% !important' }
                }}>
                  <Lottie 
                    animationData={heartAnimation} 
                    loop={true}
                  />
                </Box>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <Typography 
                  variant="h4" 
                  component="h1" 
                  gutterBottom
                  sx={{
                    fontWeight: 700,
                    fontSize: { xs: '1.75rem', sm: '2.125rem' },
                    background: 'linear-gradient(45deg, #fff 30%, rgba(255,255,255,0.8) 90%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    color: 'transparent',
                    textShadow: '0 2px 10px rgba(0,0,0,0.1)',
                    letterSpacing: '-0.5px'
                  }}
                >
                  {isRegistering ? 'Create Account' : 'Welcome Back'}
                </Typography>
              </motion.div>
            </Box>

            {error && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Alert 
                  severity="error" 
                  sx={{ 
                    mb: 2,
                    backgroundColor: alpha('#ff0000', 0.1),
                    color: '#fff',
                    '& .MuiAlert-icon': {
                      color: '#fff'
                    }
                  }}
                >
                  {error}
                </Alert>
              </motion.div>
            )}

            <form onSubmit={handleEmailSubmit}>
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column',
                gap: { xs: 1, sm: 2 }
              }}>
                {isRegistering && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                  >
                    <StyledTextField
                      fullWidth
                      label="Display Name"
                      variant="outlined"
                      margin="normal"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          height: { xs: '45px', sm: '56px' }
                        }
                      }}
                    />
                  </motion.div>
                )}

                <StyledTextField
                  fullWidth
                  label="Email"
                  variant="outlined"
                  margin="normal"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      height: { xs: '45px', sm: '56px' }
                    }
                  }}
                />

                <StyledTextField
                  fullWidth
                  label="Password"
                  type="password"
                  variant="outlined"
                  margin="normal"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      height: { xs: '45px', sm: '56px' }
                    }
                  }}
                />

                <Button
                  fullWidth
                  variant="contained"
                  type="submit"
                  disabled={isLoading}
                  sx={{
                    mt: { xs: 1, sm: 2 },
                    height: { xs: '45px', sm: '56px' },
                    borderRadius: '12px',
                    background: 'linear-gradient(45deg, #ee7b78 30%, #fbc2eb 90%)',
                    fontSize: { xs: '0.9rem', sm: '1rem' },
                    textTransform: 'none',
                    fontWeight: 600,
                    '&:hover': {
                      background: 'linear-gradient(45deg, #e76f6c 30%, #f9b4e7 90%)',
                    }
                  }}
                >
                  {isLoading ? (
                    <CircularProgress size={24} sx={{ color: '#fff' }} />
                  ) : (
                    isRegistering ? 'Sign Up' : 'Sign In'
                  )}
                </Button>

                <Divider sx={{ 
                  my: { xs: 2, sm: 3 },
                  '&.MuiDivider-root': {
                    '&::before, &::after': {
                      borderColor: alpha('#fff', 0.2)
                    }
                  }
                }}>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: alpha('#fff', 0.7),
                      px: 1
                    }}
                  >
                    or
                  </Typography>
                </Divider>

                <Button
                  fullWidth
                  variant="outlined"
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                  startIcon={<GoogleIcon />}
                  sx={{
                    height: { xs: '45px', sm: '56px' },
                    borderRadius: '12px',
                    borderColor: alpha('#fff', 0.3),
                    color: '#fff',
                    fontSize: { xs: '0.9rem', sm: '1rem' },
                    textTransform: 'none',
                    fontWeight: 500,
                    '&:hover': {
                      borderColor: alpha('#fff', 0.5),
                      bgcolor: alpha('#fff', 0.1)
                    }
                  }}
                >
                  Continue with Google
                </Button>

                <Button
                  onClick={() => setIsRegistering(!isRegistering)}
                  sx={{
                    mt: { xs: 1, sm: 2 },
                    color: alpha('#fff', 0.9),
                    fontSize: { xs: '0.85rem', sm: '0.9rem' },
                    textTransform: 'none',
                    '&:hover': {
                      bgcolor: alpha('#fff', 0.1)
                    }
                  }}
                >
                  {isRegistering 
                    ? 'Already have an account? Sign In' 
                    : 'Need an account? Sign Up'}
                </Button>
              </Box>
            </form>
          </Paper>
        </motion.div>
      </Container>
    </HeroBackground>
  );
}