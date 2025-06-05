/* ===========================================
   src/components/SideBar.jsx (Left-Aligned)
=========================================== */
import React from "react";
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Divider,
  alpha,
  useTheme,
  Avatar,
  Typography
} from "@mui/material";

import CloseIcon from "@mui/icons-material/Close";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";

// Icons
import HomeIcon from "@mui/icons-material/Home";
import StarIcon from "@mui/icons-material/Star";
import AssignmentIcon from "@mui/icons-material/Assignment";
import RedeemIcon from "@mui/icons-material/Redeem";
import ChatIcon from "@mui/icons-material/Chat";
import TimelineIcon from "@mui/icons-material/Timeline"; // Accountability
import LogoutIcon from "@mui/icons-material/Logout";
import MessageIcon from "@mui/icons-material/Message";
import CardGiftcardIcon from "@mui/icons-material/CardGiftcard";
import NotificationsIcon from "@mui/icons-material/Notifications";
import FavoriteIcon from "@mui/icons-material/Favorite";
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import MoodIcon from '@mui/icons-material/Mood';
import SettingsIcon from '@mui/icons-material/Settings';

import { useNavigate, useLocation } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { useAuth } from "../contexts/AuthContext";

/**
 * Props:
 *  - mobileOpen: bool (temporary drawer for mobile)
 *  - isOpen: bool (for desktop drawer)
 *  - onDrawerToggle: function to open/close mobile drawer
 *  - variant: "persistent" or "temporary" (for desktop vs. mobile)
 * 
 * On desktop, we do a persistent left drawer pinned below top bar.
 * On mobile, we do temporary (slide in/out).
 */

const DRAWER_WIDTH = 240;

const menuItems = [
  // Main Features
  { text: 'Home', icon: <HomeIcon />, path: '/app', key: 'home' },
  { text: 'Messages', icon: <MessageIcon />, path: '/app/messages', key: 'messages' },
  { text: 'Stars', icon: <StarIcon />, path: '/app/stars', key: 'stars' },
  { text: 'Coupons', icon: <CardGiftcardIcon />, path: '/app/coupons', key: 'coupons' },
  { text: 'Schedule', icon: <CalendarMonthIcon />, path: '/app/schedule', key: 'schedule' },
  { text: 'Mood', icon: <MoodIcon />, path: '/app/mood', key: 'mood' },
  
  // Productivity
  { category: 'Productivity', key: 'productivity-header' },
  { text: 'Reminders', icon: <NotificationsIcon />, path: '/app/reminders', key: 'reminders' },
  { text: 'Accountability', icon: <AssignmentIcon />, path: '/app/accountability', key: 'accountability' },
  
  // Settings
  { category: 'Settings', key: 'settings-header' },
  { text: 'Partner', icon: <FavoriteIcon />, path: '/app/partner', key: 'partner' },
  { text: 'Profile Settings', icon: <SettingsIcon />, path: '/app/settings', key: 'settings' },
  
  // Admin (only shown to admin users)
  { category: 'Admin', key: 'admin-header' },
  { text: 'Admin Dashboard', icon: <AdminPanelSettingsIcon />, path: '/app/admin', key: 'admin' }
];

