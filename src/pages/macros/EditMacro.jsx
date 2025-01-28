/**
 * EditMacro Component
 * 
 * A comprehensive form interface for editing existing ticket macros in the workspace.
 * This component provides a full-featured editor for modifying macro templates,
 * including all ticket fields, custom fields, and automation settings.
 * 
 * Features:
 * - Loads and displays existing macro data for editing
 * - Dynamic custom field support with type-specific input controls
 * - User selection for requestor and assignee fields
 * - Group assignment capabilities
 * - Type and topic selection
 * - Priority level configuration
 * - Real-time validation and error handling
 * - Automatic data persistence to Supabase
 * 
 * Props (via URL parameters):
 * @param {string} workspaceId - The ID of the current workspace
 * @param {string} macroId - The ID of the macro being edited
 * 
 * State Management:
 * - Manages loading states for initial data fetch
 * - Handles form validation and submission states
 * - Maintains separate states for different field types
 * - Tracks changes to custom fields independently
 * 
 * Database Interactions:
 * - Fetches existing macro data from macros table
 * - Loads workspace configuration including custom fields
 * - Updates macro records in Supabase
 * - Manages related entities (users, groups, types, topics)
 */

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  MenuItem,
  Button,
  Alert,
  Autocomplete,
  FormControlLabel,
  Checkbox,
} from '@mui/material';

