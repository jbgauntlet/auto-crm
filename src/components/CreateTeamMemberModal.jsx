import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  MenuItem,
  Alert,
  Box,
  Checkbox,
  FormControl,
  InputLabel,
  Select,
  ListItemText,
  OutlinedInput,
} from '@mui/material';
import { supabase } from '../lib/supabaseClient';

const ROLE_OPTIONS = [
  { value: 'admin', label: 'Admin' },
  { value: 'agent', label: 'Agent' },
];

function CreateTeamMemberModal({ open, onClose, workspaceId }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [groups, setGroups] = useState([]);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    role: 'agent',
    selectedGroups: [],
  });

  useEffect(() => {
    if (open && workspaceId) {
      fetchGroups();
    }
  }, [open, workspaceId]);

  const fetchGroups = async () => {
    try {
      const { data: groupsData, error: groupsError } = await supabase
        .from('groups')
        .select('*')
        .eq('workspace_id', workspaceId);

      if (groupsError) throw groupsError;
      setGroups(groupsData);
    } catch (error) {
      setError(error.message);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError(null);
  };

  const handleGroupChange = (event) => {
    const {
      target: { value },
    } = event;
    setFormData(prev => ({
      ...prev,
      selectedGroups: typeof value === 'string' ? value.split(',') : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Generate a random password for the new user
      const tempPassword = Math.random().toString(36).slice(-8);

      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: tempPassword,
        options: {
          data: {
            first_name: formData.first_name,
            last_name: formData.last_name,
            role: formData.role,
          },
        },
      });

      if (authError) throw authError;

      // Create user profile
      const { error: profileError } = await supabase
        .from('users')
        .insert([
          {
            id: authData.user.id,
            email: formData.email,
            first_name: formData.first_name,
            last_name: formData.last_name,
            role: formData.role,
            created_at: new Date().toISOString(),
          }
        ]);

      if (profileError) throw profileError;

      // Create workspace membership
      const { error: membershipError } = await supabase
        .from('workspace_memberships')
        .insert([
          {
            workspace_id: workspaceId,
            user_id: authData.user.id,
            created_at: new Date().toISOString(),
          }
        ]);

      if (membershipError) throw membershipError;

      // Create group memberships
      if (formData.selectedGroups.length > 0) {
        const groupMemberships = formData.selectedGroups.map(groupId => ({
          user_id: authData.user.id,
          group_id: groupId,
          created_at: new Date().toISOString(),
        }));

        const { error: groupError } = await supabase
          .from('group_memberships')
          .insert(groupMemberships);

        if (groupError) throw groupError;
      }

      onClose();
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        role: 'agent',
        selectedGroups: [],
      });
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add Team Member</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              required
              fullWidth
              label="First Name"
              name="first_name"
              value={formData.first_name}
              onChange={handleInputChange}
            />

            <TextField
              required
              fullWidth
              label="Last Name"
              name="last_name"
              value={formData.last_name}
              onChange={handleInputChange}
            />

            <TextField
              required
              fullWidth
              type="email"
              label="Email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
            />

            <TextField
              select
              required
              fullWidth
              label="Role"
              name="role"
              value={formData.role}
              onChange={handleInputChange}
            >
              {ROLE_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>

            <FormControl fullWidth>
              <InputLabel>Groups</InputLabel>
              <Select
                multiple
                value={formData.selectedGroups}
                onChange={handleGroupChange}
                input={<OutlinedInput label="Groups" />}
                renderValue={(selected) => {
                  const selectedNames = selected.map(id => 
                    groups.find(g => g.id === id)?.name
                  ).filter(Boolean);
                  return selectedNames.join(', ');
                }}
              >
                {groups.map((group) => (
                  <MenuItem key={group.id} value={group.id}>
                    <Checkbox checked={formData.selectedGroups.includes(group.id)} />
                    <ListItemText primary={group.name} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
          >
            {loading ? 'Adding...' : 'Add Team Member'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

export default CreateTeamMemberModal; 