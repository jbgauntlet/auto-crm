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
} from '@mui/material';

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

function Ticket() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
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
  });

  useEffect(() => {
    const fetchTicketAndUsers = async () => {
      try {
        // Fetch ticket details
        const { data: ticket, error: ticketError } = await supabase
          .from('tickets')
          .select(`
            *,
            requestor:requestor_id(email),
            assignee:assignee_id(email),
            creator:creator_id(email),
            workspace:workspace_id(name)
          `)
          .eq('id', id)
          .single();

        if (ticketError) throw ticketError;

        // Get workspace users for assignee dropdown
        const { data: users, error: usersError } = await supabase
          .from('workspace_memberships')
          .select(`
            user_id,
            users:user_id(
              id,
              email
            )
          `)
          .eq('workspace_id', ticket.workspace_id);

        if (usersError) throw usersError;

        setWorkspaceUsers(users.map(membership => ({
          id: membership.users.id,
          email: membership.users.email,
        })));

        setTicketData({
          subject: ticket.subject,
          description: ticket.description,
          priority: ticket.priority,
          status: ticket.status,
          requestor: ticket.requestor.email,
          assignee_id: ticket.assignee_id,
          creator: ticket.creator.email,
          workspace: ticket.workspace.name,
          notes: ticket.notes || '',
          resolution: ticket.resolution || '',
        });

      } catch (error) {
        setError(error.message);
      }
    };

    fetchTicketAndUsers();
  }, [id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setTicketData(prev => ({
      ...prev,
      [name]: value
    }));
    setError(null);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const { error: updateError } = await supabase
        .from('tickets')
        .update({
          assignee_id: ticketData.assignee_id,
          priority: ticketData.priority,
          notes: ticketData.notes,
        })
        .eq('id', id);

      if (updateError) throw updateError;
      setError(null);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
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
                    label="Assignee"
                    name="assignee_id"
                    value={ticketData.assignee_id}
                    onChange={handleInputChange}
                    sx={{ mb: 2 }}
                  >
                    {workspaceUsers.map((user) => (
                      <MenuItem key={user.id} value={user.id}>
                        {user.email}
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
                      disabled={loading}
                    >
                      Save Changes
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