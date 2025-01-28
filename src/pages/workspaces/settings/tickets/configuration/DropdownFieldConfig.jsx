/**
 * Dropdown Field Configuration Component
 * 
 * Allows administrators to configure a new dropdown custom field for tickets.
 * This component handles:
 * - Setting the field name
 * - Managing dropdown options
 * - Adding and removing options
 * - Saving the configuration to the database
 * 
 * Features:
 * - Dynamic option management
 * - Field name validation
 * - Error handling
 * - Loading state management
 * - Database integration via Supabase
 * 
 * @component
 * @returns {JSX.Element} The rendered dropdown field configuration form
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
  IconButton,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Add as AddIcon,
} from '@mui/icons-material';

/**
 * DropdownFieldConfig component for creating and configuring dropdown custom fields
 */
function DropdownFieldConfig() {
  const navigate = useNavigate();
  const { workspaceId } = useParams();
  const [fieldName, setFieldName] = useState('');
  const [options, setOptions] = useState([{ name: '' }]);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  /**
   * Adds a new empty option to the options list
   */
  const handleAddOption = () => {
    setOptions([...options, { name: '' }]);
  };

  /**
   * Updates an option's value at the specified index
   * @param {number} index - The index of the option to update
   * @param {string} value - The new value for the option
   */
  const handleOptionChange = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = { name: value };
    setOptions(newOptions);
  };

  const handleRemoveOption = (index) => {
    if (options.length > 1) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const handleCreate = async () => {
    try {
      setSaving(true);
      setError(null);

      // Validate inputs
      if (!fieldName.trim()) {
        throw new Error('Field name is required');
      }

      const nonEmptyOptions = options.filter(opt => opt.name.trim());
      if (nonEmptyOptions.length === 0) {
        throw new Error('At least one option is required');
      }

      // Create the dropdown field
      const { data: field, error: createError } = await supabase
        .from('ticket_custom_fields')
        .insert([{
          name: fieldName.trim(),
          type: 'dropdown',
          workspace_id: workspaceId
        }])
        .select()
        .single();

      if (createError) throw createError;

      // Create the options
      const { error: optionsError } = await supabase
        .from('ticket_custom_field_options')
        .insert(
          nonEmptyOptions.map(option => ({
            name: option.name.trim(),
            ticket_field_id: field.id
          }))
        );

      if (optionsError) {
        // If options creation fails, delete the field
        await supabase
          .from('ticket_custom_fields')
          .delete()
          .eq('id', field.id);
        throw optionsError;
      }

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
        Create Dropdown Field
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
              placeholder="e.g., Priority, Status"
            />

            <Typography variant="h6" sx={{ mb: 2 }}>
              Options
            </Typography>

            {options.map((option, index) => (
              <Box key={index} sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <TextField
                  fullWidth
                  label={`Option ${index + 1}`}
                  value={option.name}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                  required={index === 0}
                />
                <IconButton 
                  onClick={() => handleRemoveOption(index)}
                  disabled={options.length === 1}
                  sx={{ 
                    color: 'error.main',
                    visibility: options.length === 1 ? 'hidden' : 'visible'
                  }}
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
            ))}

            <Button
              startIcon={<AddIcon />}
              onClick={handleAddOption}
              sx={{ mb: 4 }}
            >
              Add Option
            </Button>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                onClick={handleCreate}
                disabled={saving || !fieldName.trim() || !options[0].name.trim()}
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

export default DropdownFieldConfig; 