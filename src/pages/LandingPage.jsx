/**
 * Landing Page Component
 * 
 * The main landing/marketing page for Auto-CRM that showcases the application's
 * key features and benefits. It includes:
 * - Hero section with main value proposition
 * - Feature highlights with icons and descriptions
 * - Call-to-action buttons for signup/login
 * - Product screenshots and demos
 * 
 * @component
 * @returns {JSX.Element} The rendered landing page
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Stack,
  Divider,
} from '@mui/material';
import {
  Speed as SpeedIcon,
  Group as TeamIcon,
  Timeline as AnalyticsIcon,
  AutoGraph as GrowthIcon,
  Security as SecurityIcon,
  Api as IntegrationIcon,
  Help as HelpIcon,
} from '@mui/icons-material';
import crmDemo from '../assets/crm-template-demo.png';

/**
 * Main landing page component that serves as the entry point for new users
 */
function LandingPage() {
  const navigate = useNavigate();

  const features = [
    {
      icon: <SpeedIcon sx={{ fontSize: 40 }} />,
      title: 'Fast Implementation',
      description: 'Get up and running in minutes, not months. Our intuitive setup process makes it easy to start managing customer relationships right away.'
    },
    {
      icon: <TeamIcon sx={{ fontSize: 40 }} />,
      title: 'Team Collaboration',
      description: 'Unite your teams with shared inbox, group assignments, and real-time collaboration tools.'
    },
    {
      icon: <AnalyticsIcon sx={{ fontSize: 40 }} />,
      title: 'Powerful Analytics',
      description: 'Make data-driven decisions with comprehensive reporting and insights into your customer service performance.'
    },
    {
      icon: <GrowthIcon sx={{ fontSize: 40 }} />,
      title: 'Scalable Solution',
      description: 'Grow your business with a platform that scales with you, from startup to enterprise.'
    },
    {
      icon: <SecurityIcon sx={{ fontSize: 40 }} />,
      title: 'Enterprise Security',
      description: 'Rest easy with enterprise-grade security features and compliance standards built into every aspect of the platform.'
    },
    {
      icon: <IntegrationIcon sx={{ fontSize: 40 }} />,
      title: 'Easy Integration',
      description: 'Connect with your favorite tools and services through our extensive integration marketplace.'
    }
  ];

  const stats = [
    { value: '45%', label: 'Increase in Team Productivity' },
    { value: '65%', label: 'Faster Response Times' },
    { value: '89%', label: 'Customer Satisfaction' },
  ];

  return (
    <Box>
      {/* Hero Section */}
      <Box 
        sx={{ 
          background: 'linear-gradient(45deg, #16494D 30%, #008079 90%)',
          color: 'white',
          minHeight: '67vh',
          minWidth: '100vw',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <Container maxWidth="xl">
          <Grid 
            container 
            sx={{ 
              alignItems: 'center',
            }}
          >
            {/* Left Container - Text and Buttons */}
            <Grid 
              item 
              xs={12} 
              md={6} 
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                p: 4,
              }}
            >
              <Box
                sx={{
                  maxWidth: '600px',
                  mx: 'auto',
                }}
              >
                <Typography 
                  variant="h1" 
                  sx={{ 
                    fontSize: { xs: '2rem', md: '3rem' },
                    fontWeight: 700,
                    mb: 2,
                    lineHeight: 1.2,
                  }}
                >
                  Issue Tracking Made Simple with AutoCRM
                </Typography>
                <Typography 
                  variant="h2" 
                  sx={{ 
                    fontSize: { xs: '1rem', md: '1.5rem' },
                    fontWeight: 400,
                    mb: 6,
                    opacity: 0.9,
                    lineHeight: 1.4,
                  }}
                >
                  Streamline your customer support and team collaboration with our all-in-one platform
                </Typography>
                <Stack 
                  direction="row" 
                  spacing={3} 
                  justifyContent="center"
                >
                  <Button 
                    variant="contained" 
                    size="large"
                    onClick={() => navigate('/signup')}
                    sx={{
                      backgroundColor: 'white',
                      color: 'primary.main',
                      px: 4,
                      py: 1.5,
                      fontSize: '1.1rem',
                      '&:hover': {
                        backgroundColor: 'grey.100',
                      },
                    }}
                  >
                    Get Started Free
                  </Button>
                  <Button 
                    variant="outlined" 
                    size="large"
                    onClick={() => navigate('/login')}
                    sx={{
                      borderColor: 'white',
                      borderWidth: 2,
                      color: 'white',
                      px: 4,
                      py: 1.5,
                      fontSize: '1.1rem',
                      '&:hover': {
                        borderColor: 'grey.100',
                        borderWidth: 2,
                        backgroundColor: 'rgba(255,255,255,0.1)',
                      },
                    }}
                  >
                    Sign In
                  </Button>
                </Stack>
              </Box>
            </Grid>

            {/* Right Container - Platform Preview */}
            <Grid 
              item 
              xs={12} 
              md={6}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                p: 4,
              }}
            >
              <Box
                component="img"
                src={crmDemo}
                alt="Platform Preview"
                sx={{
                  width: '100%',
                  maxWidth: '700px',
                  height: 'auto',
                  borderRadius: 2,
                  boxShadow: '0 8px 40px rgba(0,0,0,0.2)',
                  transform: 'perspective(1000px) rotateY(-5deg)',
                  transition: 'transform 0.3s ease',
                  '&:hover': {
                    transform: 'perspective(1000px) rotateY(0deg)',
                  },
                }}
              />
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Stats Section */}
      <Box sx={{ 
        py: 8, 
        backgroundColor: 'primary.light',
        minHeight: '25vh',
        display: 'flex',
        alignItems: 'center',
      }}>
        <Container maxWidth="lg">
          <Grid 
            container 
            spacing={8}
            justifyContent="center"
            alignItems="center"
          >
            {stats.map((stat, index) => (
              <Grid 
                item 
                xs={12} 
                md={4}
                key={index}
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                }}
              >
                <Card 
                  elevation={0}
                  sx={{ 
                    textAlign: 'center',
                    backgroundColor: 'transparent',
                    minHeight: '20vh',
                    width: '350px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <CardContent
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '100%',
                      py: 3,
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mb: 1.5,
                      }}
                    >
                      <Typography 
                        variant="h3" 
                        sx={{ 
                          color: 'primary.main',
                          fontWeight: 700,
                          fontSize: { xs: '2.5rem', md: '3rem' },
                          lineHeight: 1,
                        }}
                      >
                        {stat.value}
                      </Typography>
                    </Box>
                    <Typography 
                      variant="h6" 
                      color="text.secondary"
                      sx={{
                        fontSize: { xs: '1rem', md: '1.25rem' },
                        lineHeight: 1.4,
                        mt: 0,
                      }}
                    >
                      {stat.label}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Features Section */}
      <Box sx={{ py: 8, backgroundColor: 'white' }}>
        <Container maxWidth="lg">
          <Typography 
            variant="h3" 
            align="center" 
            sx={{ 
              mb: 8,
              fontWeight: 600,
              color: 'primary.main'
            }}
          >
            Everything you need to deliver exceptional service
          </Typography>
          <Grid container spacing={4}>
            {features.map((feature, index) => (
              <Grid item xs={12} md={4} key={index}>
                <Card 
                  elevation={0}
                  sx={{ 
                    height: '100%',
                    backgroundColor: 'transparent',
                    '&:hover': {
                      backgroundColor: 'grey.50',
                    },
                    transition: 'background-color 0.3s'
                  }}
                >
                  <CardContent>
                    <Box sx={{ color: 'primary.main', mb: 2 }}>
                      {feature.icon}
                    </Box>
                    <Typography 
                      variant="h5" 
                      sx={{ 
                        mb: 2,
                        fontWeight: 600
                      }}
                    >
                      {feature.title}
                    </Typography>
                    <Typography color="text.secondary">
                      {feature.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Help Section */}
      <Box sx={{ py: 8, backgroundColor: 'primary.light' }}>
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography 
                variant="h3" 
                sx={{ 
                  mb: 3,
                  fontWeight: 600,
                  color: 'primary.main'
                }}
              >
                Need Help?
              </Typography>
              <Typography 
                variant="h6" 
                sx={{ 
                  mb: 4,
                  color: 'text.secondary',
                  lineHeight: 1.6
                }}
              >
                Our comprehensive help center provides detailed guides and documentation to help you make the most of AutoCRM. From getting started guides to advanced features, we've got you covered.
              </Typography>
              <Button
                variant="contained"
                size="large"
                startIcon={<HelpIcon />}
                onClick={() => navigate('/help')}
                sx={{
                  backgroundColor: 'primary.main',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: 'primary.dark',
                  }
                }}
              >
                Visit Help Center
              </Button>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ 
                p: 4, 
                backgroundColor: 'white', 
                borderRadius: 2,
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
              }}>
                <Typography variant="h6" sx={{ mb: 3, color: 'primary.main', fontWeight: 600 }}>
                  Popular Help Topics
                </Typography>
                <Stack spacing={2}>
                  {[
                    { title: 'Getting started with workspaces', section: 'Getting Started' },
                    { title: 'Managing tickets and priorities', section: 'Ticket Management' },
                    { title: 'Setting up team collaboration', section: 'Team Collaboration' },
                    { title: 'Using analytics and reporting', section: 'Analytics and Reporting' },
                    { title: 'Customizing workspace settings', section: 'Workspace Settings' }
                  ].map((topic, index) => (
                    <Box 
                      key={index}
                      sx={{ 
                        p: 2, 
                        backgroundColor: 'background.paper',
                        borderRadius: 1,
                        border: '1px solid',
                        borderColor: 'divider',
                        cursor: 'pointer',
                        '&:hover': {
                          backgroundColor: 'primary.light',
                          borderColor: 'primary.main',
                        }
                      }}
                      onClick={() => navigate(`/help?section=${encodeURIComponent(topic.section)}`)}
                    >
                      <Typography variant="body1">
                        {topic.title}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* CTA Section */}
      <Box 
        sx={{ 
          py: 8,
          backgroundColor: 'primary.main',
          color: 'white',
          textAlign: 'center'
        }}
      >
        <Container maxWidth="md">
          <Typography 
            variant="h3" 
            sx={{ 
              mb: 3,
              fontWeight: 600
            }}
          >
            Ready to transform your customer service?
          </Typography>
          <Typography 
            variant="h6" 
            sx={{ 
              mb: 4,
              opacity: 0.9
            }}
          >
            Join thousands of teams already delivering exceptional customer experiences
          </Typography>
          <Button 
            variant="contained"
            size="large"
            onClick={() => navigate('/signup')}
            sx={{
              backgroundColor: 'white',
              color: 'primary.main',
              '&:hover': {
                backgroundColor: 'grey.100',
              }
            }}
          >
            Get Started Free
          </Button>
        </Container>
      </Box>
    </Box>
  );
}

export default LandingPage; 