import {
  Box,
  Typography,
  ToggleButtonGroup,
  ToggleButton,
  IconButton,
  Tooltip,
  Popover,
} from '@mui/material';
import { useTheme } from '../theme/ThemeContext';
import { colorOptions } from '../theme/ThemeContext';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import { useState } from 'react';

/**
 * Component for managing theme settings
 */
export const ThemeSettings = () => {
  const { mode, primaryColor, setMode, setPrimaryColor } = useTheme();
  const [colorAnchor, setColorAnchor] = useState(null);

  const handleModeChange = (event, newMode) => {
    if (newMode !== null) {
      setMode(newMode);
    }
  };

  const handleColorClick = (event) => {
    setColorAnchor(event.currentTarget);
  };

  const handleColorClose = () => {
    setColorAnchor(null);
  };

  const handleColorChange = (color) => {
    setPrimaryColor(color);
    handleColorClose();
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      <ToggleButtonGroup
        value={mode}
        exclusive
        onChange={handleModeChange}
        aria-label="theme mode"
        size="small"
      >
        <ToggleButton value="light" aria-label="light mode">
          <LightModeIcon />
        </ToggleButton>
        <ToggleButton value="dark" aria-label="dark mode">
          <DarkModeIcon />
        </ToggleButton>
      </ToggleButtonGroup>

      <Tooltip title="Change primary color">
        <IconButton
          onClick={handleColorClick}
          sx={{
            width: 40,
            height: 40,
            backgroundColor: primaryColor,
            '&:hover': {
              backgroundColor: primaryColor,
              opacity: 0.8,
            },
          }}
        >
          <Box
            sx={{
              width: 24,
              height: 24,
              borderRadius: '50%',
              border: '2px solid',
              borderColor: mode === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.2)',
            }}
          />
        </IconButton>
      </Tooltip>

      <Popover
        open={Boolean(colorAnchor)}
        anchorEl={colorAnchor}
        onClose={handleColorClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
            Primary Color
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1 }}>
            {colorOptions.map((color) => (
              <Tooltip key={color.name} title={color.name}>
                <IconButton
                  onClick={() => handleColorChange(color.value)}
                  sx={{
                    width: 40,
                    height: 40,
                    backgroundColor: color.value,
                    '&:hover': {
                      backgroundColor: color.value,
                      opacity: 0.8,
                    },
                  }}
                >
                  {color.value === primaryColor && (
                    <Box
                      sx={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        border: '2px solid',
                        borderColor: mode === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.2)',
                      }}
                    />
                  )}
                </IconButton>
              </Tooltip>
            ))}
          </Box>
        </Box>
      </Popover>
    </Box>
  );
}; 