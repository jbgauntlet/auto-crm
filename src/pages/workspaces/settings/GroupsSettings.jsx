/**
 * GroupsSettings Component
 * 
 * Manages workspace groups and their configurations.
 * Provides interfaces for creating, editing, and deleting groups.
 * 
 * Features:
 * - Group listing
 * - Group creation
 * - Group deletion
 * - Member assignment
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
  Button,
  Alert,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import CreateGroupModal from '../../../components/CreateGroupModal';

function GroupsSettings() {
  const { workspaceId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [groups, setGroups] = useState([]);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState(null);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: groupsData, error: groupsError } = await supabase
        .from('groups')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('name');

      if (groupsError) throw groupsError;
      setGroups(groupsData);
    } catch (err) {
      console.error('Error fetching groups:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, [workspaceId]);

  const handleDeleteClick = (group) => {
    setGroupToDelete(group);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      const { error: deleteError } = await supabase
        .from('groups')
        .delete()
        .eq('id', groupToDelete.id);

      if (deleteError) throw deleteError;

      setDeleteDialogOpen(false);
      setGroupToDelete(null);
      fetchGroups();
    } catch (err) {
      console.error('Error deleting group:', err);
      setError(err.message);
    }
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
        Groups
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Card>
        <CardContent>
          <Box sx={{ maxWidth: 800 }}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setCreateModalOpen(true)}
              >
                Create Group
              </Button>
            </Box>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Group Name</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {groups.map((group) => (
                    <TableRow key={group.id}>
                      <TableCell>{group.name}</TableCell>
                      <TableCell align="right">
                        <IconButton
                          onClick={() => handleDeleteClick(group)}
                          sx={{ color: 'error.main' }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                  {groups.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={2} align="center">
                        <Typography variant="body2" sx={{ py: 2 }}>
                          No groups found. Create your first group above.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </CardContent>
      </Card>

      {/* Create Group Modal */}
      <CreateGroupModal
        open={createModalOpen}
        onClose={() => {
          setCreateModalOpen(false);
          fetchGroups();
        }}
        workspaceId={workspaceId}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Group</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the group "{groupToDelete?.name}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default GroupsSettings; 