import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import {
  Box,
  Typography,
  Paper,
  Chip,
  Divider,
  Grid,
  IconButton,
  Tooltip,
  Button,
  Avatar,
  TextareaAutosize,
  Stack,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Autocomplete,
  Checkbox,
} from '@mui/material';
import {
  AccessTime as TimeIcon,
  Person as PersonIcon,
  Flag as PriorityIcon,
  ArrowBack as BackIcon,
  Chat as CommentIcon,
  Edit as EditIcon,
  Lock as InternalIcon,
  Public as PublicIcon,
  LocalOffer as TagIcon,
  Group as GroupIcon,
  Category as TypeIcon,
  Topic as TopicIcon,
  CheckCircle as ResolveIcon,
} from '@mui/icons-material';

function Ticket() {
  const { workspaceId, ticketId } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [ticketConfig, setTicketConfig] = useState(null);
  const [customFields, setCustomFields] = useState([]);
  const [resolutionOptions, setResolutionOptions] = useState([]);
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [editedTicket, setEditedTicket] = useState(null);
  const [groups, setGroups] = useState([]);
  const [workspaceUsers, setWorkspaceUsers] = useState([]);
  const [resolutionData, setResolutionData] = useState({
    resolution: '',
    notes: ''
  });
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const isResolved = ticket?.resolution_id != null;

  const statusColors = {
    open: '#008079',
    in_progress: '#2073B7',
    closed: '#68868B',
  };

  const priorityColors = {
    urgent: '#C72A1C',
    high: '#2073B7',
    normal: '#16494D',
    low: '#008079',
  };

  const STATUS_OPTIONS = [
    { value: 'open', label: 'Open' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'closed', label: 'Closed' },
  ];

  useEffect(() => {
    const fetchTicketData = async () => {
      try {
        // Fetch ticket configuration
        const { data: config, error: configError } = await supabase
          .from('ticket_configs')
          .select('*')
          .eq('workspace_id', workspaceId)
          .single();

        if (configError) throw configError;
        setTicketConfig(config);

        // Fetch workspace users
        const { data: users, error: usersError } = await supabase
          .from('workspace_memberships')
          .select(`
            user:user_id(
              id,
              email,
              first_name,
              last_name
            )
          `)
          .eq('workspace_id', workspaceId);

        if (usersError) throw usersError;
        setWorkspaceUsers(users.map(u => u.user));

        // Fetch groups if enabled
        if (config.has_groups) {
          const { data: groupsData, error: groupsError } = await supabase
            .from('groups')
            .select('*')
            .eq('workspace_id', workspaceId);

          if (groupsError) throw groupsError;
          setGroups(groupsData);
        }

        // Fetch ticket with all related data
        const { data, error } = await supabase
          .from('tickets')
          .select(`
            *,
            requestor:requestor_id(id, email, first_name, last_name),
            assignee:assignee_id(id, email, first_name, last_name),
            creator:creator_id(id, email, first_name, last_name),
            group:group_id(id, name),
            tags:ticket_tag_memberships(
              tag:tag_id(id, name)
            )
          `)
          .eq('id', ticketId)
          .single();

        if (error) throw error;

        // Fetch type and topic if they exist
        if (data.type_id) {
          const { data: typeData } = await supabase
            .from('ticket_type_options')
            .select('id, name')
            .eq('id', data.type_id)
            .single();
          data.type = typeData;
        }

        if (data.topic_id) {
          const { data: topicData } = await supabase
            .from('ticket_topic_options')
            .select('id, name')
            .eq('id', data.topic_id)
            .single();
          data.topic = topicData;
        }

        setTicket(data);

        // Fetch custom fields if ticket has them
        if (data.custom_fields) {
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
        }

        // Fetch resolution options if enabled
        if (config.has_resolution) {
          const { data: resolutions, error: resolutionsError } = await supabase
            .from('ticket_resolution_options')
            .select('*')
            .eq('workspace_id', workspaceId);

          if (resolutionsError) throw resolutionsError;
          setResolutionOptions(resolutions);
        }

        // Fetch notes
        const { data: notesData, error: notesError } = await supabase
          .from('ticket_notes')
          .select('*')
          .eq('ticket_id', ticketId)
          .order('created_at', { ascending: false });

        if (notesError) throw notesError;
        setNotes(notesData);

      } catch (error) {
        console.error('Error fetching ticket data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTicketData();
  }, [ticketId, workspaceId]);

  useEffect(() => {
    if (ticket && !editedTicket) {
      setEditedTicket({ ...ticket });
    }
  }, [ticket]);

  useEffect(() => {
    // Update filtered users when group changes or on initial load
    const updateFilteredUsers = async () => {
      if (!editedTicket?.group_id) {
        // If no group selected, show all workspace users (limited to 5)
        setFilteredUsers(workspaceUsers.slice(0, 5));
        return;
      }

      // Fetch users in the selected group
      const { data: groupMembers, error } = await supabase
        .from('group_memberships')
        .select(`
          user:user_id(
            id,
            email,
            first_name,
            last_name
          )
        `)
        .eq('group_id', editedTicket.group_id);

      if (error) {
        console.error('Error fetching group members:', error);
        return;
      }

      setFilteredUsers(groupMembers.map(m => m.user));
    };

    updateFilteredUsers();
  }, [editedTicket?.group_id, workspaceUsers]);

  const handleFieldChange = (field, value) => {
    if (field === 'group_id') {
      // Clear assignee when group changes
      setEditedTicket(prev => ({
        ...prev,
        [field]: value,
        assignee_id: '' // Clear assignee
      }));
    } else {
      setEditedTicket(prev => ({
        ...prev,
        [field]: value
      }));
    }
    setHasChanges(true);
  };

  const handleCustomFieldChange = (fieldId, value) => {
    setEditedTicket(prev => ({
      ...prev,
      custom_fields: {
        ...prev.custom_fields,
        [fieldId]: value
      }
    }));
    setHasChanges(true);
  };

  const handleSaveChanges = async () => {
    try {
      // Create new version first
      const versionData = {
        ticket_id: ticket.id,
        requestor_id: ticket.requestor_id,
        assignee_id: editedTicket.assignee_id,
        priority: editedTicket.priority,
        subject: editedTicket.subject,
        description: editedTicket.description,
        workspace_id: ticket.workspace_id,
        creator_id: ticket.creator_id,
        status: ticket.status,
        resolution: ticket.resolution,
        group_id: editedTicket.group_id,
        type_id: editedTicket.type_id,
        topic_id: editedTicket.topic_id,
        custom_fields: editedTicket.custom_fields,
        resolution_notes: ticket.resolution_notes
      };

      const { error: versionError } = await supabase
        .from('ticket_versions')
        .insert([versionData]);

      if (versionError) throw versionError;

      // Update the ticket
      const { error: ticketError } = await supabase
        .from('tickets')
        .update({
          subject: editedTicket.subject,
          description: editedTicket.description,
          priority: editedTicket.priority,
          assignee_id: editedTicket.assignee_id,
          group_id: editedTicket.group_id,
          type_id: editedTicket.type_id,
          topic_id: editedTicket.topic_id,
          custom_fields: editedTicket.custom_fields,
        })
        .eq('id', ticketId);

      if (ticketError) throw ticketError;

      setTicket(editedTicket);
      setHasChanges(false);
    } catch (error) {
      console.error('Error saving changes:', error);
    }
  };

  const handleCancelChanges = () => {
    setEditedTicket({ ...ticket });
    setHasChanges(false);
  };

  const handleNoteSubmit = async (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    try {
      const { error } = await supabase
        .from('ticket_notes')
        .insert([{
          ticket_id: ticketId,
          content: newNote
        }]);

      if (error) throw error;

      // Refresh notes
      const { data, error: fetchError } = await supabase
        .from('ticket_notes')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setNotes(data);
      setNewNote('');
    } catch (error) {
      console.error('Error adding note:', error);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      const { error } = await supabase
        .from('tickets')
        .update({ status: newStatus })
        .eq('id', ticketId);

      if (error) throw error;

      // Add status change to activity
      const { data: { user } } = await supabase.auth.getUser();
      await supabase
        .from('ticket_activities')
        .insert([{
          ticket_id: ticketId,
          user_id: user.id,
          activity_type: 'status_change',
          content: `Status changed to ${newStatus}`,
          is_internal: true
        }]);

      setTicket({ ...ticket, status: newStatus });
      
      // Refresh comments to show the status change
      const { data: activities } = await supabase
        .from('ticket_activities')
        .select(`
          *,
          user:user_id (
            id,
            first_name,
            last_name,
            email
          )
        `)
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });

      setNotes(activities);
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleResolveTicket = async () => {
    try {
      // Find the resolution option ID based on the selected name
      const { data: resolutionOption, error: resolutionError } = await supabase
        .from('ticket_resolution_options')
        .select('id')
        .eq('name', resolutionData.resolution)
        .single();

      if (resolutionError) throw resolutionError;

      const currentTimestamp = new Date().toISOString();

      const { error } = await supabase
        .from('tickets')
        .update({
          status: 'closed',
          resolution_id: resolutionOption.id,
          resolution_notes: resolutionData.notes,
          resolved_at: currentTimestamp
        })
        .eq('id', ticketId);

      if (error) throw error;

      // Add resolution to activity
      const { data: { user } } = await supabase.auth.getUser();
      await supabase
        .from('ticket_notes')
        .insert([{
          ticket_id: ticketId,
          content: `Ticket resolved with resolution: ${resolutionData.resolution}\n${resolutionData.notes ? `Notes: ${resolutionData.notes}` : ''}`
        }]);

      // Update the ticket state
      setTicket(prev => ({ 
        ...prev, 
        status: 'closed', 
        resolution_id: resolutionOption.id,
        resolution_notes: resolutionData.notes,
        resolution: { id: resolutionOption.id, name: resolutionData.resolution },
        resolved_at: currentTimestamp
      }));
      setResolveDialogOpen(false);
    } catch (error) {
      console.error('Error resolving ticket:', error);
    }
  };

  const handleUserSearch = (query) => {
    setUserSearchQuery(query);
    if (!query) return;

    const filtered = (editedTicket?.group_id ? filteredUsers : workspaceUsers)
      .filter(user => 
        `${user.first_name} ${user.last_name}`.toLowerCase().includes(query.toLowerCase()) ||
        user.email.toLowerCase().includes(query.toLowerCase())
      )
      .slice(0, 5);

    setFilteredUsers(filtered);
  };

  if (loading) {
    return <Box>Loading...</Box>;
  }

  if (!ticket) {
    return <Box>Ticket not found</Box>;
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header Section */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton 
            onClick={() => navigate(-1)}
            sx={{ color: 'primary.main' }}
          >
            <BackIcon />
          </IconButton>
          <TextField
            variant="standard"
            value={editedTicket?.subject || ''}
            onChange={(e) => handleFieldChange('subject', e.target.value)}
            disabled={isResolved}
            sx={{ 
              '& .MuiInputBase-input': {
                fontSize: '2rem',
                fontWeight: 600,
                color: 'primary.main',
              },
              '& .MuiInput-underline:before': { borderBottom: 'none' },
              '& .MuiInput-underline:hover:before': { borderBottom: '1px solid rgba(0, 0, 0, 0.42)' }
            }}
          />
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          {hasChanges && !isResolved && (
            <>
              <Button
                variant="outlined"
                onClick={handleCancelChanges}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={handleSaveChanges}
              >
                Save Changes
              </Button>
            </>
          )}
          {ticketConfig?.has_resolution && !ticket.resolution && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<ResolveIcon />}
              onClick={() => setResolveDialogOpen(true)}
            >
              Resolve Ticket
            </Button>
          )}
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Main Content */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 3 }}>
            {/* Status and Priority */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 3 }}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Status
                </Typography>
                <Chip
                  label={editedTicket?.status.replace('_', ' ')}
                  sx={{
                    backgroundColor: `${statusColors[editedTicket?.status]}15`,
                    color: statusColors[editedTicket?.status],
                    fontWeight: 500,
                  }}
                />
              </Box>
              <Box sx={{ minWidth: 120 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Priority
                </Typography>
                <FormControl fullWidth size="small">
                  <Select
                    value={editedTicket?.priority || ''}
                    onChange={(e) => handleFieldChange('priority', e.target.value)}
                    variant="standard"
                    disabled={isResolved}
                    sx={{ textAlign: 'left' }}
                  >
                    <MenuItem value="low">Low</MenuItem>
                    <MenuItem value="normal">Normal</MenuItem>
                    <MenuItem value="high">High</MenuItem>
                    <MenuItem value="urgent">Urgent</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </Box>

            {/* Description */}
            <Typography variant="subtitle2" color="text.secondary" gutterBottom align="left">
              Description
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={4}
              value={editedTicket?.description || ''}
              onChange={(e) => handleFieldChange('description', e.target.value)}
              variant="outlined"
              disabled={isResolved}
              sx={{ mb: 3 }}
            />

            {/* Custom Fields */}
            {customFields.length > 0 && editedTicket?.custom_fields && (
              <>
                <Divider sx={{ my: 3 }} />
                <Typography variant="h6" gutterBottom align="left">
                  Additional Information
                </Typography>
                <Grid container spacing={2}>
                  {customFields.map((field) => (
                    <Grid item xs={12} sm={6} key={field.id}>
                      {field.type === 'checkbox' ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Checkbox
                            checked={editedTicket.custom_fields[field.id] === 'true'}
                            onChange={(e) => handleCustomFieldChange(field.id, e.target.checked.toString())}
                            disabled={isResolved}
                          />
                          <Typography variant="subtitle2" color="text.secondary">
                            {field.name}
                          </Typography>
                        </Box>
                      ) : (
                        <>
                          <Typography variant="subtitle2" color="text.secondary" gutterBottom align="left">
                            {field.name}
                          </Typography>
                          {field.type === 'dropdown' ? (
                            <FormControl fullWidth>
                              <Select
                                value={editedTicket.custom_fields[field.id] || ''}
                                onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
                                variant="standard"
                                disabled={isResolved}
                                sx={{ textAlign: 'left' }}
                              >
                                <MenuItem value="">-</MenuItem>
                                {field.options.map(option => (
                                  <MenuItem key={option.id} value={option.name}>
                                    {option.name}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          ) : field.type === 'multiselect' ? (
                            <FormControl fullWidth>
                              <Select
                                multiple
                                value={editedTicket.custom_fields[field.id] || []}
                                onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
                                variant="standard"
                                disabled={isResolved}
                                renderValue={(selected) => selected.join(', ')}
                                sx={{ textAlign: 'left' }}
                              >
                                {field.options.map(option => (
                                  <MenuItem key={option.id} value={option.name}>
                                    {option.name}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          ) : (
                            <TextField
                              fullWidth
                              value={editedTicket.custom_fields[field.id] || ''}
                              onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
                              variant="standard"
                              disabled={isResolved}
                              multiline={field.type === 'multiline'}
                              rows={field.type === 'multiline' ? 4 : 1}
                            />
                          )}
                        </>
                      )}
                    </Grid>
                  ))}
                </Grid>
              </>
            )}
          </Paper>

          {/* Notes Timeline */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 3, color: 'primary.main' }}>
              Working Notes
            </Typography>

            {/* New Note Form - Moved to top */}
            <Box component="form" onSubmit={handleNoteSubmit} sx={{ mb: 3 }}>
              <TextareaAutosize
                minRows={3}
                placeholder="Add a working note..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid #ccc',
                  marginBottom: '8px',
                }}
              />
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={<CommentIcon />}
                  disabled={!newNote.trim()}
                >
                  Add Note
                </Button>
              </Box>
            </Box>

            {/* Notes List */}
            <Stack spacing={3}>
              {notes.map((note) => (
                <Box
                  key={note.id}
                  sx={{
                    display: 'flex',
                    gap: 2,
                    p: 2,
                    backgroundColor: 'transparent',
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <Box sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Typography variant="caption" color="text.secondary" align="left">
                        {new Date(note.created_at).toLocaleString()}
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', textAlign: 'left' }}>
                      {note.content}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Stack>
          </Paper>
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }} align="left">
              Details
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* Requestor Info - Read only */}
              <Box>
                <Typography variant="subtitle2" color="text.secondary" align="left">
                  Requested by
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PersonIcon sx={{ color: 'primary.main' }} />
                  <Typography>
                    {ticket.requestor.first_name} {ticket.requestor.last_name}
                  </Typography>
                </Box>
              </Box>

              <Divider />

              {/* Group Info */}
              {ticketConfig?.has_groups && (
                <>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" align="left">
                      Group
                    </Typography>
                    <FormControl fullWidth variant="standard">
                      <Select
                        value={editedTicket?.group_id || ''}
                        onChange={(e) => handleFieldChange('group_id', e.target.value)}
                        disabled={isResolved}
                      >
                        <MenuItem value="">-</MenuItem>
                        {groups.map(group => (
                          <MenuItem key={group.id} value={group.id}>
                            {group.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                  <Divider />
                </>
              )}

              {/* Assignee Info */}
              <Box>
                <Typography variant="subtitle2" color="text.secondary" align="left">
                  Assigned to
                </Typography>
                <Autocomplete
                  value={filteredUsers.find(u => u.id === editedTicket?.assignee_id) || null}
                  onChange={(event, newValue) => {
                    handleFieldChange('assignee_id', newValue?.id || '');
                  }}
                  inputValue={userSearchQuery}
                  onInputChange={(event, newInputValue) => {
                    handleUserSearch(newInputValue);
                  }}
                  options={filteredUsers}
                  disabled={isResolved}
                  getOptionLabel={(option) => 
                    option ? `${option.first_name} ${option.last_name}` : ''
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      variant="standard"
                      placeholder="Search users..."
                    />
                  )}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                />
              </Box>

              <Divider />

              {/* Created Date - Read only */}
              <Box>
                <Typography variant="subtitle2" color="text.secondary" align="left">
                  Created on
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TimeIcon sx={{ color: 'primary.main' }} />
                  <Typography>
                    {new Date(ticket.created_at).toLocaleString()}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Resolution Dialog */}
      <Dialog 
        open={resolveDialogOpen} 
        onClose={() => setResolveDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Resolve Ticket</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Resolution Type</InputLabel>
              <Select
                value={resolutionData.resolution}
                label="Resolution Type"
                onChange={(e) => setResolutionData(prev => ({
                  ...prev,
                  resolution: e.target.value
                }))}
              >
                {resolutionOptions.map(option => (
                  <MenuItem key={option.id} value={option.name}>
                    {option.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {ticketConfig?.has_resolution_notes && (
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Resolution Notes"
                value={resolutionData.notes}
                onChange={(e) => setResolutionData(prev => ({
                  ...prev,
                  notes: e.target.value
                }))}
              />
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResolveDialogOpen(false)}>
            Cancel
          </Button>
          <Button 
            variant="contained"
            onClick={handleResolveTicket}
            disabled={!resolutionData.resolution}
          >
            Resolve
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Ticket; 