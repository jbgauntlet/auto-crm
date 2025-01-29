/**
 * Home Component
 * 
 * Main workspace home page that displays workspace overview and key metrics.
 * 
 * Features:
 * - Ticket Management:
 *   - Real-time ticket list with advanced filtering
 *   - Quick ticket creation
 *   - Status and priority visualization
 *   - Ticket counts by category
 * 
 * - Team Management:
 *   - Team member list with role indicators
 *   - Group management interface
 *   - Member invitation system
 *   - Role-based access control
 * 
 * - Group Features:
 *   - Group creation and management
 *   - Member assignment to groups
 *   - Group-based filtering
 *   - Visual group indicators
 * 
 * Data Display:
 * - Tickets Grid:
 *   - Subject and description
 *   - Status with color coding
 *   - Priority levels
 *   - Assignee and requestor info
 *   - Creation timestamps
 * 
 * - Team Grid:
 *   - Member details
 *   - Role assignments
 *   - Group memberships
 *   - Join dates
 * 
 * State Management:
 * - Tracks ticket and user data
 * - Manages multiple modal states
 * - Handles filter selections
 * - Maintains loading states
 * 
 * Security Features:
 * - Role-based action permissions
 * - Secure data fetching
 * - Protected management functions
 * 
 * Database Interactions:
 * - Real-time ticket updates
 * - User data synchronization
 * - Group membership management
 * - Workspace configuration
 * 
 * UI/UX Features:
 * - Material-UI DataGrid integration
 * - Modal interfaces for actions
 * - Color-coded status indicators
 * - Responsive layout design
 * - Interactive filtering system
 * 
 * POTENTIAL REFACTORING OPPORTUNITIES:
 * 
 * 1. Component Extraction:
 *    - TicketGrid: Lines ~50-180 (columns definition + grid rendering)
 *    - TeamGrid: Lines ~180-300 (userColumns definition + grid rendering)
 *    - WorkspaceHeader: Lines ~600-650 (title + action buttons)
 *    - TeamSection: Lines ~650-750 (team members section)
 * 
 * 2. Custom Hooks:
 *    - useTickets: Lines ~350-450 (ticket fetching, filtering, counting)
 *    - useTeamMembers: Lines ~450-500 (team member fetching and formatting)
 *    - useWorkspaceGroups: Lines ~500-550 (group management)
 *    - useWorkspaceRole: Lines ~300-350 (role checking and permissions)
 * 
 * 3. Utility Functions:
 *    - formatTicketData: Lines ~450-500 (ticket data formatting)
 *    - formatUserData: Lines ~300-350 (user data formatting)
 *    - getTicketCounts: Lines ~250-300 (ticket counting logic)
 * 
 * 4. Constants:
 *    - colorMappings: Lines ~100-150 (status, priority, role colors)
 *    - gridConfigs: Lines ~50-100 (column definitions)
 * 
 * 5. Context Providers:
 *    - WorkspaceContext: For sharing workspace data
 *    - TeamContext: For sharing team member data
 *    - TicketContext: For sharing ticket data
 * 
 * Original file structure below:
 */

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import {
  Box,
  Button,
  Typography,
  Divider,
  TextField,
  MenuItem,
  IconButton,
  Tooltip,
  Card,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import GroupIcon from '@mui/icons-material/Group';
import CreateTeamMemberModal from '../../components/CreateTeamMemberModal';
import CreateGroupModal from '../../components/CreateGroupModal';
import GroupManagementModal from '../../components/GroupManagementModal';
import TicketFilterButtons from '../../components/TicketFilterButtons';
import QuickTicketModal from '../../components/QuickTicketModal';
import NoteAddIcon from '@mui/icons-material/NoteAdd';

function Home() {
  const navigate = useNavigate();
  const { workspaceId } = useParams();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isTeamMemberModalOpen, setIsTeamMemberModalOpen] = useState(false);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [workspaceUsers, setWorkspaceUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState('all');
  const [availableGroups, setAvailableGroups] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isGroupManagementOpen, setIsGroupManagementOpen] = useState(false);
  const [ticketFilter, setTicketFilter] = useState('all');
  const [showClosed, setShowClosed] = useState(false);
  const [ticketCounts, setTicketCounts] = useState({
    you: 0,
    groups: 0,
    all: 0
  });
  const [isQuickTicketModalOpen, setIsQuickTicketModalOpen] = useState(false);

  const statusColors = {
    open: '#008079', // primary-light-contrast
    in_progress: '#2073B7', // secondary
    closed: '#68868B', // primary-gray
  };

  const priorityColors = {
    urgent: '#C72A1C', // red
    high: '#2073B7', // secondary
    normal: '#16494D', // primary
    low: '#008079', // primary-light-contrast
  };

  const roleColors = {
    owner: '#C72A1C', // red
    admin: '#2073B7', // secondary
    agent: '#16494D', // primary
  };

  // Check if user can manage groups and team
  const canManage = userRole === 'owner' || userRole === 'admin';

  const columns = [
    { 
      field: 'subject', 
      headerName: 'Subject', 
      flex: 1,
      minWidth: 200,
    },
    { 
      field: 'status', 
      headerName: 'Status',
      width: 120,
      renderCell: (params) => (
        <Box
          sx={{
            backgroundColor: `${statusColors[params.value]}15`,
            color: statusColors[params.value],
            padding: '6px 12px',
            borderRadius: '6px',
            textTransform: 'capitalize',
            fontWeight: 500,
          }}
        >
          {params.value.replace('_', ' ')}
        </Box>
      ),
    },
    { 
      field: 'priority', 
      headerName: 'Priority',
      width: 120,
      renderCell: (params) => (
        <Box
          sx={{
            backgroundColor: `${priorityColors[params.value]}15`,
            color: priorityColors[params.value],
            padding: '6px 12px',
            borderRadius: '6px',
            textTransform: 'capitalize',
            fontWeight: 500,
          }}
        >
          {params.value}
        </Box>
      ),
    },
    { 
      field: 'requestor', 
      headerName: 'Requester',
      width: 200,
    },
    { 
      field: 'assignee', 
      headerName: 'Assignee',
      width: 200,
    },
    { 
      field: 'created_at', 
      headerName: 'Created At',
      width: 180,
    },
  ];

  const userColumns = [
    { 
      field: 'email', 
      headerName: 'Email', 
      flex: 1,
      minWidth: 200,
    },
    { 
      field: 'first_name', 
      headerName: 'First Name',
      width: 150,
    },
    { 
      field: 'last_name', 
      headerName: 'Last Name',
      width: 150,
    },
    { 
      field: 'role', 
      headerName: 'Role',
      width: 120,
      renderCell: (params) => (
        <Box
          sx={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 8px'
          }}
        >
          <Box
            sx={{
              backgroundColor: `${roleColors[params.value]}15`,
              color: roleColors[params.value],
              padding: '2px 6px',
              borderRadius: 0,
              textTransform: 'capitalize',
              fontWeight: 500,
              width: 'calc(100% - 16px)',
              height: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {params.value}
          </Box>
        </Box>
      ),
    },
    { 
      field: 'groups', 
      headerName: 'Groups',
      width: 200,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%', margin: '0 8px' }}>
          <Box
            sx={{
              display: 'flex',
              gap: 0.5,
              flexWrap: 'wrap',
              flex: 1,
              height: '24px',
              alignItems: 'center'
            }}
          >
            {params.value ? params.value.split(', ').map((group, index) => (
              <Box
                key={index}
                sx={{
                  backgroundColor: 'primary.light',
                  padding: '2px 6px',
                  borderRadius: 0,
                  fontSize: '0.875rem',
                  height: '20px',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                {group}
              </Box>
            )) : null}
          </Box>
          <Tooltip title="Manage Groups">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedUser(params.row);
                setIsGroupManagementOpen(true);
              }}
            >
              <GroupIcon />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
    { 
      field: 'joined_at', 
      headerName: 'Joined At',
      width: 180,
    },
  ];

  // Add filtered users computation
  const filteredUsers = workspaceUsers.filter(user => {
    if (selectedGroup === 'all') return true;
    return user.groups.includes(selectedGroup);
  });

  const refreshData = async () => {
    setUsersLoading(true);
    try {
      const { data: users, error: usersError } = await supabase
        .from('workspace_memberships')
        .select(`
          user_id,
          created_at,
          role,
          users:user_id (
            email,
            first_name,
            last_name,
            created_at
          ),
          workspace:workspace_id (
            groups (
              id,
              name,
              group_memberships!inner (
                user_id
              )
            )
          )
        `)
        .eq('workspace_id', workspaceId);

      if (usersError) throw usersError;

      const formattedUsers = users.map(({ user_id, users: user, created_at, role, workspace }) => ({
        id: user_id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: role,
        joined_at: new Date(created_at).toLocaleString(),
        created_at: new Date(user.created_at).toLocaleString(),
        groups: workspace.groups
          ?.filter(group => group.group_memberships.some(gm => gm.user_id === user_id))
          .map(group => group.name)
          .join(', ') || ''
      }));

      setWorkspaceUsers(formattedUsers);
    } catch (error) {
      console.error('Error refreshing users:', error);
    } finally {
      setUsersLoading(false);
    }
  };

  const fetchTicketCounts = async (userId, workspaceId) => {
    try {
      if (!userId || !workspaceId) {
        console.warn('Missing userId or workspaceId for ticket counts');
        setTicketCounts({ you: 0, groups: 0, all: 0 });
        return;
      }

      const { data: userGroups } = await supabase
        .from('group_memberships')
        .select('group_id')
        .eq('user_id', userId);

      const groupIds = userGroups?.map(g => g.group_id) || [];

      const [assignedToYou, assignedToGroups, allOpen] = await Promise.all([
        supabase
          .from('tickets')
          .select('id', { count: 'exact' })
          .eq('workspace_id', workspaceId)
          .eq('assignee_id', userId)
          .eq('status', 'open'),

        groupIds.length > 0 ? 
          supabase
            .from('tickets')
            .select('id', { count: 'exact' })
            .eq('workspace_id', workspaceId)
            .in('group_id', groupIds)
            .eq('status', 'open')
          :
          Promise.resolve({ count: 0 }),

        supabase
          .from('tickets')
          .select('id', { count: 'exact' })
          .eq('workspace_id', workspaceId)
          .eq('status', 'open')
      ]);

      setTicketCounts({
        you: assignedToYou.count || 0,
        groups: assignedToGroups.count || 0,
        all: allOpen.count || 0
      });
    } catch (error) {
      console.error('Error fetching ticket counts:', error);
      setTicketCounts({ you: 0, groups: 0, all: 0 });
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.error('No authenticated user found');
          navigate('/login');
          return;
        }

        // Get user's role
        const { data: userRole, error: userError } = await supabase
          .from('workspace_memberships')
          .select('role')
          .eq('workspace_id', workspaceId)
          .eq('user_id', user.id)
          .single();

        if (userError) throw userError;
        setUserRole(userRole.role);

        // Fetch workspace users with their groups
        const { data: users, error: usersError } = await supabase
          .from('workspace_memberships')
          .select(`
            user_id,
            created_at,
            role,
            users:user_id (
              email,
              first_name,
              last_name,
              created_at
            ),
            workspace:workspace_id (
              groups (
                id,
                name,
                group_memberships!inner (
                  user_id
                )
              )
            )
          `)
          .eq('workspace_id', workspaceId);

        if (usersError) throw usersError;

        // Format users data
        const formattedUsers = users.map(({ user_id, users: user, created_at, role, workspace }) => ({
          id: user_id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          role: role,
          joined_at: new Date(created_at).toLocaleString(),
          created_at: new Date(user.created_at).toLocaleString(),
          groups: workspace.groups
            ?.filter(group => group.group_memberships.some(gm => gm.user_id === user_id))
            .map(group => group.name)
            .join(', ') || ''
        }));

        setWorkspaceUsers(formattedUsers);

        // Fetch all workspace groups
        const { data: groupsData, error: groupsError } = await supabase
          .from('groups')
          .select('*')
          .eq('workspace_id', workspaceId);

        if (groupsError) throw groupsError;
        setAvailableGroups(groupsData);

        // Fetch ticket counts
        await fetchTicketCounts(user.id, workspaceId);
        
        // Fetch filtered tickets
        let query = supabase
          .from('tickets')
          .select(`
            id,
            subject,
            description,
            status,
            priority,
            created_at,
            requestor:requestor_id(id, email, first_name, last_name),
            assignee:assignee_id(id, email, first_name, last_name),
            creator:creator_id(id, email, first_name, last_name),
            group:group_id(id, name),
            type:ticket_type_options(id, name),
            topic:ticket_topic_options(id, name),
            resolution:ticket_resolution_options(id, name),
            custom_fields,
            resolution_notes
          `)
          .eq('workspace_id', workspaceId);

        // Apply filters
        if (!showClosed) {
          query = query.neq('status', 'closed');
        }

        if (ticketFilter === 'you') {
          query = query.eq('assignee_id', user.id);
        } else if (ticketFilter === 'groups') {
          const { data: userGroups } = await supabase
            .from('group_memberships')
            .select('group_id')
            .eq('user_id', user.id);
          
          const groupIds = userGroups?.map(g => g.group_id) || [];
          if (groupIds.length > 0) {
            query = query.in('group_id', groupIds);
          } else {
            // If user has no groups, return no results
            setTickets([]);
            return;
          }
        }

        const { data: ticketsData, error: ticketsError } = await query;

        if (ticketsError) throw ticketsError;

        // Format the data for the grid
        const formattedTickets = ticketsData.map(ticket => ({
          id: ticket.id,
          subject: ticket.subject,
          description: ticket.description,
          status: ticket.status || 'open',
          priority: ticket.priority || 'normal',
          requestor: ticket.requestor ? `${ticket.requestor.first_name} ${ticket.requestor.last_name}` : '',
          assignee: ticket.assignee ? `${ticket.assignee.first_name} ${ticket.assignee.last_name}` : 'Unassigned',
          created_at: new Date(ticket.created_at).toLocaleString(),
          type: ticket.type?.name || '',
          topic: ticket.topic?.name || '',
          group: ticket.group?.name || '',
          resolution: ticket.resolution?.name || '',
          resolution_notes: ticket.resolution_notes || ''
        }));

        setTickets(formattedTickets);

      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
        setUsersLoading(false);
      }
    };

    fetchData();
  }, [ticketFilter, showClosed, navigate, workspaceId]);

  return (
    <Box>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 4 
      }}>
        <Typography 
          variant="h4" 
          component="h1" 
          sx={{ 
            color: 'primary.main',
            fontWeight: 600
          }}
        >
          Tickets
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          {canManage && (
            <>
              <Button
                variant="outlined"
                startIcon={<GroupAddIcon />}
                onClick={() => setIsGroupModalOpen(true)}
                sx={{
                  borderColor: 'primary.main',
                  color: 'primary.main',
                  '&:hover': {
                    borderColor: 'primary.dark',
                    backgroundColor: 'primary.light',
                  }
                }}
              >
                Create Group
              </Button>
              <Button
                variant="outlined"
                startIcon={<PersonAddIcon />}
                onClick={() => setIsTeamMemberModalOpen(true)}
                sx={{
                  borderColor: 'secondary.main',
                  color: 'secondary.main',
                  '&:hover': {
                    borderColor: 'secondary.dark',
                    backgroundColor: 'secondary.light',
                    color: 'secondary.contrastText',
                  }
                }}
              >
                Add Team Member
              </Button>
            </>
          )}
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('tickets/create')}
            sx={{
              backgroundColor: 'primary.main',
              '&:hover': {
                backgroundColor: 'primary.dark',
              }
            }}
          >
            Create Ticket
          </Button>
          <Tooltip title="Quick Ticket">
            <IconButton
              onClick={() => setIsQuickTicketModalOpen(true)}
              sx={{
                color: 'primary.contrastText',
                backgroundColor: 'primary.main',
                width: 36.5,
                height: 36.5,
                borderRadius: 0,
                '&:hover': {
                  backgroundColor: 'primary.dark',
                },
                '& .MuiSvgIcon-root': {
                  fontSize: 20,
                }
              }}
            >
              <NoteAddIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <TicketFilterButtons
        currentFilter={ticketFilter}
        onFilterChange={setTicketFilter}
        showClosed={showClosed}
        onShowClosedChange={setShowClosed}
        counts={ticketCounts}
      />

      <Card sx={{ mb: 4 }}>
        <DataGrid
          rows={tickets}
          columns={columns}
          pageSize={10}
          rowsPerPageOptions={[10, 25, 50]}
          checkboxSelection
          disableSelectionOnClick
          loading={loading}
          onRowClick={(params) => navigate(`tickets/${params.row.id}`)}
          autoHeight
          sx={{
            '& .MuiDataGrid-row': {
              cursor: 'pointer',
              '&:hover': {
                backgroundColor: 'primary.light',
              },
            },
            '& .MuiDataGrid-columnHeaders': {
              backgroundColor: 'primary.light',
              color: 'primary.main',
            },
            '& .MuiDataGrid-cell': {
              borderColor: 'custom.lightGray',
            },
            '& .MuiDataGrid-footerContainer': {
              borderTop: 'none',
              backgroundColor: 'background.paper',
            },
          }}
        />
      </Card>

      {canManage && (
        <>
          <Divider sx={{ 
            my: 4,
            borderColor: 'custom.lightGray',
          }} />
          
          <Box sx={{ mb: 4 }}>
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              mb: 3
            }}>
              <Typography 
                variant="h4" 
                component="h2"
                sx={{ 
                  color: 'primary.main',
                  fontWeight: 600
                }}
              >
                Team Members
              </Typography>
              <TextField
                select
                label="Filter by Group"
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
                sx={{ 
                  width: 200,
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: 'custom.lightGray',
                    },
                    '&:hover fieldset': {
                      borderColor: 'primary.main',
                    },
                  },
                }}
              >
                <MenuItem value="all">All Groups</MenuItem>
                {availableGroups.map((group) => (
                  <MenuItem key={group.id} value={group.name}>
                    {group.name}
                  </MenuItem>
                ))}
              </TextField>
            </Box>
            <Card>
              <DataGrid
                rows={filteredUsers}
                columns={userColumns}
                pageSize={10}
                rowsPerPageOptions={[10, 25, 50]}
                disableSelectionOnClick
                loading={usersLoading}
                autoHeight
                sx={{
                  '& .MuiDataGrid-row': {
                    '&:hover': {
                      backgroundColor: 'primary.light',
                    },
                  },
                  '& .MuiDataGrid-columnHeaders': {
                    backgroundColor: 'primary.light',
                    color: 'primary.main',
                  },
                  '& .MuiDataGrid-cell': {
                    borderColor: 'custom.lightGray',
                  },
                  '& .MuiDataGrid-footerContainer': {
                    borderTop: 'none',
                    backgroundColor: 'background.paper',
                  },
                }}
              />
            </Card>
          </Box>
        </>
      )}

      {/* Modals */}
      <CreateTeamMemberModal
        open={isTeamMemberModalOpen}
        onClose={() => setIsTeamMemberModalOpen(false)}
        workspaceId={workspaceId}
        userRole={userRole}
      />

      <CreateGroupModal
        open={isGroupModalOpen}
        onClose={() => setIsGroupModalOpen(false)}
        workspaceId={workspaceId}
      />

      <GroupManagementModal
        open={isGroupManagementOpen}
        onClose={() => {
          setIsGroupManagementOpen(false);
          setSelectedUser(null);
        }}
        user={selectedUser}
        workspaceId={workspaceId}
        onUpdate={refreshData}
      />

      <QuickTicketModal
        open={isQuickTicketModalOpen}
        onClose={() => setIsQuickTicketModalOpen(false)}
        workspaceId={workspaceId}
      />
    </Box>
  );
}

export default Home; 