import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { ResponsivePie } from '@nivo/pie';
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

function ResolutionMetrics({ workspaceId, timeRange, onTimeRangeChange }) {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    resolutions: [],
    byType: {},
    averageTimeByType: {},
    trends: [],
    firstContactResolution: {
      count: 0,
      percentage: 0
    }
  });

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

  useEffect(() => {
    const fetchMetrics = async () => {
      setLoading(true);
      try {
        // Fetch resolution options
        const { data: resolutions, error: resolutionsError } = await supabase
          .from('ticket_resolution_options')
          .select('*')
          .eq('workspace_id', workspaceId);

        if (resolutionsError) throw resolutionsError;
        console.log('Resolution options:', resolutions);

        // Fetch tickets with resolution data
        let query = supabase
          .from('tickets')
          .select(`
            id,
            created_at,
            resolved_at,
            resolution_id,
            resolution_notes,
            ticket_notes (
              created_at,
              is_internal
            )
          `)
          .eq('workspace_id', workspaceId);

        const startDate = getStartDate();
        if (startDate) {
          query = query.gte('created_at', startDate.toISOString());
        }

        const { data: tickets, error: ticketsError } = await query;
        if (ticketsError) throw ticketsError;
        
        console.log('All tickets:', tickets);
        console.log('Tickets with resolved_at:', tickets.filter(t => t.resolved_at !== null));

        const newMetrics = {
          resolutions: resolutions,
          byType: {},
          averageTimeByType: {},
          trends: [],
          firstContactResolution: {
            count: 0,
            percentage: 0
          }
        };

        // Initialize resolution type distribution
        resolutions.forEach(resolution => {
          newMetrics.byType[resolution.id] = {
            name: resolution.name,
            count: 0
          };
        });

        // Filter resolved tickets
        const resolvedTickets = tickets.filter(ticket => 
          ticket.resolved_at !== null
        );
        console.log('Resolved tickets (only resolved_at check):', resolvedTickets);

        // Calculate metrics for resolved tickets
        resolvedTickets.forEach(ticket => {
          console.log('Processing resolved ticket:', {
            id: ticket.id,
            resolved_at: ticket.resolved_at,
            resolution_id: ticket.resolution_id,
            resolution_notes: ticket.resolution_notes
          });

          // Update resolution type count
          if (newMetrics.byType[ticket.resolution_id]) {
            newMetrics.byType[ticket.resolution_id].count++;
          }

          // Calculate resolution time
          if (ticket.created_at && ticket.resolved_at) {
            const created = new Date(ticket.created_at);
            const resolved = new Date(ticket.resolved_at);
            const resolutionTime = (resolved.getTime() - created.getTime()) / (1000 * 60 * 60 * 24); // Convert to days

            console.log('Resolution time calculation:', {
              id: ticket.id,
              created_at: ticket.created_at,
              resolved_at: ticket.resolved_at,
              resolutionTime
            });

            // Update average resolution time
            if (!newMetrics.averageTimeByType[ticket.resolution_id]) {
              newMetrics.averageTimeByType[ticket.resolution_id] = {
                name: resolutions.find(r => r.id === ticket.resolution_id)?.name || 'Unknown',
                totalTime: 0,
                count: 0
              };
            }
            newMetrics.averageTimeByType[ticket.resolution_id].totalTime += resolutionTime;
            newMetrics.averageTimeByType[ticket.resolution_id].count++;
          }
        });

        console.log('Resolution type distribution:', newMetrics.byType);
        console.log('Average resolution times:', newMetrics.averageTimeByType);

        // Calculate final average resolution times
        Object.keys(newMetrics.averageTimeByType).forEach(resolutionId => {
          const data = newMetrics.averageTimeByType[resolutionId];
          newMetrics.averageTimeByType[resolutionId] = {
            name: data.name,
            time: data.count > 0 ? data.totalTime / data.count : 0
          };
        });

        // Calculate first contact resolution
        const firstContactResolved = resolvedTickets.filter(ticket => {
          if (!ticket.resolution_notes) return false;
          const notes = ticket.ticket_notes || [];
          const customerNotes = notes.filter(note => !note.is_internal);
          const isFCR = customerNotes.length === 0;
          console.log('FCR check for ticket:', {
            id: ticket.id,
            has_resolution_notes: !!ticket.resolution_notes,
            customer_notes_count: customerNotes.length,
            is_fcr: isFCR
          });
          return isFCR;
        });

        newMetrics.firstContactResolution = {
          count: firstContactResolved.length,
          percentage: resolvedTickets.length > 0 
            ? (firstContactResolved.length / resolvedTickets.length * 100).toFixed(1) 
            : '0.0'
        };

        console.log('First contact resolution:', newMetrics.firstContactResolution);

        // Calculate trends (by month)
        const trendsByMonth = {};
        resolvedTickets.forEach(ticket => {
          const month = new Date(ticket.resolved_at).toISOString().slice(0, 7); // YYYY-MM
          if (!trendsByMonth[month]) {
            trendsByMonth[month] = {
              month,
              total: 0
            };
            resolutions.forEach(resolution => {
              trendsByMonth[month][resolution.name] = 0;
            });
          }
          trendsByMonth[month].total++;
          const resolution = resolutions.find(r => r.id === ticket.resolution_id);
          if (resolution) {
            trendsByMonth[month][resolution.name]++;
          }
        });

        newMetrics.trends = Object.values(trendsByMonth).sort((a, b) => a.month.localeCompare(b.month));
        console.log('Monthly trends:', newMetrics.trends);

        setMetrics(newMetrics);
      } catch (error) {
        console.error('Error fetching resolution metrics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [workspaceId, timeRange]);

  // Prepare data for resolution type distribution pie chart
  const resolutionTypeData = Object.values(metrics.byType).map(({ name, count }) => ({
    id: name,
    label: name,
    value: count
  }));

  // Prepare data for average resolution time chart
  const resolutionTimeData = Object.values(metrics.averageTimeByType).map(({ name, time }) => ({
    name: name,
    time: Number(time.toFixed(1))
  }));

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

      {/* First Contact Resolution Card */}
      <Grid item xs={12} md={6} lg={3}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              First Contact Resolution
            </Typography>
            <Typography variant="h3" color="primary.main">
              {metrics.firstContactResolution.percentage}%
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {metrics.firstContactResolution.count} tickets
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* Total Resolved Card */}
      <Grid item xs={12} md={6} lg={3}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Total Resolved
            </Typography>
            <Typography variant="h3" color="primary.main">
              {Object.values(metrics.byType).reduce((sum, { count }) => sum + count, 0)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {timeRange === 'all' ? 'All time' : `Last ${timeRange.replace('d', ' days')}`}
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* Resolution Type Distribution */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Resolution Type Distribution
            </Typography>
            <Box sx={{ height: 300 }}>
              <ResponsivePie
                data={resolutionTypeData}
                margin={{ top: 40, right: 80, bottom: 40, left: 80 }}
                innerRadius={0.5}
                padAngle={0.7}
                cornerRadius={3}
                activeOuterRadiusOffset={8}
                colors={{ scheme: 'nivo' }}
                arcLinkLabelsSkipAngle={10}
                arcLinkLabelsTextColor="#333333"
                arcLinkLabelsThickness={2}
                arcLinkLabelsDiagonalLength={16}
                arcLinkLabelsStraightLength={24}
                arcLinkLabelsTextOffset={6}
                arcLabelsSkipAngle={10}
                arcLabelsTextColor="#ffffff"
                legends={[
                  {
                    anchor: 'right',
                    direction: 'column',
                    justify: false,
                    translateX: 70,
                    translateY: 0,
                    itemsSpacing: 12,
                    itemWidth: 100,
                    itemHeight: 18,
                    itemTextColor: '#999',
                    itemDirection: 'left-to-right',
                    itemOpacity: 1,
                    symbolSize: 18,
                    symbolShape: 'circle',
                  }
                ]}
              />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Average Resolution Time by Type */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Average Resolution Time by Type
            </Typography>
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer>
                <BarChart
                  data={resolutionTimeData}
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
                  <Bar dataKey="time" fill="#8884d8" name="Days" />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Resolution Trends */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Resolution Trends
            </Typography>
            <Box sx={{ height: 400 }}>
              <ResponsiveContainer>
                <BarChart
                  data={metrics.trends}
                  margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 70
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="month"
                    angle={-45}
                    textAnchor="end"
                    height={70}
                  />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  {metrics.resolutions.map((resolution, index) => (
                    <Bar
                      key={resolution.id}
                      dataKey={resolution.name}
                      stackId="a"
                      fill={`hsl(${index * (360 / metrics.resolutions.length)}, 70%, 50%)`}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}

export default ResolutionMetrics; 