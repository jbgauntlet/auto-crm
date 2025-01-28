/**
 * Analytics Component
 * 
 * A comprehensive analytics dashboard for workspace ticket data visualization and analysis.
 * Provides multiple views for different aspects of ticket management performance.
 * 
 * Features:
 * - Multiple Analysis Categories:
 *   - Ticket Volume & Status: Track ticket flow and status distribution
 *   - Group Performance: Analyze team efficiency and workload
 *   - Individual Performance: Monitor agent productivity
 *   - Custom Field Analytics: Analyze custom field usage patterns
 *   - Resolution Analysis: Track resolution trends and efficiency
 * 
 * - Interactive Interface:
 *   - Category selection sidebar
 *   - Time range filtering
 *   - Dynamic content rendering
 *   - Visual feedback for selected states
 * 
 * Layout Structure:
 * - Sidebar:
 *   - Category navigation
 *   - Visual indicators for current selection
 *   - Consistent iconography
 * - Main Content Area:
 *   - Category-specific metrics
 *   - Time range controls
 *   - Data visualizations
 * 
 * Props:
 * None - Uses React Router for workspace context
 * 
 * State Management:
 * - Tracks selected category
 * - Manages time range selection
 * - Handles metric component rendering
 * 
 * Component Integration:
 * - Integrates with specialized metric components:
 *   - VolumeMetrics
 *   - GroupMetrics
 *   - IndividualMetrics
 *   - CustomFieldMetrics
 *   - ResolutionMetrics
 * 
 * Styling:
 * - Material-UI components and theming
 * - Responsive layout design
 * - Consistent visual hierarchy
 * - Clear selection states
 */

import { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Assessment as VolumeIcon,
  Groups as GroupIcon,
  Person as PersonIcon,
  ViewList as CustomFieldIcon,
  CheckCircle as ResolutionIcon,
} from '@mui/icons-material';

import VolumeMetrics from './metrics/VolumeMetrics';
import GroupMetrics from './metrics/GroupMetrics';
import IndividualMetrics from './metrics/IndividualMetrics';
import CustomFieldMetrics from './metrics/CustomFieldMetrics';
import ResolutionMetrics from './metrics/ResolutionMetrics';

function Analytics() {
  const { workspaceId } = useParams();
  const [selectedCategory, setSelectedCategory] = useState('volume');
  const [timeRange, setTimeRange] = useState('7d'); // Default to last 7 days

  const categories = [
    { id: 'volume', label: 'Ticket Volume & Status', icon: <VolumeIcon /> },
    { id: 'group', label: 'Group Performance', icon: <GroupIcon /> },
    { id: 'individual', label: 'Individual Performance', icon: <PersonIcon /> },
    { id: 'custom', label: 'Custom Field Analytics', icon: <CustomFieldIcon /> },
    { id: 'resolution', label: 'Resolution Analysis', icon: <ResolutionIcon /> },
  ];

  const renderContent = () => {
    const commonProps = {
      workspaceId,
      timeRange,
      onTimeRangeChange: setTimeRange
    };

    switch (selectedCategory) {
      case 'volume':
        return <VolumeMetrics {...commonProps} />;
      case 'group':
        return <GroupMetrics {...commonProps} />;
      case 'individual':
        return <IndividualMetrics {...commonProps} />;
      case 'custom':
        return <CustomFieldMetrics {...commonProps} />;
      case 'resolution':
        return <ResolutionMetrics {...commonProps} />;
      default:
        return null;
    }
  };

  return (
    <Box sx={{ display: 'flex', height: '100%' }}>
      {/* Sidebar */}
      <Paper sx={{ width: 360, borderRadius: 0 }}>
        <List sx={{ py: 2 }}>
          {categories.map((category) => (
            <ListItem key={category.id} disablePadding>
              <ListItemButton
                selected={selectedCategory === category.id}
                onClick={() => setSelectedCategory(category.id)}
                sx={{
                  py: 1.5,
                  '&.Mui-selected': {
                    backgroundColor: 'primary.main',
                    color: 'white',
                    '&:hover': {
                      backgroundColor: 'primary.dark',
                    },
                    '& .MuiListItemIcon-root': {
                      color: 'white',
                    },
                  },
                }}
              >
                <ListItemIcon sx={{ color: selectedCategory === category.id ? 'white' : 'inherit' }}>
                  {category.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={category.label} 
                  primaryTypographyProps={{
                    fontSize: '0.95rem',
                    fontWeight: selectedCategory === category.id ? 600 : 400
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Paper>

      {/* Main Content */}
      <Box sx={{ flexGrow: 1, p: 4 }}>
        <Typography variant="h4" component="h1" sx={{ color: 'primary.main', fontWeight: 600, mb: 4 }}>
          {categories.find(c => c.id === selectedCategory)?.label}
        </Typography>
        {renderContent()}
      </Box>
    </Box>
  );
}

export default Analytics; 