function EditMacro() {
  const navigate = useNavigate();
  const { workspaceId, macroId } = useParams();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [ticketConfig, setTicketConfig] = useState(null);
  const [customFields, setCustomFields] = useState([]);
  const [groups, setGroups] = useState([]);
  const [workspaceUsers, setWorkspaceUsers] = useState([]);
  const [typeOptions, setTypeOptions] = useState([]);
  const [topicOptions, setTopicOptions] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);

  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    priority: 'normal',
    requestor_id: null,
    assignee_id: null,
    group_id: '',
    type_id: '',
    topic_id: '',
    custom_fields: {}
  });

  const PRIORITY_OPTIONS = [
    { value: 'low', label: 'Low' },
    { value: 'normal', label: 'Normal' },
    { value: 'high', label: 'High' },
    { value: 'urgent', label: 'Urgent' }
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch macro data
        const { data: macro, error: macroError } = await supabase
          .from('tickets_macro')
          .select('*')
          .eq('id', macroId)
          .single();

        if (macroError) throw macroError;
        setFormData(macro);

        // Fetch ticket configuration
        const { data: configData, error: configError } = await supabase
          .from('ticket_configs')
          .select('*')
          .eq('workspace_id', workspaceId)
          .single();

        if (configError) throw configError;
        console.log('Ticket config:', configData);
        setTicketConfig(configData);

        // Fetch workspace users
        const { data: users, error: usersError } = await supabase
          .from('workspace_memberships')
          .select(`
            user:user_id (
              id,
              email,
              first_name,
              last_name
            )
          `)
          .eq('workspace_id', workspaceId);

        if (usersError) throw usersError;
        const formattedUsers = users.map(u => u.user);
        setWorkspaceUsers(formattedUsers);
        setFilteredUsers(formattedUsers);

        // Fetch groups if enabled
        if (configData?.has_groups) {
          const { data: groupsData, error: groupsError } = await supabase
            .from('groups')
            .select('*')
            .eq('workspace_id', workspaceId);

          if (groupsError) throw groupsError;
          setGroups(groupsData);
        }

        // Fetch type options if enabled
        if (configData?.has_type) {
          const { data: types, error: typesError } = await supabase
            .from('ticket_type_options')
            .select('*')
            .eq('workspace_id', workspaceId);

          if (typesError) throw typesError;
          console.log('Type options:', types);
          setTypeOptions(types);
        } else {
          console.log('Type options not enabled:', configData?.has_type);
        }

        // Fetch topic options if enabled
        if (configData?.has_topic) {
          const { data: topics, error: topicsError } = await supabase
            .from('ticket_topic_options')
            .select('*')
            .eq('workspace_id', workspaceId);

          if (topicsError) throw topicsError;
          console.log('Topic options:', topics);
          setTopicOptions(topics);
        } else {
          console.log('Topic options not enabled:', configData?.has_topic);
        }

        // Fetch custom fields
        const { data: fields, error: fieldsError } = await supabase
          .from('ticket_custom_fields')
          .select(`
            *,
            options:ticket_custom_field_options(*)
          `)
          .eq('workspace_id', workspaceId)
          .eq('is_enabled', true);

        if (fieldsError) throw fieldsError;
        setCustomFields(fields);

        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load form data');
        setLoading(false);
      }
    };

    fetchData();
  }, [workspaceId, macroId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith('custom_field_')) {
      const fieldId = name.replace('custom_field_', '');
      setFormData(prev => ({
        ...prev,
        custom_fields: {
          ...prev.custom_fields,
          [fieldId]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleCustomFieldChange = (fieldId, value) => {
    setFormData(prev => ({
      ...prev,
      custom_fields: {
        ...prev.custom_fields,
        [fieldId]: value
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const macroData = {
        subject: formData.subject,
        description: formData.description,
        priority: formData.priority,
        requestor_id: formData.requestor_id,
        assignee_id: formData.assignee_id,
        group_id: formData.group_id || null,
        type_id: formData.type_id || null,
        topic_id: formData.topic_id || null,
        custom_fields: formData.custom_fields
      };

      const { error } = await supabase
        .from('tickets_macro')
        .update(macroData)
        .eq('id', macroId);

      if (error) throw error;

      navigate(`/workspaces/${workspaceId}/macros`);
    } catch (error) {
      console.error('Error updating macro:', error);
      setError('Failed to update macro');
    }
  };

  const renderCustomField = (field) => {
    switch (field.type) {
      case 'checkbox':
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.custom_fields[field.id] === 'true'}
                  onChange={(e) => {
                    const { checked } = e.target;
                    setFormData(prev => ({
                      ...prev,
                      custom_fields: {
                        ...prev.custom_fields,
                        [field.id]: checked.toString()
                      }
                    }));
                  }}
                />
              }
              label={field.name}
            />
          </Box>
        );
      case 'dropdown':
        return (
          <TextField
            fullWidth
            select
            label={field.name}
            name={`custom_field_${field.id}`}
            value={formData.custom_fields[field.id] || ''}
            onChange={handleInputChange}
          >
            <MenuItem value="">-</MenuItem>
            {field.options.map((option) => (
              <MenuItem key={option.id} value={option.name}>
                {option.name}
              </MenuItem>
            ))}
          </TextField>
        );
      case 'text':
        return (
          <TextField
            fullWidth
            label={field.name}
            name={`custom_field_${field.id}`}
            value={formData.custom_fields[field.id] || ''}
            onChange={handleInputChange}
          />
        );
      case 'multiline':
        return (
          <TextField
            fullWidth
            multiline
            rows={4}
            label={field.name}
            name={`custom_field_${field.id}`}
            value={formData.custom_fields[field.id] || ''}
            onChange={handleInputChange}
          />
        );
      case 'multiselect':
        return (
          <TextField
            fullWidth
            select
            label={field.name}
            name={`custom_field_${field.id}`}
            value={formData.custom_fields[field.id] || []}
            onChange={handleInputChange}
            SelectProps={{
              multiple: true,
              renderValue: (selected) => selected.join(', ')
            }}
          >
            {field.options.map((option) => (
              <MenuItem key={option.id} value={option.name}>
                {option.name}
              </MenuItem>
            ))}
          </TextField>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return <Box>Loading...</Box>;
  }

  return (
    <Box sx={{ p: 3, backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <Box sx={{ 
        maxWidth: '1200px',
        mx: 'auto',
      }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 3 }}>
          Edit Ticket Macro
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* Main Macro Information */}
            <Grid item xs={12} md={8}>
              <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Macro Details
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Subject Template"
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      placeholder="Template for ticket subject"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Description Template"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      multiline
                      rows={6}
                      placeholder="Template for ticket description"
                    />
                  </Grid>
                </Grid>
              </Paper>

              {/* Custom Fields Section */}
              {customFields.length > 0 && (
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Additional Information
                  </Typography>
                  <Grid container spacing={2}>
                    {customFields.map((field) => (
                      <Grid item xs={12} md={6} key={field.id}>
                        {renderCustomField(field)}
                      </Grid>
                    ))}
                  </Grid>
                </Paper>
              )}
            </Grid>

            {/* Sidebar Information */}
            <Grid item xs={12} md={4}>
              {/* Classification Card */}
              <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Classification
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      select
                      label="Priority"
                      name="priority"
                      value={formData.priority}
                      onChange={handleInputChange}
                    >
                      {PRIORITY_OPTIONS.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>

                  {ticketConfig?.has_type && (
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        select
                        label="Type"
                        name="type_id"
                        value={formData.type_id}
                        onChange={handleInputChange}
                      >
                        <MenuItem value="">-</MenuItem>
                        {typeOptions.map((type) => (
                          <MenuItem key={type.id} value={type.id}>
                            {type.name}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                  )}

                  {ticketConfig?.has_topic && (
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        select
                        label="Topic"
                        name="topic_id"
                        value={formData.topic_id}
                        onChange={handleInputChange}
                      >
                        <MenuItem value="">-</MenuItem>
                        {topicOptions.map((topic) => (
                          <MenuItem key={topic.id} value={topic.id}>
                            {topic.name}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                  )}
                </Grid>
              </Paper>

              {/* Assignment Card */}
              <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Assignment
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Autocomplete
                      options={workspaceUsers}
                      getOptionLabel={(option) => 
                        option ? `${option.first_name} ${option.last_name} (${option.email})` : ''
                      }
                      value={workspaceUsers.find(u => u.id === formData.requestor_id) || null}
                      onChange={(event, newValue) => {
                        setFormData(prev => ({
                          ...prev,
                          requestor_id: newValue?.id || null
                        }));
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Default Requestor"
                          fullWidth
                        />
                      )}
                    />
                  </Grid>

                  {ticketConfig?.has_groups && (
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        select
                        label="Default Group"
                        name="group_id"
                        value={formData.group_id}
                        onChange={handleInputChange}
                      >
                        <MenuItem value="">-</MenuItem>
                        {groups.map((group) => (
                          <MenuItem key={group.id} value={group.id}>
                            {group.name}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                  )}

                  <Grid item xs={12}>
                    <Autocomplete
                      options={filteredUsers}
                      getOptionLabel={(option) => 
                        option ? `${option.first_name} ${option.last_name} (${option.email})` : ''
                      }
                      value={workspaceUsers.find(u => u.id === formData.assignee_id) || null}
                      onChange={(event, newValue) => {
                        setFormData(prev => ({
                          ...prev,
                          assignee_id: newValue?.id || null
                        }));
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Default Assignee"
                          fullWidth
                        />
                      )}
                    />
                  </Grid>
                </Grid>
              </Paper>

              {/* Actions */}
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate('../')}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                >
                  Save Changes
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Box>
    </Box>
  );
}

export default EditMacro; 