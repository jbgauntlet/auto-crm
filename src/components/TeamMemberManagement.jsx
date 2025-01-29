import { useState, useEffect } from 'react';
import {
  Button,
  Stack,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import CreateTeamMemberModal from './CreateTeamMemberModal';
import CreateGroupModal from './CreateGroupModal';
import { supabase } from '../lib/supabaseClient';

/**
 * TeamMemberManagement Component
 * 
 * A reusable component for managing team members and groups across different pages.
 * Provides functionality for adding team members and creating groups.
 * 
 * @param {Object} props
 * @param {string} props.workspaceId - The ID of the current workspace
 * @param {Function} props.onMemberAdded - Callback function when a member is added
 * @param {Function} props.onGroupCreated - Callback function when a group is created
 */
export default function TeamMemberManagement({ workspaceId, onMemberAdded, onGroupCreated }) {
  const [createMemberOpen, setCreateMemberOpen] = useState(false);
  const [createGroupOpen, setCreateGroupOpen] = useState(false);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: membership, error } = await supabase
          .from('workspace_memberships')
          .select('role')
          .eq('workspace_id', workspaceId)
          .eq('user_id', user.id)
          .single();

        if (error) throw error;
        setUserRole(membership.role);
      } catch (error) {
        console.error('Error fetching user role:', error);
      }
    };

    if (workspaceId) {
      fetchUserRole();
    }
  }, [workspaceId]);

  const handleMemberSuccess = () => {
    setCreateMemberOpen(false);
    if (onMemberAdded) {
      onMemberAdded();
    }
  };

  const handleGroupSuccess = () => {
    setCreateGroupOpen(false);
    if (onGroupCreated) {
      onGroupCreated();
    }
  };

  // Only show buttons if user is owner or admin
  if (!userRole || (userRole !== 'owner' && userRole !== 'admin')) {
    return null;
  }

  return (
    <>
      <Stack direction="row" spacing={2}>
        <Button
          variant="outlined"
          startIcon={<GroupAddIcon />}
          onClick={() => setCreateGroupOpen(true)}
        >
          Create Group
        </Button>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateMemberOpen(true)}
        >
          Add Team Member
        </Button>
      </Stack>

      <CreateTeamMemberModal
        open={createMemberOpen}
        onClose={() => setCreateMemberOpen(false)}
        workspaceId={workspaceId}
        userRole={userRole}
        onSuccess={handleMemberSuccess}
      />

      <CreateGroupModal
        open={createGroupOpen}
        onClose={() => setCreateGroupOpen(false)}
        workspaceId={workspaceId}
        onSuccess={handleGroupSuccess}
      />
    </>
  );
} 