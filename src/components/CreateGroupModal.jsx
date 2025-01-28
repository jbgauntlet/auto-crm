/**
 * CreateGroupModal Component
 * 
 * A modal dialog for creating new groups within a workspace.
 * Provides a simple interface for group creation with validation.
 * 
 * Features:
 * - Single field form for group name
 * - Real-time input validation
 * - Loading state management
 * - Error handling and display
 * 
 * Props:
 * @param {boolean} open - Controls the visibility of the modal
 * @param {function} onClose - Callback function to close the modal
 * @param {string} workspaceId - The ID of the current workspace
 * 
 * State Management:
 * - Tracks group name input
 * - Manages loading state
 * - Handles error states
 * 
 * Database Interactions:
 * - Creates new group records
 * - Associates groups with workspace
 * - Handles unique constraint violations
 * 
 * Validation:
 * - Requires non-empty group name
 * - Trims whitespace
 * - Prevents duplicate submissions
 * - Provides error feedback
 */

import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Alert,
  Box,
} from '@mui/material';
import { supabase } from '../lib/supabaseClient';

function CreateGroupModal({ open, onClose, workspaceId }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [name, setName] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error: groupError } = await supabase
        .from('groups')
        .insert([
          {
            name: name.trim(),
            workspace_id: workspaceId,
            created_at: new Date().toISOString(),
          }
        ]);

      if (groupError) throw groupError;

      setName('');
      onClose();
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Create Group</DialogTitle>
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
              label="Group Name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError(null);
              }}
              autoFocus
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading || !name.trim()}
          >
            {loading ? 'Creating...' : 'Create Group'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

export default CreateGroupModal; 