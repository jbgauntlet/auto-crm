/**
 * Individual Performance Metrics Component
 * 
 * Displays performance metrics for individual team members including:
 * - Ticket volume per user
 * - Average resolution time per user
 * - Open vs. closed ticket ratios
 * - Current workload distribution
 * 
 * Features:
 * - Real-time data fetching from Supabase
 * - Interactive bar charts using Recharts
 * - Time range filtering (7d, 30d, 90d, all)
 * - Comparative performance visualization
 * - Workload analysis
 * - Loading states and error handling
 * 
 * The component helps managers track individual performance and
 * identify potential workload imbalances or training needs.
 * 
 * @component
 * @param {Object} props
 * @param {string} props.workspaceId - The ID of the current workspace
 * @param {string} props.timeRange - Selected time range for filtering data
 * @param {Function} props.onTimeRangeChange - Callback when time range changes
 * @returns {JSX.Element} The rendered individual metrics dashboard
 */

import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  CircularProgress,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';

/**
 * IndividualMetrics component that displays per-user performance analytics
 */
function IndividualMetrics({ workspaceId, timeRange, onTimeRangeChange }) {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    users: [],
    ticketsByUser: {},
    resolutionTimeByUser: {},
    openVsClosed: {},
    currentWorkload: {}
  });

  /**
   * Calculates the start date based on the selected time range
   * @returns {Date|null} The calculated start date or null for all-time
   */
  const getStartDate = () => {
    const now = new Date();
    switch (timeRange) {
      case '7d':
        return new Date(now.setDate(now.getDate() - 7));
      case '30d':
        return new Date(now.setDate(now.getDate() - 30));
      case '90d':
        return new Date(now.setDate(now.getDate() - 90));
      case 'all':
        return null;
      default:
        return new Date(now.setDate(now.getDate() - 7));
    }
  };

  /**
   * Fetches individual performance metrics from Supabase
   * Includes ticket counts, resolution times, and workload data
   */
  useEffect(() => {
    const fetchMetrics = async () => {
      setLoading(true);
      try {
        // Fetch workspace users
        const { data: users, error: usersError } = await supabase
          .from('workspace_memberships')
          .select(`
            user:user_id (
              id,
              email,
              first_name,
              last_name
            )
          `)
          .eq('workspace_id', workspaceId);

        if (usersError) throw usersError;

        // Fetch tickets with assignee information
        let query = supabase
          .from('tickets')
          .select('assignee_id, status, resolved_at, created_at')
          .eq('workspace_id', workspaceId);

        const startDate = getStartDate();
        if (startDate) {
          query = query.gte('created_at', startDate.toISOString());
        }

        const { data: tickets, error: ticketsError } = await query;
        if (ticketsError) throw ticketsError;

        const newMetrics = {
          users: users.map(u => u.user),
          ticketsByUser: {},
          resolutionTimeByUser: {},
          openVsClosed: {},
          currentWorkload: {}
        };

        users.forEach(({ user }) => {
          const userTickets = tickets.filter(t => t.assignee_id === user.id);
          const resolvedTickets = userTickets.filter(t => t.resolved_at && t.created_at);
          
          // Total tickets per user
          newMetrics.ticketsByUser[user.id] = userTickets.length;

          // Average resolution time
          if (resolvedTickets.length > 0) {
            const totalResolutionTime = resolvedTickets.reduce((sum, ticket) => {
              const created = new Date(ticket.created_at);
              const resolved = new Date(ticket.resolved_at);
              return sum + (resolved.getTime() - created.getTime());
            }, 0);
            newMetrics.resolutionTimeByUser[user.id] = 
              totalResolutionTime / resolvedTickets.length / (1000 * 60 * 60 * 24);
          } else {
            newMetrics.resolutionTimeByUser[user.id] = 0;
          }

          // Open vs Closed tickets
          newMetrics.openVsClosed[user.id] = {
            open: userTickets.filter(t => t.status === 'open').length,
            closed: userTickets.filter(t => t.status === 'closed').length
          };

          // Current workload (open tickets)
          newMetrics.currentWorkload[user.id] = userTickets.filter(t => t.status === 'open').length;
        });

        setMetrics(newMetrics);
      } catch (error) {
        console.error('Error fetching individual metrics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [workspaceId, timeRange]);

  /**
   * Prepares data for the bar chart visualization
   * @returns {Array} Formatted data for the bar chart
   */
  const prepareBarData = () => {
    return metrics.users.map(user => ({
      name: `${user.first_name} ${user.last_name}`,
      'Open Tickets': metrics.openVsClosed[user.id]?.open || 0,
      'Closed Tickets': metrics.openVsClosed[user.id]?.closed || 0,
      'Avg. Resolution Time': Number((metrics.resolutionTimeByUser[user.id] || 0).toFixed(1))
    }));
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Grid container spacing={3}>
      {/* Time Range Filter */}
      <Grid item xs={12}>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          <ToggleButtonGroup
            value={timeRange}
            exclusive
            onChange={(e, newValue) => {
              if (newValue !== null) {
                onTimeRangeChange(newValue);
              }
            }}
            size="small"
          >
            <ToggleButton value="7d">Last 7 days</ToggleButton>
            <ToggleButton value="30d">Last 30 days</ToggleButton>
            <ToggleButton value="90d">Last 90 days</ToggleButton>
            <ToggleButton value="all">All time</ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Grid>

      {/* Individual Overview Cards */}
      {metrics.users.map(user => (
        <Grid item xs={12} md={6} lg={4} key={user.id}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {user.first_name} {user.last_name}
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Current Workload
                  </Typography>
                  <Typography variant="h4" color="primary.main">
                    {metrics.currentWorkload[user.id] || 0}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Total Resolved
                  </Typography>
                  <Typography variant="h4" color="primary.main">
                    {metrics.openVsClosed[user.id]?.closed || 0}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Avg. Resolution Time
                  </Typography>
                  <Typography variant="h4" color="primary.main">
                    {(metrics.resolutionTimeByUser[user.id] || 0).toFixed(1)}d
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      ))}

      {/* Individual Performance Chart */}
      <Grid item xs={12}>
        <Card sx={{ maxWidth: '100%' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Individual Performance Comparison
            </Typography>
            <div style={{ width: '100%', height: 400 }}>
              <ResponsiveContainer>
                <BarChart
                  data={prepareBarData()}
                  margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 70
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45}
                    textAnchor="end"
                    height={70}
                  />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Open Tickets" fill="#8884d8" />
                  <Bar dataKey="Closed Tickets" fill="#82ca9d" />
                  <Bar dataKey="Avg. Resolution Time" fill="#ffc658" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}

export default IndividualMetrics; 