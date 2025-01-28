/**
 * GeneralSettings Component
 * 
 * Manages general workspace settings including name and deletion options.
 * Only accessible to workspace owners.
 * 
 * Features:
 * - Workspace name management
 * - Workspace deletion (danger zone)
 * - Real-time updates
 * - Error handling
 * 
 * Props:
 * @param {Object} workspace - Current workspace data
 * @param {Function} onUpdate - Callback for workspace updates
 * @param {string} error - Error message to display
 * @param {boolean} loading - Loading state indicator
 */

import { useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Alert,
  Divider,
} from '@mui/material';

function GeneralSettings({ workspace, onUpdate, error: parentError, loading }) {
  const [name, setName] = useState(workspace?.name || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      const { error } = await supabase
        .from('workspaces')
        .update({ name: name.trim() })
        .eq('id', workspace.id);

      if (error) throw error;

      if (onUpdate) onUpdate({ ...workspace, name: name.trim() });
    } catch (error) {
      console.error('Error saving workspace:', error);
      setError(error.message);
    } finally {
      setSaving(false);
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
      <Typography
        variant="h4"
        component="h1"
        sx={{
          color: 'primary.main',
          fontWeight: 600,
          mb: 4,
        }}
      >
        General Settings
      </Typography>

      {(parentError || error) && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {parentError || error}
        </Alert>
      )}

      <Card>
        <CardContent>
          <Box sx={{ maxWidth: 400 }}>
            <TextField
              fullWidth
              label="Workspace Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              sx={{ mb: 3 }}
            />

            <Button
              variant="contained"
              onClick={handleSave}
              disabled={saving || !name.trim() || name.trim() === workspace?.name}
              sx={{
                backgroundColor: 'primary.main',
                '&:hover': {
                  backgroundColor: 'primary.dark',
                },
              }}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </Box>

          <Divider sx={{ my: 4 }} />

          <Typography
            variant="h6"
            component="h2"
            sx={{
              color: 'error.main',
              fontWeight: 600,
              mb: 2,
            }}
          >
            Danger Zone
          </Typography>

          <Button
            variant="outlined"
            color="error"
            onClick={() => {
              // TODO: Add workspace deletion functionality
              // This should include a confirmation dialog
            }}
          >
            Delete Workspace
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
}

export default GeneralSettings; 