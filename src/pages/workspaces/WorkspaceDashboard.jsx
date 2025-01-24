import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  Alert,
  InputAdornment,
  Collapse,
  IconButton,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { Business as BusinessIcon } from '@mui/icons-material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

function WorkspaceDashboard() {
  const navigate = useNavigate();
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [error, setError] = useState(null);
  const [creating, setCreating] = useState(false);
  const [invites, setInvites] = useState([]);
  const [showInvites, setShowInvites] = useState(true);
  const [processingInvite, setProcessingInvite] = useState(null);

  const handleModalClose = () => {
    setModalOpen(false);
    setName('');
    setError(null);
  };

  const handleCreateWorkspace = async (e) => {
    e.preventDefault();
    setCreating(true);
    setError(null);
    
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      // Create workspace
      const { data: workspace, error: workspaceError } = await supabase
        .from('workspaces')
        .insert([
          {
            name,
            owner_id: user.id,
            created_at: new Date().toISOString(),
          }
        ])
        .select()
        .single();

      if (workspaceError) throw workspaceError;

      // Create workspace membership for owner
      const { error: membershipError } = await supabase
        .from('workspace_memberships')
        .insert([
          {
            workspace_id: workspace.id,
            user_id: user.id,
            created_at: new Date().toISOString(),
            role: 'Owner'
          }
        ]);

      if (membershipError) throw membershipError;

      // Add the new workspace to the list
      setWorkspaces(prev => [...prev, {
        id: workspace.id,
        name: workspace.name,
        created_at: new Date(workspace.created_at).toLocaleDateString(),
      }]);

      handleModalClose();
    } catch (error) {
      setError(error.message);
    } finally {
      setCreating(false);
    }
  };

  const handleInviteAction = async (inviteId, accept) => {
    setProcessingInvite(inviteId);
    setError(null);
    
    try {
      // Get invite details first
      const { data: invite, error: inviteError } = await supabase
        .from('workspace_invites')
        .select(`
          id,
          workspace_id,
          role,
          group_id,
          workspace:workspace_id (
            name,
            created_at
          )
        `)
        .eq('id', inviteId)
        .single();

      if (inviteError) throw inviteError;

      if (accept) {
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;

        // Create workspace membership
        const { error: membershipError } = await supabase
          .from('workspace_memberships')
          .insert([{
            workspace_id: invite.workspace_id,
            user_id: user.id,
            role: invite.role,
            created_at: new Date().toISOString(),
          }]);

        if (membershipError) throw membershipError;

        // If there's a group, create group membership
        if (invite.group_id) {
          const { error: groupError } = await supabase
            .from('group_memberships')
            .insert([{
              group_id: invite.group_id,
              user_id: user.id,
              created_at: new Date().toISOString(),
            }]);

          if (groupError) throw groupError;
        }

        // Add workspace to the list
        setWorkspaces(prev => [...prev, {
          id: invite.workspace_id,
          name: invite.workspace.name,
          created_at: new Date(invite.workspace.created_at).toLocaleDateString(),
        }]);
      }

      // Delete the invite
      const { error: deleteError } = await supabase
        .from('workspace_invites')
        .delete()
        .eq('id', inviteId);

      if (deleteError) throw deleteError;

      // Remove invite from state
      setInvites(prev => prev.filter(inv => inv.id !== inviteId));

    } catch (error) {
      console.error('Error processing invite:', error);
      setError(error.message);
    } finally {
      setProcessingInvite(null);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate('/login');
          return;
        }

        // Fetch workspaces and invites in parallel
        const [workspacesResponse, invitesResponse] = await Promise.all([
          supabase
            .from('workspace_memberships')
            .select(`
              workspace:workspace_id (
                id,
                name,
                created_at
              )
            `)
            .eq('user_id', user.id),
          
          supabase
            .from('workspace_invites')
            .select(`
              id,
              workspace:workspace_id (
                name
              ),
              role,
              group:group_id (
                name
              )
            `)
            .eq('email', user.email)
        ]);

        if (workspacesResponse.error) throw workspacesResponse.error;
        if (invitesResponse.error) throw invitesResponse.error;

        const formattedWorkspaces = workspacesResponse.data.map(({ workspace }) => ({
          id: workspace.id,
          name: workspace.name,
          created_at: new Date(workspace.created_at).toLocaleDateString(),
        }));

        const formattedInvites = invitesResponse.data.map(invite => ({
          id: invite.id,
          workspaceName: invite.workspace.name,
          role: invite.role,
          groupName: invite.group?.name,
        }));

        setWorkspaces(formattedWorkspaces);
        setInvites(formattedInvites);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  return (
    <Box
      sx={{
        height: '100vh',
        backgroundColor: 'background.default',
        overflow: 'hidden',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      }}
    >
      <Box sx={{ p: 4 }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mb: 4,
        }}>
          <Typography
            variant="h5"
            component="h1"
            sx={{
              color: 'primary.main',
              fontWeight: 600,
            }}
          >
            My Workspaces
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setModalOpen(true)}
            sx={{
              backgroundColor: 'primary.main',
              '&:hover': {
                backgroundColor: 'primary.dark',
              }
            }}
          >
            Create Workspace
          </Button>
        </Box>

        <Grid container spacing={3}>
          {workspaces.map((workspace) => (
            <Grid item xs={12} sm={6} md={4} key={workspace.id}>
              <Card
                onClick={() => navigate(`/workspaces/${workspace.id}`)}
                sx={{
                  cursor: 'pointer',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    backgroundColor: 'primary.light',
                  }
                }}
              >
                <CardContent>
                  <Typography
                    variant="h6"
                    component="h2"
                    sx={{
                      color: 'primary.main',
                      fontWeight: 600,
                      mb: 2,
                    }}
                  >
                    {workspace.name}
                  </Typography>
                  <Divider sx={{ my: 2 }} />
                  <Typography
                    variant="body2"
                    color="text.secondary"
                  >
                    Created: {workspace.created_at}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {invites.length > 0 && (
          <>
            <Divider sx={{ my: 4 }} />
            <Box sx={{ mb: 4 }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  mb: 3,
                }}
              >
                <Typography
                  variant="h5"
                  component="h2"
                  sx={{
                    color: 'primary.main',
                    fontWeight: 600,
                  }}
                >
                  Pending Invitations
                </Typography>
              </Box>
              <Grid container spacing={2}>
                {invites.map((invite) => (
                  <Grid item xs={12} key={invite.id}>
                    <Card
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        p: 2,
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Box>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                            Workspace
                          </Typography>
                          <Typography variant="h6" sx={{ color: 'primary.main' }}>
                            {invite.workspaceName}
                          </Typography>
                        </Box>
                        <Box sx={{ 
                          display: 'flex', 
                          flexDirection: 'column',
                          gap: 0.5,
                        }}>
                          <Typography variant="body2" color="text.secondary">
                            Invited Role
                          </Typography>
                          <Box sx={{
                            backgroundColor: 'primary.light',
                            color: 'primary.main',
                            px: 2,
                            py: 0.5,
                            borderRadius: 0,
                            fontWeight: 500,
                          }}>
                            {invite.role}
                          </Box>
                        </Box>
                        {invite.groupName && (
                          <Box sx={{ 
                            display: 'flex', 
                            flexDirection: 'column',
                            gap: 0.5,
                          }}>
                            <Typography variant="body2" color="text.secondary">
                              Team Group
                            </Typography>
                            <Box sx={{
                              backgroundColor: 'secondary.light',
                              color: 'secondary.main',
                              px: 2,
                              py: 0.5,
                              borderRadius: 0,
                              fontWeight: 500,
                            }}>
                              {invite.groupName}
                            </Box>
                          </Box>
                        )}
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          variant="contained"
                          disabled={processingInvite === invite.id}
                          onClick={() => handleInviteAction(invite.id, true)}
                          startIcon={<CheckCircleIcon />}
                          sx={{ 
                            minWidth: 120,
                            backgroundColor: 'success.main',
                            '&:hover': {
                              backgroundColor: 'success.dark',
                            },
                          }}
                        >
                          Accept
                        </Button>
                        <Button
                          variant="contained"
                          disabled={processingInvite === invite.id}
                          onClick={() => handleInviteAction(invite.id, false)}
                          startIcon={<CancelIcon />}
                          sx={{ 
                            minWidth: 120,
                            backgroundColor: 'error.main',
                            '&:hover': {
                              backgroundColor: 'error.dark',
                            },
                          }}
                        >
                          Decline
                        </Button>
                      </Box>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </>
        )}

        {/* Create Workspace Modal */}
        <Dialog 
          open={modalOpen} 
          onClose={handleModalClose}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle
            sx={{
              color: 'primary.main',
              fontWeight: 600,
              pb: 1,
            }}
          >
            Create Workspace
          </DialogTitle>
          <DialogContent>
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ mb: 3 }}
            >
              Give your workspace a name to get started
            </Typography>

            {error && (
              <Alert 
                severity="error" 
                sx={{ mb: 3 }}
              >
                {error}
              </Alert>
            )}

            <form onSubmit={handleCreateWorkspace}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                <TextField
                  required
                  fullWidth
                  label="Workspace Name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setError(null);
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <BusinessIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                />

                <Button
                  type="submit"
                  variant="contained"
                  disabled={creating || !name.trim()}
                  sx={{
                    height: 48,
                    backgroundColor: 'primary.main',
                    '&:hover': {
                      backgroundColor: 'primary.dark',
                    },
                  }}
                >
                  {creating ? 'Creating...' : 'Create Workspace'}
                </Button>
              </Box>
            </form>
          </DialogContent>
        </Dialog>
      </Box>
    </Box>
  );
}

export default WorkspaceDashboard; 