import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    primary: {
      main: '#1565C0',
      light: '#42A5F5',
      dark: '#0D47A1',
      contrastText: '#FFFFFF'
    },
    secondary: {
      main: '#F9A825',
      light: '#FFD54F',
      dark: '#F57F17',
      contrastText: '#1A2B3C'
    },
    success: {
      main: '#2E7D32',
      light: '#66BB6A'
    },
    error: {
      main: '#C62828',
      light: '#EF5350'
    },
    background: {
      default: '#F5F7FA',
      paper: '#FFFFFF'
    },
    text: {
      primary: '#1A2B3C',
      secondary: '#5A6B7C'
    }
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
      fontSize: '2.5rem',
      lineHeight: 1.2
    },
    h2: {
      fontWeight: 600,
      fontSize: '2rem',
      lineHeight: 1.3
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.5rem',
      lineHeight: 1.4
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.15rem',
      lineHeight: 1.4
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.5
    }
  },
  shape: {
    borderRadius: 12
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 8,
          padding: '10px 24px'
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 2px 12px rgba(0, 0, 0, 0.06)'
        }
      }
    }
  }
});
