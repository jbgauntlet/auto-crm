/**
 * WorkspaceSettingsSidebar Component
 * 
 * A navigation sidebar specifically for workspace settings and configuration.
 * Provides hierarchical navigation through various workspace configuration options.
 * 
 * Features:
 * - Hierarchical menu structure with collapsible sections
 * - Visual indication of current route
 * - Grouped settings categories:
 *   - General workspace settings
 *   - Team management
 *   - Group configuration
 *   - Ticket system settings:
 *     - Custom fields
 *     - Topics
 *     - Types
 *     - Tags
 *     - Resolutions
 *     - General configuration
 * 
 * Props:
 * None - Uses React Router for navigation and context
 * 
 * State Management:
 * - Tracks expanded/collapsed state of ticket settings section
 * - Maintains current route selection
 * 
 * Context Requirements:
 * - Must be used within a React Router context
 * - Requires workspace ID from URL parameters
 * 
 * Styling:
 * - Uses Material-UI's theme system
 * - Custom styling for selected states
 * - Consistent iconography for different setting types
 * - Nested menu indentation
 */

import { useState } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Collapse,
} from '@mui/material';
import {
  Settings as GeneralIcon,
  Group as TeamIcon,
  Category as GroupsIcon,
  Assignment as TicketsIcon,
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
  Label as TagIcon,
  Topic as TopicIcon,
  ViewList as TypesIcon,
  Settings as ConfigIcon,
  CheckCircle as ResolutionIcon,
  AddBox as CreateFieldIcon,
  ViewColumn as CustomFieldsIcon,
  LocalOffer as LocalOfferIcon,
  CheckCircleOutline as CheckCircleOutlineIcon,
  Tune as TuneIcon,
} from '@mui/icons-material';

function WorkspaceSettingsSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { workspaceId } = useParams();
  const [ticketsOpen, setTicketsOpen] = useState(true);

  const baseSettingsItems = [
    {
      label: 'General',
      icon: <GeneralIcon />,
      path: `/workspaces/${workspaceId}/workspace-settings`,
    },
    {
      label: 'Team',
      icon: <TeamIcon />,
      path: `/workspaces/${workspaceId}/workspace-settings/team`,
    },
    {
      label: 'Groups',
      icon: <GroupsIcon />,
      path: `/workspaces/${workspaceId}/workspace-settings/groups`,
    },
  ];

  const ticketSettingsItems = [
    { label: 'Custom Fields', path: 'tickets/custom-fields', icon: <CustomFieldsIcon /> },
    { label: 'Topics', path: 'tickets/topics', icon: <TopicIcon /> },
    { label: 'Types', path: 'tickets/types', icon: <TypesIcon /> },
    { label: 'Tags', path: 'tickets/tags', icon: <LocalOfferIcon /> },
    { label: 'Resolutions', path: 'tickets/resolutions', icon: <CheckCircleOutlineIcon /> },
    { label: 'Configuration', path: 'tickets/configuration', icon: <TuneIcon /> },
  ];

  const isCurrentPath = (path) => {
    return location.pathname === path;
  };

  const isInTicketsSection = () => {
    return location.pathname.includes('/workspace-settings/tickets');
  };

  return (
    <Box
      sx={{
        width: 240,
        borderRight: '1px solid',
        borderColor: 'custom.lightGray',
        height: '100%',
        backgroundColor: 'background.paper',
      }}
    >
      <List>
        {baseSettingsItems.map((item) => (
          <ListItem key={item.label} disablePadding>
            <ListItemButton
              onClick={() => navigate(item.path)}
              selected={isCurrentPath(item.path)}
              sx={{
                '&.Mui-selected': {
                  backgroundColor: 'primary.light',
                  '&:hover': {
                    backgroundColor: 'primary.light',
                  },
                },
                '&:hover': {
                  backgroundColor: 'primary.light',
                },
              }}
            >
              <ListItemIcon
                sx={{
                  color: isCurrentPath(item.path) ? 'primary.main' : 'text.secondary',
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                sx={{
                  color: isCurrentPath(item.path) ? 'primary.main' : 'text.primary',
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}

        <ListItem disablePadding>
          <ListItemButton
            onClick={() => setTicketsOpen(!ticketsOpen)}
            selected={isInTicketsSection()}
            sx={{
              '&.Mui-selected': {
                backgroundColor: 'primary.light',
                '&:hover': {
                  backgroundColor: 'primary.light',
                },
              },
              '&:hover': {
                backgroundColor: 'primary.light',
              },
            }}
          >
            <ListItemIcon
              sx={{
                color: isInTicketsSection() ? 'primary.main' : 'text.secondary',
              }}
            >
              <TicketsIcon />
            </ListItemIcon>
            <ListItemText
              primary="Tickets"
              sx={{
                color: isInTicketsSection() ? 'primary.main' : 'text.primary',
              }}
            />
            {ticketsOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </ListItemButton>
        </ListItem>

        <Collapse in={ticketsOpen} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            {ticketSettingsItems.map((item) => (
              <ListItem key={item.label} disablePadding>
                <ListItemButton
                  onClick={() => navigate(item.path)}
                  selected={isCurrentPath(item.path)}
                  sx={{
                    pl: 4,
                    '&.Mui-selected': {
                      backgroundColor: 'primary.light',
                      '&:hover': {
                        backgroundColor: 'primary.light',
                      },
                    },
                    '&:hover': {
                      backgroundColor: 'primary.light',
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      color: isCurrentPath(item.path) ? 'primary.main' : 'text.secondary',
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.label}
                    sx={{
                      color: isCurrentPath(item.path) ? 'primary.main' : 'text.primary',
                    }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Collapse>
      </List>
    </Box>
  );
}

export default WorkspaceSettingsSidebar; 