// src/themes/pinkPurpleTheme.js
import { createTheme, alpha } from "@mui/material/styles";
import { keyframes } from "@mui/system";

/**
 * Swirl gradient animation matching LoginPage exactly:
 * Same timing (12s), same easing (ease), same color stops
 */
const swirlGradient = keyframes`
  0% { background-position: 0% 0%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 0%; }
`;

export const pinkPurpleTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: "#f78fb3" },
    secondary: { main: "#c56cf0" },
    text: {
      primary: "#fff",
      secondary: alpha("#ffffff", 0.7)
    },
    background: {
      /**
       * For fallback if swirl not loaded, keep a deeper pink
       * so it isn't "too bright".
       */
      default: "#7b2e59",
      /**
       * Paper => a semi-translucent frosted overlay, 
       * but slightly darker than the login "card" 
       * so everything isn't "too bright".
       */
      paper: alpha("#ffffff", 0.08)
    }
  },
  typography: {
    fontFamily: "'Quicksand', system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
    h1: {
      fontSize: '3.5rem',
      fontWeight: 700,
      letterSpacing: '-0.02em',
      lineHeight: 1.2
    },
    h2: {
      fontSize: '2.75rem',
      fontWeight: 700,
      letterSpacing: '-0.01em'
    },
    h3: {
      fontSize: '2.25rem',
      fontWeight: 600,
      letterSpacing: '-0.01em'
    },
    h4: {
      fontSize: '1.75rem',
      fontWeight: 600,
      letterSpacing: '-0.005em'
    },
    body1: {
      fontSize: '1.125rem',
      letterSpacing: '0.01em',
      lineHeight: 1.6
    },
    button: {
      letterSpacing: '0.02em',
      fontWeight: 600
    }
  },
  components: {
    // 1) We apply the swirl to the entire body:
    MuiCssBaseline: {
      styleOverrides: {
        "@keyframes swirl": swirlGradient,
        "html, body, #root": {
          margin: 0,
          padding: 0,
          minHeight: "100vh"
        },
        body: {
          background: "linear-gradient(-45deg, #ee7b78, #fbc2eb, #b89ee5, #ee7b78)",
          backgroundSize: "400% 400%",
          animation: "swirl 12s ease infinite",
          color: "#fff",
          minHeight: "100vh",
          overflowX: "hidden"
        }
      }
    },

    // 2) Paper => frosted, with a subtle border
    MuiPaper: {
      styleOverrides: {
        root: {
          backdropFilter: 'blur(20px)',
          backgroundColor: alpha('#ffffff', 0.07),
          border: `1px solid ${alpha('#ffffff', 0.1)}`,
          boxShadow: `
            0 4px 24px -1px ${alpha('#000000', 0.1)},
            0 2px 8px -1px ${alpha('#000000', 0.06)}
          `,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            backgroundColor: alpha('#ffffff', 0.09),
            transform: 'translateY(-2px)',
            boxShadow: `
              0 8px 32px -1px ${alpha('#000000', 0.12)},
              0 4px 16px -1px ${alpha('#000000', 0.07)}
            `
          }
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          padding: '10px 24px',
          textTransform: 'none',
          fontWeight: 600,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-1px)'
          }
        }
      }
    }
  }
});