/**
 * CreateTeamMemberModal Component
 * 
 * A modal dialog component for inviting new team members to a workspace.
 * Handles the complete invitation flow including role assignment and group selection.
 * 
 * Features:
 * - Email-based team member invitation
 * - Role-based access control (RBAC)
 * - Multiple group assignments
 * - Validation for existing users and memberships
 * - Error handling and user feedback
 * 
 * Props:
 * @param {boolean} open - Controls the visibility of the modal
 * @param {function} onClose - Callback function to close the modal
 * @param {string} workspaceId - The ID of the current workspace
 * @param {string} userRole - The role of the current user ('owner' or 'admin')
 * 
 * State Management:
 * - Tracks form input values (email, role, groups)
 * - Manages loading and error states
 * - Maintains list of available groups
 * 
 * Database Interactions:
 * - Checks for existing user accounts
 * - Validates workspace memberships
 * - Creates workspace invites
 * - Manages group associations
 * 
 * Security:
 * - Role-based rendering (only owners and admins can access)
 * - Validates user permissions for role assignment
 * - Prevents duplicate invitations
 * 
 * Error Handling:
 * - Validates email format
 * - Checks for existing memberships
 * - Handles database errors
 * - Provides user-friendly error messages
 */

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

function CreateTeamMemberModal({ open, onClose, workspaceId, userRole }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [groups, setGroups] = useState([]);
  const [formData, setFormData] = useState({
    email: '',
    role: 'agent',
    selectedGroups: [],
  });

  // Define available roles based on user's role
  const getRoleOptions = () => {
    switch (userRole) {
      case 'owner':
        return [
          { value: 'owner', label: 'Owner' },
          { value: 'admin', label: 'Admin' },
          { value: 'agent', label: 'Agent' },
        ];
      case 'admin':
        return [
          { value: 'admin', label: 'Admin' },
          { value: 'agent', label: 'Agent' },
        ];
      default:
        return [];
    }
  };

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
    setError(null);

    try {
      // Check if user exists
      const { data: existingUser, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('email', formData.email)
        .single();

      if (userError && userError.code !== 'PGRST116') { // PGRST116 is "not found" error
        throw userError;
      }

      if (!existingUser) {
        throw new Error('No user found with this email address. Please make sure the user has signed up first.');
      }

      // Check if user is already a member of the workspace
      const { data: existingMembership, error: membershipError } = await supabase
        .from('workspace_memberships')
        .select('id')
        .eq('workspace_id', workspaceId)
        .eq('user_id', existingUser.id)
        .single();

      if (membershipError && membershipError.code !== 'PGRST116') {
        throw membershipError;
      }

      if (existingMembership) {
        throw new Error('This user is already a member of the workspace.');
      }

      // Check if user already has a pending invite
      const { data: existingInvite, error: inviteError } = await supabase
        .from('workspace_invites')
        .select('id')
        .eq('workspace_id', workspaceId)
        .eq('email', formData.email)
        .single();

      if (inviteError && inviteError.code !== 'PGRST116') {
        throw inviteError;
      }

      if (existingInvite) {
        throw new Error('This user already has a pending invitation to this workspace.');
      }

      // Create workspace invites for each selected group
      const invitePromises = formData.selectedGroups.map(groupId => 
        supabase
          .from('workspace_invites')
          .insert([{
            email: formData.email,
            workspace_id: workspaceId,
            role: formData.role,
            group_id: groupId,
          }])
      );

      // If no groups selected, create one invite without group
      if (formData.selectedGroups.length === 0) {
        invitePromises.push(
          supabase
            .from('workspace_invites')
            .insert([{
              email: formData.email,
              workspace_id: workspaceId,
              role: formData.role,
            }])
        );
      }

      const results = await Promise.all(invitePromises);
      const errors = results.filter(result => result.error);
      
      if (errors.length > 0) {
        throw new Error('Failed to create one or more invites');
      }

      onClose();
      setFormData({
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

  // Don't render the modal if user is not authorized
  if (userRole !== 'owner' && userRole !== 'admin') {
    return null;
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle
        sx={{
          color: 'primary.main',
          fontWeight: 600,
          pb: 1,
        }}
      >
        Add Team Member
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
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
              {getRoleOptions().map((option) => (
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
            sx={{
              height: 48,
              backgroundColor: 'primary.main',
              '&:hover': {
                backgroundColor: 'primary.dark',
              },
            }}
          >
            {loading ? 'Sending Invite...' : 'Send Invite'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

export default CreateTeamMemberModal; 