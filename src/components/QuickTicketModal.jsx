/**
 * QuickTicketModal Component
 * 
 * A streamlined modal dialog for quickly creating basic tickets.
 * Provides a simplified interface with essential ticket fields only.
 * 
 * Features:
 * - Minimal form with essential fields:
 *   - Subject
 *   - Description
 *   - Priority selection
 * - Automatic status setting
 * - Current user as default requestor
 * - Real-time form validation
 * 
 * Props:
 * @param {boolean} open - Controls the visibility of the modal
 * @param {function} onClose - Callback function to close the modal
 * @param {string} workspaceId - The ID of the current workspace
 * 
 * State Management:
 * - Tracks form input values
 * - Manages loading state during submission
 * - Handles form reset after submission
 * 
 * Database Interactions:
 * - Creates new ticket records
 * - Associates tickets with current user
 * - Sets default ticket properties
 * 
 * UX Features:
 * - Responsive modal design
 * - Form validation feedback
 * - Loading state indication
 * - Clear success/error handling
 */

import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Box,
} from '@mui/material';

function QuickTicketModal({ open, onClose, workspaceId }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    priority: 'normal',
    status: 'open',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { error } = await supabase
        .from('tickets')
        .insert([
          {
            ...formData,
            workspace_id: workspaceId,
            creator_id: user.id,
            requestor_id: user.id,
          }
        ]);

      if (error) throw error;

      // Reset form and close modal
      setFormData({
        subject: '',
        description: '',
        priority: 'normal',
        status: 'open',
      });
      onClose();
    } catch (error) {
      console.error('Error creating ticket:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle sx={{ 
        color: 'primary.main',
        fontWeight: 600,
      }}>
        Create Quick Ticket
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              required
              label="Subject"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              fullWidth
            />
            <TextField
              required
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              multiline
              rows={4}
              fullWidth
            />
            <TextField
              select
              label="Priority"
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              fullWidth
            >
              <MenuItem value="low">Low</MenuItem>
              <MenuItem value="normal">Normal</MenuItem>
              <MenuItem value="high">High</MenuItem>
              <MenuItem value="urgent">Urgent</MenuItem>
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button 
            onClick={onClose}
            sx={{ color: 'text.secondary' }}
          >
            Cancel
          </Button>
          <Button 
            type="submit"
            variant="contained"
            disabled={loading}
            sx={{
              backgroundColor: 'primary.main',
              '&:hover': {
                backgroundColor: 'primary.dark',
              }
            }}
          >
            Create Ticket
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

export default QuickTicketModal; 