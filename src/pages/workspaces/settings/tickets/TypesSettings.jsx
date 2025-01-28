/**
 * TypesSettings Component
 * 
 * Manages ticket types for a workspace.
 * Provides interfaces for creating, editing, and deleting ticket types.
 * 
 * Features:
 * - Type listing
 * - Type creation
 * - Type deletion
 * - Real-time updates
 * - Error handling
 * 
 * Props:
 * None - Uses React Router for workspace context
 */

import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../../../lib/supabaseClient';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
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

function TypesSettings() {
  const { workspaceId } = useParams();
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newType, setNewType] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [typeToDelete, setTypeToDelete] = useState(null);

  const fetchTypes = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: types, error: typesError } = await supabase
        .from('ticket_type_options')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('name');

      if (typesError) throw typesError;

      setTypes(types);
    } catch (err) {
      console.error('Error fetching types:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTypes();
  }, [workspaceId]);

  const handleAddType = async () => {
    try {
      setSaving(true);
      setError(null);

      if (!newType.trim()) {
        throw new Error('Type name is required');
      }

      const { error: createError } = await supabase
        .from('ticket_type_options')
        .insert([{
          name: newType.trim(),
          workspace_id: workspaceId
        }]);

      if (createError) throw createError;

      setNewType('');
      fetchTypes();
    } catch (err) {
      console.error('Error adding type:', err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (type) => {
    setTypeToDelete(type);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      const { error: deleteError } = await supabase
        .from('ticket_type_options')
        .delete()
        .eq('id', typeToDelete.id);

      if (deleteError) throw deleteError;

      setDeleteDialogOpen(false);
      setTypeToDelete(null);
      fetchTypes();
    } catch (err) {
      console.error('Error deleting type:', err);
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
        Types
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Card>
        <CardContent>
          <Box sx={{ maxWidth: 600 }}>
            <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
              <TextField
                fullWidth
                label="New Type"
                value={newType}
                onChange={(e) => setNewType(e.target.value)}
                placeholder="e.g., Task, Issue, Enhancement"
              />
              <Button
                variant="contained"
                onClick={handleAddType}
                disabled={saving || !newType.trim()}
                sx={{
                  backgroundColor: 'primary.main',
                  '&:hover': {
                    backgroundColor: 'primary.dark',
                  },
                  whiteSpace: 'nowrap',
                }}
              >
                Add Type
              </Button>
            </Box>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Type Name</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {types.map((type) => (
                    <TableRow key={type.id}>
                      <TableCell>{type.name}</TableCell>
                      <TableCell align="right">
                        <IconButton
                          onClick={() => handleDeleteClick(type)}
                          sx={{ color: 'error.main' }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                  {types.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={2} align="center">
                        <Typography variant="body2" sx={{ py: 2 }}>
                          No types found. Add your first type above.
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

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Type</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the type "{typeToDelete?.name}"? This action cannot be undone.
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

export default TypesSettings; 