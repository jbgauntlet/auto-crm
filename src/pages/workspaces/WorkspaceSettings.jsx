import { useState, useEffect } from 'react';
import { useNavigate, useParams, Routes, Route } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Alert,
  Divider,
  Grid,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  FormControlLabel,
  Checkbox,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ListItemText,
} from '@mui/material';
import WorkspaceSettingsSidebar from '../../components/WorkspaceSettingsSidebar';
import {
  ArrowDropDown as DropdownIcon,
  CheckBox as CheckboxIcon,
  TextFields as TextIcon,
  Notes as MultilineIcon,
  List as MultiSelectIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Settings as SettingsIcon,
  Edit as EditIcon,
} from '@mui/icons-material';

// Import field configuration components
import CreateCustomFieldSettings from './settings/fields/CreateCustomFieldSettings';
import DropdownFieldConfig from './settings/fields/DropdownFieldConfig';
import CheckboxFieldConfig from './settings/fields/CheckboxFieldConfig';
import TextFieldConfig from './settings/fields/TextFieldConfig';
import MultilineFieldConfig from './settings/fields/MultilineFieldConfig';
import MultiSelectFieldConfig from './settings/fields/MultiSelectFieldConfig';

// Helper functions
const getFieldTypeLabel = (type) => {
  switch (type) {
    case 'dropdown':
      return 'Dropdown';
    case 'checkbox':
      return 'Checkbox';
    case 'text':
      return 'Text';
    case 'multiline':
      return 'Multiline Text';
    case 'multiselect':
      return 'Multi-Select';
    default:
      return type;
  }
};

const getFieldTypeIcon = (type) => {
  switch (type) {
    case 'dropdown':
      return <DropdownIcon />;
    case 'checkbox':
      return <CheckboxIcon />;
    case 'text':
      return <TextIcon />;
    case 'multiline':
      return <MultilineIcon />;
    case 'multiselect':
      return <MultiSelectIcon />;
    default:
      return null;
  }
};

function GeneralSettings({ workspace, onUpdate, error, loading }) {
  const [name, setName] = useState(workspace?.name || '');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const handleSave = async () => {
    try {
      setSaving(true);
      setSaveError(null);

      const { error } = await supabase
        .from('workspaces')
        .update({ name: name.trim() })
        .eq('id', workspace.id);

      if (error) throw error;

      if (onUpdate) onUpdate({ ...workspace, name: name.trim() });
    } catch (error) {
      console.error('Error saving workspace:', error);
      setSaveError(error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 4 }}>
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography
        variant="h4"
        component="h1"
        sx={{
          color: 'primary.main',
          fontWeight: 600,
          mb: 4,
        }}
      >
        General Settings
      </Typography>

      {(error || saveError) && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error || saveError}
        </Alert>
      )}

      <Card>
        <CardContent>
          <Box sx={{ maxWidth: 400 }}>
            <TextField
              fullWidth
              label="Workspace Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              sx={{ mb: 3 }}
            />

            <Button
              variant="contained"
              onClick={handleSave}
              disabled={saving || !name.trim() || name.trim() === workspace?.name}
              sx={{
                backgroundColor: 'primary.main',
                '&:hover': {
                  backgroundColor: 'primary.dark',
                },
              }}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </Box>

          <Divider sx={{ my: 4 }} />

          <Typography
            variant="h6"
            component="h2"
            sx={{
              color: 'error.main',
              fontWeight: 600,
              mb: 2,
            }}
          >
            Danger Zone
          </Typography>

          <Button
            variant="outlined"
            color="error"
            onClick={() => {
              // TODO: Add workspace deletion functionality
              // This should include a confirmation dialog
            }}
          >
            Delete Workspace
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
}

