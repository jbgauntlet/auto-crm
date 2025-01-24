import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { ResponsivePie } from '@nivo/pie';
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

function VolumeMetrics({ workspaceId, timeRange, onTimeRangeChange }) {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
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
        const newMetrics = {
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
          newMetrics.averageResolutionTime = totalResolutionTime / resolvedTickets.length / (1000 * 60 * 60 * 24);
        }

        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        newMetrics.resolvedLastWeek = resolvedTickets.filter(t => 
          new Date(t.resolved_at) > oneWeekAgo
        ).length;

        setMetrics(newMetrics);
      } catch (error) {
        console.error('Error fetching volume metrics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [workspaceId, timeRange]);

  const prepareStatusData = () => {
    return Object.entries(metrics.byStatus).map(([status, value]) => ({
      id: status,
      label: status.replace('_', ' '),
      value,
      color: statusColors[status]
    }));
  };

  const preparePriorityData = () => {
    return Object.entries(metrics.byPriority).map(([priority, value]) => ({
      id: priority,
      label: priority,
      value,
      color: priorityColors[priority]
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

      {/* Overview Cards */}
      <Grid item xs={12} md={6} lg={3}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Total Tickets
            </Typography>
            <Typography variant="h3" color="primary.main">
              {metrics.total}
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
              {metrics.byStatus.open}
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
              {metrics.averageResolutionTime.toFixed(1)}d
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
              {metrics.resolvedLastWeek}
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
}

export default VolumeMetrics; 