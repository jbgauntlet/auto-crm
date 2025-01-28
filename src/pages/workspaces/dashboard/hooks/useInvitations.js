import { useState, useCallback } from 'react';
import { invitationService } from '../services/invitationService';

/**
 * Custom hook for managing workspace invitations
 */
export const useInvitations = () => {
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingInvite, setProcessingInvite] = useState(null);

  /**
   * Fetches all invitations for a user
   */
  const fetchInvitations = useCallback(async (userEmail) => {
    try {
      setLoading(true);
      const invitations = await invitationService.fetchInvitations(userEmail);
      setInvites(invitations);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Handles accepting or rejecting an invitation
   */
  const handleInvitation = useCallback(async (inviteId, accept, userId) => {
    try {
      setProcessingInvite(inviteId);
      setError(null);

      if (accept) {
        const workspace = await invitationService.acceptInvitation(inviteId, userId);
        setInvites(prev => prev.filter(inv => inv.id !== inviteId));
        return workspace;
      } else {
        await invitationService.rejectInvitation(inviteId);
        setInvites(prev => prev.filter(inv => inv.id !== inviteId));
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setProcessingInvite(null);
    }
  }, []);

  return {
    invites,
    loading,
    error,
    processingInvite,
    fetchInvitations,
    handleInvitation
  };
}; 