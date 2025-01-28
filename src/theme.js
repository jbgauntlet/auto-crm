/**
 * Material-UI Theme Configuration
 * 
 * A custom theme configuration for the application using Material-UI's theming system.
 * Provides consistent styling and branding across all components.
 * 
 * Features:
 * - Typography:
 *   - System font stack for optimal rendering
 *   - Consistent heading weights
 *   - Custom button text styling
 * 
 * - Color Palette:
 *   - Primary: Deep teal (#16494D)
 *   - Secondary: Blue (#2073B7)
 *   - Success: Forest green (#164D23)
 *   - Error: Red (#C72A1C)
 *   - Custom colors for specific use cases
 * 
 * - Component Customization:
 *   - Buttons: No text transform, square corners
 *   - Cards: Consistent shadow and square corners
 *   - Data Grid: Custom header styling
 *   - Text Fields: Square corners, weighted labels
 *   - Alerts: Square corners
 *   - Typography: Custom letter spacing
 * 
 * - Global Styles:
 *   - Reset margins and padding
 *   - Controlled viewport behavior
 *   - Base background color
 *   - Overflow handling
 */

import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  typography: {
    fontFamily: [
      'system-ui',
      '-apple-system',
      'BlinkMacSystemFont',
      'Segoe UI',
      'Roboto',
      'Oxygen',
      'Ubuntu',
      'Cantarell',
      'Fira Sans',
      'Droid Sans',
      'Helvetica Neue',
      'sans-serif',
    ].join(','),
    h1: {
      fontWeight: 600,
    },
    h2: {
      fontWeight: 600,
    },
    h3: {
      fontWeight: 600,
    },
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
    },
  },
  palette: {
    primary: {
      main: '#16494D',
      light: '#DBEDED',
      dark: '#0D2D30',
      contrastText: '#F8F9F9',
    },
    secondary: {
      main: '#2073B7',
      light: '#4091D9',
      dark: '#165080',
      contrastText: '#F8F9F9',
    },
    success: {
      main: '#164D23',
      light: '#1E6B31',
      dark: '#0E3016',
      contrastText: '#F8F9F9',
    },
    error: {
      main: '#C72A1C',
      light: '#E85A4F',
      dark: '#8B1D13',
    },
    background: {
      default: '#F8F9F9',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#16494D',
      secondary: '#68868B',
    },
    custom: {
      primaryLightContrast: '#008079',
      primaryGray: '#68868B',
      lightGray: '#E9EBED',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 0,
          fontWeight: 500,
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          boxShadow: '0 2px 8px rgba(22, 73, 77, 0.1)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 0,
        },
      },
    },
    MuiDataGrid: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          border: 'none',
          backgroundColor: '#FFFFFF',
          boxShadow: '0 2px 8px rgba(22, 73, 77, 0.1)',
          '& .MuiDataGrid-columnHeaders': {
            backgroundColor: '#DBEDED',
            color: '#16494D',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiInputLabel-root': {
            fontWeight: 500,
          },
          '& .MuiOutlinedInput-root': {
            borderRadius: 0,
          },
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 0,
        },
      },
    },
    MuiTypography: {
      styleOverrides: {
        root: {
          letterSpacing: '-0.01em',
        },
      },
    },
    MuiCssBaseline: {
      styleOverrides: {
        '*': {
          margin: 0,
          padding: 0,
          boxSizing: 'border-box',
        },
        html: {
          width: '100vw',
          overflowX: 'hidden',
        },
        body: {
          backgroundColor: '#E6EDED',
          margin: 0,
          padding: 0,
          width: '100vw',
          overflowX: 'hidden',
        },
        '#root': {
          margin: 0,
          padding: 0,
          width: '100vw',
          maxWidth: '100vw',
          overflowX: 'hidden',
        },
      },
    },
  },
});

export default theme; 