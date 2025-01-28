import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabaseClient';
import {
  Box,
  Typography,
  Grid,
  Divider,
  Button,
  Alert,
  Skeleton,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { WorkspaceCard } from './components/WorkspaceCard';
import { InvitationCard } from './components/InvitationCard';
import { CreateWorkspaceModal } from './components/CreateWorkspaceModal';
import { LoadingSpinner } from './components/LoadingSpinner';
import { useWorkspaces } from './hooks/useWorkspaces';
import { useInvitations } from './hooks/useInvitations';

/**
 * Main dashboard component for managing workspaces and invitations
 */
export const WorkspaceDashboard = () => {
  const navigate = useNavigate();
  const {
    workspaces,
    loading: workspacesLoading,
    error: workspacesError,
    creating,
    fetchWorkspaces,
    createWorkspace
  } = useWorkspaces();

  const {
    invites,
    loading: invitesLoading,
    error: invitesError,
    processingInvite,
    fetchInvitations,
    handleInvitation
  } = useInvitations();

  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const initializeDashboard = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate('/login');
          return;
        }

        await Promise.all([
          fetchWorkspaces(user.id),
          fetchInvitations(user.email)
        ]);
      } catch (error) {
        console.error('Error initializing dashboard:', error);
      }
    };

    initializeDashboard();
  }, [navigate, fetchWorkspaces, fetchInvitations]);

  const handleCreateWorkspace = async (name) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user found');

      await createWorkspace(name, user.id);
      setModalOpen(false);
    } catch (error) {
      console.error('Error creating workspace:', error);
    }
  };

  const handleInviteAction = async (inviteId, accept) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user found');

      const workspace = await handleInvitation(inviteId, accept, user.id);
      if (workspace) {
        await fetchWorkspaces(user.id);
      }
    } catch (error) {
      console.error('Error processing invite:', error);
    }
  };

  const renderWorkspaces = () => {
    if (workspacesLoading) {
      return (
        <Grid container spacing={3}>
          {[1, 2, 3].map((key) => (
            <Grid item xs={12} sm={6} md={4} key={key}>
              <Skeleton
                variant="rounded"
                sx={{
                  height: 140,
                  borderRadius: 1,
                  backgroundColor: 'primary.light',
                  opacity: 0.1
                }}
              />
            </Grid>
          ))}
        </Grid>
      );
    }

    if (workspacesError) {
      return (
        <Alert severity="error" sx={{ mb: 3 }}>
          {workspacesError}
        </Alert>
      );
    }

    if (workspaces.length === 0) {
      return (
        <Box
          sx={{
            textAlign: 'center',
            py: 8,
            backgroundColor: 'primary.light',
            opacity: 0.1,
            borderRadius: 1
          }}
        >
          <Typography variant="body1" color="text.secondary">
            No workspaces yet. Create your first workspace to get started.
          </Typography>
        </Box>
      );
    }

    return (
      <Grid container spacing={3}>
        {workspaces.map((workspace) => (
          <Grid item xs={12} sm={6} md={4} key={workspace.id}>
            <WorkspaceCard
              workspace={workspace}
              onClick={() => navigate(`/workspaces/${workspace.id}`)}
            />
          </Grid>
        ))}
      </Grid>
    );
  };

  const renderInvitations = () => {
    if (invitesLoading) {
      return (
        <Grid container spacing={2}>
          {[1, 2].map((key) => (
            <Grid item xs={12} key={key}>
              <Skeleton
                variant="rounded"
                sx={{
                  height: 100,
                  borderRadius: 1,
                  backgroundColor: 'primary.light',
                  opacity: 0.1
                }}
              />
            </Grid>
          ))}
        </Grid>
      );
    }

    if (invitesError) {
      return (
        <Alert severity="error" sx={{ mb: 3 }}>
          {invitesError}
        </Alert>
      );
    }

    return (
      <Grid container spacing={2}>
        {invites.map((invite) => (
          <Grid item xs={12} key={invite.id}>
            <InvitationCard
              invite={invite}
              onAccept={() => handleInviteAction(invite.id, true)}
              onReject={() => handleInviteAction(invite.id, false)}
              processing={processingInvite === invite.id}
            />
          </Grid>
        ))}
      </Grid>
    );
  };

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

        {renderWorkspaces()}

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

              {renderInvitations()}
            </Box>
          </>
        )}

        <CreateWorkspaceModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onSubmit={handleCreateWorkspace}
          error={workspacesError}
          creating={creating}
        />
      </Box>
    </Box>
  );
}; 