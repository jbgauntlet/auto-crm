import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Checkbox,
  FormControlLabel,
  Alert,
  Divider,
} from '@mui/material';
import { supabase } from '../lib/supabaseClient';

function GroupManagementModal({ open, onClose, user, workspaceId, onUpdate }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [groups, setGroups] = useState([]);
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [initialGroups, setInitialGroups] = useState([]);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (open && workspaceId) {
      fetchGroups();
    }
  }, [open, workspaceId]);

  const fetchGroups = async () => {
    try {
      // Fetch all workspace groups
      const { data: groupsData, error: groupsError } = await supabase
        .from('groups')
        .select('*')
        .eq('workspace_id', workspaceId);

      if (groupsError) throw groupsError;

      // Fetch user's group memberships
      const { data: memberships, error: membershipError } = await supabase
        .from('group_memberships')
        .select('group_id')
        .eq('user_id', user.id);

      if (membershipError) throw membershipError;

      const userGroupIds = memberships.map(m => m.group_id);
      setGroups(groupsData);
      setSelectedGroups(userGroupIds);
      setInitialGroups(userGroupIds);
      setHasChanges(false);
    } catch (error) {
      setError(error.message);
    }
  };

  const handleGroupToggle = (groupId) => {
    setSelectedGroups(prev => {
      const newSelection = prev.includes(groupId)
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId];
      
      setHasChanges(!arraysEqual(newSelection, initialGroups));
      return newSelection;
    });
  };

  const arraysEqual = (a, b) => {
    if (a.length !== b.length) return false;
    const sortedA = [...a].sort();
    const sortedB = [...b].sort();
    return sortedA.every((val, idx) => val === sortedB[idx]);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // Remove user from unselected groups
      const groupsToRemove = initialGroups.filter(
        groupId => !selectedGroups.includes(groupId)
      );
      
      if (groupsToRemove.length > 0) {
        const { error: removeError } = await supabase
          .from('group_memberships')
          .delete()
          .eq('user_id', user.id)
          .in('group_id', groupsToRemove);

        if (removeError) throw removeError;
      }

      // Add user to newly selected groups
      const groupsToAdd = selectedGroups.filter(
        groupId => !initialGroups.includes(groupId)
      );

      if (groupsToAdd.length > 0) {
        const newMemberships = groupsToAdd.map(groupId => ({
          user_id: user.id,
          group_id: groupId,
          created_at: new Date().toISOString(),
        }));

        const { error: addError } = await supabase
          .from('group_memberships')
          .insert(newMemberships);

        if (addError) throw addError;
      }

      setInitialGroups(selectedGroups);
      setHasChanges(false);
      onUpdate(); // Trigger table refresh
      onClose(); // Close the modal after successful save
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedGroups(initialGroups);
    setHasChanges(false);
    setError(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Manage Groups for {user?.first_name} {user?.last_name}
      </DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <Box sx={{ mt: 2 }}>
          {groups.map((group) => (
            <Box key={group.id} sx={{ mb: 1 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={selectedGroups.includes(group.id)}
                    onChange={() => handleGroupToggle(group.id)}
                    disabled={loading}
                  />
                }
                label={group.name}
              />
              <Divider />
            </Box>
          ))}
          {groups.length === 0 && (
            <Typography color="text.secondary">
              No groups available
            </Typography>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={loading || !hasChanges}
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default GroupManagementModal; 