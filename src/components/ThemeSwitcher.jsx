import React from 'react';
import { Box, IconButton, Menu, MenuItem, Tooltip } from '@mui/material';
import PaletteIcon from '@mui/icons-material/Palette';
import { useTheme } from '../contexts/ThemeContext';

const THEME_DISPLAY_NAMES = {
  pinkPurple: "Pink & Purple",
  bluePurple: "Blue & Purple"
};

const ThemeSwitcher = () => {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const { currentTheme, changeTheme, themeOptions } = useTheme();
  
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleThemeChange = (theme) => {
    changeTheme(theme);
    handleClose();
  };

  return (
    <Box>
      <Tooltip title="Change theme">
        <IconButton onClick={handleClick} color="inherit">
          <PaletteIcon />
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
      >
        {themeOptions.map((theme) => (
          <MenuItem
            key={theme}
            onClick={() => handleThemeChange(theme)}
            selected={theme === currentTheme}
          >
            {THEME_DISPLAY_NAMES[theme] || theme}
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
};

export default ThemeSwitcher; 