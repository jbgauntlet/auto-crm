/**
 * Custom Field Usage Metrics Component
 * 
 * Displays analytics for custom field usage across tickets including:
 * - Field usage frequency
 * - Value distribution for each field
 * - Usage trends over time
 * - Field completion rates
 * 
 * Features:
 * - Real-time data fetching from Supabase
 * - Multiple visualization types (bar charts, tables)
 * - Time range filtering (7d, 30d, 90d, all)
 * - Field type specific analytics
 * - Usage pattern analysis
 * - Loading states and error handling
 * 
 * The component helps administrators understand how custom fields
 * are being used and which fields might need to be adjusted or
 * removed based on usage patterns.
 * 
 * @component
 * @param {Object} props
 * @param {string} props.workspaceId - The ID of the current workspace
 * @param {string} props.timeRange - Selected time range for filtering data
 * @param {Function} props.onTimeRangeChange - Callback when time range changes
 * @returns {JSX.Element} The rendered custom field metrics dashboard
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';

/**
 * CustomFieldMetrics component that displays custom field usage analytics
 */
function CustomFieldMetrics({ workspaceId, timeRange, onTimeRangeChange }) {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    fields: [],
    usage: {},
    valueDistribution: {},
    trends: {}
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
   * Fetches custom field usage metrics from Supabase
   * Includes field configurations, usage data, and trends
   */
  useEffect(() => {
    const fetchMetrics = async () => {
      setLoading(true);
      try {
        // Fetch custom fields configuration
        const { data: fields, error: fieldsError } = await supabase
          .from('ticket_custom_fields')
          .select(`
            *,
            options:ticket_custom_field_options(*)
          `)
          .eq('workspace_id', workspaceId)
          .eq('is_enabled', true);

        if (fieldsError) throw fieldsError;

        // Fetch tickets with custom fields data
        let query = supabase
          .from('tickets')
          .select('custom_fields, created_at')
          .eq('workspace_id', workspaceId);

        const startDate = getStartDate();
        if (startDate) {
          query = query.gte('created_at', startDate.toISOString());
        }

        const { data: tickets, error: ticketsError } = await query;
        if (ticketsError) throw ticketsError;

        const newMetrics = {
          fields: fields,
          usage: {},
          valueDistribution: {},
          trends: {}
        };

        // Calculate usage statistics
        fields.forEach(field => {
          const ticketsWithField = tickets.filter(t => 
            t.custom_fields && t.custom_fields[field.id] !== undefined && 
            t.custom_fields[field.id] !== '' && 
            t.custom_fields[field.id] !== null
          );

          newMetrics.usage[field.id] = {
            total: ticketsWithField.length,
            percentage: (ticketsWithField.length / tickets.length * 100).toFixed(1)
          };

          // Calculate value distribution for dropdown and multiselect fields
          if (field.type === 'dropdown' || field.type === 'multiselect') {
            const valueCount = {};
            ticketsWithField.forEach(ticket => {
              const values = Array.isArray(ticket.custom_fields[field.id])
                ? ticket.custom_fields[field.id]
                : [ticket.custom_fields[field.id]];
              
              values.forEach(value => {
                valueCount[value] = (valueCount[value] || 0) + 1;
              });
            });

            newMetrics.valueDistribution[field.id] = Object.entries(valueCount).map(([value, count]) => ({
              name: value,
              count: count
            }));
          }

          // Calculate trends (by month)
          const trendsByMonth = {};
          ticketsWithField.forEach(ticket => {
            const month = new Date(ticket.created_at).toISOString().slice(0, 7); // YYYY-MM
            trendsByMonth[month] = (trendsByMonth[month] || 0) + 1;
          });

          newMetrics.trends[field.id] = Object.entries(trendsByMonth)
            .map(([month, count]) => ({
              month: month,
              count: count
            }))
            .sort((a, b) => a.month.localeCompare(b.month));
        });

        setMetrics(newMetrics);
      } catch (error) {
        console.error('Error fetching custom field metrics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [workspaceId, timeRange]);

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

      {/* Usage Overview */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Custom Field Usage
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Field Name</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell align="right">Usage Count</TableCell>
                    <TableCell align="right">Usage %</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {metrics.fields.map((field) => (
                    <TableRow key={field.id}>
                      <TableCell>{field.name}</TableCell>
                      <TableCell>{field.type}</TableCell>
                      <TableCell align="right">{metrics.usage[field.id]?.total || 0}</TableCell>
                      <TableCell align="right">{metrics.usage[field.id]?.percentage || 0}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Grid>

      {/* Value Distribution Charts */}
      {metrics.fields
        .filter(field => field.type === 'dropdown' || field.type === 'multiselect')
        .map(field => (
          <Grid item xs={12} md={6} key={field.id}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {field.name} Distribution
                </Typography>
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer>
                    <BarChart
                      data={metrics.valueDistribution[field.id] || []}
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
                      <Bar dataKey="count" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}

      {/* Usage Trends */}
      {metrics.fields.map(field => (
        <Grid item xs={12} key={`trend-${field.id}`}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {field.name} Usage Trend
              </Typography>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer>
                  <BarChart
                    data={metrics.trends[field.id] || []}
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
                    <Bar dataKey="count" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}

export default CustomFieldMetrics; 