function TeamSettings() {
  const { workspaceId } = useParams();
  const [members, setMembers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentUserRole, setCurrentUserRole] = useState(null);
  const [editMember, setEditMember] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [selectedRole, setSelectedRole] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current user's role
      const { data: { user } } = await supabase.auth.getUser();
      const { data: currentMembership, error: currentMembershipError } = await supabase
        .from('workspace_memberships')
        .select('role')
        .eq('workspace_id', workspaceId)
        .eq('user_id', user.id)
        .single();

      if (currentMembershipError) throw currentMembershipError;
      setCurrentUserRole(currentMembership.role);

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

  const handleEditClick = async (member) => {
    try {
      // Fetch current group memberships for the user
      const { data: groupMemberships, error: groupError } = await supabase
        .from('group_memberships')
        .select('group_id')
        .eq('user_id', member.user_id);

      if (groupError) throw groupError;

      setEditMember(member);
      setSelectedRole(member.role);
      setSelectedGroups(groupMemberships.map(gm => gm.group_id));
      setEditDialogOpen(true);
    } catch (err) {
      console.error('Error fetching group memberships:', err);
      setError(err.message);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      // Update role
      const { error: roleError } = await supabase
        .from('workspace_memberships')
        .update({ role: selectedRole })
        .eq('id', editMember.id);

      if (roleError) throw roleError;

      // Delete existing group memberships
      const { error: deleteError } = await supabase
        .from('group_memberships')
        .delete()
        .eq('user_id', editMember.user_id);

      if (deleteError) throw deleteError;

      // Add new group memberships
      if (selectedGroups.length > 0) {
        const { error: groupError } = await supabase
          .from('group_memberships')
          .insert(
            selectedGroups.map(groupId => ({
              user_id: editMember.user_id,
              group_id: groupId
            }))
          );

        if (groupError) throw groupError;
      }

      setEditDialogOpen(false);
      fetchData();
    } catch (err) {
      console.error('Error saving changes:', err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (member) => {
    setMemberToDelete(member);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      const { error: deleteError } = await supabase
        .from('workspace_memberships')
        .delete()
        .eq('id', memberToDelete.id);

      if (deleteError) throw deleteError;

      setDeleteDialogOpen(false);
      setMemberToDelete(null);
      fetchData();
    } catch (err) {
      console.error('Error deleting member:', err);
      setError(err.message);
    }
  };

  const filteredMembers = members.filter(member => {
    const searchLower = searchQuery.toLowerCase();
    const fullName = `${member.users.first_name} ${member.users.last_name}`.toLowerCase();
    const email = member.users.email.toLowerCase();
    
    return fullName.includes(searchLower) || email.includes(searchLower);
  });

  const getAvailableRoles = () => {
    if (currentUserRole === 'owner') {
      return ['owner', 'admin', 'agent'];
    } else if (currentUserRole === 'admin') {
      return ['admin', 'agent'];
    }
    return [];
  };

  if (loading) {
    return (
      <Box sx={{ p: 4 }}>
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" sx={{ color: 'primary.main', fontWeight: 600, mb: 4 }}>
        Team Settings
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Card sx={{ mb: 4 }}>
        <CardContent>
          <TextField
            fullWidth
            label="Search members"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or email"
            sx={{ mb: 3 }}
          />

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Groups</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredMembers.map((member) => (
                  <TableRow key={member.id}>
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
                    <TableCell align="right">
                      <IconButton
                        onClick={() => handleEditClick(member)}
                        disabled={
                          currentUserRole === 'admin' && member.role === 'owner'
                        }
                        sx={{ color: 'primary.main' }}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        onClick={() => handleDeleteClick(member)}
                        disabled={
                          currentUserRole === 'admin' && member.role === 'owner'
                        }
                        sx={{ color: 'error.main' }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Edit Member Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Edit Member: {editMember?.users.first_name} {editMember?.users.last_name}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Role</InputLabel>
              <Select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                label="Role"
              >
                {getAvailableRoles().map((role) => (
                  <MenuItem key={role} value={role}>
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Groups</InputLabel>
              <Select
                multiple
                value={selectedGroups}
                onChange={(e) => setSelectedGroups(e.target.value)}
                label="Groups"
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((groupId) => (
                      <Chip
                        key={groupId}
                        label={groups.find(g => g.id === groupId)?.name}
                        size="small"
                      />
                    ))}
                  </Box>
                )}
              >
                {groups.map((group) => (
                  <MenuItem key={group.id} value={group.id}>
                    <Checkbox checked={selectedGroups.indexOf(group.id) > -1} />
                    <ListItemText primary={group.name} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={saving}
            sx={{
              backgroundColor: 'primary.main',
              '&:hover': {
                backgroundColor: 'primary.dark',
              },
            }}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Remove Team Member</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to remove {memberToDelete?.users.first_name} {memberToDelete?.users.last_name} from the workspace? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Remove
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

function GroupsSettings() {
  return (
    <Box>
      <Typography variant="h4" component="h1" sx={{ color: 'primary.main', fontWeight: 600, mb: 4 }}>
        Groups Settings
      </Typography>
      {/* TODO: Add groups settings content */}
    </Box>
  );
}

function CustomFieldsSettings() {
  const navigate = useNavigate();
  const { workspaceId } = useParams();
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [fieldToDelete, setFieldToDelete] = useState(null);

  const fetchFields = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: customFields, error: fieldsError } = await supabase
        .from('ticket_custom_fields')
        .select(`
          *,
          ticket_custom_field_options (
            id,
            name
          )
        `)
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });

      if (fieldsError) throw fieldsError;

      setFields(customFields);
    } catch (err) {
      console.error('Error fetching custom fields:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFields();
  }, [workspaceId]);

  const handleDeleteClick = (field) => {
    setFieldToDelete(field);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      const { error: deleteError } = await supabase
        .from('ticket_custom_fields')
        .delete()
        .eq('id', fieldToDelete.id);

      if (deleteError) throw deleteError;

      setDeleteDialogOpen(false);
      setFieldToDelete(null);
      fetchFields();
    } catch (err) {
      console.error('Error deleting field:', err);
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 4 }}>
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 4,
      }}>
        <Typography variant="h4" component="h1" sx={{ color: 'primary.main', fontWeight: 600 }}>
          Custom Fields
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate(`/workspaces/${workspaceId}/workspace-settings/tickets/create-field`)}
          sx={{
            backgroundColor: 'primary.main',
            '&:hover': {
              backgroundColor: 'primary.dark',
            }
          }}
        >
          Create Custom Field
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Type</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Options</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {fields.map((field) => (
              <TableRow key={field.id}>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {getFieldTypeIcon(field.type)}
                    {getFieldTypeLabel(field.type)}
                  </Box>
                </TableCell>
                <TableCell>{field.name}</TableCell>
                <TableCell>
                  {field.ticket_custom_field_options?.length > 0 
                    ? field.ticket_custom_field_options.map(opt => opt.name).join(', ')
                    : '-'
                  }
                </TableCell>
                <TableCell align="right">
                  <IconButton
                    onClick={() => navigate(`/workspaces/${workspaceId}/workspace-settings/tickets/custom-fields/${field.id}`)}
                    sx={{ color: 'primary.main' }}
                  >
                    <SettingsIcon />
                  </IconButton>
                  <IconButton
                    onClick={() => handleDeleteClick(field)}
                    sx={{ color: 'error.main' }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {fields.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  <Typography variant="body2" sx={{ py: 2 }}>
                    No custom fields found. Click the Create Custom Field button to add one.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Custom Field</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the custom field "{fieldToDelete?.name}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

function CustomFieldSettings() {
  const navigate = useNavigate();
  const { workspaceId, fieldId } = useParams();
  const [field, setField] = useState(null);
  const [fieldName, setFieldName] = useState('');
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchField = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data: fieldData, error: fieldError } = await supabase
          .from('ticket_custom_fields')
          .select(`
            *,
            ticket_custom_field_options (
              id,
              name
            )
          `)
          .eq('id', fieldId)
          .single();

        if (fieldError) throw fieldError;

        setField(fieldData);
        setFieldName(fieldData.name);
        setOptions(fieldData.ticket_custom_field_options.map(opt => ({
          id: opt.id,
          name: opt.name
        })));
      } catch (err) {
        console.error('Error fetching field:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchField();
  }, [fieldId]);

  const handleAddOption = () => {
    setOptions([...options, { id: null, name: '' }]);
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = { ...newOptions[index], name: value };
    setOptions(newOptions);
  };

  const handleRemoveOption = (index) => {
    if (options.length > 1) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      // Validate inputs
      if (!fieldName.trim()) {
        throw new Error('Field name is required');
      }

      const nonEmptyOptions = options.filter(opt => opt.name.trim());
      if (field.type === 'dropdown' && nonEmptyOptions.length === 0) {
        throw new Error('At least one option is required');
      }

      // Update field name
      const { error: fieldError } = await supabase
        .from('ticket_custom_fields')
        .update({ name: fieldName.trim() })
        .eq('id', fieldId);

      if (fieldError) throw fieldError;

      // Handle options if it's a dropdown field
      if (field.type === 'dropdown') {
        // First, delete all existing options
        const { error: deleteError } = await supabase
          .from('ticket_custom_field_options')
          .delete()
          .eq('ticket_field_id', fieldId);

        if (deleteError) throw deleteError;

        // Then insert all current options
        const { error: insertError } = await supabase
          .from('ticket_custom_field_options')
          .insert(
            nonEmptyOptions.map(option => ({
              name: option.name.trim(),
              ticket_field_id: fieldId
            }))
          );

        if (insertError) throw insertError;
      }

      navigate(`/workspaces/${workspaceId}/workspace-settings/tickets/custom-fields`);
    } catch (err) {
      console.error('Error saving field:', err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 4 }}>
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  if (!field) {
    return (
      <Box sx={{ p: 4 }}>
        <Typography>Field not found</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" sx={{ color: 'primary.main', fontWeight: 600, mb: 4 }}>
        Edit {getFieldTypeLabel(field.type)} Field
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Card>
        <CardContent>
          <Box sx={{ maxWidth: 600 }}>
            <TextField
              fullWidth
              label="Field Name"
              value={fieldName}
              onChange={(e) => setFieldName(e.target.value)}
              sx={{ mb: 4 }}
              required
            />

            {field.type === 'dropdown' && (
              <>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Options
                </Typography>

                {options.map((option, index) => (
                  <Box key={index} sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <TextField
                      fullWidth
                      label={`Option ${index + 1}`}
                      value={option.name}
                      onChange={(e) => handleOptionChange(index, e.target.value)}
                      required={index === 0}
                    />
                    <IconButton 
                      onClick={() => handleRemoveOption(index)}
                      disabled={options.length === 1}
                      sx={{ 
                        color: 'error.main',
                        visibility: options.length === 1 ? 'hidden' : 'visible'
                      }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                ))}

                <Button
                  startIcon={<AddIcon />}
                  onClick={handleAddOption}
                  sx={{ mb: 4 }}
                >
                  Add Option
                </Button>
              </>
            )}

            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                onClick={handleSave}
                disabled={saving || !fieldName.trim() || (field.type === 'dropdown' && !options[0]?.name.trim())}
                sx={{
                  backgroundColor: 'primary.main',
                  '&:hover': {
                    backgroundColor: 'primary.dark',
                  },
                }}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>

              <Button
                variant="outlined"
                onClick={() => navigate(`/workspaces/${workspaceId}/workspace-settings/tickets/custom-fields`)}
              >
                Cancel
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}

function TopicsSettings() {
  const navigate = useNavigate();
  const { workspaceId } = useParams();
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newTopic, setNewTopic] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [topicToDelete, setTopicToDelete] = useState(null);

  const fetchTopics = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: topics, error: topicsError } = await supabase
        .from('ticket_topic_options')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('name');

      if (topicsError) throw topicsError;

      setTopics(topics);
    } catch (err) {
      console.error('Error fetching topics:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTopics();
  }, [workspaceId]);

  const handleAddTopic = async () => {
    try {
      setSaving(true);
      setError(null);

      if (!newTopic.trim()) {
        throw new Error('Topic name is required');
      }

      const { error: createError } = await supabase
        .from('ticket_topic_options')
        .insert([{
          name: newTopic.trim(),
          workspace_id: workspaceId
        }]);

      if (createError) throw createError;

      setNewTopic('');
      fetchTopics();
    } catch (err) {
      console.error('Error adding topic:', err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (topic) => {
    setTopicToDelete(topic);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      const { error: deleteError } = await supabase
        .from('ticket_topic_options')
        .delete()
        .eq('id', topicToDelete.id);

      if (deleteError) throw deleteError;

      setDeleteDialogOpen(false);
      setTopicToDelete(null);
      fetchTopics();
    } catch (err) {
      console.error('Error deleting topic:', err);
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 4 }}>
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" sx={{ color: 'primary.main', fontWeight: 600, mb: 4 }}>
        Topics
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Card>
        <CardContent>
          <Box sx={{ maxWidth: 600 }}>
            <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
              <TextField
                fullWidth
                label="New Topic"
                value={newTopic}
                onChange={(e) => setNewTopic(e.target.value)}
                placeholder="e.g., Bug Report, Feature Request"
              />
              <Button
                variant="contained"
                onClick={handleAddTopic}
                disabled={saving || !newTopic.trim()}
                sx={{
                  backgroundColor: 'primary.main',
                  '&:hover': {
                    backgroundColor: 'primary.dark',
                  },
                  whiteSpace: 'nowrap',
                }}
              >
                Add Topic
              </Button>
            </Box>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Topic Name</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {topics.map((topic) => (
                    <TableRow key={topic.id}>
                      <TableCell>{topic.name}</TableCell>
                      <TableCell align="right">
                        <IconButton
                          onClick={() => handleDeleteClick(topic)}
                          sx={{ color: 'error.main' }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                  {topics.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={2} align="center">
                        <Typography variant="body2" sx={{ py: 2 }}>
                          No topics found. Add your first topic above.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Topic</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the topic "{topicToDelete?.name}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

function TypesSettings() {
  const navigate = useNavigate();
  const { workspaceId } = useParams();
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newType, setNewType] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [typeToDelete, setTypeToDelete] = useState(null);

  const fetchTypes = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: types, error: typesError } = await supabase
        .from('ticket_type_options')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('name');

      if (typesError) throw typesError;

      setTypes(types);
    } catch (err) {
      console.error('Error fetching types:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTypes();
  }, [workspaceId]);

  const handleAddType = async () => {
    try {
      setSaving(true);
      setError(null);

      if (!newType.trim()) {
        throw new Error('Type name is required');
      }

      const { error: createError } = await supabase
        .from('ticket_type_options')
        .insert([{
          name: newType.trim(),
          workspace_id: workspaceId
        }]);

      if (createError) throw createError;

      setNewType('');
      fetchTypes();
    } catch (err) {
      console.error('Error adding type:', err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (type) => {
    setTypeToDelete(type);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      const { error: deleteError } = await supabase
        .from('ticket_type_options')
        .delete()
        .eq('id', typeToDelete.id);

      if (deleteError) throw deleteError;

      setDeleteDialogOpen(false);
      setTypeToDelete(null);
      fetchTypes();
    } catch (err) {
      console.error('Error deleting type:', err);
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 4 }}>
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" sx={{ color: 'primary.main', fontWeight: 600, mb: 4 }}>
        Types
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Card>
        <CardContent>
          <Box sx={{ maxWidth: 600 }}>
            <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
              <TextField
                fullWidth
                label="New Type"
                value={newType}
                onChange={(e) => setNewType(e.target.value)}
                placeholder="e.g., Task, Issue, Enhancement"
              />
              <Button
                variant="contained"
                onClick={handleAddType}
                disabled={saving || !newType.trim()}
                sx={{
                  backgroundColor: 'primary.main',
                  '&:hover': {
                    backgroundColor: 'primary.dark',
                  },
                  whiteSpace: 'nowrap',
                }}
              >
                Add Type
              </Button>
            </Box>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Type Name</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {types.map((type) => (
                    <TableRow key={type.id}>
                      <TableCell>{type.name}</TableCell>
                      <TableCell align="right">
                        <IconButton
                          onClick={() => handleDeleteClick(type)}
                          sx={{ color: 'error.main' }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                  {types.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={2} align="center">
                        <Typography variant="body2" sx={{ py: 2 }}>
                          No types found. Add your first type above.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Type</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the type "{typeToDelete?.name}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

function TagsSettings() {
  const navigate = useNavigate();
  const { workspaceId } = useParams();
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newTag, setNewTag] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [tagToDelete, setTagToDelete] = useState(null);

  const fetchTags = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: tags, error: tagsError } = await supabase
        .from('ticket_tags')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('name');

      if (tagsError) throw tagsError;

      setTags(tags);
    } catch (err) {
      console.error('Error fetching tags:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTags();
  }, [workspaceId]);

  const handleAddTag = async () => {
    try {
      setSaving(true);
      setError(null);

      if (!newTag.trim()) {
        throw new Error('Tag name is required');
      }

      const { error: createError } = await supabase
        .from('ticket_tags')
        .insert([{
          name: newTag.trim(),
          workspace_id: workspaceId
        }]);

      if (createError) throw createError;

      setNewTag('');
      fetchTags();
    } catch (err) {
      console.error('Error adding tag:', err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (tag) => {
    setTagToDelete(tag);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      const { error: deleteError } = await supabase
        .from('ticket_tags')
        .delete()
        .eq('id', tagToDelete.id);

      if (deleteError) throw deleteError;

      setDeleteDialogOpen(false);
      setTagToDelete(null);
      fetchTags();
    } catch (err) {
      console.error('Error deleting tag:', err);
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 4 }}>
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" sx={{ color: 'primary.main', fontWeight: 600, mb: 4 }}>
        Tags
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Card>
        <CardContent>
          <Box sx={{ maxWidth: 600 }}>
            <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
              <TextField
                fullWidth
                label="New Tag"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="e.g., Urgent, High Priority, Backend"
              />
              <Button
                variant="contained"
                onClick={handleAddTag}
                disabled={saving || !newTag.trim()}
                sx={{
                  backgroundColor: 'primary.main',
                  '&:hover': {
                    backgroundColor: 'primary.dark',
                  },
                  whiteSpace: 'nowrap',
                }}
              >
                Add Tag
              </Button>
            </Box>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Tag Name</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tags.map((tag) => (
                    <TableRow key={tag.id}>
                      <TableCell>{tag.name}</TableCell>
                      <TableCell align="right">
                        <IconButton
                          onClick={() => handleDeleteClick(tag)}
                          sx={{ color: 'error.main' }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                  {tags.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={2} align="center">
                        <Typography variant="body2" sx={{ py: 2 }}>
                          No tags found. Add your first tag above.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Tag</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the tag "{tagToDelete?.name}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

function ConfigurationSettings() {
  const { workspaceId } = useParams();
  const [config, setConfig] = useState(null);
  const [customFields, setCustomFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editedConfig, setEditedConfig] = useState(null);
  const [editedFields, setEditedFields] = useState([]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch ticket config
      const { data: configData, error: configError } = await supabase
        .from('ticket_configs')
        .select('*')
        .eq('workspace_id', workspaceId)
        .single();

      if (configError) throw configError;

      // Fetch custom fields
      const { data: fieldsData, error: fieldsError } = await supabase
        .from('ticket_custom_fields')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at');

      if (fieldsError) throw fieldsError;

      setConfig(configData);
      setCustomFields(fieldsData);
      setEditedConfig(configData);
      setEditedFields(fieldsData);
    } catch (err) {
      console.error('Error fetching configuration:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [workspaceId]);

  const handleEdit = () => {
    setIsEditing(true);
    setEditedConfig({ ...config });
    setEditedFields([...customFields]);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedConfig({ ...config });
    setEditedFields([...customFields]);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      // Update ticket config
      const { error: configError } = await supabase
        .from('ticket_configs')
        .update({
          has_resolution: editedConfig.has_resolution,
          has_resolution_notes: editedConfig.has_resolution_notes,
          has_type: editedConfig.has_type,
          has_topic: editedConfig.has_topic,
          has_groups: editedConfig.has_groups,
        })
        .eq('id', config.id);

      if (configError) throw configError;

      // Update custom fields
      for (const field of editedFields) {
        const { error: fieldError } = await supabase
          .from('ticket_custom_fields')
          .update({ is_enabled: field.is_enabled })
          .eq('id', field.id);

        if (fieldError) throw fieldError;
      }

      setConfig(editedConfig);
      setCustomFields(editedFields);
      setIsEditing(false);
    } catch (err) {
      console.error('Error saving configuration:', err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleConfigChange = (field) => (event) => {
    setEditedConfig({
      ...editedConfig,
      [field]: event.target.checked,
    });
  };

  const handleFieldChange = (fieldId) => (event) => {
    setEditedFields(
      editedFields.map((field) =>
        field.id === fieldId
          ? { ...field, is_enabled: event.target.checked }
          : field
      )
    );
  };

  if (loading) {
    return (
      <Box sx={{ p: 4 }}>
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 4,
      }}>
        <Typography variant="h4" component="h1" sx={{ color: 'primary.main', fontWeight: 600 }}>
          Ticket Configuration
        </Typography>
        {!isEditing ? (
          <Button
            variant="contained"
            onClick={handleEdit}
            startIcon={<SettingsIcon />}
            sx={{
              backgroundColor: 'primary.main',
              '&:hover': {
                backgroundColor: 'primary.dark',
              },
            }}
          >
            Edit Configuration
          </Button>
        ) : (
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              onClick={handleCancel}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={saving}
              sx={{
                backgroundColor: 'primary.main',
                '&:hover': {
                  backgroundColor: 'primary.dark',
                },
              }}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </Box>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 3 }}>
            General Settings
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 4 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={editedConfig?.has_resolution ?? false}
                  onChange={handleConfigChange('has_resolution')}
                  disabled={!isEditing}
                />
              }
              label="Enable Resolution Field"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={editedConfig?.has_resolution_notes ?? false}
                  onChange={handleConfigChange('has_resolution_notes')}
                  disabled={!isEditing}
                />
              }
              label="Enable Resolution Notes"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={editedConfig?.has_type ?? false}
                  onChange={handleConfigChange('has_type')}
                  disabled={!isEditing}
                />
              }
              label="Enable Type Field"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={editedConfig?.has_topic ?? false}
                  onChange={handleConfigChange('has_topic')}
                  disabled={!isEditing}
                />
              }
              label="Enable Topic Field"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={editedConfig?.has_groups ?? false}
                  onChange={handleConfigChange('has_groups')}
                  disabled={!isEditing}
                />
              }
              label="Enable Group Assignment"
            />
          </Box>

          <Divider sx={{ my: 4 }} />

          <Typography variant="h6" sx={{ mb: 3 }}>
            Custom Fields
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {editedFields.map((field) => (
              <FormControlLabel
                key={field.id}
                control={
                  <Checkbox
                    checked={field.is_enabled}
                    onChange={handleFieldChange(field.id)}
                    disabled={!isEditing}
                  />
                }
                label={`${field.name} (${getFieldTypeLabel(field.type)})`}
              />
            ))}
            {editedFields.length === 0 && (
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                No custom fields found. Create custom fields to configure them here.
              </Typography>
            )}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}

function ResolutionsSettings() {
  const navigate = useNavigate();
  const { workspaceId } = useParams();
  const [resolutions, setResolutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newResolution, setNewResolution] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [resolutionToDelete, setResolutionToDelete] = useState(null);

  const fetchResolutions = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: resolutions, error: resolutionsError } = await supabase
        .from('ticket_resolution_options')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('name');

      if (resolutionsError) throw resolutionsError;

      setResolutions(resolutions);
    } catch (err) {
      console.error('Error fetching resolutions:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResolutions();
  }, [workspaceId]);

  const handleAddResolution = async () => {
    try {
      setSaving(true);
      setError(null);

      if (!newResolution.trim()) {
        throw new Error('Resolution name is required');
      }

      const { error: createError } = await supabase
        .from('ticket_resolution_options')
        .insert([{
          name: newResolution.trim(),
          workspace_id: workspaceId
        }]);

      if (createError) throw createError;

      setNewResolution('');
      fetchResolutions();
    } catch (err) {
      console.error('Error adding resolution:', err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (resolution) => {
    setResolutionToDelete(resolution);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      const { error: deleteError } = await supabase
        .from('ticket_resolution_options')
        .delete()
        .eq('id', resolutionToDelete.id);

      if (deleteError) throw deleteError;

      setDeleteDialogOpen(false);
      setResolutionToDelete(null);
      fetchResolutions();
    } catch (err) {
      console.error('Error deleting resolution:', err);
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 4 }}>
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" sx={{ color: 'primary.main', fontWeight: 600, mb: 4 }}>
        Resolutions
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Card>
        <CardContent>
          <Box sx={{ maxWidth: 600 }}>
            <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
              <TextField
                fullWidth
                label="New Resolution"
                value={newResolution}
                onChange={(e) => setNewResolution(e.target.value)}
                placeholder="e.g., Fixed, Won't Fix, Duplicate"
              />
              <Button
                variant="contained"
                onClick={handleAddResolution}
                disabled={saving || !newResolution.trim()}
                sx={{
                  backgroundColor: 'primary.main',
                  '&:hover': {
                    backgroundColor: 'primary.dark',
                  },
                  whiteSpace: 'nowrap',
                }}
              >
                Add Resolution
              </Button>
            </Box>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Resolution Name</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {resolutions.map((resolution) => (
                    <TableRow key={resolution.id}>
                      <TableCell>{resolution.name}</TableCell>
                      <TableCell align="right">
                        <IconButton
                          onClick={() => handleDeleteClick(resolution)}
                          sx={{ color: 'error.main' }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                  {resolutions.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={2} align="center">
                        <Typography variant="body2" sx={{ py: 2 }}>
                          No resolutions found. Add your first resolution above.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Resolution</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the resolution "{resolutionToDelete?.name}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

function WorkspaceSettings() {
  const navigate = useNavigate();
  const { workspaceId } = useParams();
  const [workspace, setWorkspace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkPermissionAndFetchData = async () => {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate('/login');
          return;
        }

        // Check if user is owner
        const { data: membership, error: membershipError } = await supabase
          .from('workspace_memberships')
          .select('role')
          .eq('workspace_id', workspaceId)
          .eq('user_id', user.id)
          .single();

        if (membershipError) throw membershipError;

        if (membership.role !== 'owner') {
          navigate(`/workspaces/${workspaceId}`);
          return;
        }

        // Fetch workspace data
        const { data: workspace, error: workspaceError } = await supabase
          .from('workspaces')
          .select('*')
          .eq('id', workspaceId)
          .single();

        if (workspaceError) throw workspaceError;

        setWorkspace(workspace);
      } catch (error) {
        console.error('Error:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    checkPermissionAndFetchData();
  }, [workspaceId, navigate]);

  return (
    <Box sx={{ display: 'flex', height: '100%' }}>
      <WorkspaceSettingsSidebar />
      <Box sx={{ flex: 1, p: 4, overflowY: 'auto' }}>
        <Routes>
          <Route 
            path="/" 
            element={
              <GeneralSettings 
                workspace={workspace} 
                onUpdate={setWorkspace}
                error={error}
                loading={loading}
              />
            } 
          />
          <Route path="/team" element={<TeamSettings />} />
          <Route path="/groups" element={<GroupsSettings />} />
          <Route path="/tickets/custom-fields" element={<CustomFieldsSettings />} />
          <Route path="/tickets/custom-fields/:fieldId" element={<CustomFieldSettings />} />
          <Route path="/tickets/create-field" element={<CreateCustomFieldSettings />} />
          <Route path="/tickets/create-field/dropdown" element={<DropdownFieldConfig />} />
          <Route path="/tickets/create-field/checkbox" element={<CheckboxFieldConfig />} />
          <Route path="/tickets/create-field/text" element={<TextFieldConfig />} />
          <Route path="/tickets/create-field/multiline" element={<MultilineFieldConfig />} />
          <Route path="/tickets/create-field/multiselect" element={<MultiSelectFieldConfig />} />
          <Route path="/tickets/topics" element={<TopicsSettings />} />
          <Route path="/tickets/types" element={<TypesSettings />} />
          <Route path="/tickets/tags" element={<TagsSettings />} />
          <Route path="/tickets/resolutions" element={<ResolutionsSettings />} />
          <Route path="/tickets/configuration" element={<ConfigurationSettings />} />
        </Routes>
      </Box>
    </Box>
  );
}

export default WorkspaceSettings; 