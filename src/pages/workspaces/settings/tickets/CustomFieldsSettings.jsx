/**
 * CustomFieldsSettings Component
 * 
 * Manages custom fields for tickets in a workspace.
 * Provides interfaces for creating, editing, and managing field configurations.
 * 
 * Features:
 * - Custom field listing
 * - Field creation with different types (text, dropdown, checkbox, etc.)
 * - Field editing and deletion
 * - Field type configuration
 * - Field options management for dropdown/multiselect types
 * 
 * Props:
 * None - Uses React Router for workspace context
 */

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../../../lib/supabaseClient';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Alert,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  IconButton,
  Paper,
} from '@mui/material';
import {
  Add as AddIcon,
  Settings as SettingsIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';

// Import helper functions from WorkspaceSettings
const getFieldTypeLabel = (type) => {
  switch (type) {
    case 'dropdown':
      return 'Dropdown';
    case 'checkbox':
      return 'Checkbox';
    case 'text':
      return 'Text';
    case 'multiline':
      return 'Multiline Text';
    case 'multiselect':
      return 'Multi-Select';
    default:
      return type;
  }
};

function CustomFieldsSettings() {
  const navigate = useNavigate();
  const { workspaceId } = useParams();
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchFields = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: customFields, error: fieldsError } = await supabase
        .from('ticket_custom_fields')
        .select(`
          *,
          ticket_custom_field_options (
            id,
            name
          )
        `)
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });

      if (fieldsError) throw fieldsError;

      setFields(customFields);
    } catch (err) {
      console.error('Error fetching custom fields:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFields();
  }, [workspaceId]);

  const handleDeleteField = async (fieldId) => {
    try {
      const { error: deleteError } = await supabase
        .from('ticket_custom_fields')
        .delete()
        .eq('id', fieldId);

      if (deleteError) throw deleteError;

      fetchFields();
    } catch (err) {
      console.error('Error deleting field:', err);
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
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 4,
      }}>
        <Typography variant="h4" component="h1" sx={{ color: 'primary.main', fontWeight: 600 }}>
          Custom Fields
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate(`/workspaces/${workspaceId}/workspace-settings/tickets/create-field`)}
          sx={{
            backgroundColor: 'primary.main',
            '&:hover': {
              backgroundColor: 'primary.dark',
            }
          }}
        >
          Create Custom Field
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Type</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Options</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {fields.map((field) => (
              <TableRow key={field.id}>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {getFieldTypeLabel(field.type)}
                  </Box>
                </TableCell>
                <TableCell>{field.name}</TableCell>
                <TableCell>
                  {field.ticket_custom_field_options?.length > 0 
                    ? field.ticket_custom_field_options.map(opt => opt.name).join(', ')
                    : '-'
                  }
                </TableCell>
                <TableCell align="right">
                  <IconButton
                    onClick={() => navigate(`/workspaces/${workspaceId}/workspace-settings/tickets/custom-fields/${field.id}`)}
                    sx={{ color: 'primary.main' }}
                  >
                    <SettingsIcon />
                  </IconButton>
                  <IconButton
                    onClick={() => handleDeleteField(field.id)}
                    sx={{ color: 'error.main' }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {fields.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  <Typography variant="body2" sx={{ py: 2 }}>
                    No custom fields found. Click the Create Custom Field button to add one.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

export default CustomFieldsSettings; 