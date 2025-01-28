/**
 * TagsSettings Component
 * 
 * Manages ticket tags for a workspace.
 * Provides interfaces for creating, editing, and deleting ticket tags.
 * 
 * Features:
 * - Tag listing
 * - Tag creation
 * - Tag deletion
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

function TagsSettings() {
  const { workspaceId } = useParams();
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newTag, setNewTag] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [tagToDelete, setTagToDelete] = useState(null);

  const fetchTags = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: tags, error: tagsError } = await supabase
        .from('ticket_tags')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('name');

      if (tagsError) throw tagsError;

      setTags(tags);
    } catch (err) {
      console.error('Error fetching tags:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTags();
  }, [workspaceId]);

  const handleAddTag = async () => {
    try {
      setSaving(true);
      setError(null);

      if (!newTag.trim()) {
        throw new Error('Tag name is required');
      }

      const { error: createError } = await supabase
        .from('ticket_tags')
        .insert([{
          name: newTag.trim(),
          workspace_id: workspaceId
        }]);

      if (createError) throw createError;

      setNewTag('');
      fetchTags();
    } catch (err) {
      console.error('Error adding tag:', err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (tag) => {
    setTagToDelete(tag);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      const { error: deleteError } = await supabase
        .from('ticket_tags')
        .delete()
        .eq('id', tagToDelete.id);

      if (deleteError) throw deleteError;

      setDeleteDialogOpen(false);
      setTagToDelete(null);
      fetchTags();
    } catch (err) {
      console.error('Error deleting tag:', err);
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
        Tags
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
                label="New Tag"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="e.g., Urgent, High Priority, Backend"
              />
              <Button
                variant="contained"
                onClick={handleAddTag}
                disabled={saving || !newTag.trim()}
                sx={{
                  backgroundColor: 'primary.main',
                  '&:hover': {
                    backgroundColor: 'primary.dark',
                  },
                  whiteSpace: 'nowrap',
                }}
              >
                Add Tag
              </Button>
            </Box>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Tag Name</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tags.map((tag) => (
                    <TableRow key={tag.id}>
                      <TableCell>
                        <Chip 
                          label={tag.name}
                          size="small"
                          sx={{ mr: 1 }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          onClick={() => handleDeleteClick(tag)}
                          sx={{ color: 'error.main' }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                  {tags.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={2} align="center">
                        <Typography variant="body2" sx={{ py: 2 }}>
                          No tags found. Add your first tag above.
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
        <DialogTitle>Delete Tag</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the tag "{tagToDelete?.name}"? This action cannot be undone.
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

export default TagsSettings; 