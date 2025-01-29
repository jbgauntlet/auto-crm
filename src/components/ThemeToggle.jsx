import { IconButton } from '@mui/material';
import { DarkMode as DarkModeIcon, LightMode as LightModeIcon } from '@mui/icons-material';
import { useTheme } from '../theme/ThemeContext';

export const ThemeToggle = () => {
  const { mode, setMode } = useTheme();

  const handleToggle = () => {
    setMode(mode === 'light' ? 'dark' : 'light');
  };

  return (
    <IconButton
      onClick={handleToggle}
      sx={{
        color: 'primary.contrastText',
      }}
    >
      {mode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
    </IconButton>
  );
}; 