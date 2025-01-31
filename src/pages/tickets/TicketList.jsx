/**
 * TicketList Component
 * 
 * A comprehensive interface for displaying and managing tickets within a workspace.
 * This component provides a data grid view of all tickets with advanced filtering,
 * sorting, and navigation capabilities.
 * 
 * Features:
 * - Real-time ticket data display using Material-UI DataGrid
 * - Advanced filtering options (All tickets, My tickets, Group tickets)
 * - Toggle for showing/hiding closed tickets
 * - Visual status indicators with color coding
 * - Priority-based highlighting
 * - Quick navigation to ticket details
 * - Create new ticket functionality
 * - Real-time ticket count tracking
 * 
 * Props (via URL parameters):
 * @param {string} workspaceId - The ID of the current workspace
 * 
 * State Management:
 * - Manages loading states for data fetching
 * - Tracks active filter selections
 * - Maintains ticket visibility preferences
 * - Updates ticket counts in real-time
 * 
 * Database Interactions:
 * - Fetches ticket data from Supabase with real-time updates
 * - Maintains separate counters for different ticket categories
 * - Handles ticket status and assignment changes
 * 
 * Visual Features:
 * - Color-coded status indicators
 * - Priority-based highlighting
 * - Responsive grid layout
 * - Interactive filtering buttons
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import {
  Box,
  Typography,
  Card,
  Button,
  Stack,
  Tooltip,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import TicketFilterButtons from '../../components/TicketFilterButtons';
import QuickTicketModal from '../../components/QuickTicketModal';
import AITicketModal from '../../components/AITicketModal';
import AIEnhancedTicketModal from '../../components/AIEnhancedTicketModal';

function TicketList() {
  const navigate = useNavigate();
  const { workspaceId } = useParams();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ticketFilter, setTicketFilter] = useState('all');
  const [showClosed, setShowClosed] = useState(false);
  const [quickTicketOpen, setQuickTicketOpen] = useState(false);
  const [aiTicketOpen, setAiTicketOpen] = useState(false);
  const [aiEnhancedOpen, setAiEnhancedOpen] = useState(false);
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
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ mb: 3 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
          <Typography variant="h4" component="h1" sx={{ color: 'primary.main', fontWeight: 600 }}>
            Tickets
          </Typography>
          <Stack direction="row" spacing={1}>
            <Tooltip title="Create Ticket">
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => navigate(`/workspaces/${workspaceId}/tickets/create`)}
              >
                Create Ticket
              </Button>
            </Tooltip>
            <Tooltip title="Quick Ticket">
              <Button
                variant="contained"
                color="secondary"
                startIcon={<FlashOnIcon />}
                onClick={() => setQuickTicketOpen(true)}
              >
                Quick Ticket
              </Button>
            </Tooltip>
            <Tooltip title="AI Ticket">
              <Button
                variant="contained"
                color="info"
                startIcon={<SmartToyIcon />}
                onClick={() => setAiTicketOpen(true)}
              >
                AI Ticket
              </Button>
            </Tooltip>
            <Tooltip title="AI Enhanced Ticket (Beta)">
              <Button
                variant="contained"
                color="warning"
                startIcon={<AutoFixHighIcon />}
                onClick={() => setAiEnhancedOpen(true)}
              >
                AI Enhanced
              </Button>
            </Tooltip>
          </Stack>
        </Stack>

        <TicketFilterButtons
          currentFilter={ticketFilter}
          onFilterChange={setTicketFilter}
          showClosed={showClosed}
          onShowClosedChange={setShowClosed}
          counts={ticketCounts}
        />
      </Box>

      <Card sx={{ flexGrow: 1 }}>
        <DataGrid
          rows={tickets}
          columns={columns}
          pageSize={25}
          rowsPerPageOptions={[25]}
          disableSelectionOnClick
          loading={loading}
          onRowClick={(params) => navigate(`/workspaces/${workspaceId}/tickets/${params.id}`)}
          sx={{
            border: 'none',
            '& .MuiDataGrid-row': {
              cursor: 'pointer',
            },
          }}
        />
      </Card>

      <QuickTicketModal
        open={quickTicketOpen}
        onClose={() => setQuickTicketOpen(false)}
        workspaceId={workspaceId}
      />

      <AITicketModal
        open={aiTicketOpen}
        onClose={() => setAiTicketOpen(false)}
        workspaceId={workspaceId}
      />

      <AIEnhancedTicketModal
        open={aiEnhancedOpen}
        onClose={() => setAiEnhancedOpen(false)}
        workspaceId={workspaceId}
      />
    </Box>
  );
}

export default TicketList; 