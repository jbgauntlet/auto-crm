import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import {
  Container,
  Card,
  CardContent,
  Box,
  Typography,
  TextField,
  MenuItem,
  Button,
  Alert,
  Grid,
  Paper,
} from '@mui/material';

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

const STATUS_OPTIONS = [
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'closed', label: 'Closed' },
];

function Ticket() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [ticket, setTicket] = useState(null);
  const [groups, setGroups] = useState([]);
  const [groupMembers, setGroupMembers] = useState([]);
  const [workspaceUsers, setWorkspaceUsers] = useState([]);
  const [resolvingTicket, setResolvingTicket] = useState(false);
  
  const [ticketData, setTicketData] = useState({
    subject: '',
    description: '',
    priority: '',
    status: '',
    requestor: '',
    assignee_id: '',
    creator: '',
    workspace: '',
    notes: '',
    resolution: '',
    group_id: '',
  });

  // Add a state for validation
  const [validationError, setValidationError] = useState(false);

  useEffect(() => {
    fetchTicket();
  }, [id]);

  const fetchTicket = async () => {
    try {
      // Fetch ticket with related data
      const { data: ticketData, error: ticketError } = await supabase
        .from('tickets')
        .select(`
          *,
          requestor:requestor_id(email),
          assignee:assignee_id(email),
          creator:creator_id(email),
          group:group_id(id, name),
          workspace:workspace_id(id, name)
        `)
        .eq('id', id)
        .single();

      if (ticketError) throw ticketError;

      // Fetch workspace groups
      const { data: groupsData, error: groupsError } = await supabase
        .from('groups')
        .select('*')
        .eq('workspace_id', ticketData.workspace_id);

      if (groupsError) throw groupsError;

      // Fetch all workspace users
      const { data: users, error: usersError } = await supabase
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
        .eq('workspace_id', ticketData.workspace_id);

      if (usersError) throw usersError;

      setTicket(ticketData);
      setGroups(groupsData);
      setWorkspaceUsers(users.map(u => u.users));

      // If ticket has a group, fetch its members
      if (ticketData.group_id) {
        await fetchGroupMembers(ticketData.group_id);
      } else {
        setGroupMembers(users.map(u => u.users));
      }

      setTicketData({
        subject: ticketData.subject,
        description: ticketData.description,
        priority: ticketData.priority,
        status: ticketData.status,
        requestor: ticketData.requestor.email,
        assignee_id: ticketData.assignee_id || '',
        creator: ticketData.creator.email,
        workspace: ticketData.workspace?.name || '',
        notes: ticketData.notes || '',
        resolution: ticketData.resolution || '',
        group_id: ticketData.group_id || '',
      });

    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchGroupMembers = async (groupId) => {
    try {
      if (!groupId) {
        // If no group selected, show all workspace users
        setGroupMembers(workspaceUsers);
        return;
      }

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
        .eq('group_id', groupId);

      if (error) throw error;
      setGroupMembers(members.map(m => m.users));
    } catch (error) {
      setError(error.message);
    }
  };

  const handleInputChange = async (e) => {
    const { name, value } = e.target;
    
    let updates = {
      [name]: value,
    };

    // Reset assignee if group changes
    if (name === 'group_id') {
      updates.assignee_id = '';
      await fetchGroupMembers(value);
    }

    setTicketData(prev => ({
      ...prev,
      ...updates
    }));
    setError(null);
  };

  const handleSave = async () => {
    // Check if assignee is empty
    if (!ticketData.assignee_id) {
      setValidationError(true);
      setError('Assignee is required');
      return;
    }

    setSaving(true);
    setValidationError(false);
    try {
      const { error: updateError } = await supabase
        .from('tickets')
        .update({
          subject: ticketData.subject,
          description: ticketData.description,
          status: ticketData.status,
          priority: ticketData.priority,
          assignee_id: ticketData.assignee_id || null,
          group_id: ticketData.group_id || null,
        })
        .eq('id', id);

      if (updateError) throw updateError;
      navigate('/dashboard');
    } catch (error) {
      setError(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleResolve = async () => {
    if (!resolvingTicket) {
      setResolvingTicket(true);
      return;
    }

    if (!ticketData.resolution.trim()) {
      setError('Resolution is required');
      return;
    }

    setLoading(true);
    try {
      const { error: updateError } = await supabase
        .from('tickets')
        .update({
          status: 'closed',
          resolution: ticketData.resolution,
        })
        .eq('id', id);

      if (updateError) throw updateError;
      navigate('/dashboard');
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!ticket) return <div>Ticket not found</div>;

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Card elevation={8}>
          <CardContent>
            <Typography variant="h4" component="h1" gutterBottom>
              Ticket #{id}
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <Box component="form" sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                {/* Immutable Fields */}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Workspace"
                    value={ticketData.workspace}
                    disabled
                    sx={{ mb: 2 }}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Creator"
                    value={ticketData.creator}
                    disabled
                    sx={{ mb: 2 }}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Requester"
                    value={ticketData.requestor}
                    disabled
                    sx={{ mb: 2 }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Subject"
                    value={ticketData.subject}
                    disabled
                    sx={{ mb: 2 }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Description"
                    value={ticketData.description}
                    disabled
                    multiline
                    rows={4}
                    sx={{ mb: 2 }}
                  />
                </Grid>

                {/* Editable Fields */}
                <Grid item xs={12} md={6}>
                  <TextField
                    select
                    fullWidth
                    label="Status"
                    name="status"
                    value={ticketData.status}
                    onChange={handleInputChange}
                    sx={{ mb: 2 }}
                  >
                    {STATUS_OPTIONS.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    select
                    fullWidth
                    label="Priority"
                    name="priority"
                    value={ticketData.priority}
                    onChange={handleInputChange}
                    sx={{ mb: 2 }}
                  >
                    {PRIORITY_OPTIONS.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    select
                    fullWidth
                    label="Group"
                    name="group_id"
                    value={ticketData.group_id}
                    onChange={handleInputChange}
                    sx={{ mb: 2 }}
                  >
                    <MenuItem value="">-</MenuItem>
                    {groups.map((group) => (
                      <MenuItem key={group.id} value={group.id}>
                        {group.name}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    required
                    error={validationError && !ticketData.assignee_id}
                    helperText={validationError && !ticketData.assignee_id ? 'Assignee is required' : ''}
                    select
                    fullWidth
                    label="Assignee"
                    name="assignee_id"
                    value={ticketData.assignee_id}
                    onChange={handleInputChange}
                    sx={{ mb: 2 }}
                  >
                    <MenuItem value="">-</MenuItem>
                    {groupMembers.map((user) => (
                      <MenuItem key={user.id} value={user.id}>
                        {user.email}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Notes"
                    name="notes"
                    value={ticketData.notes}
                    onChange={handleInputChange}
                    multiline
                    rows={4}
                    sx={{ mb: 2 }}
                  />
                </Grid>

                {/* Resolution Section */}
                {resolvingTicket && (
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Resolution"
                      name="resolution"
                      value={ticketData.resolution}
                      onChange={handleInputChange}
                      required
                      multiline
                      rows={4}
                      sx={{ mb: 2 }}
                    />
                  </Grid>
                )}

                {/* Action Buttons */}
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                    <Button
                      variant="contained"
                      onClick={handleSave}
                      disabled={saving}
                    >
                      {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                    {resolvingTicket ? (
                      <Button
                        variant="contained"
                        color="success"
                        onClick={handleResolve}
                        disabled={loading || !ticketData.resolution.trim()}
                      >
                        Submit Resolution
                      </Button>
                    ) : (
                      <Button
                        variant="contained"
                        color="success"
                        onClick={handleResolve}
                        disabled={loading || ticketData.status === 'closed'}
                      >
                        Resolve Ticket
                      </Button>
                    )}
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
}

export default Ticket; 