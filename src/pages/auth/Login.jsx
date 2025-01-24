import { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
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

function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) throw error;
      navigate('/workspaces');
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
            Sign In to AutoCRM
          </Typography>

          {error && (
            <Alert 
              severity="error" 
              sx={{ 
                mb: 3,
              }}
            >
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <TextField
                required
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
              />

              <TextField
                required
                fullWidth
                label="Password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
              />

              <Button
                type="submit"
                variant="contained"
                disabled={loading}
                sx={{
                  height: 48,
                  backgroundColor: 'primary.main',
                  '&:hover': {
                    backgroundColor: 'primary.dark',
                  },
                }}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>

              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center',
                mt: 1 
              }}>
                <Link
                  component={RouterLink}
                  to="/signup"
                  sx={{
                    color: 'secondary.main',
                    textDecoration: 'none',
                    '&:hover': {
                      textDecoration: 'underline',
                    },
                  }}
                >
                  Need an account?
                </Link>
                <Link
                  component={RouterLink}
                  to="/forgot-password"
                  sx={{
                    color: 'secondary.main',
                    textDecoration: 'none',
                    '&:hover': {
                      textDecoration: 'underline',
                    },
                  }}
                >
                  Forgot Password?
                </Link>
              </Box>
            </Box>
          </form>
        </Paper>
      </Box>
    </Box>
  );
}

export default Login; 