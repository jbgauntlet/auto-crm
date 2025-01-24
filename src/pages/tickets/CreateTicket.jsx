import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import {
  Box,
  TextField,
  Button,
  MenuItem,
  Typography,
  Alert,
  Grid,
  Divider,
  Chip,
  Paper,
  Autocomplete,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import debounce from 'lodash/debounce';

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

const STATUS_OPTIONS = [
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'pending', label: 'Pending' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
];

function CreateTicket() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [workspaceUsers, setWorkspaceUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [currentWorkspace, setCurrentWorkspace] = useState(null);
  const [groupMembers, setGroupMembers] = useState([]);
  const [ticketConfig, setTicketConfig] = useState(null);
  const [customFields, setCustomFields] = useState([]);
  const [typeOptions, setTypeOptions] = useState([]);
  const [topicOptions, setTopicOptions] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [tagSuggestions, setTagSuggestions] = useState([]);
  const [tagSearchQuery, setTagSearchQuery] = useState('');

  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    priority: 'normal',
    requestor_id: '',
    group_id: '',
    assignee_id: '',
    type_id: '',
    topic_id: '',
    custom_fields: {},
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get current user's workspace
        const { data: { user } } = await supabase.auth.getUser();
        const { data: membership } = await supabase
          .from('workspace_memberships')
          .select('workspace_id')
          .eq('user_id', user.id)
          .single();

        setCurrentWorkspace(membership.workspace_id);

        // Fetch workspace users
        const { data: users, error: usersError } = await supabase
          .from('users')
          .select('id, email, first_name, last_name')
          .eq('id', user.id);

        if (usersError) throw usersError;
        setWorkspaceUsers(users);

        // Fetch workspace groups
        const { data: groupsData, error: groupsError } = await supabase
          .from('groups')
          .select('*')
          .eq('workspace_id', membership.workspace_id);

        if (groupsError) throw groupsError;
        setGroups(groupsData);

        // Fetch ticket configuration
        const { data: configData, error: configError } = await supabase
          .from('ticket_configs')
          .select('*')
          .eq('workspace_id', membership.workspace_id)
          .single();

        if (configError) throw configError;
        setTicketConfig(configData);

        // Fetch custom fields
        const { data: fieldsData, error: fieldsError } = await supabase
          .from('ticket_custom_fields')
          .select(`
            *,
            options:ticket_custom_field_options(*)
          `)
          .eq('workspace_id', membership.workspace_id)
          .eq('is_enabled', true);

        if (fieldsError) throw fieldsError;
        setCustomFields(fieldsData);

        // Initialize custom_fields object with empty values
        const initialCustomFields = {};
        fieldsData.forEach(field => {
          // Initialize multiselect fields as empty arrays, others as empty strings
          initialCustomFields[field.id] = field.type === 'multiselect' ? [] : '';
        });
        setFormData(prev => ({
          ...prev,
          custom_fields: initialCustomFields
        }));

        // Fetch type options if enabled
        if (configData.has_type) {
          const { data: types, error: typesError } = await supabase
            .from('ticket_type_options')
            .select('*')
            .eq('workspace_id', membership.workspace_id);

          if (typesError) throw typesError;
          setTypeOptions(types);
        }

        // Fetch topic options if enabled
        if (configData.has_topic) {
          const { data: topics, error: topicsError } = await supabase
            .from('ticket_topic_options')
            .select('*')
            .eq('workspace_id', membership.workspace_id);

          if (topicsError) throw topicsError;
          setTopicOptions(topics);
        }

      } catch (error) {
        setError(error.message);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const fetchGroupMembers = async () => {
      if (!formData.group_id) {
        // If no group selected, show all workspace users
        const { data: users, error } = await supabase
          .from('workspace_memberships')
          .select(`
            user_id,
            users:user_id (
              id,
              email,
              first_name,
              last_name
            )
          `)
          .eq('workspace_id', currentWorkspace);

        if (error) throw error;
        setGroupMembers(users.map(u => u.users));
      } else {
        // Fetch users in the selected group
        const { data: members, error } = await supabase
          .from('group_memberships')
          .select(`
            user_id,
            users:user_id (
              id,
              email,
              first_name,
              last_name
            )
          `)
          .eq('group_id', formData.group_id);

        if (error) throw error;
        setGroupMembers(members.map(m => m.users));
      }
    };

    if (currentWorkspace) {
      fetchGroupMembers().catch(error => {
        setError(error.message);
      });
    }
  }, [formData.group_id, currentWorkspace]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith('custom_field_')) {
      const fieldId = name.replace('custom_field_', '');
      const field = customFields.find(f => f.id === fieldId);
      
      // Handle multiselect fields differently
      if (field?.type === 'multiselect') {
        setFormData(prev => ({
          ...prev,
          custom_fields: {
            ...prev.custom_fields,
            [fieldId]: value // value is already an array for multiselect
          }
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          custom_fields: {
            ...prev.custom_fields,
            [fieldId]: value
          }
        }));
      }
    } else if (name === 'group_id') {
      setFormData(prev => ({
        ...prev,
        [name]: value,
        assignee_id: '', // Reset assignee
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
    
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const ticketData = {
        subject: formData.subject,
        description: formData.description,
        priority: formData.priority,
        status: 'open',
        requestor_id: formData.requestor_id || user.id,
        assignee_id: formData.assignee_id || null,
        group_id: formData.group_id || null,
        workspace_id: currentWorkspace,
        creator_id: user.id,
        type_id: formData.type_id || null,
        topic_id: formData.topic_id || null,
        created_at: new Date().toISOString(),
        custom_fields: formData.custom_fields,
      };

      // Start a transaction
      const { data: ticket, error: ticketError } = await supabase
        .from('tickets')
        .insert([ticketData])
        .select()
        .single();

      if (ticketError) throw ticketError;

      // Create the initial ticket version
      const versionData = {
        ...ticketData,
        ticket_id: ticket.id
      };

      const { error: versionError } = await supabase
        .from('ticket_versions')
        .insert([versionData]);

      if (versionError) throw versionError;

      // Create tag memberships
      if (selectedTags.length > 0) {
        const tagMemberships = selectedTags.map(tag => ({
          ticket_id: ticket.id,
          tag_id: tag.id,
        }));

        const { error: tagError } = await supabase
          .from('ticket_tag_memberships')
          .insert(tagMemberships);

        if (tagError) throw tagError;
      }

      navigate(`/workspaces/${currentWorkspace}/tickets`);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const renderCustomField = (field) => {
    switch (field.type) {
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
      case 'checkbox':
        return (
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
        );
      case 'multiselect':
        const value = formData.custom_fields[field.id] || [];
        return (
          <TextField
            fullWidth
            select
            label={field.name}
            name={`custom_field_${field.id}`}
            value={Array.isArray(value) ? value : []}
            onChange={handleInputChange}
            SelectProps={{
              multiple: true,
              MenuProps: {
                PaperProps: {
                  style: {
                    maxHeight: 300
                  }
                }
              },
              renderValue: (selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value) => (
                    <Chip key={value} label={value} size="small" />
                  ))}
                </Box>
              ),
            }}
          >
            {field.options?.map((option) => (
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

  // Add debounced search function for tags
  const searchTags = debounce(async (query) => {
    if (!currentWorkspace || !query) {
      setTagSuggestions([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('ticket_tags')
        .select('*')
        .eq('workspace_id', currentWorkspace)
        .ilike('name', `%${query}%`)
        .limit(4);

      if (error) throw error;

      // Filter out already selected tags
      const filteredSuggestions = data.filter(
        tag => !selectedTags.some(selectedTag => selectedTag.id === tag.id)
      );

      setTagSuggestions(filteredSuggestions);
    } catch (error) {
      console.error('Error searching tags:', error);
    }
  }, 300);

  // Handle tag selection
  const handleTagSelect = (tag) => {
    if (tag && !selectedTags.some(t => t.id === tag.id)) {
      setSelectedTags([...selectedTags, tag]);
    }
    setTagSearchQuery('');
  };

  // Handle tag removal
  const handleTagRemove = (tagId) => {
    setSelectedTags(selectedTags.filter(tag => tag.id !== tagId));
  };

  return (
    <Box sx={{ p: 3, backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <Box sx={{ 
        maxWidth: '1200px',
        mx: 'auto',
      }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 3 }}>
          Create Ticket
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* Main Ticket Information */}
            <Grid item xs={12} md={8}>
              <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Ticket Details
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      required
                      fullWidth
                      label="Subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      placeholder="Brief summary of the issue"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      required
                      fullWidth
                      label="Description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      multiline
                      rows={6}
                      placeholder="Detailed description of the issue"
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
                      required
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

                  {/* Tags Section */}
                  <Grid item xs={12}>
                    <Autocomplete
                      freeSolo
                      options={tagSuggestions}
                      getOptionLabel={(option) => option.name || ''}
                      inputValue={tagSearchQuery}
                      onInputChange={(event, newValue) => {
                        setTagSearchQuery(newValue);
                        searchTags(newValue);
                      }}
                      onChange={(event, newValue) => {
                        if (newValue && typeof newValue === 'object') {
                          handleTagSelect(newValue);
                        }
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Search Tags"
                          fullWidth
                        />
                      )}
                    />
                    {selectedTags.length > 0 && (
                      <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {selectedTags.map((tag) => (
                          <Chip
                            key={tag.id}
                            label={tag.name}
                            onDelete={() => handleTagRemove(tag.id)}
                            size="small"
                          />
                        ))}
                      </Box>
                    )}
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
                    <TextField
                      required
                      fullWidth
                      select
                      label="Requestor"
                      name="requestor_id"
                      value={formData.requestor_id}
                      onChange={handleInputChange}
                    >
                      {workspaceUsers.map((user) => (
                        <MenuItem key={user.id} value={user.id}>
                          {user.email}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>

                  {ticketConfig?.has_groups && (
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        select
                        label="Group"
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
                    <TextField
                      required
                      fullWidth
                      select
                      label="Assignee"
                      name="assignee_id"
                      value={formData.assignee_id}
                      onChange={handleInputChange}
                    >
                      <MenuItem value="">-</MenuItem>
                      {groupMembers.map((user) => (
                        <MenuItem key={user.id} value={user.id}>
                          {user.email}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                </Grid>
              </Paper>

              {/* Submit Button */}
              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={loading}
                sx={{ height: 46 }}
              >
                {loading ? 'Creating...' : 'Create Ticket'}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Box>
    </Box>
  );
}

export default CreateTicket; 