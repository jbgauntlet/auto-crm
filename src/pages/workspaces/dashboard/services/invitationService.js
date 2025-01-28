import { supabase } from '../../../../lib/supabaseClient';

/**
 * Service for managing workspace invitations
 */
export const invitationService = {
  /**
   * Fetches all invitations for a user
   */
  async fetchInvitations(userEmail) {
    const { data, error } = await supabase
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
      .eq('email', userEmail);

    if (error) throw error;

    return data.map(invite => ({
      id: invite.id,
      workspaceName: invite.workspace.name,
      role: invite.role,
      groupName: invite.group?.name,
    }));
  },

  /**
   * Accepts a workspace invitation
   */
  async acceptInvitation(inviteId, userId) {
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

    // Create workspace membership
    const { error: membershipError } = await supabase
      .from('workspace_memberships')
      .insert([{
        workspace_id: invite.workspace_id,
        user_id: userId,
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
          user_id: userId,
          created_at: new Date().toISOString(),
        }]);

      if (groupError) throw groupError;
    }

    // Delete the invite
    const { error: deleteError } = await supabase
      .from('workspace_invites')
      .delete()
      .eq('id', inviteId);

    if (deleteError) throw deleteError;

    return {
      id: invite.workspace_id,
      name: invite.workspace.name,
      created_at: new Date(invite.workspace.created_at).toLocaleDateString(),
    };
  },

  /**
   * Rejects a workspace invitation
   */
  async rejectInvitation(inviteId) {
    const { error } = await supabase
      .from('workspace_invites')
      .delete()
      .eq('id', inviteId);

    if (error) throw error;
  }
}; 