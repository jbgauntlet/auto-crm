import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../../../lib/supabaseClient';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Alert,
} from '@mui/material';

function MultilineFieldConfig() {
  const navigate = useNavigate();
  const { workspaceId } = useParams();
  const [fieldName, setFieldName] = useState('');
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    try {
      setSaving(true);
      setError(null);

      // Validate input
      if (!fieldName.trim()) {
        throw new Error('Field name is required');
      }

      // Create the multiline text field
      const { error: createError } = await supabase
        .from('ticket_custom_fields')
        .insert([{
          name: fieldName.trim(),
          type: 'multiline',
          workspace_id: workspaceId
        }]);

      if (createError) throw createError;

      // Redirect back to custom fields list
      navigate(`/workspaces/${workspaceId}/workspace-settings/tickets/custom-fields`);
    } catch (err) {
      console.error('Error creating field:', err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" sx={{ color: 'primary.main', fontWeight: 600, mb: 4 }}>
        Create Multiline Text Field
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Card>
        <CardContent>
          <Box sx={{ maxWidth: 600 }}>
            <TextField
              fullWidth
              label="Field Name"
              value={fieldName}
              onChange={(e) => setFieldName(e.target.value)}
              sx={{ mb: 4 }}
              required
              placeholder="e.g., Description, Additional Notes"
            />

            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                onClick={handleCreate}
                disabled={saving || !fieldName.trim()}
                sx={{
                  backgroundColor: 'primary.main',
                  '&:hover': {
                    backgroundColor: 'primary.dark',
                  },
                }}
              >
                {saving ? 'Creating...' : 'Create Field'}
              </Button>

              <Button
                variant="outlined"
                onClick={() => navigate(`/workspaces/${workspaceId}/workspace-settings/tickets/create-field`)}
              >
                Cancel
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}

export default MultilineFieldConfig; 