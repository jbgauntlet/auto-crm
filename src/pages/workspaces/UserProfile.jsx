import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Avatar,
  Chip,
  Grid,
  Alert,
} from '@mui/material';

function UserProfile() {
  const { workspaceId, userId } = useParams();
  const [user, setUser] = useState(null);
  const [workspaceMembership, setWorkspaceMembership] = useState(null);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch user details
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .single();

        if (userError) throw userError;

        // Fetch workspace membership
        const { data: membershipData, error: membershipError } = await supabase
          .from('workspace_memberships')
          .select('*')
          .eq('workspace_id', workspaceId)
          .eq('user_id', userId)
          .single();

        if (membershipError) throw membershipError;

        // Fetch user's groups in this workspace
        const { data: groupsData, error: groupsError } = await supabase
          .from('group_memberships')
          .select(`
            group_id,
            groups!inner (
              id,
              name,
              workspace_id
            )
          `)
          .eq('user_id', userId)
          .eq('groups.workspace_id', workspaceId);

        if (groupsError) throw groupsError;

        setUser(userData);
        setWorkspaceMembership(membershipData);
        setGroups(groupsData);
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [workspaceId, userId]);

  if (loading) {
    return (
      <Box sx={{ p: 4 }}>
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  if (!user || !workspaceMembership) {
    return (
      <Box sx={{ p: 4 }}>
        <Typography>User not found</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Card>
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4} sx={{ textAlign: 'center' }}>
              <Avatar
                sx={{
                  width: 120,
                  height: 120,
                  margin: '0 auto',
                  mb: 2,
                  fontSize: '3rem',
                  backgroundColor: 'primary.main',
                }}
              >
                {user.first_name?.[0]}{user.last_name?.[0]}
              </Avatar>
              <Typography variant="h5" sx={{ mb: 1 }}>
                {user.first_name} {user.last_name}
              </Typography>
              <Chip 
                label={workspaceMembership.role}
                color={
                  workspaceMembership.role === 'owner' 
                    ? 'error' 
                    : workspaceMembership.role === 'admin' 
                      ? 'warning' 
                      : 'default'
                }
              />
            </Grid>
            <Grid item xs={12} md={8}>
              <Typography variant="h6" sx={{ mb: 2 }}>Contact Information</Typography>
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  Email
                </Typography>
                <Typography>{user.email}</Typography>
              </Box>
              {user.phone && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" color="text.secondary">
                    Phone
                  </Typography>
                  <Typography>{user.phone}</Typography>
                </Box>
              )}
              <Typography variant="h6" sx={{ mb: 2 }}>Groups</Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {groups.map((gm) => (
                  <Chip
                    key={gm.groups.id}
                    label={gm.groups.name}
                    size="small"
                  />
                ))}
                {groups.length === 0 && (
                  <Typography variant="body2" color="text.secondary">
                    Not a member of any groups
                  </Typography>
                )}
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
}

export default UserProfile; 