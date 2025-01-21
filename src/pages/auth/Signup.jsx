import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { 
  Card, 
  CardContent, 
  TextField, 
  Button, 
  Typography, 
  Box, 
  InputAdornment, 
  IconButton,
  Alert,
  Divider,
  Container,
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import { 
  Email as EmailIcon,
  Lock as LockIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
} from '@mui/icons-material';

const steps = [
  { field: 'email', label: 'Email', type: 'email', icon: EmailIcon },
  { field: 'first_name', label: 'First Name', type: 'text', icon: PersonIcon },
  { field: 'last_name', label: 'Last Name', type: 'text', icon: PersonIcon },
  { field: 'phone', label: 'Phone Number', type: 'tel', icon: PhoneIcon },
  { field: 'password', label: 'Password', type: 'password', icon: LockIcon },
];

function Signup() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    phone: '',
    password: '',
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(null);
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (currentStep !== steps.length - 1) {
      handleNext();
      return;
    }
    
    setLoading(true);
    try {
      // Sign up the user with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            first_name: formData.first_name,
            last_name: formData.last_name,
            phone: formData.phone,
            role: 'owner', // Set role in auth metadata
          },
        },
      });

      if (authError) throw authError;

      // Create user profile in users table
      const { error: profileError } = await supabase
        .from('users')
        .insert([
          {
            id: authData.user.id,
            email: formData.email,
            first_name: formData.first_name,
            last_name: formData.last_name,
            phone: formData.phone,
            role: 'owner', // Set role in users table
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ]);

      if (profileError) throw profileError;

      // Check if user has any workspace memberships
      const { data: memberships, error: membershipError } = await supabase
        .from('workspace_memberships')
        .select('*')
        .eq('user_id', authData.user.id);

      if (membershipError) throw membershipError;

      // Redirect based on workspace membership
      if (!memberships || memberships.length === 0) {
        navigate('/create-workspace');
      } else {
        navigate('/dashboard');
      }

    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const currentField = steps[currentStep];
  const IconComponent = currentField.icon;

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Card 
          elevation={8}
          sx={{
            width: '100%',
            borderRadius: 2,
            py: 2,
          }}
        >
          <CardContent>
            <Box 
              component="form" 
              onSubmit={handleSubmit}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 3,
              }}
            >
              {/* Header */}
              <Box sx={{ textAlign: 'center', mb: 2 }}>
                <Typography variant="h4" component="h1" gutterBottom>
                  Create Account
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Join AutoCRM to get started
                </Typography>
              </Box>

              {/* Stepper */}
              <Stepper activeStep={currentStep} alternativeLabel>
                {steps.map((step, index) => (
                  <Step key={step.field}>
                    <StepLabel>{step.label}</StepLabel>
                  </Step>
                ))}
              </Stepper>

              {/* Error Alert */}
              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}

              {/* Current Field */}
              <TextField
                required
                fullWidth
                id={currentField.field}
                label={currentField.label}
                name={currentField.field}
                type={currentField.field === 'password' ? (showPassword ? 'text' : 'password') : currentField.type}
                autoComplete={currentField.field}
                autoFocus
                value={formData[currentField.field]}
                onChange={handleInputChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <IconComponent color="action" />
                    </InputAdornment>
                  ),
                  ...(currentField.field === 'password' && {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }),
                }}
              />

              {/* Navigation Buttons */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                <Button
                  onClick={handleBack}
                  disabled={currentStep === 0 || loading}
                  variant="outlined"
                  sx={{ flex: 1 }}
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading}
                  sx={{ 
                    flex: 1,
                    height: 46,
                    backgroundColor: 'primary.main',
                    '&:hover': {
                      backgroundColor: 'primary.dark',
                    },
                  }}
                >
                  {loading ? 'Creating...' : currentStep === steps.length - 1 ? 'Create Account' : 'Next'}
                </Button>
              </Box>

              {/* Divider */}
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                <Divider sx={{ flex: 1 }} />
                <Typography variant="body2" color="text.secondary" sx={{ px: 2 }}>
                  Already have an account?
                </Typography>
                <Divider sx={{ flex: 1 }} />
              </Box>

              {/* Sign In Link */}
              <Button
                component={Link}
                to="/login"
                fullWidth
                variant="outlined"
                sx={{ mt: 1 }}
              >
                Sign in
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
}

export default Signup; 