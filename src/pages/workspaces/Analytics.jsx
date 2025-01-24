import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { ResponsivePie } from '@nivo/pie';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
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
import {
  Assessment as VolumeIcon,
  Groups as GroupIcon,
  Person as PersonIcon,
  ViewList as CustomFieldIcon,
  CheckCircle as ResolutionIcon,
} from '@mui/icons-material';

function Analytics() {
  const { workspaceId } = useParams();
  const [selectedCategory, setSelectedCategory] = useState('volume');
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d'); // Default to last 7 days
  const [volumeMetrics, setVolumeMetrics] = useState({
    total: 0,
    byStatus: {
      open: 0,
      closed: 0
    },
    byPriority: {
      urgent: 0,
      high: 0,
      normal: 0,
      low: 0
    },
    averageResolutionTime: 0,
    resolvedLastWeek: 0
  });
  const [groupMetrics, setGroupMetrics] = useState({
    groups: [],
    ticketsByGroup: {},
    resolutionTimeByGroup: {},
    openVsClosed: {}
  });
  const [individualMetrics, setIndividualMetrics] = useState({
    users: [],
    ticketsByUser: {},
    resolutionTimeByUser: {},
    openVsClosed: {},
    currentWorkload: {}
  });
  const [customFieldMetrics, setCustomFieldMetrics] = useState({
    fields: [],
    usage: {},
    valueDistribution: {},
    trends: {}
  });
  const [resolutionMetrics, setResolutionMetrics] = useState({
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
    const fetchVolumeMetrics = async () => {
      setLoading(true);
      try {
        let query = supabase
          .from('tickets')
          .select('status, priority, resolved_at, created_at')
          .eq('workspace_id', workspaceId);

        const startDate = getStartDate();
        if (startDate) {
          query = query.gte('created_at', startDate.toISOString());
        }

        const { data: statusData, error: statusError } = await query;

        if (statusError) throw statusError;

        // Calculate metrics
        const metrics = {
          total: statusData.length,
          byStatus: {
            open: statusData.filter(t => t.status === 'open').length,
            closed: statusData.filter(t => t.status === 'closed').length
          },
          byPriority: {
            urgent: statusData.filter(t => t.priority === 'urgent').length,
            high: statusData.filter(t => t.priority === 'high').length,
            normal: statusData.filter(t => t.priority === 'normal').length,
            low: statusData.filter(t => t.priority === 'low').length
          },
          averageResolutionTime: 0,
          resolvedLastWeek: 0
        };

        // Calculate average resolution time for resolved tickets
        const resolvedTickets = statusData.filter(t => t.resolved_at && t.created_at);
        if (resolvedTickets.length > 0) {
          const totalResolutionTime = resolvedTickets.reduce((sum, ticket) => {
            const created = new Date(ticket.created_at);
            const resolved = new Date(ticket.resolved_at);
            return sum + (resolved.getTime() - created.getTime());
          }, 0);
          metrics.averageResolutionTime = totalResolutionTime / resolvedTickets.length / (1000 * 60 * 60 * 24);
        }

        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        metrics.resolvedLastWeek = resolvedTickets.filter(t => 
          new Date(t.resolved_at) > oneWeekAgo
        ).length;

        setVolumeMetrics(metrics);
      } catch (error) {
        console.error('Error fetching volume metrics:', error);
      } finally {
        setLoading(false);
      }
    };

    const fetchGroupMetrics = async () => {
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

        const metrics = {
          groups: groups,
          ticketsByGroup: {},
          resolutionTimeByGroup: {},
          openVsClosed: {}
        };

        groups.forEach(group => {
          const groupTickets = tickets.filter(t => t.group_id === group.id);
          const resolvedTickets = groupTickets.filter(t => t.resolved_at && t.created_at);
          
          metrics.ticketsByGroup[group.name] = groupTickets.length;

          if (resolvedTickets.length > 0) {
            const totalResolutionTime = resolvedTickets.reduce((sum, ticket) => {
              const created = new Date(ticket.created_at);
              const resolved = new Date(ticket.resolved_at);
              return sum + (resolved.getTime() - created.getTime());
            }, 0);
            metrics.resolutionTimeByGroup[group.name] = 
              totalResolutionTime / resolvedTickets.length / (1000 * 60 * 60 * 24);
          } else {
            metrics.resolutionTimeByGroup[group.name] = 0;
          }

          metrics.openVsClosed[group.name] = {
            open: groupTickets.filter(t => t.status === 'open').length,
            closed: groupTickets.filter(t => t.status === 'closed').length
          };
        });

        setGroupMetrics(metrics);
      } catch (error) {
        console.error('Error fetching group metrics:', error);
      } finally {
        setLoading(false);
      }
    };

    const fetchIndividualMetrics = async () => {
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

        const metrics = {
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
          metrics.ticketsByUser[user.id] = userTickets.length;

          // Average resolution time
          if (resolvedTickets.length > 0) {
            const totalResolutionTime = resolvedTickets.reduce((sum, ticket) => {
              const created = new Date(ticket.created_at);
              const resolved = new Date(ticket.resolved_at);
              return sum + (resolved.getTime() - created.getTime());
            }, 0);
            metrics.resolutionTimeByUser[user.id] = 
              totalResolutionTime / resolvedTickets.length / (1000 * 60 * 60 * 24);
          } else {
            metrics.resolutionTimeByUser[user.id] = 0;
          }

          // Open vs Closed tickets
          metrics.openVsClosed[user.id] = {
            open: userTickets.filter(t => t.status === 'open').length,
            closed: userTickets.filter(t => t.status === 'closed').length
          };

          // Current workload (open tickets)
          metrics.currentWorkload[user.id] = userTickets.filter(t => t.status === 'open').length;
        });

        setIndividualMetrics(metrics);
      } catch (error) {
        console.error('Error fetching individual metrics:', error);
      } finally {
        setLoading(false);
      }
    };

    const fetchCustomFieldMetrics = async () => {
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

        const metrics = {
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

          metrics.usage[field.id] = {
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

            metrics.valueDistribution[field.id] = Object.entries(valueCount).map(([value, count]) => ({
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

          metrics.trends[field.id] = Object.entries(trendsByMonth)
            .map(([month, count]) => ({
              month: month,
              count: count
            }))
            .sort((a, b) => a.month.localeCompare(b.month));
        });

        setCustomFieldMetrics(metrics);
      } catch (error) {
        console.error('Error fetching custom field metrics:', error);
      } finally {
        setLoading(false);
      }
    };

    const fetchResolutionMetrics = async () => {
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

        const metrics = {
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
          metrics.byType[resolution.id] = {
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
          if (metrics.byType[ticket.resolution_id]) {
            metrics.byType[ticket.resolution_id].count++;
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
            if (!metrics.averageTimeByType[ticket.resolution_id]) {
              metrics.averageTimeByType[ticket.resolution_id] = {
                name: resolutions.find(r => r.id === ticket.resolution_id)?.name || 'Unknown',
                totalTime: 0,
                count: 0
              };
            }
            metrics.averageTimeByType[ticket.resolution_id].totalTime += resolutionTime;
            metrics.averageTimeByType[ticket.resolution_id].count++;
          }
        });

        console.log('Resolution type distribution:', metrics.byType);
        console.log('Average resolution times:', metrics.averageTimeByType);

        // Calculate final average resolution times
        Object.keys(metrics.averageTimeByType).forEach(resolutionId => {
          const data = metrics.averageTimeByType[resolutionId];
          metrics.averageTimeByType[resolutionId] = {
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

        metrics.firstContactResolution = {
          count: firstContactResolved.length,
          percentage: resolvedTickets.length > 0 
            ? (firstContactResolved.length / resolvedTickets.length * 100).toFixed(1) 
            : '0.0'
        };

        console.log('First contact resolution:', metrics.firstContactResolution);

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

        metrics.trends = Object.values(trendsByMonth).sort((a, b) => a.month.localeCompare(b.month));
        console.log('Monthly trends:', metrics.trends);

        setResolutionMetrics(metrics);
      } catch (error) {
        console.error('Error fetching resolution metrics:', error);
      } finally {
        setLoading(false);
      }
    };

    if (selectedCategory === 'volume') {
      fetchVolumeMetrics();
    } else if (selectedCategory === 'group') {
      fetchGroupMetrics();
    } else if (selectedCategory === 'individual') {
      fetchIndividualMetrics();
    } else if (selectedCategory === 'custom') {
      fetchCustomFieldMetrics();
    } else if (selectedCategory === 'resolution') {
      fetchResolutionMetrics();
    }
  }, [selectedCategory, workspaceId, timeRange]);

  const statusColors = {
    open: '#008079',
    closed: '#68868B',
  };

  const priorityColors = {
    urgent: '#C72A1C',
    high: '#2073B7',
    normal: '#16494D',
    low: '#008079',
  };

  const prepareStatusData = () => {
    return Object.entries(volumeMetrics.byStatus).map(([status, value]) => ({
      id: status,
      label: status.replace('_', ' '),
      value,
      color: statusColors[status]
    }));
  };

  const preparePriorityData = () => {
    return Object.entries(volumeMetrics.byPriority).map(([priority, value]) => ({
      id: priority,
      label: priority,
      value,
      color: priorityColors[priority]
    }));
  };

  const pieChartCommonProps = {
    margin: { top: 40, right: 80, bottom: 40, left: 80 },
    animate: true,
    activeOuterRadiusOffset: 8,
    cornerRadius: 3,
    arcLinkLabelsColor: { from: 'color' },
    arcLinkLabelsThickness: 2,
    arcLabelsTextColor: '#ffffff',
    arcLinkLabel: d => `${d.label} (${d.value})`,
    arcLinkLabelsSkipAngle: 10,
    arcLinkLabelsDiagonalLength: 16,
    arcLinkLabelsStraightLength: 24,
    arcLinkLabelsTextOffset: 6,
    arcLabelsSkipAngle: 10,
    legends: [
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
    ]
  };

  const prepareGroupBarData = () => {
    console.log('Preparing group bar data...');
    const data = groupMetrics.groups.map(group => ({
      name: group.name,
      'Open Tickets': groupMetrics.openVsClosed[group.name]?.open || 0,
      'Closed Tickets': groupMetrics.openVsClosed[group.name]?.closed || 0,
      'Avg. Resolution Time': Number((groupMetrics.resolutionTimeByGroup[group.name] || 0).toFixed(1)),
    }));
    console.log('Bar data:', data);
    return data;
  };

  const prepareIndividualBarData = () => {
    return individualMetrics.users.map(user => ({
      name: `${user.first_name} ${user.last_name}`,
      'Open Tickets': individualMetrics.openVsClosed[user.id]?.open || 0,
      'Closed Tickets': individualMetrics.openVsClosed[user.id]?.closed || 0,
      'Avg. Resolution Time': Number((individualMetrics.resolutionTimeByUser[user.id] || 0).toFixed(1))
    }));
  };

  const renderVolumeContent = () => {
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
                  setTimeRange(newValue);
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

        {/* Overview Cards */}
        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Total Tickets
              </Typography>
              <Typography variant="h3" color="primary.main">
                {volumeMetrics.total}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {timeRange === 'all' ? 'All time' : `Last ${timeRange.replace('d', ' days')}`}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Open Tickets
              </Typography>
              <Typography variant="h3" color="primary.main">
                {volumeMetrics.byStatus.open}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {timeRange === 'all' ? 'All time' : `Last ${timeRange.replace('d', ' days')}`}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Avg. Resolution Time
              </Typography>
              <Typography variant="h3" color="primary.main">
                {volumeMetrics.averageResolutionTime.toFixed(1)}d
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {timeRange === 'all' ? 'All time' : `Last ${timeRange.replace('d', ' days')}`}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Resolved (Last 7d)
              </Typography>
              <Typography variant="h3" color="primary.main">
                {volumeMetrics.resolvedLastWeek}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Last 7 days
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Status Distribution */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Status Distribution
              </Typography>
              <Box sx={{ height: 300 }}>
                <ResponsivePie
                  data={prepareStatusData()}
                  colors={{ datum: 'data.color' }}
                  {...pieChartCommonProps}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Priority Distribution */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Priority Distribution
              </Typography>
              <Box sx={{ height: 300 }}>
                <ResponsivePie
                  data={preparePriorityData()}
                  colors={{ datum: 'data.color' }}
                  {...pieChartCommonProps}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };

  const renderGroupContent = () => {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      );
    }

    const barData = prepareGroupBarData();

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
                  setTimeRange(newValue);
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
        {groupMetrics.groups.map(group => (
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
                      {groupMetrics.ticketsByGroup[group.name] || 0}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Open Tickets
                    </Typography>
                    <Typography variant="h4" color="primary.main">
                      {groupMetrics.openVsClosed[group.name]?.open || 0}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Avg. Resolution Time
                    </Typography>
                    <Typography variant="h4" color="primary.main">
                      {(groupMetrics.resolutionTimeByGroup[group.name] || 0).toFixed(1)}d
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
                    data={barData}
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
  };

  const renderIndividualContent = () => {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      );
    }

    const barData = prepareIndividualBarData();

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
                  setTimeRange(newValue);
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
        {individualMetrics.users.map(user => (
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
                      {individualMetrics.currentWorkload[user.id] || 0}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Total Resolved
                    </Typography>
                    <Typography variant="h4" color="primary.main">
                      {individualMetrics.openVsClosed[user.id]?.closed || 0}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Avg. Resolution Time
                    </Typography>
                    <Typography variant="h4" color="primary.main">
                      {(individualMetrics.resolutionTimeByUser[user.id] || 0).toFixed(1)}d
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
                    data={barData}
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
  };

  const renderCustomFieldContent = () => {
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
                  setTimeRange(newValue);
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
                    {customFieldMetrics.fields.map((field) => (
                      <TableRow key={field.id}>
                        <TableCell>{field.name}</TableCell>
                        <TableCell>{field.type}</TableCell>
                        <TableCell align="right">{customFieldMetrics.usage[field.id]?.total || 0}</TableCell>
                        <TableCell align="right">{customFieldMetrics.usage[field.id]?.percentage || 0}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Value Distribution Charts */}
        {customFieldMetrics.fields
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
                        data={customFieldMetrics.valueDistribution[field.id] || []}
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
        {customFieldMetrics.fields.map(field => (
          <Grid item xs={12} key={`trend-${field.id}`}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {field.name} Usage Trend
                </Typography>
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer>
                    <BarChart
                      data={customFieldMetrics.trends[field.id] || []}
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
  };

  const renderResolutionContent = () => {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      );
    }

    // Prepare data for resolution type distribution pie chart
    const resolutionTypeData = Object.values(resolutionMetrics.byType).map(({ name, count }) => ({
      id: name,
      label: name,
      value: count
    }));

    // Prepare data for average resolution time chart
    const resolutionTimeData = Object.values(resolutionMetrics.averageTimeByType).map(({ name, time }) => ({
      name: name,
      time: Number(time.toFixed(1))
    }));

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
                  setTimeRange(newValue);
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
                {resolutionMetrics.firstContactResolution.percentage}%
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {resolutionMetrics.firstContactResolution.count} tickets
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
                {Object.values(resolutionMetrics.byType).reduce((sum, { count }) => sum + count, 0)}
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
                    data={resolutionMetrics.trends}
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
                    {resolutionMetrics.resolutions.map((resolution, index) => (
                      <Bar
                        key={resolution.id}
                        dataKey={resolution.name}
                        stackId="a"
                        fill={`hsl(${index * (360 / resolutionMetrics.resolutions.length)}, 70%, 50%)`}
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
  };

  const categories = [
    { id: 'volume', label: 'Ticket Volume & Status', icon: <VolumeIcon /> },
    { id: 'group', label: 'Group Performance', icon: <GroupIcon /> },
    { id: 'individual', label: 'Individual Performance', icon: <PersonIcon /> },
    { id: 'custom', label: 'Custom Field Analytics', icon: <CustomFieldIcon /> },
    { id: 'resolution', label: 'Resolution Analysis', icon: <ResolutionIcon /> },
  ];

  const renderContent = () => {
    switch (selectedCategory) {
      case 'volume':
        return renderVolumeContent();
      case 'group':
        return renderGroupContent();
      case 'individual':
        return renderIndividualContent();
      case 'custom':
        return renderCustomFieldContent();
      case 'resolution':
        return renderResolutionContent();
      default:
        return null;
    }
  };

  return (
    <Box sx={{ display: 'flex', height: '100%' }}>
      {/* Sidebar */}
      <Paper sx={{ width: 240, borderRadius: 0 }}>
        <List>
          {categories.map((category) => (
            <ListItem key={category.id} disablePadding>
              <ListItemButton
                selected={selectedCategory === category.id}
                onClick={() => setSelectedCategory(category.id)}
                sx={{
                  '&.Mui-selected': {
                    backgroundColor: 'primary.main',
                    color: 'white',
                    '&:hover': {
                      backgroundColor: 'primary.dark',
                    },
                    '& .MuiListItemIcon-root': {
                      color: 'white',
                    },
                  },
                }}
              >
                <ListItemIcon sx={{ color: selectedCategory === category.id ? 'white' : 'inherit' }}>
                  {category.icon}
                </ListItemIcon>
                <ListItemText primary={category.label} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Paper>

      {/* Main Content */}
      <Box sx={{ flexGrow: 1, p: 4 }}>
        <Typography variant="h4" component="h1" sx={{ color: 'primary.main', fontWeight: 600, mb: 4 }}>
          {categories.find(c => c.id === selectedCategory)?.label}
        </Typography>
        {renderContent()}
      </Box>
    </Box>
  );
}

export default Analytics; 