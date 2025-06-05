// src/components/DashboardLayout.jsx

import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Box } from "@mui/material";
import TopBar from "./TopBar";
import SideBar from "./SideBar";
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';

const DRAWER_WIDTH = 240;

export default function DashboardLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isOpen, setIsOpen] = useState(true);

  const handleDrawerToggle = () => {
    if (window.innerWidth < 600) {
      setMobileOpen(!mobileOpen);
    } else {
      setIsOpen(!isOpen);
    }
  };

  return (
    <Box sx={{ 
      display: 'flex',
      minHeight: '100vh',
      position: 'relative',
      overflow: 'hidden'  // Prevent body scroll when drawer is open
    }}>
      {/* TopBar - Fixed at the top */}
      <TopBar onDrawerToggle={handleDrawerToggle} />
      
      {/* Main Content - Fills remaining space */}
      <Box
        component="main"
        role="main"
        tabIndex="-1"
        sx={{
          flexGrow: 1,
          width: {
            xs: '100%',
            sm: `calc(100% - ${isOpen ? DRAWER_WIDTH : 0}px)`
          },
          ml: { sm: isOpen ? `${DRAWER_WIDTH}px` : 0 },  // Margin for sidebar on desktop
          mt: { xs: '56px', sm: '64px' },  // Space for top bar
          transition: 'margin 0.3s ease, width 0.3s ease',
          position: 'relative',
          zIndex: 1,  // Ensure main content is above the backdrop
          overflow: 'auto',
          WebkitOverflowScrolling: 'touch',  // Smooth scroll on iOS
          height: {
            xs: 'calc(100vh - 56px)',  // Full height minus mobile top bar
            sm: 'calc(100vh - 64px)'   // Full height minus desktop top bar
          },
          '&:focus': {
            outline: 'none'
          }
        }}
      >
        <Outlet />
      </Box>

      {/* SideBar - Fixed position */}
      <SideBar 
        mobileOpen={mobileOpen}
        isOpen={isOpen}
        onDrawerToggle={handleDrawerToggle}
        variant="permanent"
        menuItems={[
          {
            text: 'Schedule',
            icon: <CalendarMonthIcon />,
            path: '/schedule'
          },
        ]}
      />
    </Box>
  );
}