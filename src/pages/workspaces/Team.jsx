/**
 * Team Component
 * 
 * A comprehensive team directory interface displaying all workspace members
 * and their associated roles and group memberships.
 * 
 * Features:
 * - Member Directory:
 *   - Complete member listing
 *   - Role visualization
 *   - Group membership display
 *   - Search functionality
 * 
 * - Data Display:
 *   - Member names and emails
 *   - Role indicators with color coding
 *   - Group membership chips
 *   - Interactive table rows
 * 
 * - Search Capabilities:
 *   - Real-time filtering
 *   - Name and email search
 *   - Empty state handling
 * 
 * Data Management:
 * - Member Data:
 *   - Basic user information
 *   - Workspace roles
 *   - Group associations
 * 
 * - Group Data:
 *   - Group names and IDs
 *   - Workspace association
 *   - Membership tracking
 * 
 * Database Interactions:
 * - Fetches workspace memberships
 * - Retrieves user details
 * - Loads group memberships
 * - Combines related data
 * 
 * UI Features:
 * - Material-UI table layout
 * - Role-based chip colors
 * - Interactive row highlighting
 * - Responsive design
 * - Loading states
 * - Error handling
 * 
 * Navigation:
 * - Click-through to member details
 * - Workspace context preservation
 * 
 * Error Handling:
 * - Loading state indication
 * - Error message display
 * - Graceful data fallbacks
 */

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Alert,
  Paper,
} from '@mui/material';

function Team() {
  const navigate = useNavigate();
  const { workspaceId } = useParams();
  const [members, setMembers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch members with their details
      const { data: membersData, error: membersError } = await supabase
        .from('workspace_memberships')
        .select(`
          id,
          role,
          user_id,
          users (
            id,
            email,
            first_name,
            last_name
          )
        `)
        .eq('workspace_id', workspaceId);

      if (membersError) throw membersError;

      // Fetch group memberships for each user
      const { data: groupMembershipsData, error: groupMembershipsError } = await supabase
        .from('group_memberships')
        .select(`
          group_id,
          user_id,
          groups!inner (
            id,
            name,
            workspace_id
          )
        `)
        .eq('groups.workspace_id', workspaceId);

      if (groupMembershipsError) throw groupMembershipsError;

      // Fetch groups for the workspace
      const { data: groupsData, error: groupsError } = await supabase
        .from('groups')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('name');

      if (groupsError) throw groupsError;

      // Combine the data
      const membersWithGroups = membersData.map(member => ({
        ...member,
        group_memberships: groupMembershipsData.filter(gm => gm.user_id === member.user_id)
      }));

      setMembers(membersWithGroups);
      setGroups(groupsData);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [workspaceId]);

  const filteredMembers = members.filter(member => {
    const searchLower = searchQuery.toLowerCase();
    const fullName = `${member.users.first_name} ${member.users.last_name}`.toLowerCase();
    const email = member.users.email.toLowerCase();
    
    return fullName.includes(searchLower) || email.includes(searchLower);
  });

  if (loading) {
    return (
      <Box sx={{ p: 4 }}>
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" component="h1" sx={{ color: 'primary.main', fontWeight: 600, mb: 4 }}>
        Team Directory
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Card>
        <CardContent>
          <TextField
            fullWidth
            label="Search members"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or email"
            sx={{ mb: 3 }}
          />

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Groups</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredMembers.map((member) => (
                  <TableRow 
                    key={member.id}
                    onClick={() => navigate(`/workspaces/${workspaceId}/team/${member.user_id}`)}
                    sx={{ 
                      cursor: 'pointer',
                      '&:hover': {
                        backgroundColor: 'action.hover',
                      },
                    }}
                  >
                    <TableCell>
                      {member.users.first_name} {member.users.last_name}
                    </TableCell>
                    <TableCell>{member.users.email}</TableCell>
                    <TableCell>
                      <Chip 
                        label={member.role} 
                        color={
                          member.role === 'owner' 
                            ? 'error' 
                            : member.role === 'admin' 
                              ? 'warning' 
                              : 'default'
                        }
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {member.group_memberships?.map((gm, index) => {
                        const group = groups.find(g => g.id === gm.group_id);
                        return group ? (
                          <Chip
                            key={group.id}
                            label={group.name}
                            size="small"
                            sx={{ mr: 0.5, mb: 0.5 }}
                          />
                        ) : null;
                      })}
                    </TableCell>
                  </TableRow>
                ))}
                {filteredMembers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      <Typography variant="body2" sx={{ py: 2 }}>
                        No members found matching your search.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
}

export default Team; 