import { useState, useCallback } from 'react';
import { supabase } from '../../../../lib/supabaseClient';
import { workspaceSetupService } from '../services/workspaceSetupService';

/**
 * Custom hook for managing workspaces
 */
export const useWorkspaces = () => {
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [creating, setCreating] = useState(false);

  /**
   * Fetches all workspaces for a user
   */
  const fetchWorkspaces = useCallback(async (userId) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('workspace_memberships')
        .select(`
          workspace:workspace_id (
            id,
            name,
            created_at
          )
        `)
        .eq('user_id', userId);

      if (error) throw error;

      const formattedWorkspaces = data.map(({ workspace }) => ({
        id: workspace.id,
        name: workspace.name,
        created_at: new Date(workspace.created_at).toLocaleDateString(),
      }));

      setWorkspaces(formattedWorkspaces);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Creates a new workspace
   */
  const createWorkspace = useCallback(async (name, userId) => {
    try {
      setCreating(true);
      setError(null);

      const workspace = await workspaceSetupService.createWorkspace(name, userId);

      setWorkspaces(prev => [...prev, {
        id: workspace.id,
        name: workspace.name,
        created_at: new Date(workspace.created_at).toLocaleDateString(),
      }]);

      return workspace;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setCreating(false);
    }
  }, []);

  return {
    workspaces,
    loading,
    error,
    creating,
    fetchWorkspaces,
    createWorkspace
  };
}; 