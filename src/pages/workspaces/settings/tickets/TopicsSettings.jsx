/**
 * TopicsSettings Component
 * 
 * Manages ticket topics for a workspace.
 * Provides interfaces for creating, editing, and deleting ticket topics.
 * 
 * Features:
 * - Topic listing
 * - Topic creation
 * - Topic deletion
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

function TopicsSettings() {
  const { workspaceId } = useParams();
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newTopic, setNewTopic] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [topicToDelete, setTopicToDelete] = useState(null);

  const fetchTopics = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: topics, error: topicsError } = await supabase
        .from('ticket_topic_options')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('name');

      if (topicsError) throw topicsError;

      setTopics(topics);
    } catch (err) {
      console.error('Error fetching topics:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTopics();
  }, [workspaceId]);

  const handleAddTopic = async () => {
    try {
      setSaving(true);
      setError(null);

      if (!newTopic.trim()) {
        throw new Error('Topic name is required');
      }

      const { error: createError } = await supabase
        .from('ticket_topic_options')
        .insert([{
          name: newTopic.trim(),
          workspace_id: workspaceId
        }]);

      if (createError) throw createError;

      setNewTopic('');
      fetchTopics();
    } catch (err) {
      console.error('Error adding topic:', err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (topic) => {
    setTopicToDelete(topic);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      const { error: deleteError } = await supabase
        .from('ticket_topic_options')
        .delete()
        .eq('id', topicToDelete.id);

      if (deleteError) throw deleteError;

      setDeleteDialogOpen(false);
      setTopicToDelete(null);
      fetchTopics();
    } catch (err) {
      console.error('Error deleting topic:', err);
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
        Topics
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
                label="New Topic"
                value={newTopic}
                onChange={(e) => setNewTopic(e.target.value)}
                placeholder="e.g., Bug Report, Feature Request"
              />
              <Button
                variant="contained"
                onClick={handleAddTopic}
                disabled={saving || !newTopic.trim()}
                sx={{
                  backgroundColor: 'primary.main',
                  '&:hover': {
                    backgroundColor: 'primary.dark',
                  },
                  whiteSpace: 'nowrap',
                }}
              >
                Add Topic
              </Button>
            </Box>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Topic Name</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {topics.map((topic) => (
                    <TableRow key={topic.id}>
                      <TableCell>{topic.name}</TableCell>
                      <TableCell align="right">
                        <IconButton
                          onClick={() => handleDeleteClick(topic)}
                          sx={{ color: 'error.main' }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                  {topics.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={2} align="center">
                        <Typography variant="body2" sx={{ py: 2 }}>
                          No topics found. Add your first topic above.
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
        <DialogTitle>Delete Topic</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the topic "{topicToDelete?.name}"? This action cannot be undone.
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

export default TopicsSettings; 