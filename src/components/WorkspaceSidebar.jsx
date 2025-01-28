/**
 * WorkspaceSidebar Component
 * 
 * A collapsible sidebar navigation component for workspace-level navigation.
 * Provides access to all major workspace features and displays workspace context.
 * 
 * Features:
 * - Collapsible/expandable sidebar with smooth animations
 * - Workspace branding with auto-generated color avatar
 * - Role-based menu items (different for owners vs regular users)
 * - Visual indication of current route
 * - Tooltips for collapsed state
 * - Quick access to common workspace features:
 *   - Dashboard
 *   - Tickets
 *   - Macros
 *   - Team Management
 *   - Analytics
 *   - Workspace Settings (owner only)
 * 
 * Props:
 * None - Uses React Router for navigation and context
 * 
 * State Management:
 * - Tracks sidebar expanded/collapsed state
 * - Maintains current workspace information
 * - Manages user role and permissions
 * 
 * Context Requirements:
 * - Must be used within a React Router context
 * - Requires workspace ID from URL parameters
 * - Needs authenticated Supabase client
 * 
 * Styling:
 * - Uses Material-UI's theme system
 * - Custom color generation for workspace avatars
 * - Responsive design with smooth transitions
 */

import { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import {
  Box,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Divider,
  Avatar,
  Typography,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Group as GroupIcon,
  Settings as AdminSettingsIcon,
  Assessment as AnalyticsIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  ExitToApp as LeaveIcon,
  Logout as LogoutIcon,
  Assignment as TicketIcon,
  AutoFixHigh as MacroIcon,
  Help as HelpIcon,
} from '@mui/icons-material';

const DRAWER_WIDTH = 240;
const COLLAPSED_WIDTH = 65;

// Helper function to generate consistent colors from string
const stringToColor = (string) => {
  let hash = 0;
  for (let i = 0; i < string.length; i++) {
    hash = string.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = [
    '#16494D', // primary green
    '#2073B7', // blue
    '#B95C24', // burnt orange
    '#7C4789', // purple
    '#607D3B', // olive green
    '#A85C85', // mauve
    '#3B7C76', // teal
  ];
  return colors[Math.abs(hash) % colors.length];
};

function WorkspaceSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { workspaceId } = useParams();
  const [expanded, setExpanded] = useState(false);
  const [workspace, setWorkspace] = useState(null);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const fetchWorkspaceAndRole = async () => {
      if (!workspaceId) return;
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [workspaceResponse, roleResponse] = await Promise.all([
        supabase
          .from('workspaces')
          .select('name')
          .eq('id', workspaceId)
          .single(),
        supabase
          .from('workspace_memberships')
          .select('role')
          .eq('workspace_id', workspaceId)
          .eq('user_id', user.id)
          .single()
      ]);

      if (!workspaceResponse.error && workspaceResponse.data) {
        setWorkspace(workspaceResponse.data);
      }

      if (!roleResponse.error && roleResponse.data) {
        setUserRole(roleResponse.data.role);
      }
    };

    fetchWorkspaceAndRole();
  }, [workspaceId]);

  const menuItems = [
    {
      label: 'Dashboard',
      icon: <DashboardIcon />,
      path: `/workspaces/${workspaceId}`,
    },
    {
      label: 'Tickets',
      icon: <TicketIcon />,
      path: `/workspaces/${workspaceId}/tickets`,
    },
    {
      label: 'Macros',
      icon: <MacroIcon />,
      path: `/workspaces/${workspaceId}/macros`,
    },
    {
      label: 'Team',
      icon: <GroupIcon />,
      path: `/workspaces/${workspaceId}/team`,
    },
    {
      label: 'Analytics',
      icon: <AnalyticsIcon />,
      path: `/workspaces/${workspaceId}/analytics`,
    },
    ...(userRole === 'owner' ? [{
      label: 'Workspace Settings',
      icon: <AdminSettingsIcon />,
      path: `/workspaces/${workspaceId}/workspace-settings`,
    }] : []),
  ];

  const handleToggle = () => {
    setExpanded(!expanded);
  };

  const isCurrentPath = (path) => {
    return location.pathname.endsWith(path);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: expanded ? DRAWER_WIDTH : COLLAPSED_WIDTH,
        transition: 'width 0.2s ease-in-out',
        position: 'relative',
        '& .MuiDrawer-paper': {
          width: expanded ? DRAWER_WIDTH : COLLAPSED_WIDTH,
          transition: 'width 0.2s ease-in-out',
          overflowX: 'hidden',
          backgroundColor: 'primary.main',
          color: 'primary.contrastText',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          zIndex: 1200,
        },
      }}
    >
      {/* Top Section */}
      <Box>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            padding: 2,
            gap: 2,
            position: 'relative',
          }}
        >
          <Avatar
            sx={{
              bgcolor: workspace ? stringToColor(workspace.name) : 'primary.main',
              width: expanded ? 40 : 32,
              height: expanded ? 40 : 32,
              fontSize: expanded ? 20 : 16,
              transition: 'all 0.2s ease-in-out',
              borderRadius: 0,
            }}
          >
            {workspace?.name.charAt(0).toUpperCase()}
          </Avatar>
          
          {expanded && (
            <Typography
              noWrap
              sx={{
                color: 'primary.contrastText',
                fontWeight: 600,
                flexGrow: 1,
              }}
            >
              {workspace?.name}
            </Typography>
          )}
        </Box>

        <Divider sx={{ borderColor: 'primary.light' }} />
      </Box>

      {/* Middle Section - Flexible Space */}
      <Box sx={{ 
        flexGrow: 1, 
        overflowY: 'auto', // Allow scrolling if content is too tall
        minHeight: 0, // Important for proper flex behavior
      }}>
        <List>
          {menuItems.map((item) => (
            <ListItem key={item.label} disablePadding>
              {expanded ? (
                <ListItemButton
                  onClick={() => navigate(item.path)}
                  selected={isCurrentPath(item.path)}
                  sx={{
                    '&.Mui-selected': {
                      backgroundColor: 'primary.dark',
                      '&:hover': {
                        backgroundColor: 'primary.dark',
                      },
                    },
                    '&:hover': {
                      backgroundColor: 'primary.dark',
                    },
                  }}
                >
                  <ListItemIcon sx={{ color: 'primary.contrastText' }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText primary={item.label} />
                </ListItemButton>
              ) : (
                <Tooltip title={item.label} placement="right">
                  <ListItemButton
                    onClick={() => navigate(item.path)}
                    selected={isCurrentPath(item.path)}
                    sx={{
                      justifyContent: 'center',
                      '&.Mui-selected': {
                        backgroundColor: 'primary.dark',
                        '&:hover': {
                          backgroundColor: 'primary.dark',
                        },
                      },
                      '&:hover': {
                        backgroundColor: 'primary.dark',
                      },
                    }}
                  >
                    <ListItemIcon sx={{ color: 'primary.contrastText', minWidth: 'auto' }}>
                      {item.icon}
                    </ListItemIcon>
                  </ListItemButton>
                </Tooltip>
              )}
            </ListItem>
          ))}
        </List>
      </Box>

      {/* Bottom Section - Fixed Height */}
      <Box sx={{ mt: 'auto' }}> {/* Changed from flexGrow: 1 to mt: 'auto' */}
        <Divider sx={{ borderColor: 'primary.light' }} />
        
        {expanded ? (
          <>
            <ListItemButton
              onClick={() => window.open('/help', '_blank')}
              sx={{
                py: 1.5,
                '&:hover': {
                  backgroundColor: 'primary.dark',
                },
              }}
            >
              <ListItemIcon sx={{ color: 'primary.contrastText' }}>
                <HelpIcon />
              </ListItemIcon>
              <ListItemText primary="Help" />
            </ListItemButton>

            <ListItemButton
              onClick={() => navigate('/workspaces')}
              sx={{
                py: 1.5,
                '&:hover': {
                  backgroundColor: 'primary.dark',
                },
              }}
            >
              <ListItemIcon sx={{ color: 'primary.contrastText' }}>
                <LeaveIcon />
              </ListItemIcon>
              <ListItemText primary="Leave Workspace" />
            </ListItemButton>

            <ListItemButton
              onClick={handleLogout}
              sx={{
                py: 1.5,
                '&:hover': {
                  backgroundColor: 'primary.dark',
                },
              }}
            >
              <ListItemIcon sx={{ color: 'primary.contrastText' }}>
                <LogoutIcon />
              </ListItemIcon>
              <ListItemText primary="Logout" />
            </ListItemButton>
          </>
        ) : (
          <>
            <Tooltip title="Help" placement="right">
              <ListItemButton
                onClick={() => window.open('/help', '_blank')}
                sx={{
                  py: 1.5,
                  justifyContent: 'center',
                  '&:hover': {
                    backgroundColor: 'primary.dark',
                  },
                }}
              >
                <ListItemIcon sx={{ color: 'primary.contrastText', minWidth: 'auto' }}>
                  <HelpIcon />
                </ListItemIcon>
              </ListItemButton>
            </Tooltip>

            <Tooltip title="Leave Workspace" placement="right">
              <ListItemButton
                onClick={() => navigate('/workspaces')}
                sx={{
                  py: 1.5,
                  justifyContent: 'center',
                  '&:hover': {
                    backgroundColor: 'primary.dark',
                  },
                }}
              >
                <ListItemIcon sx={{ color: 'primary.contrastText', minWidth: 'auto' }}>
                  <LeaveIcon />
                </ListItemIcon>
              </ListItemButton>
            </Tooltip>

            <Tooltip title="Logout" placement="right">
              <ListItemButton
                onClick={handleLogout}
                sx={{
                  py: 1.5,
                  justifyContent: 'center',
                  '&:hover': {
                    backgroundColor: 'primary.dark',
                  },
                }}
              >
                <ListItemIcon sx={{ color: 'primary.contrastText', minWidth: 'auto' }}>
                  <LogoutIcon />
                </ListItemIcon>
              </ListItemButton>
            </Tooltip>
          </>
        )}
      </Box>

      <IconButton 
        onClick={handleToggle}
        size="small"
        sx={{ 
          position: 'fixed',
          left: expanded ? DRAWER_WIDTH - 10 : COLLAPSED_WIDTH - 10,
          top: 28,
          transform: 'translateY(-50%)',
          width: 20,
          height: 20,
          backgroundColor: 'primary.main',
          border: '1px solid',
          borderColor: 'primary.light',
          color: 'primary.contrastText',
          zIndex: 1201,
          boxShadow: '2px 0 4px rgba(0,0,0,0.2)',
          transition: 'left 0.2s ease-in-out',
          '&:hover': {
            backgroundColor: 'primary.dark',
          },
          '& .MuiSvgIcon-root': {
            fontSize: 16,
          },
        }}
      >
        {expanded ? <ChevronLeftIcon /> : <ChevronRightIcon />}
      </IconButton>
    </Drawer>
  );
}

export default WorkspaceSidebar; 