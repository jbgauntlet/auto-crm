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
  Popover,
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
  Palette,
} from '@mui/icons-material';
import { ThemeToggle } from './ThemeToggle';
import { useTheme, themeOptions } from '../theme/ThemeContext';

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
  const [colorAnchor, setColorAnchor] = useState(null);
  const { theme, setTheme, mode } = useTheme();

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

  const handleColorClose = () => {
    setColorAnchor(null);
  };

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    handleColorClose();
  };

  return (
    <>
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
          overflowY: 'auto',
          minHeight: 0,
        }}>
          <List sx={{ py: 0 }}>
            {menuItems.map((item) => (
              <ListItem key={item.label} disablePadding>
                <Tooltip title={item.label} placement="right">
                  <ListItemButton
                    onClick={() => navigate(item.path)}
                    selected={isCurrentPath(item.path)}
                    sx={{
                      minHeight: 48,
                      justifyContent: expanded ? 'initial' : 'center',
                      px: 2.5,
                      '&.Mui-selected': {
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        '&:hover': {
                          backgroundColor: 'rgba(255, 255, 255, 0.2)',
                        },
                      },
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      },
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: 0,
                        mr: expanded ? 3 : 'auto',
                        justifyContent: 'center',
                        color: 'primary.contrastText',
                      }}
                    >
                      {item.icon}
                    </ListItemIcon>
                    {expanded && (
                      <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                        <ListItemText 
                          primary={item.label}
                          sx={{ color: 'primary.contrastText' }}
                        />
                      </Box>
                    )}
                  </ListItemButton>
                </Tooltip>
              </ListItem>
            ))}
          </List>
        </Box>

        {/* Bottom Section */}
        <Box sx={{ mt: 'auto' }}>
          <Divider sx={{ borderColor: 'primary.light' }} />
          <List sx={{ py: 0 }}>
            {expanded ? (
              <>
                <ListItem disablePadding>
                  <ListItemButton 
                    onClick={(event) => setColorAnchor(event.currentTarget)}
                    sx={{ py: 1.5 }}
                  >
                    <ListItemIcon sx={{ color: 'primary.contrastText', minWidth: 48 }}>
                      <Palette />
                    </ListItemIcon>
                    <ListItemText primary="Theme Color" />
                  </ListItemButton>
                </ListItem>
                <ListItem disablePadding>
                  <ListItemButton sx={{ py: 1.5 }}>
                    <ListItemIcon sx={{ color: 'primary.contrastText', minWidth: 48 }}>
                      <ThemeToggle />
                    </ListItemIcon>
                    <ListItemText primary="Dark Mode" />
                  </ListItemButton>
                </ListItem>
                <ListItem disablePadding>
                  <ListItemButton 
                    onClick={() => window.open('/help', '_blank')}
                    sx={{ py: 1.5 }}
                  >
                    <ListItemIcon sx={{ color: 'primary.contrastText', minWidth: 48 }}>
                      <HelpIcon />
                    </ListItemIcon>
                    <ListItemText primary="Help" />
                  </ListItemButton>
                </ListItem>
                <ListItem disablePadding>
                  <ListItemButton 
                    onClick={() => navigate('/workspaces')}
                    sx={{ py: 1.5 }}
                  >
                    <ListItemIcon sx={{ color: 'primary.contrastText', minWidth: 48 }}>
                      <LeaveIcon />
                    </ListItemIcon>
                    <ListItemText primary="Leave Workspace" />
                  </ListItemButton>
                </ListItem>
                <ListItem disablePadding>
                  <ListItemButton 
                    onClick={handleLogout}
                    sx={{ py: 1.5 }}
                  >
                    <ListItemIcon sx={{ color: 'primary.contrastText', minWidth: 48 }}>
                      <LogoutIcon />
                    </ListItemIcon>
                    <ListItemText primary="Logout" />
                  </ListItemButton>
                </ListItem>
              </>
            ) : (
              <>
                <ListItem disablePadding>
                  <Tooltip title="Theme Color" placement="right">
                    <ListItemButton 
                      onClick={(event) => setColorAnchor(event.currentTarget)}
                      sx={{ py: 1.5, justifyContent: 'center' }}
                    >
                      <ListItemIcon sx={{ color: 'primary.contrastText', minWidth: 'auto' }}>
                        <Palette />
                      </ListItemIcon>
                    </ListItemButton>
                  </Tooltip>
                </ListItem>
                <ListItem disablePadding>
                  <Tooltip title="Dark Mode" placement="right">
                    <ListItemButton sx={{ py: 1.5, justifyContent: 'center' }}>
                      <ListItemIcon sx={{ color: 'primary.contrastText', minWidth: 'auto' }}>
                        <ThemeToggle />
                      </ListItemIcon>
                    </ListItemButton>
                  </Tooltip>
                </ListItem>
                <ListItem disablePadding>
                  <Tooltip title="Help" placement="right">
                    <ListItemButton 
                      onClick={() => window.open('/help', '_blank')}
                      sx={{ py: 1.5, justifyContent: 'center' }}
                    >
                      <ListItemIcon sx={{ color: 'primary.contrastText', minWidth: 'auto' }}>
                        <HelpIcon />
                      </ListItemIcon>
                    </ListItemButton>
                  </Tooltip>
                </ListItem>
                <ListItem disablePadding>
                  <Tooltip title="Leave Workspace" placement="right">
                    <ListItemButton 
                      onClick={() => navigate('/workspaces')}
                      sx={{ py: 1.5, justifyContent: 'center' }}
                    >
                      <ListItemIcon sx={{ color: 'primary.contrastText', minWidth: 'auto' }}>
                        <LeaveIcon />
                      </ListItemIcon>
                    </ListItemButton>
                  </Tooltip>
                </ListItem>
                <ListItem disablePadding>
                  <Tooltip title="Logout" placement="right">
                    <ListItemButton 
                      onClick={handleLogout}
                      sx={{ py: 1.5, justifyContent: 'center' }}
                    >
                      <ListItemIcon sx={{ color: 'primary.contrastText', minWidth: 'auto' }}>
                        <LogoutIcon />
                      </ListItemIcon>
                    </ListItemButton>
                  </Tooltip>
                </ListItem>
              </>
            )}
          </List>
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
        </Box>
      </Drawer>
      
      <Popover
        open={Boolean(colorAnchor)}
        anchorEl={colorAnchor}
        onClose={handleColorClose}
        anchorOrigin={{
          vertical: 'center',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'center',
          horizontal: 'left',
        }}
      >
        <Box sx={{ p: 2, width: 320 }}>
          <Typography variant="subtitle2" sx={{ mb: 2 }}>
            Theme
          </Typography>
          <Box sx={{ display: 'grid', gap: 2 }}>
            {themeOptions.map((themeOption) => (
              <Box
                key={themeOption.name}
                onClick={() => handleThemeChange(themeOption.name)}
                sx={{
                  cursor: 'pointer',
                  p: 1,
                  border: '2px solid',
                  borderColor: theme === themeOption.name ? 'primary.main' : 'transparent',
                  borderRadius: 1,
                  '&:hover': {
                    bgcolor: 'action.hover',
                  },
                }}
              >
                <Typography variant="body2" sx={{ mb: 1 }}>
                  {themeOption.name}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  {/* Light mode preview */}
                  <Box sx={{ flex: 1, p: 1, bgcolor: themeOption.light.background.paper, borderRadius: 0.5 }}>
                    <Box sx={{ display: 'flex', gap: 0.5, mb: 0.5 }}>
                      <Box sx={{ width: 24, height: 24, bgcolor: themeOption.light.primary.main, borderRadius: 0.5 }} />
                      <Box sx={{ width: 24, height: 24, bgcolor: themeOption.light.secondary.main, borderRadius: 0.5 }} />
                      <Box sx={{ width: 24, height: 24, bgcolor: themeOption.light.accent, borderRadius: 0.5 }} />
                    </Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      Light
                    </Typography>
                  </Box>
                  {/* Dark mode preview */}
                  <Box sx={{ flex: 1, p: 1, bgcolor: themeOption.dark.background.paper, borderRadius: 0.5 }}>
                    <Box sx={{ display: 'flex', gap: 0.5, mb: 0.5 }}>
                      <Box sx={{ width: 24, height: 24, bgcolor: themeOption.dark.primary.main, borderRadius: 0.5 }} />
                      <Box sx={{ width: 24, height: 24, bgcolor: themeOption.dark.secondary.main, borderRadius: 0.5 }} />
                      <Box sx={{ width: 24, height: 24, bgcolor: themeOption.dark.accent, borderRadius: 0.5 }} />
                    </Box>
                    <Typography variant="caption" sx={{ color: '#fff' }}>
                      Dark
                    </Typography>
                  </Box>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      </Popover>
    </>
  );
}

export default WorkspaceSidebar; 