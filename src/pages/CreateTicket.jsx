import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import {
  Box,
  TextField,
  Button,
  MenuItem,
  Typography,
  Alert,
} from '@mui/material';

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

function CreateTicket() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [workspaceUsers, setWorkspaceUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [currentWorkspace, setCurrentWorkspace] = useState(null);
  const [groupMembers, setGroupMembers] = useState([]);

  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    priority: 'normal',
    requestor_id: '',
    group_id: '',
    assignee_id: '',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get current user's workspace
        const { data: { user } } = await supabase.auth.getUser();
        const { data: membership } = await supabase
          .from('workspace_memberships')
          .select('workspace_id')
          .eq('user_id', user.id)
          .single();

        setCurrentWorkspace(membership.workspace_id);

        // Fetch workspace users
        const { data: users, error: usersError } = await supabase
          .from('users')
          .select('id, email, first_name, last_name')
          .eq('id', user.id);

        if (usersError) throw usersError;
        setWorkspaceUsers(users);

        // Fetch workspace groups
        const { data: groupsData, error: groupsError } = await supabase
          .from('groups')
          .select('*')
          .eq('workspace_id', membership.workspace_id);

        if (groupsError) throw groupsError;
        setGroups(groupsData);

      } catch (error) {
        setError(error.message);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const fetchGroupMembers = async () => {
      if (!formData.group_id) {
        // If no group selected, show all workspace users
        const { data: users, error } = await supabase
          .from('workspace_memberships')
          .select(`
            user_id,
            users:user_id (
              id,
              email,
              first_name,
              last_name
            )
          `)
          .eq('workspace_id', currentWorkspace);

        if (error) throw error;
        setGroupMembers(users.map(u => u.users));
      } else {
        // Fetch users in the selected group
        const { data: members, error } = await supabase
          .from('group_memberships')
          .select(`
            user_id,
            users:user_id (
              id,
              email,
              first_name,
              last_name
            )
          `)
          .eq('group_id', formData.group_id);

        if (error) throw error;
        setGroupMembers(members.map(m => m.users));
      }
    };

    if (currentWorkspace) {
      fetchGroupMembers().catch(error => {
        setError(error.message);
      });
    }
  }, [formData.group_id, currentWorkspace]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Reset assignee if group changes
    if (name === 'group_id') {
      setFormData(prev => ({
        ...prev,
        [name]: value,
        assignee_id: '', // Reset assignee
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
    
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const ticketData = {
        subject: formData.subject,
        description: formData.description,
        priority: formData.priority,
        status: 'open',
        requestor_id: formData.requestor_id || user.id,
        assignee_id: formData.assignee_id || null,
        group_id: formData.group_id || null,
        workspace_id: currentWorkspace,
        creator_id: user.id,
        created_at: new Date().toISOString(),
      };

      const { error: ticketError } = await supabase
        .from('tickets')
        .insert([ticketData]);

      if (ticketError) throw ticketError;

      navigate('/dashboard');
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ 
        width: '50%',
        mx: 'auto',
        minWidth: '600px',
      }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Create Ticket
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              required
              fullWidth
              select
              label="Requestor"
              name="requestor_id"
              value={formData.requestor_id}
              onChange={handleInputChange}
            >
              {workspaceUsers.map((user) => (
                <MenuItem key={user.id} value={user.id}>
                  {user.email}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              fullWidth
              select
              label="Group"
              name="group_id"
              value={formData.group_id}
              onChange={handleInputChange}
            >
              <MenuItem value="">-</MenuItem>
              {groups.map((group) => (
                <MenuItem key={group.id} value={group.id}>
                  {group.name}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              required
              fullWidth
              select
              label="Assignee"
              name="assignee_id"
              value={formData.assignee_id}
              onChange={handleInputChange}
            >
              <MenuItem value="">-</MenuItem>
              {groupMembers.map((user) => (
                <MenuItem key={user.id} value={user.id}>
                  {user.email}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              required
              fullWidth
              label="Subject"
              name="subject"
              value={formData.subject}
              onChange={handleInputChange}
            />

            <TextField
              required
              fullWidth
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              multiline
              rows={4}
            />

            <TextField
              required
              fullWidth
              select
              label="Priority"
              name="priority"
              value={formData.priority}
              onChange={handleInputChange}
            >
              {PRIORITY_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>

            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              sx={{ mt: 2, height: 46 }}
            >
              {loading ? 'Creating...' : 'Create Ticket'}
            </Button>
          </Box>
        </form>
      </Box>
    </Box>
  );
}

export default CreateTicket; 