/**
 * Checkbox Field Configuration Component
 * 
 * Allows administrators to configure a new checkbox custom field for tickets.
 * This component handles:
 * - Setting the field name
 * - Configuring a boolean checkbox field
 * - Saving the configuration to the database
 * 
 * Features:
 * - Field name validation
 * - Error handling
 * - Loading state management
 * - Database integration via Supabase
 * 
 * Creates a checkbox field that allows users to toggle between true/false
 * values when filling out tickets.
 * 
 * @component
 * @returns {JSX.Element} The rendered checkbox field configuration form
 */

import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../../../../lib/supabaseClient';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Alert,
} from '@mui/material';

/**
 * CheckboxFieldConfig component for creating and configuring checkbox custom fields
 */
function CheckboxFieldConfig() {
  const navigate = useNavigate();
  const { workspaceId } = useParams();
  const [fieldName, setFieldName] = useState('');
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  /**
   * Handles the creation of a new checkbox field
   * Validates input and saves to the database
   */
  const handleCreate = async () => {
    try {
      setSaving(true);
      setError(null);

      // Validate input
      if (!fieldName.trim()) {
        throw new Error('Field name is required');
      }

      // Create the checkbox field
      const { error: createError } = await supabase
        .from('ticket_custom_fields')
        .insert([{
          name: fieldName.trim(),
          type: 'checkbox',
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
        Create Checkbox Field
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
              placeholder="e.g., Is Urgent, Requires Follow-up"
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

export default CheckboxFieldConfig; 