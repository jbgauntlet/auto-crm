import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
} from '@mui/material';

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

function CreateTicket() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [workspaceUsers, setWorkspaceUsers] = useState([]);
  const [currentWorkspace, setCurrentWorkspace] = useState(null);

  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    priority: 'normal',
    requestor_id: '',
    assignee_id: '',
  });

  useEffect(() => {
    const fetchWorkspaceAndUsers = async () => {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        
        // Get user's workspace
        const { data: memberships, error: membershipError } = await supabase
          .from('workspace_memberships')
          .select('workspace_id')
          .eq('user_id', user.id)
          .single();

        if (membershipError) throw membershipError;

        setCurrentWorkspace(memberships.workspace_id);

        // Get all users in the workspace
        const { data: users, error: usersError } = await supabase
          .from('workspace_memberships')
          .select(`
            user_id,
            users:user_id (
              id,
              email
            )
          `)
          .eq('workspace_id', memberships.workspace_id);

        if (usersError) throw usersError;

        setWorkspaceUsers(users.map(membership => ({
          id: membership.users.id,
          email: membership.users.email,
        })));

      } catch (error) {
        setError(error.message);
      }
    };

    fetchWorkspaceAndUsers();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error: ticketError } = await supabase
        .from('tickets')
        .insert([
          {
            subject: formData.subject,
            description: formData.description,
            priority: formData.priority,
            status: 'open',
            requestor_id: formData.requestor_id,
            assignee_id: formData.assignee_id,
            creator_id: user.id,
            workspace_id: currentWorkspace,
            created_at: new Date().toISOString(),
          }
        ]);

      if (ticketError) throw ticketError;

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
              Create New Ticket
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
              <TextField
                select
                fullWidth
                label="Requester"
                name="requestor_id"
                value={formData.requestor_id}
                onChange={handleInputChange}
                required
                sx={{ mb: 2 }}
              >
                {workspaceUsers.map((user) => (
                  <MenuItem key={user.id} value={user.id}>
                    {user.email}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                select
                fullWidth
                label="Assignee"
                name="assignee_id"
                value={formData.assignee_id}
                onChange={handleInputChange}
                required
                sx={{ mb: 2 }}
              >
                {workspaceUsers.map((user) => (
                  <MenuItem key={user.id} value={user.id}>
                    {user.email}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                select
                fullWidth
                label="Priority"
                name="priority"
                value={formData.priority}
                onChange={handleInputChange}
                required
                sx={{ mb: 2 }}
              >
                {PRIORITY_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                fullWidth
                label="Subject"
                name="subject"
                value={formData.subject}
                onChange={handleInputChange}
                required
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                multiline
                rows={4}
                sx={{ mb: 3 }}
              />

              <Button
                type="submit"
                variant="contained"
                fullWidth
                size="large"
                disabled={loading}
                sx={{ height: 46 }}
              >
                {loading ? 'Creating...' : 'Create Ticket'}
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
}

export default CreateTicket; 