import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Button } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

function NotFound() {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        textAlign: 'center',
        p: 3,
      }}
    >
      <ErrorOutlineIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
      <Typography variant="h4" component="h1" sx={{ mb: 2, color: 'primary.main' }}>
        Page Not Found
      </Typography>
      <Typography variant="body1" sx={{ mb: 4, maxWidth: 500 }}>
        The page you're looking for doesn't exist or you don't have permission to access it.
      </Typography>
      <Button
        variant="contained"
        onClick={() => navigate(-1)}
        sx={{
          backgroundColor: 'primary.main',
          '&:hover': {
            backgroundColor: 'primary.dark',
          }
        }}
      >
        Go Back
      </Button>
    </Box>
  );
}

export default NotFound; 