export default function SideBar({
  mobileOpen,
  isOpen,
  onDrawerToggle,
  variant = "permanent"
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const { user, isAdmin } = useAuth();

  async function handleLogout() {
    await signOut(auth);
    navigate("/login");
  }

  const drawerContent = (
    <Box
      role="navigation"
      aria-label="Main navigation"
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: alpha('#000000', 0.2),
        backdropFilter: 'blur(20px)',
        color: '#fff',
        position: 'relative',
        pt: { xs: 7, sm: 8 },  // Increased top padding to account for top bar
        borderRight: `1px solid ${alpha('#fff', 0.1)}`,
      }}
    >
      {/* Close button */}
      <IconButton
        onClick={onDrawerToggle}
        aria-label="Close navigation menu"
        sx={{
          position: 'absolute',
          top: { xs: 12, sm: 16 },
          right: { xs: 8, sm: 12 },
          color: alpha('#fff', 0.7),
          '&:hover': {
            color: '#fff'
          }
        }}
      >
        <ChevronLeftIcon />
      </IconButton>

      {/* User Info */}
      <Box 
        component="section"
        aria-label="User profile"
        sx={{ 
          px: 2,
          pb: 2,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 1
        }}
      >
        <Avatar
          src={user?.photoURL}
          alt={user?.displayName || user?.email}
          sx={{
            width: { xs: 48, sm: 64 },
            height: { xs: 48, sm: 64 },
            mb: 1,
            border: `2px solid ${alpha('#fff', 0.2)}`
          }}
        >
          {user?.displayName?.[0] || user?.email?.[0]}
        </Avatar>
        <Typography variant="subtitle1" sx={{ 
          fontWeight: 600,
          fontSize: { xs: '0.9rem', sm: '1rem' },
          textAlign: 'center',
          wordBreak: 'break-word'
        }}>
          {user?.displayName || user?.email}
        </Typography>
      </Box>

      <Divider sx={{ 
        mb: 2,
        borderColor: alpha('#fff', 0.1)
      }} />

      {/* Navigation Menu */}
      <List 
        component="nav"
        aria-label="Main menu"
        sx={{ flex: 1, px: 1 }}
      >
        {menuItems.map((item, index) => {
          if (item.category) {
            return (
              <Typography
                key={item.category}
                variant="overline"
                component="h2"
                sx={{
                  px: 2,
                  py: 1,
                  display: 'block',
                  color: alpha('#fff', 0.5),
                  fontSize: '0.7rem',
                  fontWeight: 600
                }}
              >
                {item.category}
              </Typography>
            );
          }

          // Skip admin items for non-admin users
          if (item.text === 'Admin Dashboard' && !isAdmin) {
            return null;
          }

          return (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                onClick={() => {
                  navigate(item.path);
                  if (window.innerWidth < 600) {
                    onDrawerToggle();
                  }
                }}
                selected={location.pathname === item.path}
                aria-current={location.pathname === item.path ? 'page' : undefined}
                sx={{
                  borderRadius: '12px',
                  mb: 0.5,
                  color: location.pathname === item.path ? '#fff' : alpha('#fff', 0.7),
                  bgcolor: location.pathname === item.path ? alpha('#fff', 0.1) : 'transparent',
                  '&:hover': {
                    bgcolor: alpha('#fff', 0.15),
                  },
                  '&.Mui-selected': {
                    bgcolor: alpha('#fff', 0.1),
                    '&:hover': {
                      bgcolor: alpha('#fff', 0.15),
                    }
                  }
                }}
              >
                <ListItemIcon sx={{ 
                  color: 'inherit',
                  minWidth: 40
                }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.text}
                  primaryTypographyProps={{
                    fontSize: { xs: '0.9rem', sm: '1rem' },
                    fontWeight: location.pathname === item.path ? 600 : 400
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      {/* Logout Button */}
      <Box sx={{ p: 2 }}>
        <ListItemButton
          onClick={handleLogout}
          aria-label="Log out"
          sx={{
            borderRadius: '12px',
            color: alpha('#fff', 0.7),
            '&:hover': {
              bgcolor: alpha('#ee7b78', 0.15),
              color: '#fff'
            }
          }}
        >
          <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}>
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText 
            primary="Logout"
            primaryTypographyProps={{
              fontSize: { xs: '0.9rem', sm: '1rem' }
            }}
          />
        </ListItemButton>
      </Box>
    </Box>
  );

  return (
    <>
      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        anchor="left"
        open={mobileOpen}
        onClose={onDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better mobile performance
          disableScrollLock: true, // Prevent scroll issues
          disablePortal: true // Keep focus within drawer
        }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            bgcolor: 'transparent',
            border: 'none'
          }
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Desktop Drawer */}
      <Drawer
        variant="permanent"
        anchor="left"
        open={isOpen}
        sx={{
          display: { xs: 'none', sm: 'block' },
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            bgcolor: 'transparent',
            border: 'none',
            position: 'fixed',
            transform: isOpen ? 'none' : `translateX(-${DRAWER_WIDTH}px)`,
            transition: 'transform 0.3s ease-in-out'
          }
        }}
      >
        {drawerContent}
      </Drawer>
    </>
  );
}