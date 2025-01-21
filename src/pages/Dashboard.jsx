import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Box, Button, Typography } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';

function Dashboard() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentWorkspace, setCurrentWorkspace] = useState(null);

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        // Get current user's workspace
        const { data: { user } } = await supabase.auth.getUser();
        const { data: membership } = await supabase
          .from('workspace_memberships')
          .select('workspace_id')
          .eq('user_id', user.id)
          .single();

        setCurrentWorkspace(membership.workspace_id);

        // Fetch tickets for the workspace with user details
        const { data: ticketsData, error } = await supabase
          .from('tickets')
          .select(`
            *,
            requestor:requestor_id(email),
            assignee:assignee_id(email),
            creator:creator_id(email)
          `)
          .eq('workspace_id', membership.workspace_id);

        if (error) throw error;

        // Format the data for the grid
        const formattedTickets = ticketsData.map(ticket => ({
          id: ticket.id,
          subject: ticket.subject,
          description: ticket.description,
          status: ticket.status,
          priority: ticket.priority,
          requestor: ticket.requestor?.email,
          assignee: ticket.assignee?.email,
          creator: ticket.creator?.email,
          created_at: new Date(ticket.created_at).toLocaleString(),
        }));

        setTickets(formattedTickets);
      } catch (error) {
        console.error('Error fetching tickets:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, []);

  const columns = [
    { 
      field: 'subject', 
      headerName: 'Subject', 
      flex: 1,
      minWidth: 200,
    },
    { 
      field: 'status', 
      headerName: 'Status',
      width: 120,
      renderCell: (params) => (
        <Box
          sx={{
            backgroundColor: 
              params.value === 'open' ? 'success.light' :
              params.value === 'in_progress' ? 'warning.light' :
              'error.light',
            padding: '4px 8px',
            borderRadius: '4px',
            textTransform: 'capitalize',
          }}
        >
          {params.value.replace('_', ' ')}
        </Box>
      ),
    },
    { 
      field: 'priority', 
      headerName: 'Priority',
      width: 120,
      renderCell: (params) => (
        <Box
          sx={{
            backgroundColor: 
              params.value === 'urgent' ? 'error.light' :
              params.value === 'high' ? 'warning.light' :
              params.value === 'normal' ? 'info.light' :
              'success.light',
            padding: '4px 8px',
            borderRadius: '4px',
            textTransform: 'capitalize',
          }}
        >
          {params.value}
        </Box>
      ),
    },
    { 
      field: 'requestor', 
      headerName: 'Requester',
      width: 200,
    },
    { 
      field: 'assignee', 
      headerName: 'Assignee',
      width: 200,
    },
    { 
      field: 'created_at', 
      headerName: 'Created At',
      width: 180,
    },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Tickets
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/create-ticket')}
        >
          Create Ticket
        </Button>
      </Box>

      <Box sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={tickets}
          columns={columns}
          pageSize={10}
          rowsPerPageOptions={[10, 25, 50]}
          checkboxSelection
          disableSelectionOnClick
          loading={loading}
          onRowClick={(params) => navigate(`/ticket/${params.row.id}`)}
          sx={{
            '& .MuiDataGrid-row': {
              cursor: 'pointer',
              '&:hover': {
                backgroundColor: 'action.hover',
              },
            },
          }}
        />
      </Box>
    </Box>
  );
}

export default Dashboard; 