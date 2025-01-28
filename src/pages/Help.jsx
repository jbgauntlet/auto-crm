/**
 * Help Center Component
 * 
 * A comprehensive help and documentation page that provides users with:
 * - Searchable help articles and FAQs
 * - Categorized help sections with expandable content
 * - Quick navigation to specific help topics
 * - Support for deep linking to specific sections
 * 
 * Features:
 * - Search functionality for help content
 * - Accordion-based navigation
 * - URL parameter support for direct section access
 * - Automatic scrolling to relevant sections
 * 
 * @component
 * @returns {JSX.Element} The rendered help center page
 */

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Container,
  TextField,
  InputAdornment,
  Grid,
  Card,
  CardContent,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import helpBanner from '../assets/help-banner.jpg';

function Help() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSection, setSelectedSection] = useState(null);
  const [searchParams] = useSearchParams();

  /**
   * Effect hook to handle initial page load and section navigation
   */
  useEffect(() => {
    window.scrollTo(0, 0);
    
    const section = searchParams.get('section');
    if (section) {
      // Wait for the page to load before scrolling to the section
      setTimeout(() => {
        const element = document.getElementById(section);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          setSelectedSection(section);
        }
      }, 100);
    }
  }, [searchParams]);

  const sections = [
    {
      title: "Getting Started",
      icon: "🚀",
      description: "Learn how to set up your workspace and get started with AutoCRM",
      items: [
        {
          question: "How do I create a new workspace?",
          answer: "To create a new workspace:\n1. Log in to your account\n2. Navigate to the Workspaces dashboard\n3. Click 'Create Workspace'\n4. Fill in the workspace name and details\n5. Your workspace will be automatically configured with default groups, ticket types, topics, and tags"
        },
        {
          question: "What are the default configurations?",
          answer: "When you create a workspace, it comes with:\n- Default Groups: Sales, Billing, Finance, Engineering, Support, Product Management, Management\n- Default Ticket Types: Task, Bug, Question, Issue\n- Default Topics: Technical Support, Product Issue, Billing Issue, Customer Inquiry, Returns, Refund, Account Information\n- Default Tags: FY2025, Project_Name\n- Default Resolutions: Fixed, Can't Reproduce, Not to be fixed, Duplicate"
        }
      ]
    },
    {
      title: "Ticket Management",
      icon: "🎫",
      description: "Everything you need to know about creating and managing tickets",
      items: [
        {
          question: "How do I create a ticket?",
          answer: "You can create tickets in two ways:\n1. Quick Ticket: Use the quick ticket button on the workspace dashboard for simple tickets\n2. Full Ticket: Navigate to the Tickets section and click 'Create Ticket' for a detailed ticket with all options"
        },
        {
          question: "What are ticket priorities?",
          answer: "Tickets can have four priority levels:\n- Urgent: Critical issues requiring immediate attention\n- High: Important issues that should be addressed soon\n- Normal: Standard priority for most tickets\n- Low: Issues that can be addressed when resources are available"
        },
        {
          question: "How do I use macros?",
          answer: "Macros are pre-defined templates that help standardize ticket creation:\n1. Create macros from the Macros section\n2. Configure default values for fields like subject, description, priority, etc.\n3. Apply macros when creating new tickets to automatically fill in common information"
        }
      ]
    },
    {
      title: "Team Collaboration",
      icon: "👥",
      description: "Learn about groups, roles, and team management features",
      items: [
        {
          question: "How do groups work?",
          answer: "Groups help organize team members by department or function:\n1. Create groups in Workspace Settings\n2. Add team members to relevant groups\n3. Assign tickets to specific groups\n4. Filter and view tickets by group assignment"
        },
        {
          question: "What are the different user roles?",
          answer: "The system has three user roles:\n- Owner: Full access to all workspace settings and configurations\n- Admin: Can manage team members and most workspace settings\n- Agent: Can work on tickets and use basic features"
        }
      ]
    },
    {
      title: "Analytics and Reporting",
      icon: "📊",
      description: "Understand your metrics and create insightful reports",
      items: [
        {
          question: "What metrics are available?",
          answer: "The analytics dashboard provides:\n- Volume Metrics: Ticket volume trends and patterns\n- Resolution Metrics: Time to resolve and resolution rates\n- Individual Metrics: Agent performance and workload\n- Group Metrics: Team performance and distribution\n- Custom Field Metrics: Analysis of custom field usage"
        },
        {
          question: "How can I customize my analytics view?",
          answer: "You can customize analytics by:\n1. Selecting different date ranges\n2. Filtering by groups or individuals\n3. Focusing on specific ticket types or topics\n4. Analyzing custom field data"
        }
      ]
    },
    {
      title: "Workspace Settings",
      icon: "⚙️",
      description: "Configure and customize your workspace to match your needs",
      items: [
        {
          question: "How do I customize ticket fields?",
          answer: "In Workspace Settings, you can:\n1. Enable/disable built-in fields (resolution, type, topic, groups)\n2. Create custom fields for additional information\n3. Configure field options and requirements\n4. Manage ticket tags and categories"
        },
        {
          question: "How do I manage team members?",
          answer: "Team management options include:\n1. Inviting new team members\n2. Assigning roles (Owner, Admin, Agent)\n3. Managing group memberships\n4. Configuring access permissions"
        }
      ]
    }
  ];

  const filteredSections = sections.map(section => ({
    ...section,
    items: section.items.filter(item =>
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(section => section.items.length > 0);

  const handleSearch = (event) => {
    setSearchQuery(event.target.value);
    if (event.target.value && filteredSections.length > 0) {
      setSelectedSection(filteredSections[0].title);
    }
  };

  const scrollToSection = (sectionTitle) => {
    const element = document.getElementById(sectionTitle);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setSelectedSection(sectionTitle);
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50' }}>
      {/* Banner Header */}
      <Box
        sx={{
          background: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url(${helpBanner})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          color: 'white',
          position: 'relative',
          py: 8,
          px: 3,
          textAlign: 'center',
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Container maxWidth="md">
          <Typography variant="h3" component="h1" sx={{ fontWeight: 600, mb: 3 }}>
            Help Center
          </Typography>
          <Typography variant="h6" sx={{ mb: 4, opacity: 0.9 }}>
            Find answers to your questions and learn how to make the most of AutoCRM
          </Typography>
          <Box sx={{ maxWidth: '600px', mx: 'auto' }}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search help articles..."
              value={searchQuery}
              onChange={handleSearch}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: 'white' }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: 2,
                  color: 'white',
                  '& fieldset': {
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                  },
                  '&:hover fieldset': {
                    borderColor: 'rgba(255, 255, 255, 0.5)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: 'white',
                  },
                },
                '& .MuiOutlinedInput-input': {
                  '&::placeholder': {
                    color: 'rgba(255, 255, 255, 0.7)',
                    opacity: 1,
                  },
                },
              }}
            />
          </Box>
        </Container>
      </Box>

      {/* Category Cards */}
      <Container maxWidth="lg" sx={{ mt: 4, mb: 6, position: 'relative' }}>
        <Grid container spacing={3}>
          {sections.map((section) => (
            <Grid item xs={12} sm={6} md={4} key={section.title}>
              <Card 
                onClick={() => scrollToSection(section.title)}
                sx={{ 
                  cursor: 'pointer',
                  height: '100%',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4,
                  },
                  bgcolor: selectedSection === section.title ? 'primary.light' : 'background.paper',
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <Typography variant="h2" sx={{ fontSize: '2rem' }}>
                      {section.icon}
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {section.title}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {section.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Content */}
      <Container maxWidth="lg" sx={{ pb: 8 }}>
        {filteredSections.map((section) => (
          <Box key={section.title} id={section.title} sx={{ mb: 6, scrollMarginTop: '32px' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
              <Typography variant="h5" component="h2" sx={{ color: 'primary.main', fontWeight: 600 }}>
                {section.icon} {section.title}
              </Typography>
            </Box>
            {section.items.map((item, itemIndex) => (
              <Accordion
                key={itemIndex}
                sx={{
                  mb: 2,
                  boxShadow: 'none',
                  '&:before': { display: 'none' },
                  border: 1,
                  borderColor: 'divider',
                  '&:not(:last-child)': { mb: 2 },
                  bgcolor: 'background.paper',
                  textAlign: 'left',
                }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  sx={{
                    '&:hover': { bgcolor: 'primary.light' },
                  }}
                >
                  <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                    {item.question}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ borderTop: 1, borderColor: 'divider' }}>
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
                    {item.answer}
                  </Typography>
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        ))}
      </Container>
    </Box>
  );
}

export default Help; 