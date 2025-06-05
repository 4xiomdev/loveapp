/* ===========================================
   src/components/TopBar.jsx
=========================================== */
import React, { useState, useEffect } from "react";
import { AppBar, Toolbar, Typography, IconButton, alpha, Box, Stack } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import HomeIcon from "@mui/icons-material/Home";
import { useNavigate } from "react-router-dom";
import ThemeSwitcher from "./ThemeSwitcher";
import { useAuth } from "../contexts/AuthContext";
import { usePartnerData } from "../hooks/usePartnerData";
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LocationOnIcon from '@mui/icons-material/LocationOn';

export default function TopBar({ onDrawerToggle }) {
  const navigate = useNavigate();
  const { userData } = useAuth();
  const { partnerData } = usePartnerData();
  const [houstonTime, setHoustonTime] = useState('');
  const [dammamTime, setDammamTime] = useState('');

  // Update times every second
  useEffect(() => {
    const updateTimes = () => {
      // Houston time (CST/CDT)
      const houston = new Date().toLocaleTimeString('en-US', {
        timeZone: 'America/Chicago',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });

      // Dammam time (AST)
      const dammam = new Date().toLocaleTimeString('en-US', {
        timeZone: 'Asia/Riyadh',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });

      setHoustonTime(houston);
      setDammamTime(dammam);
    };

    // Initial update
    updateTimes();

    // Update every second
    const interval = setInterval(updateTimes, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <AppBar
      position="fixed"
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        bgcolor: 'transparent',
        color: '#fff',
        height: { xs: 56, sm: 64 },
        backdropFilter: 'blur(20px)',
        backgroundColor: alpha('#000000', 0.2),
        borderBottom: `1px solid ${alpha('#ffffff', 0.1)}`,
        boxShadow: `0 4px 10px ${alpha('#000000', 0.2)}`,
        fontFamily: "'Quicksand', sans-serif",
        width: '100%',
        left: 0
      }}
    >
      <Toolbar
        sx={{
          minHeight: { xs: '56px !important', sm: '64px !important' },
          px: { xs: 1, sm: 2 },
          display: 'flex',
          justifyContent: 'space-between'
        }}
      >
        {/* Left section */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton
            color="inherit"
            edge="start"
            onClick={onDrawerToggle}
            sx={{
              mr: { xs: 1, sm: 2 },
              transition: 'transform 0.2s',
              '&:hover': { transform: 'scale(1.1)' }
            }}
          >
            <MenuIcon />
          </IconButton>

          <IconButton
            color="inherit"
            onClick={() => navigate("/app")}
            sx={{
              mr: { xs: 1, sm: 2 },
              transition: 'transform 0.2s',
              '&:hover': { transform: 'scale(1.1)' }
            }}
          >
            <HomeIcon />
          </IconButton>

          <Typography
            variant="h6"
            noWrap
            component="div"
            sx={{
              fontWeight: 700,
              fontFamily: "'Quicksand', sans-serif",
              fontSize: { xs: '1.1rem', sm: '1.25rem' }
            }}
          >
            LoveApp
          </Typography>
        </Box>

        {/* Center section - Times and Locations */}
        {/* Desktop version */}
        <Stack 
          direction="row" 
          spacing={3} 
          sx={{ 
            display: { xs: 'none', md: 'flex' },
            alignItems: 'center'
          }}
        >
          {/* Houston */}
          <Box sx={{ textAlign: 'center' }}>
            <Typography 
              variant="caption" 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 0.5,
                color: alpha('#fff', 0.7),
                mb: 0.5
              }}
            >
              <LocationOnIcon sx={{ fontSize: 14 }} />
              Houston, TX
            </Typography>
            <Typography 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 0.5,
                fontWeight: 600
              }}
            >
              <AccessTimeIcon sx={{ fontSize: 16 }} />
              {houstonTime}
            </Typography>
          </Box>

          {/* Dammam */}
          <Box sx={{ textAlign: 'center' }}>
            <Typography 
              variant="caption" 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 0.5,
                color: alpha('#fff', 0.7),
                mb: 0.5
              }}
            >
              <LocationOnIcon sx={{ fontSize: 14 }} />
              Dammam, KSA
            </Typography>
            <Typography 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 0.5,
                fontWeight: 600
              }}
            >
              <AccessTimeIcon sx={{ fontSize: 16 }} />
              {dammamTime}
            </Typography>
          </Box>
        </Stack>

        {/* Mobile version */}
        <Stack 
          direction="column" 
          spacing={0.5} 
          sx={{ 
            display: { xs: 'flex', md: 'none' },
            alignItems: 'flex-end',
            position: 'absolute',
            right: { xs: 48, sm: 56 },  // Space for theme switcher
            top: '50%',
            transform: 'translateY(-50%)'
          }}
        >
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 0.5,
            bgcolor: alpha('#fff', 0.1),
            borderRadius: '6px',
            py: 0.25,
            px: 0.75
          }}>
            <Typography 
              variant="caption" 
              sx={{ 
                display: 'flex', 
                alignItems: 'center',
                gap: 0.5,
                color: alpha('#fff', 0.9),
                fontSize: '0.65rem',
                lineHeight: 1
              }}
            >
              🇺🇸 {houstonTime}
            </Typography>
          </Box>

          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 0.5,
            bgcolor: alpha('#fff', 0.1),
            borderRadius: '6px',
            py: 0.25,
            px: 0.75
          }}>
            <Typography 
              variant="caption" 
              sx={{ 
                display: 'flex', 
                alignItems: 'center',
                gap: 0.5,
                color: alpha('#fff', 0.9),
                fontSize: '0.65rem',
                lineHeight: 1
              }}
            >
              🇸🇦 {dammamTime}
            </Typography>
          </Box>
        </Stack>

        {/* Right section */}
        <ThemeSwitcher />
      </Toolbar>
    </AppBar>
  );
}