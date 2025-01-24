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