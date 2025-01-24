import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  Link,
  Paper,
} from '@mui/material';

function ForgotPassword() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;
      setSuccess(true);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box 
      sx={{ 
        minHeight: '100vh',
        width: '100%',
        backgroundColor: 'background.default',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box
        sx={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 3,
          mt: '-5%',
          overflow: 'hidden',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            width: '40%',
            minWidth: '400px',
          }}
        >
          <Typography
            variant="h5"
            component="h1"
            gutterBottom
            sx={{
              color: 'primary.main',
              fontWeight: 600,
              textAlign: 'left',
              mb: 4,
            }}
          >
            Reset Password
          </Typography>

          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{ mb: 3, textAlign: 'left' }}
          >
            Enter your email to receive reset instructions
          </Typography>

          {error && (
            <Alert 
              severity="error" 
              sx={{ mb: 3 }}
            >
              {error}
            </Alert>
          )}

          {success && (
            <Alert 
              severity="success" 
              sx={{ mb: 3 }}
            >
              Check your email for the password reset link
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <TextField
                required
                fullWidth
                type="email"
                label="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <Button
                type="submit"
                variant="contained"
                disabled={loading || !email}
                sx={{
                  height: 48,
                  backgroundColor: 'primary.main',
                  '&:hover': {
                    backgroundColor: 'primary.dark',
                  },
                }}
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </Button>

              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center',
                alignItems: 'center',
                mt: 1 
              }}>
                <Link
                  component={RouterLink}
                  to="/login"
                  sx={{
                    color: 'secondary.main',
                    textDecoration: 'none',
                    '&:hover': {
                      textDecoration: 'underline',
                    },
                  }}
                >
                  Back to Login
                </Link>
              </Box>
            </Box>
          </form>
        </Paper>
      </Box>
    </Box>
  );
}

export default ForgotPassword; 