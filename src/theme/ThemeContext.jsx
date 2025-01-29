import { createContext, useContext, useState, useEffect } from 'react';
import { createTheme, ThemeProvider as MuiThemeProvider } from '@mui/material';
import { supabase } from '../lib/supabaseClient';

const ThemeContext = createContext();

/**
 * Available theme options with complete color palettes
 */
export const themeOptions = [
  {
    name: 'Dark+',
    light: {
      primary: {
        main: '#0098FF',
        light: '#1EABFF',
        dark: '#0082DB',
        contrastText: '#FFFFFF'
      },
      secondary: {
        main: '#3B3B3B',
        light: '#4D4D4D',
        dark: '#292929',
        contrastText: '#FFFFFF'
      },
      accent: '#E8F5FE',
      background: {
        default: '#FFFFFF',
        paper: '#F3F3F3'
      }
    },
    dark: {
      primary: {
        main: '#0098FF',
        light: '#1EABFF',
        dark: '#0082DB',
        contrastText: '#FFFFFF'
      },
      secondary: {
        main: '#3B3B3B',
        light: '#4D4D4D',
        dark: '#292929',
        contrastText: '#FFFFFF'
      },
      accent: '#264F78',
      background: {
        default: '#181818',
        paper: '#1E1E1E'
      }
    }
  },
  {
    name: 'Monokai',
    light: {
      primary: {
        main: '#FF6188',
        light: '#FF7A9D',
        dark: '#E64C77',
        contrastText: '#FFFFFF'
      },
      secondary: {
        main: '#A9DC76',
        light: '#BBE38B',
        dark: '#98C567',
        contrastText: '#000000'
      },
      accent: '#FFE6EB',
      background: {
        default: '#FFFFFF',
        paper: '#F3F3F3'
      }
    },
    dark: {
      primary: {
        main: '#FF6188',
        light: '#FF7A9D',
        dark: '#E64C77',
        contrastText: '#FFFFFF'
      },
      secondary: {
        main: '#A9DC76',
        light: '#BBE38B',
        dark: '#98C567',
        contrastText: '#000000'
      },
      accent: '#403E41',
      background: {
        default: '#181818',
        paper: '#1E1E1E'
      }
    }
  },
  {
    name: 'Teal',
    light: {
      primary: {
        main: '#16494D',
        light: '#235E63',
        dark: '#0D3538',
        contrastText: '#FFFFFF'
      },
      secondary: {
        main: '#607D3B',
        light: '#7A9550',
        dark: '#4C6430',
        contrastText: '#FFFFFF'
      },
      accent: '#E3F2E6',
      background: {
        default: '#F3F3F3',
        paper: '#FFFFFF'
      }
    },
    dark: {
      primary: {
        main: '#1C5F64',
        light: '#2B7A80',
        dark: '#134448',
        contrastText: '#FFFFFF'
      },
      secondary: {
        main: '#739649',
        light: '#8CAD62',
        dark: '#5A7F30',
        contrastText: '#FFFFFF'
      },
      accent: '#1E3A2D',
      background: {
        default: '#181818',
        paper: '#1E1E1E'
      }
    }
  },
  {
    name: 'Ocean',
    light: {
      primary: {
        main: '#1976D2',
        light: '#2196F3',
        dark: '#0D47A1',
        contrastText: '#FFFFFF'
      },
      secondary: {
        main: '#26A69A',
        light: '#4DB6AC',
        dark: '#00796B',
        contrastText: '#FFFFFF'
      },
      accent: '#E1F5FE',
      background: {
        default: '#F3F3F3',
        paper: '#FFFFFF'
      }
    },
    dark: {
      primary: {
        main: '#0D5FA3',
        light: '#1976D2',
        dark: '#064884',
        contrastText: '#FFFFFF'
      },
      secondary: {
        main: '#00897B',
        light: '#26A69A',
        dark: '#00695C',
        contrastText: '#FFFFFF'
      },
      accent: '#163449',
      background: {
        default: '#181818',
        paper: '#1E1E1E'
      }
    }
  },
  {
    name: 'Night Owl',
    light: {
      primary: {
        main: '#2AA298',
        light: '#35B5AA',
        dark: '#218F86',
        contrastText: '#FFFFFF'
      },
      secondary: {
        main: '#994CC3',
        light: '#A85FCE',
        dark: '#8A39B8',
        contrastText: '#FFFFFF'
      },
      accent: '#E0E0E0',
      background: {
        default: '#F3F3F3',
        paper: '#FFFFFF'
      }
    },
    dark: {
      primary: {
        main: '#7FDBCA',
        light: '#94E1D3',
        dark: '#6AC4B2',
        contrastText: '#000000'
      },
      secondary: {
        main: '#C792EA',
        light: '#D1A6EE',
        dark: '#BD7EE6',
        contrastText: '#000000'
      },
      accent: '#2F3043',
      background: {
        default: '#181818',
        paper: '#1E1E1E'
      }
    }
  }
];

/**
 * Update defaultThemePreferences to include the full palette
 */
const defaultThemePreferences = {
  mode: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
  theme: 'Dark+'
};

/**
 * Custom hook to use theme context
 */
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

/**
 * Theme provider component
 */
export const ThemeProvider = ({ children }) => {
  const [themePreferences, setThemePreferences] = useState(defaultThemePreferences);
  const [loading, setLoading] = useState(true);

  // Fetch theme preferences from Supabase
  useEffect(() => {
    const fetchThemePreferences = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from('user_preferences')
          .select('theme_preferences')
          .eq('user_id', user.id)
          .single();

        if (error) throw error;

        if (data?.theme_preferences) {
          setThemePreferences(data.theme_preferences);
        }
      } catch (error) {
        console.error('Error fetching theme preferences:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchThemePreferences();
  }, []);

  // Save theme preferences to Supabase
  const saveThemePreferences = async (newPreferences) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          theme_preferences: newPreferences,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id',
          ignoreDuplicates: false
        });

      if (error) throw error;

      setThemePreferences(newPreferences);
    } catch (error) {
      console.error('Error saving theme preferences:', error);
      throw error;
    }
  };

  // Create MUI theme
  const theme = createTheme({
    palette: {
      mode: themePreferences.mode,
      ...(themeOptions.find(t => t.name === themePreferences.theme)?.[themePreferences.mode] || themeOptions[0][themePreferences.mode]),
    },
    shape: {
      borderRadius: 0,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            borderRadius: 0,
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
        },
      },
    },
  });

  const value = {
    mode: themePreferences.mode,
    theme: themePreferences.theme,
    setMode: (mode) => saveThemePreferences({ ...themePreferences, mode }),
    setTheme: (theme) => saveThemePreferences({ ...themePreferences, theme }),
    loading,
  };

  if (loading) {
    return null; // Or a loading spinner if you prefer
  }

  return (
    <ThemeContext.Provider value={value}>
      <MuiThemeProvider theme={theme}>
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
}; 