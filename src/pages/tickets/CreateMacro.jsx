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
} from '@mui/material';

function CreateMacro() {
  const navigate = useNavigate();
  const { workspaceId } = useParams();
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
        // Fetch ticket configuration
        const { data: configData, error: configError } = await supabase
          .from('workspace_settings')
          .select('ticket_configuration')
          .eq('workspace_id', workspaceId)
          .single();

        if (configError) throw configError;
        setTicketConfig(configData?.ticket_configuration);

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
        if (configData?.ticket_configuration?.has_groups) {
          const { data: groupsData, error: groupsError } = await supabase
            .from('groups')
            .select('*')
            .eq('workspace_id', workspaceId);

          if (groupsError) throw groupsError;
          setGroups(groupsData);
        }

        // Fetch type options if enabled
        if (configData?.ticket_configuration?.has_type) {
          const { data: types, error: typesError } = await supabase
            .from('ticket_type_options')
            .select('*')
            .eq('workspace_id', workspaceId);

          if (typesError) throw typesError;
          setTypeOptions(types);
        }

        // Fetch topic options if enabled
        if (configData?.ticket_configuration?.has_topic) {
          const { data: topics, error: topicsError } = await supabase
            .from('ticket_topic_options')
            .select('*')
            .eq('workspace_id', workspaceId);

          if (topicsError) throw topicsError;
          setTopicOptions(topics);
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
  }, [workspaceId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
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
        ...formData,
        workspace_id: workspaceId
      };

      const { error } = await supabase
        .from('tickets_macro')
        .insert([macroData]);

      if (error) throw error;

      navigate('../macros');
    } catch (error) {
      console.error('Error creating macro:', error);
      setError('Failed to create macro');
    }
  };

  const renderCustomField = (field) => {
    switch (field.type) {
      case 'text':
        return (
          <TextField
            fullWidth
            label={field.name}
            value={formData.custom_fields[field.id] || ''}
            onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
          />
        );
      case 'dropdown':
        return (
          <TextField
            fullWidth
            select
            label={field.name}
            value={formData.custom_fields[field.id] || ''}
            onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
          >
            <MenuItem value="">-</MenuItem>
            {field.options.map(option => (
              <MenuItem key={option.id} value={option.name}>
                {option.name}
              </MenuItem>
            ))}
          </TextField>
        );
      case 'checkbox':
        return (
          <TextField
            fullWidth
            select
            label={field.name}
            value={formData.custom_fields[field.id] || 'false'}
            onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
          >
            <MenuItem value="true">Selected</MenuItem>
            <MenuItem value="false">Not Selected</MenuItem>
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
          Create Ticket Macro
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
                  onClick={() => navigate('../macros')}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                >
                  Create Macro
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Box>
    </Box>
  );
}

export default CreateMacro; 