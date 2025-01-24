import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import {
  Box,
  Typography,
  Card,
  Button,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import TicketFilterButtons from '../../components/TicketFilterButtons';

function TicketList() {
  const navigate = useNavigate();
  const { workspaceId } = useParams();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ticketFilter, setTicketFilter] = useState('all');
  const [showClosed, setShowClosed] = useState(false);
  const [ticketCounts, setTicketCounts] = useState({
    you: 0,
    groups: 0,
    all: 0
  });

  const statusColors = {
    open: '#008079',
    in_progress: '#2073B7',
    closed: '#68868B',
  };

  const priorityColors = {
    urgent: '#C72A1C',
    high: '#2073B7',
    normal: '#16494D',
    low: '#008079',
  };

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
            backgroundColor: `${statusColors[params.value]}15`,
            color: statusColors[params.value],
            padding: '6px 12px',
            borderRadius: '6px',
            textTransform: 'capitalize',
            fontWeight: 500,
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
            backgroundColor: `${priorityColors[params.value]}15`,
            color: priorityColors[params.value],
            padding: '6px 12px',
            borderRadius: '6px',
            textTransform: 'capitalize',
            fontWeight: 500,
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate('/login');
          return;
        }

        // Fetch ticket counts
        await fetchTicketCounts(user.id, workspaceId);
        
        // Fetch filtered tickets
        let query = supabase
          .from('tickets')
          .select(`
            *,
            requestor:requestor_id(email),
            assignee:assignee_id(email),
            creator:creator_id(email)
          `)
          .eq('workspace_id', workspaceId);

        // Apply filters
        if (!showClosed) {
          query = query.neq('status', 'closed');
        }

        if (ticketFilter === 'you') {
          query = query.eq('assignee_id', user.id);
        } else if (ticketFilter === 'groups') {
          const { data: userGroups } = await supabase
            .from('group_memberships')
            .select('group_id')
            .eq('user_id', user.id);
          
          const groupIds = userGroups?.map(g => g.group_id) || [];
          query = query.in('group_id', groupIds);
        }

        const { data: ticketsData, error: ticketsError } = await query;

        if (ticketsError) throw ticketsError;

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

    fetchData();
  }, [workspaceId, ticketFilter, showClosed, navigate]);

  const fetchTicketCounts = async (userId, workspaceId) => {
    try {
      if (!userId || !workspaceId) {
        setTicketCounts({ you: 0, groups: 0, all: 0 });
        return;
      }

      const { data: userGroups } = await supabase
        .from('group_memberships')
        .select('group_id')
        .eq('user_id', userId);

      const groupIds = userGroups?.map(g => g.group_id) || [];

      const [assignedToYou, assignedToGroups, allOpen] = await Promise.all([
        supabase
          .from('tickets')
          .select('id', { count: 'exact' })
          .eq('workspace_id', workspaceId)
          .eq('assignee_id', userId)
          .eq('status', 'open'),

        groupIds.length > 0 ? 
          supabase
            .from('tickets')
            .select('id', { count: 'exact' })
            .eq('workspace_id', workspaceId)
            .in('group_id', groupIds)
            .eq('status', 'open')
          :
          Promise.resolve({ count: 0 }),

        supabase
          .from('tickets')
          .select('id', { count: 'exact' })
          .eq('workspace_id', workspaceId)
          .eq('status', 'open')
      ]);

      setTicketCounts({
        you: assignedToYou.count || 0,
        groups: assignedToGroups.count || 0,
        all: allOpen.count || 0
      });
    } catch (error) {
      console.error('Error fetching ticket counts:', error);
      setTicketCounts({ you: 0, groups: 0, all: 0 });
    }
  };

  return (
    <Box>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 4 
      }}>
        <Typography 
          variant="h4" 
          component="h1" 
          sx={{ 
            color: 'primary.main',
            fontWeight: 600
          }}
        >
          Tickets
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('create')}
            sx={{
              backgroundColor: 'primary.main',
              '&:hover': {
                backgroundColor: 'primary.dark',
              }
            }}
          >
            Create Ticket
          </Button>
        </Box>
      </Box>

      <TicketFilterButtons
        currentFilter={ticketFilter}
        onFilterChange={setTicketFilter}
        showClosed={showClosed}
        onShowClosedChange={setShowClosed}
        counts={ticketCounts}
      />

      <Card sx={{ mb: 4 }}>
        <DataGrid
          rows={tickets}
          columns={columns}
          pageSize={10}
          rowsPerPageOptions={[10, 25, 50]}
          checkboxSelection
          disableSelectionOnClick
          loading={loading}
          onRowClick={(params) => navigate(`${params.row.id}`)}
          autoHeight
          sx={{
            '& .MuiDataGrid-row': {
              cursor: 'pointer',
              '&:hover': {
                backgroundColor: 'primary.light',
              },
            },
            '& .MuiDataGrid-columnHeaders': {
              backgroundColor: 'primary.light',
              color: 'primary.main',
            },
            '& .MuiDataGrid-cell': {
              borderColor: 'custom.lightGray',
            },
            '& .MuiDataGrid-footerContainer': {
              borderTop: 'none',
              backgroundColor: 'background.paper',
            },
          }}
        />
      </Card>
    </Box>
  );
}

export default TicketList; 