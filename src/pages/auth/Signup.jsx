/**
 * Signup Page Component
 * 
 * Handles new user registration through Supabase authentication.
 * Provides a form interface for users to:
 * - Enter their email, password, and personal details
 * - Create a new account
 * - Navigate to login if they already have an account
 * 
 * Features:
 * - Form validation for all fields
 * - Error handling and display
 * - Success state management
 * - Loading state during submission
 * - Secure account creation via Supabase
 * - Responsive design
 * 
 * @component
 * @returns {JSX.Element} The rendered signup form
 */

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

/**
 * Signup component that manages new user registration
 */
function Signup() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
  });

  /**
   * Handles form input changes and clears any existing errors
   * @param {React.ChangeEvent<HTMLInputElement>} e - The input change event
   */
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
    setSuccess(false);

    try {
      // Sign up the user
      const { data: { user }, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
          }
        }
      });

      if (signUpError) throw signUpError;

      // Create user profile
      const { error: profileError } = await supabase
        .from('users')
        .insert([
          {
            id: user.id,
            email: formData.email,
            first_name: formData.firstName,
            last_name: formData.lastName,
          }
        ]);

      if (profileError) throw profileError;
      
      setSuccess(true);
      // Clear form
      setFormData({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
      });
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
            Create your AutoCRM Account
          </Typography>

          {error && (
            <Alert 
              severity="error" 
              sx={{ mb: 3 }}
            >
              {error}
            </Alert>
          )}

          {success ? (
            <Box sx={{ mb: 3 }}>
              <Alert 
                severity="success" 
                sx={{ mb: 2 }}
              >
                Account created successfully! Please check your email to confirm your account.
              </Alert>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                We've sent a confirmation link to your email address. Please click the link to activate your account.
              </Typography>
              <Button
                variant="contained"
                fullWidth
                onClick={() => navigate('/login')}
                sx={{
                  height: 48,
                  backgroundColor: 'primary.main',
                  '&:hover': {
                    backgroundColor: 'primary.dark',
                  },
                }}
              >
                Go to Login
              </Button>
            </Box>
          ) : (
            <form onSubmit={handleSubmit}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField
                    required
                    fullWidth
                    label="First Name"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                  />
                  <TextField
                    required
                    fullWidth
                    label="Last Name"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                  />
                </Box>

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
                  {loading ? 'Creating Account...' : 'Create Account'}
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
                    Already have an account? Sign in
                  </Link>
                </Box>
              </Box>
            </form>
          )}
        </Paper>
      </Box>
    </Box>
  );
}

export default Signup; 