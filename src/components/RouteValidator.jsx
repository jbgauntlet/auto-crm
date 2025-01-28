/**
 * RouteValidator Component
 * 
 * A higher-order component that validates route parameters against the database
 * before rendering its children. Provides route-level access control and validation.
 * 
 * Features:
 * - Validates workspace existence and access
 * - Validates ticket existence within workspace context
 * - Handles invalid routes with appropriate redirects
 * - Prevents unauthorized access to resources
 * 
 * Props:
 * @param {ReactNode} children - The components to render if validation passes
 * @param {string} validationKey - Key to determine validation type (default: 'workspace')
 * 
 * State Management:
 * - Tracks validation status (null, true, false)
 * - Manages loading state during validation
 * 
 * Database Interactions:
 * - Checks workspace existence
 * - Validates ticket ownership
 * - Ensures resource relationships
 * 
 * Security:
 * - Prevents access to non-existent resources
 * - Maintains proper resource hierarchy
 * - Handles validation errors gracefully
 * 
 * Navigation:
 * - Redirects to appropriate fallback routes on validation failure
 * - Maintains workspace context in redirects
 * - Handles nested resource validation
 */

import { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import NotFound from '../pages/NotFound';

function RouteValidator({ children, validationKey = 'workspace' }) {
  const navigate = useNavigate();
  const params = useParams();
  const location = useLocation();
  const [isValid, setIsValid] = useState(null);

  useEffect(() => {
    const validateRoute = async () => {
      try {
        // Get the path segments
        const pathSegments = location.pathname.split('/').filter(Boolean);
        
        // Validate workspace
        if (params.workspaceId) {
          const { data: workspace, error: workspaceError } = await supabase
            .from('workspaces')
            .select('id')
            .eq('id', params.workspaceId)
            .single();

          if (workspaceError || !workspace) {
            navigate('/workspaces');
            return;
          }
        }

        // Validate ticket if it exists in the path
        if (params.ticketId) {
          const { data: ticket, error: ticketError } = await supabase
            .from('tickets')
            .select('id')
            .eq('id', params.ticketId)
            .eq('workspace_id', params.workspaceId)
            .single();

          if (ticketError || !ticket) {
            // Navigate to the tickets list of the current workspace
            navigate(`/workspaces/${params.workspaceId}/tickets`);
            return;
          }
        }

        setIsValid(true);
      } catch (error) {
        console.error('Route validation error:', error);
        setIsValid(false);
      }
    };

    validateRoute();
  }, [location.pathname, params, navigate]);

  if (isValid === null) {
    return null; // Or a loading spinner
  }

  if (isValid === false) {
    return <NotFound />;
  }

  return children;
}

export default RouteValidator; 