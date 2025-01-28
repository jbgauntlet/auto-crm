/**
 * TeamSettings Component
 * 
 * Manages team members and their roles within a workspace.
 * Provides interfaces for role assignment and group management.
 * 
 * Features:
 * - Member listing with search
 * - Role management
 * - Group assignments
 * - Member removal
 * - Role-based access control
 * 
 * Props:
 * None - Uses React Router for workspace context
 */

import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../../lib/supabaseClient';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  IconButton,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
} from '@mui/icons-material';

function TeamSettings() {
  const { workspaceId } = useParams();
  const [members, setMembers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentUserRole, setCurrentUserRole] = useState(null);
  const [editMember, setEditMember] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [selectedRole, setSelectedRole] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current user's role
      const { data: { user } } = await supabase.auth.getUser();
      const { data: currentMembership, error: currentMembershipError } = await supabase
        .from('workspace_memberships')
        .select('role')
        .eq('workspace_id', workspaceId)
        .eq('user_id', user.id)
        .single();

      if (currentMembershipError) throw currentMembershipError;
      setCurrentUserRole(currentMembership.role);

      // Fetch members with their details
      const { data: membersData, error: membersError } = await supabase
        .from('workspace_memberships')
        .select(`
          id,
          role,
          user_id,
          users (
            id,
            email,
            first_name,
            last_name
          )
        `)
        .eq('workspace_id', workspaceId);

      if (membersError) throw membersError;

      // Fetch group memberships for each user
      const { data: groupMembershipsData, error: groupMembershipsError } = await supabase
        .from('group_memberships')
        .select(`
          group_id,
          user_id,
          groups!inner (
            id,
            name,
            workspace_id
          )
        `)
        .eq('groups.workspace_id', workspaceId);

      if (groupMembershipsError) throw groupMembershipsError;

      // Fetch groups for the workspace
      const { data: groupsData, error: groupsError } = await supabase
        .from('groups')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('name');

      if (groupsError) throw groupsError;

      // Combine the data
      const membersWithGroups = membersData.map(member => ({
        ...member,
        group_memberships: groupMembershipsData.filter(gm => gm.user_id === member.user_id)
      }));

      setMembers(membersWithGroups);
      setGroups(groupsData);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [workspaceId]);

  const handleEditClick = async (member) => {
    try {
      // Fetch current group memberships for the user
      const { data: groupMemberships, error: groupError } = await supabase
        .from('group_memberships')
        .select('group_id')
        .eq('user_id', member.user_id);

      if (groupError) throw groupError;

      setEditMember(member);
      setSelectedRole(member.role);
      setSelectedGroups(groupMemberships.map(gm => gm.group_id));
      setEditDialogOpen(true);
    } catch (err) {
      console.error('Error fetching group memberships:', err);
      setError(err.message);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      // Update role
      const { error: roleError } = await supabase
        .from('workspace_memberships')
        .update({ role: selectedRole })
        .eq('id', editMember.id);

      if (roleError) throw roleError;

      // Delete existing group memberships
      const { error: deleteError } = await supabase
        .from('group_memberships')
        .delete()
        .eq('user_id', editMember.user_id);

      if (deleteError) throw deleteError;

      // Add new group memberships
      if (selectedGroups.length > 0) {
        const { error: groupError } = await supabase
          .from('group_memberships')
          .insert(
            selectedGroups.map(groupId => ({
              user_id: editMember.user_id,
              group_id: groupId
            }))
          );

        if (groupError) throw groupError;
      }

      setEditDialogOpen(false);
      fetchData();
    } catch (err) {
      console.error('Error saving changes:', err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (member) => {
    setMemberToDelete(member);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      const { error: deleteError } = await supabase
        .from('workspace_memberships')
        .delete()
        .eq('id', memberToDelete.id);

      if (deleteError) throw deleteError;

      setDeleteDialogOpen(false);
      setMemberToDelete(null);
      fetchData();
    } catch (err) {
      console.error('Error deleting member:', err);
      setError(err.message);
    }
  };

  const filteredMembers = members.filter(member => {
    const searchLower = searchQuery.toLowerCase();
    const fullName = `${member.users.first_name} ${member.users.last_name}`.toLowerCase();
    const email = member.users.email.toLowerCase();
    
    return fullName.includes(searchLower) || email.includes(searchLower);
  });

  const getAvailableRoles = () => {
    if (currentUserRole === 'owner') {
      return ['owner', 'admin', 'agent'];
    } else if (currentUserRole === 'admin') {
      return ['admin', 'agent'];
    }
    return [];
  };

  if (loading) {
    return (
      <Box sx={{ p: 4 }}>
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" sx={{ color: 'primary.main', fontWeight: 600, mb: 4 }}>
        Team Settings
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Card sx={{ mb: 4 }}>
        <CardContent>
          <TextField
            fullWidth
            label="Search members"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or email"
            sx={{ mb: 3 }}
          />

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Groups</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredMembers.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>
                      {member.users.first_name} {member.users.last_name}
                    </TableCell>
                    <TableCell>{member.users.email}</TableCell>
                    <TableCell>
                      <Chip 
                        label={member.role} 
                        color={
                          member.role === 'owner' 
                            ? 'error' 
                            : member.role === 'admin' 
                              ? 'warning' 
                              : 'default'
                        }
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {member.group_memberships?.map((gm, index) => {
                        const group = groups.find(g => g.id === gm.group_id);
                        return group ? (
                          <Chip
                            key={group.id}
                            label={group.name}
                            size="small"
                            sx={{ mr: 0.5, mb: 0.5 }}
                          />
                        ) : null;
                      })}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        onClick={() => handleEditClick(member)}
                        disabled={
                          currentUserRole === 'admin' && member.role === 'owner'
                        }
                        sx={{ color: 'primary.main' }}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        onClick={() => handleDeleteClick(member)}
                        disabled={
                          currentUserRole === 'admin' && member.role === 'owner'
                        }
                        sx={{ color: 'error.main' }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Edit Member Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Edit Member: {editMember?.users.first_name} {editMember?.users.last_name}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Role</InputLabel>
              <Select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                label="Role"
              >
                {getAvailableRoles().map((role) => (
                  <MenuItem key={role} value={role}>
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Groups</InputLabel>
              <Select
                multiple
                value={selectedGroups}
                onChange={(e) => setSelectedGroups(e.target.value)}
                label="Groups"
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((groupId) => (
                      <Chip
                        key={groupId}
                        label={groups.find(g => g.id === groupId)?.name}
                        size="small"
                      />
                    ))}
                  </Box>
                )}
              >
                {groups.map((group) => (
                  <MenuItem key={group.id} value={group.id}>
                    <Checkbox checked={selectedGroups.indexOf(group.id) > -1} />
                    <ListItemText primary={group.name} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={saving}
            sx={{
              backgroundColor: 'primary.main',
              '&:hover': {
                backgroundColor: 'primary.dark',
              },
            }}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Remove Team Member</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to remove {memberToDelete?.users.first_name} {memberToDelete?.users.last_name} from the workspace? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Remove
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default TeamSettings; 