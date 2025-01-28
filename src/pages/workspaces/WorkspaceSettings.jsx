/**
 * WorkspaceSettings Component
 * 
 * A comprehensive settings management interface for workspace configuration.
 * Provides multiple specialized settings sections with role-based access control.
 * 
 * Main Features:
 * - General Settings:
 *   - Workspace name management
 *   - Workspace deletion
 *   - Basic configuration
 * 
 * - Team Management:
 *   - Member role assignment
 *   - Group membership control
 *   - Member removal
 *   - Role-based permissions
 * 
 * - Custom Fields:
 *   - Field type configuration:
 *     - Dropdown fields
 *     - Checkbox fields
 *     - Text fields
 *     - Multiline text
 *     - Multi-select fields
 *   - Field options management
 *   - Field ordering
 * 
 * - Ticket Configuration:
 *   - Topics management
 *   - Types configuration
 *   - Tags system
 *   - Resolution options
 *   - General ticket settings
 * 
 * Component Structure:
 * - Main Settings Router
 * - Settings Sidebar Navigation
 * - Individual Settings Sections:
 *   - GeneralSettings
 *   - TeamSettings
 *   - GroupsSettings
 *   - CustomFieldsSettings
 *   - TopicsSettings
 *   - TypesSettings
 *   - TagsSettings
 *   - ConfigurationSettings
 *   - ResolutionsSettings
 * 
 * State Management:
 * - Settings data persistence
 * - Form state handling
 * - Loading states
 * - Error management
 * 
 * Database Interactions:
 * - Settings CRUD operations
 * - Batch updates
 * - Data validation
 * - Relationship management
 * 
 * Security Features:
 * - Role-based access control
 * - Permission validation
 * - Secure data operations
 * 
 * UI/UX Features:
 * - Intuitive navigation
 * - Form validation
 * - Real-time updates
 * - Confirmation dialogs
 * - Error feedback
 * 
 * Helper Functions:
 * - Field type utilities
 * - Icon mapping
 * - Data formatting
 * - Validation helpers
 */

import React, { useState, useEffect } from 'react';
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
import CreateCustomFieldSettings from './settings/tickets/configuration/CreateCustomFieldSettings';
import DropdownFieldConfig from './settings/tickets/configuration/DropdownFieldConfig';
import CheckboxFieldConfig from './settings/tickets/configuration/CheckboxFieldConfig';
import TextFieldConfig from './settings/tickets/configuration/TextFieldConfig';
import MultilineFieldConfig from './settings/tickets/configuration/MultilineFieldConfig';
import MultiSelectFieldConfig from './settings/tickets/configuration/MultiSelectFieldConfig';

// Import the separated settings components
import GeneralSettings from './settings/GeneralSettings';
import TeamSettings from './settings/TeamSettings';
import GroupsSettings from './settings/GroupsSettings';
import CustomFieldsSettings from './settings/tickets/CustomFieldsSettings';
import TopicsSettings from './settings/tickets/TopicsSettings';
import TypesSettings from './settings/tickets/TypesSettings';
import TagsSettings from './settings/tickets/TagsSettings';
import ConfigurationSettings from './settings/tickets/ConfigurationSettings';
import ResolutionsSettings from './settings/tickets/ResolutionsSettings';

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
          <Route path="/tickets/topics" element={<TopicsSettings />} />
          <Route path="/tickets/types" element={<TypesSettings />} />
          <Route path="/tickets/tags" element={<TagsSettings />} />
          <Route path="/tickets/configuration" element={<ConfigurationSettings />} />
          <Route path="/tickets/resolutions" element={<ResolutionsSettings />} />
        </Routes>
      </Box>
    </Box>
  );
}

export default WorkspaceSettings; 