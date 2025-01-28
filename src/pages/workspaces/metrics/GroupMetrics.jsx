/**
 * Group Performance Metrics Component
 * 
 * Displays performance metrics for team groups/departments including:
 * - Ticket volume per group
 * - Average resolution time per group
 * - Open vs. closed ticket ratios
 * - Comparative group performance
 * 
 * Features:
 * - Real-time data fetching from Supabase
 * - Interactive bar charts using Recharts
 * - Time range filtering (7d, 30d, 90d, all)
 * - Group performance comparison
 * - Workload distribution analysis
 * - Loading states and error handling
 * 
 * The component helps managers understand departmental performance
 * and identify areas that may need additional resources or process improvements.
 * 
 * @component
 * @param {Object} props
 * @param {string} props.workspaceId - The ID of the current workspace
 * @param {string} props.timeRange - Selected time range for filtering data
 * @param {Function} props.onTimeRangeChange - Callback when time range changes
 * @returns {JSX.Element} The rendered group metrics dashboard
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
 * GroupMetrics component that displays per-group performance analytics
 */
function GroupMetrics({ workspaceId, timeRange, onTimeRangeChange }) {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    groups: [],
    ticketsByGroup: {},
    resolutionTimeByGroup: {},
    openVsClosed: {}
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
   * Fetches group performance metrics from Supabase
   * Includes ticket counts, resolution times, and group data
   */
  useEffect(() => {
    const fetchMetrics = async () => {
      setLoading(true);
      try {
        const { data: groups, error: groupsError } = await supabase
          .from('groups')
          .select('id, name')
          .eq('workspace_id', workspaceId);

        if (groupsError) throw groupsError;

        let query = supabase
          .from('tickets')
          .select('group_id, status, resolved_at, created_at')
          .eq('workspace_id', workspaceId);

        const startDate = getStartDate();
        if (startDate) {
          query = query.gte('created_at', startDate.toISOString());
        }

        const { data: tickets, error: ticketsError } = await query;
        if (ticketsError) throw ticketsError;

        const newMetrics = {
          groups: groups,
          ticketsByGroup: {},
          resolutionTimeByGroup: {},
          openVsClosed: {}
        };

        groups.forEach(group => {
          const groupTickets = tickets.filter(t => t.group_id === group.id);
          const resolvedTickets = groupTickets.filter(t => t.resolved_at && t.created_at);
          
          newMetrics.ticketsByGroup[group.name] = groupTickets.length;

          if (resolvedTickets.length > 0) {
            const totalResolutionTime = resolvedTickets.reduce((sum, ticket) => {
              const created = new Date(ticket.created_at);
              const resolved = new Date(ticket.resolved_at);
              return sum + (resolved.getTime() - created.getTime());
            }, 0);
            newMetrics.resolutionTimeByGroup[group.name] = 
              totalResolutionTime / resolvedTickets.length / (1000 * 60 * 60 * 24);
          } else {
            newMetrics.resolutionTimeByGroup[group.name] = 0;
          }

          newMetrics.openVsClosed[group.name] = {
            open: groupTickets.filter(t => t.status === 'open').length,
            closed: groupTickets.filter(t => t.status === 'closed').length
          };
        });

        setMetrics(newMetrics);
      } catch (error) {
        console.error('Error fetching group metrics:', error);
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
    return metrics.groups.map(group => ({
      name: group.name,
      'Open Tickets': metrics.openVsClosed[group.name]?.open || 0,
      'Closed Tickets': metrics.openVsClosed[group.name]?.closed || 0,
      'Avg. Resolution Time': Number((metrics.resolutionTimeByGroup[group.name] || 0).toFixed(1)),
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

      {/* Group Overview Cards */}
      {metrics.groups.map(group => (
        <Grid item xs={12} md={6} lg={4} key={group.id}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {group.name}
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Total Tickets
                  </Typography>
                  <Typography variant="h4" color="primary.main">
                    {metrics.ticketsByGroup[group.name] || 0}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Open Tickets
                  </Typography>
                  <Typography variant="h4" color="primary.main">
                    {metrics.openVsClosed[group.name]?.open || 0}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Avg. Resolution Time
                  </Typography>
                  <Typography variant="h4" color="primary.main">
                    {(metrics.resolutionTimeByGroup[group.name] || 0).toFixed(1)}d
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      ))}

      {/* Group Comparison Chart */}
      <Grid item xs={12}>
        <Card sx={{ maxWidth: '100%' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Group Performance Comparison
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

export default GroupMetrics; 