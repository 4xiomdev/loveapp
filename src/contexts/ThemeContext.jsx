import React, { createContext, useContext, useState, useEffect } from 'react';
import { ThemeProvider as MuiThemeProvider, CssBaseline } from '@mui/material';
import { THEME_OPTIONS } from '../themes/themeConfig';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthContext';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState('pinkPurple'); // Default theme
  const { user } = useAuth();

  // Get the theme object directly from THEME_OPTIONS
  const theme = THEME_OPTIONS[currentTheme];

  const changeTheme = async (newTheme) => {
    if (!THEME_OPTIONS[newTheme]) return;
    
    setCurrentTheme(newTheme);
    localStorage.setItem('userTheme', newTheme);

    // If user is logged in, update Firestore directly
    if (user) {
      try {
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, {
          theme: newTheme
        });
      } catch (error) {
        console.error("Error updating theme:", error);
        // Revert local changes if server update fails
        const savedTheme = localStorage.getItem('userTheme');
        if (savedTheme && THEME_OPTIONS[savedTheme]) {
          setCurrentTheme(savedTheme);
        }
      }
    }
  };

  // Load theme from localStorage on initial mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('userTheme');
    if (savedTheme && THEME_OPTIONS[savedTheme]) {
      setCurrentTheme(savedTheme);
    }
  }, []);

  // Sync with Firestore when user changes
  useEffect(() => {
    if (!user) return;
    
    const unsubscribe = onSnapshot(doc(db, "users", user.uid), (doc) => {
      if (doc.exists() && doc.data().theme && THEME_OPTIONS[doc.data().theme]) {
        const firestoreTheme = doc.data().theme;
        setCurrentTheme(firestoreTheme);
        localStorage.setItem('userTheme', firestoreTheme);
      }
    });

    return () => unsubscribe();
  }, [user]);

  if (!theme) {
    console.error('Theme not found:', currentTheme);
    return null;
  }

  return (
    <ThemeContext.Provider value={{ currentTheme, changeTheme, themeOptions: Object.keys(THEME_OPTIONS) }}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
}; 