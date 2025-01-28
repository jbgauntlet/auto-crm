/**
 * ConfigurationSettings Component
 * 
 * Manages global ticket configuration settings for a workspace.
 * Controls which features and fields are enabled for tickets.
 * 
 * Features:
 * - Enable/disable resolution field
 * - Enable/disable resolution notes
 * - Enable/disable type field
 * - Enable/disable topic field
 * - Enable/disable group assignment
 * - Enable/disable custom fields
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
  Button,
  Alert,
  FormControlLabel,
  Checkbox,
  Divider,
} from '@mui/material';

function ConfigurationSettings() {
  const { workspaceId } = useParams();
  const [config, setConfig] = useState(null);
  const [customFields, setCustomFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editedConfig, setEditedConfig] = useState(null);
  const [editedFields, setEditedFields] = useState([]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch ticket config
      const { data: configData, error: configError } = await supabase
        .from('ticket_configs')
        .select('*')
        .eq('workspace_id', workspaceId)
        .single();

      if (configError) throw configError;

      // Fetch custom fields
      const { data: fieldsData, error: fieldsError } = await supabase
        .from('ticket_custom_fields')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at');

      if (fieldsError) throw fieldsError;

      setConfig(configData);
      setCustomFields(fieldsData);
      setEditedConfig(configData);
      setEditedFields(fieldsData);
    } catch (err) {
      console.error('Error fetching configuration:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [workspaceId]);

  const handleEdit = () => {
    setIsEditing(true);
    setEditedConfig({ ...config });
    setEditedFields([...customFields]);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedConfig({ ...config });
    setEditedFields([...customFields]);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      // Update ticket config
      const { error: configError } = await supabase
        .from('ticket_configs')
        .update({
          has_resolution: editedConfig.has_resolution,
          has_resolution_notes: editedConfig.has_resolution_notes,
          has_type: editedConfig.has_type,
          has_topic: editedConfig.has_topic,
          has_groups: editedConfig.has_groups,
        })
        .eq('id', config.id);

      if (configError) throw configError;

      // Update custom fields
      for (const field of editedFields) {
        const { error: fieldError } = await supabase
          .from('ticket_custom_fields')
          .update({ is_enabled: field.is_enabled })
          .eq('id', field.id);

        if (fieldError) throw fieldError;
      }

      setConfig(editedConfig);
      setCustomFields(editedFields);
      setIsEditing(false);
    } catch (err) {
      console.error('Error saving configuration:', err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleConfigChange = (field) => (event) => {
    setEditedConfig({
      ...editedConfig,
      [field]: event.target.checked,
    });
  };

  const handleFieldChange = (fieldId) => (event) => {
    setEditedFields(
      editedFields.map((field) =>
        field.id === fieldId
          ? { ...field, is_enabled: event.target.checked }
          : field
      )
    );
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
          Ticket Configuration
        </Typography>
        {!isEditing ? (
          <Button
            variant="contained"
            onClick={handleEdit}
            sx={{
              backgroundColor: 'primary.main',
              '&:hover': {
                backgroundColor: 'primary.dark',
              },
            }}
          >
            Edit Configuration
          </Button>
        ) : (
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              onClick={handleCancel}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={saving}
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
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 3 }}>
            General Settings
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 4 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={editedConfig?.has_resolution ?? false}
                  onChange={handleConfigChange('has_resolution')}
                  disabled={!isEditing}
                />
              }
              label="Enable Resolution Field"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={editedConfig?.has_resolution_notes ?? false}
                  onChange={handleConfigChange('has_resolution_notes')}
                  disabled={!isEditing}
                />
              }
              label="Enable Resolution Notes"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={editedConfig?.has_type ?? false}
                  onChange={handleConfigChange('has_type')}
                  disabled={!isEditing}
                />
              }
              label="Enable Type Field"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={editedConfig?.has_topic ?? false}
                  onChange={handleConfigChange('has_topic')}
                  disabled={!isEditing}
                />
              }
              label="Enable Topic Field"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={editedConfig?.has_groups ?? false}
                  onChange={handleConfigChange('has_groups')}
                  disabled={!isEditing}
                />
              }
              label="Enable Group Assignment"
            />
          </Box>

          <Divider sx={{ my: 4 }} />

          <Typography variant="h6" sx={{ mb: 3 }}>
            Custom Fields
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {editedFields.map((field) => (
              <FormControlLabel
                key={field.id}
                control={
                  <Checkbox
                    checked={field.is_enabled}
                    onChange={handleFieldChange(field.id)}
                    disabled={!isEditing}
                  />
                }
                label={field.name}
              />
            ))}
            {editedFields.length === 0 && (
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                No custom fields found. Create custom fields to configure them here.
              </Typography>
            )}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}

export default ConfigurationSettings; 