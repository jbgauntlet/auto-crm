/**
 * ResolutionsSettings Component
 * 
 * Manages ticket resolution options for a workspace.
 * Provides interfaces for creating, editing, and deleting ticket resolutions.
 * 
 * Features:
 * - Resolution listing
 * - Resolution creation
 * - Resolution deletion
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
  Chip,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';

function ResolutionsSettings() {
  const { workspaceId } = useParams();
  const [resolutions, setResolutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newResolution, setNewResolution] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [resolutionToDelete, setResolutionToDelete] = useState(null);

  const fetchResolutions = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: resolutions, error: resolutionsError } = await supabase
        .from('ticket_resolution_options')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('name');

      if (resolutionsError) throw resolutionsError;

      setResolutions(resolutions);
    } catch (err) {
      console.error('Error fetching resolutions:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResolutions();
  }, [workspaceId]);

  const handleAddResolution = async () => {
    try {
      setSaving(true);
      setError(null);

      if (!newResolution.trim()) {
        throw new Error('Resolution name is required');
      }

      const { error: createError } = await supabase
        .from('ticket_resolution_options')
        .insert([{
          name: newResolution.trim(),
          workspace_id: workspaceId
        }]);

      if (createError) throw createError;

      setNewResolution('');
      fetchResolutions();
    } catch (err) {
      console.error('Error adding resolution:', err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (resolution) => {
    setResolutionToDelete(resolution);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      const { error: deleteError } = await supabase
        .from('ticket_resolution_options')
        .delete()
        .eq('id', resolutionToDelete.id);

      if (deleteError) throw deleteError;

      setDeleteDialogOpen(false);
      setResolutionToDelete(null);
      fetchResolutions();
    } catch (err) {
      console.error('Error deleting resolution:', err);
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
        Resolutions
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
                label="New Resolution"
                value={newResolution}
                onChange={(e) => setNewResolution(e.target.value)}
                placeholder="e.g., Fixed, Won't Fix, Duplicate"
              />
              <Button
                variant="contained"
                onClick={handleAddResolution}
                disabled={saving || !newResolution.trim()}
                sx={{
                  backgroundColor: 'primary.main',
                  '&:hover': {
                    backgroundColor: 'primary.dark',
                  },
                  whiteSpace: 'nowrap',
                }}
              >
                Add Resolution
              </Button>
            </Box>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Resolution Name</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {resolutions.map((resolution) => (
                    <TableRow key={resolution.id}>
                      <TableCell>
                        <Chip 
                          label={resolution.name}
                          size="small"
                          sx={{ mr: 1 }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          onClick={() => handleDeleteClick(resolution)}
                          sx={{ color: 'error.main' }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                  {resolutions.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={2} align="center">
                        <Typography variant="body2" sx={{ py: 2 }}>
                          No resolutions found. Add your first resolution above.
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
        <DialogTitle>Delete Resolution</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the resolution "{resolutionToDelete?.name}"? This action cannot be undone.
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

export default ResolutionsSettings; 