import { Box, CircularProgress, Typography } from '@mui/material';

/**
 * A reusable loading spinner component with optional message
 */
export const LoadingSpinner = ({ message, size = 40, sx = {} }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        p: 4,
        ...sx
      }}
    >
      <CircularProgress
        size={size}
        sx={{
          color: 'primary.main'
        }}
      />
      {message && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ fontWeight: 500 }}
        >
          {message}
        </Typography>
      )}
    </Box>
  );
}; 