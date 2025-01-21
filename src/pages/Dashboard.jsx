import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Box, Button, Typography, Divider, TextField, MenuItem, IconButton, Tooltip } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import GroupIcon from '@mui/icons-material/Group';
import CreateTeamMemberModal from '../components/CreateTeamMemberModal';
import CreateGroupModal from '../components/CreateGroupModal';
import GroupManagementModal from '../components/GroupManagementModal';
import TicketFilterButtons from '../components/TicketFilterButtons';

function Dashboard() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentWorkspace, setCurrentWorkspace] = useState(null);
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
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();

        if (userError) throw userError;
        setUserRole(userData.role);

        // Get user's workspace
        const { data: membership, error: membershipError } = await supabase
          .from('workspace_memberships')
          .select('workspace_id')
          .eq('user_id', user.id)
          .single();

        if (membershipError) {
          if (membershipError.code === 'PGRST116') {
            // No workspace found for user
            navigate('/create-workspace');
            return;
          }
          throw membershipError;
        }

        if (!membership?.workspace_id) {
          console.error('No workspace found for user');
          navigate('/create-workspace');
          return;
        }

        setCurrentWorkspace(membership.workspace_id);

        // Fetch workspace users with their groups
        const { data: users, error: usersError } = await supabase
          .from('workspace_memberships')
          .select(`
            user_id,
            created_at,
            users:user_id (
              email,
              first_name,
              last_name,
              role,
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
          .eq('workspace_id', membership.workspace_id);

        if (usersError) throw usersError;

        // Format users data
        const formattedUsers = users.map(({ user_id, users: user, created_at, workspace }) => ({
          id: user_id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          role: user.role,
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
          .eq('workspace_id', membership.workspace_id);

        if (groupsError) throw groupsError;
        setAvailableGroups(groupsData);

        // Fetch ticket counts
        await fetchTicketCounts(user.id, membership.workspace_id);
        
        // Fetch filtered tickets
        let query = supabase
          .from('tickets')
          .select(`
            *,
            requestor:requestor_id(email),
            assignee:assignee_id(email),
            creator:creator_id(email)
          `)
          .eq('workspace_id', membership.workspace_id);

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
          query = query.in('group_id', groupIds);
        }

        const { data: ticketsData, error: ticketsError } = await query;

        if (ticketsError) throw ticketsError;

        // Format the data for the grid
        const formattedTickets = ticketsData.map(ticket => ({
          id: ticket.id,
          subject: ticket.subject,
          description: ticket.description,
          status: ticket.status,
          priority: ticket.priority,
          requestor: ticket.requestor?.email,
          assignee: ticket.assignee?.email,
          creator: ticket.creator?.email,
          created_at: new Date(ticket.created_at).toLocaleString(),
        }));

        setTickets(formattedTickets);

      } catch (error) {
        console.error('Error fetching data:', error);
        if (error.message?.includes('workspace')) {
          navigate('/create-workspace');
        }
      } finally {
        setLoading(false);
        setUsersLoading(false);
      }
    };

    fetchData();
  }, [ticketFilter, showClosed, navigate]);

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
            backgroundColor: 
              params.value === 'open' ? 'success.light' :
              params.value === 'in_progress' ? 'warning.light' :
              'error.light',
            padding: '4px 8px',
            borderRadius: '4px',
            textTransform: 'capitalize',
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
            backgroundColor: 
              params.value === 'urgent' ? 'error.light' :
              params.value === 'high' ? 'warning.light' :
              params.value === 'normal' ? 'info.light' :
              'success.light',
            padding: '4px 8px',
            borderRadius: '4px',
            textTransform: 'capitalize',
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
            backgroundColor: 
              params.value === 'owner' ? 'error.light' :
              params.value === 'admin' ? 'warning.light' :
              'info.light',
            padding: '4px 8px',
            borderRadius: '4px',
            textTransform: 'capitalize',
          }}
        >
          {params.value}
        </Box>
      ),
    },
    { 
      field: 'groups', 
      headerName: 'Groups',
      width: 200,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            sx={{
              display: 'flex',
              gap: 0.5,
              flexWrap: 'wrap',
              flex: 1,
            }}
          >
            {params.value ? params.value.split(', ').map((group, index) => (
              <Box
                key={index}
                sx={{
                  backgroundColor: 'primary.light',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontSize: '0.875rem',
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
          users:user_id (
            email,
            first_name,
            last_name,
            role,
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
        .eq('workspace_id', currentWorkspace);

      if (usersError) throw usersError;

      const formattedUsers = users.map(({ user_id, users: user, created_at, workspace }) => ({
        id: user_id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
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
      // Guard against null/undefined values
      if (!userId || !workspaceId) {
        console.warn('Missing userId or workspaceId for ticket counts');
        setTicketCounts({ you: 0, groups: 0, all: 0 });
        return;
      }

      // Get user's groups
      const { data: userGroups } = await supabase
        .from('group_memberships')
        .select('group_id')
        .eq('user_id', userId);

      const groupIds = userGroups?.map(g => g.group_id) || [];

      // Get counts for each filter
      const [assignedToYou, assignedToGroups, allOpen] = await Promise.all([
        // YOUR tickets
        supabase
          .from('tickets')
          .select('id', { count: 'exact' })
          .eq('workspace_id', workspaceId)
          .eq('assignee_id', userId)
          .eq('status', 'open'),

        // GROUP tickets
        groupIds.length > 0 ? 
          supabase
            .from('tickets')
            .select('id', { count: 'exact' })
            .eq('workspace_id', workspaceId)
            .in('group_id', groupIds)
            .eq('status', 'open')
          :
          Promise.resolve({ count: 0 }), // Return 0 if user has no groups

        // ALL tickets
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

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Tickets
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          {canManage && (
            <>
              <Button
                variant="contained"
                startIcon={<GroupAddIcon />}
                onClick={() => setIsGroupModalOpen(true)}
              >
                Create Group
              </Button>
              <Button
                variant="contained"
                startIcon={<PersonAddIcon />}
                onClick={() => setIsTeamMemberModalOpen(true)}
              >
                Add Team Member
              </Button>
            </>
          )}
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/create-ticket')}
          >
            Create Ticket
          </Button>
        </Box>
      </Box>

      <TicketFilterButtons
        currentFilter={ticketFilter}
        onFilterChange={setTicketFilter}
        showClosed={showClosed}
        onShowClosedChange={setShowClosed}
        counts={ticketCounts}
      />

      <Box sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={tickets}
          columns={columns}
          pageSize={10}
          rowsPerPageOptions={[10, 25, 50]}
          checkboxSelection
          disableSelectionOnClick
          loading={loading}
          onRowClick={(params) => navigate(`/ticket/${params.row.id}`)}
          sx={{
            '& .MuiDataGrid-row': {
              cursor: 'pointer',
              '&:hover': {
                backgroundColor: 'action.hover',
              },
            },
          }}
        />
      </Box>

      {canManage && (
        <>
          <Divider sx={{ my: 4 }} />
          
          <Box sx={{ mb: 3 }}>
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              mb: 2
            }}>
              <Typography variant="h4" component="h2">
                Team Members
              </Typography>
              <TextField
                select
                label="Filter by Group"
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
                sx={{ width: 200 }}
              >
                <MenuItem value="all">All Groups</MenuItem>
                {availableGroups.map((group) => (
                  <MenuItem key={group.id} value={group.name}>
                    {group.name}
                  </MenuItem>
                ))}
              </TextField>
            </Box>
            <Box sx={{ height: 400, width: '100%' }}>
              <DataGrid
                rows={filteredUsers}
                columns={userColumns}
                pageSize={10}
                rowsPerPageOptions={[10, 25, 50]}
                disableSelectionOnClick
                loading={usersLoading}
                sx={{
                  '& .MuiDataGrid-row': {
                    '&:hover': {
                      backgroundColor: 'action.hover',
                    },
                  },
                }}
              />
            </Box>
          </Box>
        </>
      )}

      <CreateTeamMemberModal
        open={isTeamMemberModalOpen}
        onClose={() => setIsTeamMemberModalOpen(false)}
        workspaceId={currentWorkspace}
      />

      <CreateGroupModal
        open={isGroupModalOpen}
        onClose={() => setIsGroupModalOpen(false)}
        workspaceId={currentWorkspace}
      />

      <GroupManagementModal
        open={isGroupManagementOpen}
        onClose={() => {
          setIsGroupManagementOpen(false);
          setSelectedUser(null);
        }}
        user={selectedUser}
        workspaceId={currentWorkspace}
        onUpdate={refreshData}
      />
    </Box>
  );
}

export default Dashboard; 