import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import {
  Box,
  Typography,
  Button,
  Card,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';

function MacroList() {
  const navigate = useNavigate();
  const { workspaceId } = useParams();
  const [macros, setMacros] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMacros = async () => {
      try {
        const { data, error } = await supabase
          .from('tickets_macro')
          .select(`
            *,
            requestor:requestor_id(first_name, last_name),
            assignee:assignee_id(first_name, last_name),
            group:group_id(name),
            type:type_id(name),
            topic:topic_id(name)
          `)
          .eq('workspace_id', workspaceId);

        if (error) throw error;

        const formattedMacros = data.map(macro => ({
          ...macro,
          requestor_name: macro.requestor ? `${macro.requestor.first_name} ${macro.requestor.last_name}` : '-',
          assignee_name: macro.assignee ? `${macro.assignee.first_name} ${macro.assignee.last_name}` : '-',
          group_name: macro.group?.name || '-',
          type_name: macro.type?.name || '-',
          topic_name: macro.topic?.name || '-',
        }));

        setMacros(formattedMacros);
      } catch (error) {
        console.error('Error fetching macros:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMacros();
  }, [workspaceId]);

  const handleDelete = async (id) => {
    try {
      const { error } = await supabase
        .from('tickets_macro')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setMacros(macros.filter(macro => macro.id !== id));
    } catch (error) {
      console.error('Error deleting macro:', error);
    }
  };

  const columns = [
    { 
      field: 'subject', 
      headerName: 'Subject Template', 
      flex: 1,
      minWidth: 200,
    },
    { 
      field: 'priority', 
      headerName: 'Priority',
      width: 120,
      renderCell: (params) => (
        <Box
          sx={{
            textTransform: 'capitalize',
          }}
        >
          {params.value}
        </Box>
      ),
    },
    { 
      field: 'group_name', 
      headerName: 'Default Group',
      width: 150,
    },
    { 
      field: 'type_name', 
      headerName: 'Type',
      width: 150,
    },
    { 
      field: 'topic_name', 
      headerName: 'Topic',
      width: 150,
    },
    { 
      field: 'requestor_name', 
      headerName: 'Default Requestor',
      width: 200,
    },
    { 
      field: 'assignee_name', 
      headerName: 'Default Assignee',
      width: 200,
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      sortable: false,
      renderCell: (params) => (
        <Box>
          <Tooltip title="Edit">
            <IconButton
              onClick={() => navigate(`edit/${params.row.id}`)}
              size="small"
            >
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton
              onClick={() => handleDelete(params.row.id)}
              size="small"
              color="error"
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 4 
      }}>
        <Typography 
          variant="h4" 
          component="h1" 
          sx={{ 
            color: 'primary.main',
            fontWeight: 600
          }}
        >
          Ticket Macros
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('create')}
          sx={{
            backgroundColor: 'primary.main',
            '&:hover': {
              backgroundColor: 'primary.dark',
            }
          }}
        >
          Create Macro
        </Button>
      </Box>

      <Card sx={{ mb: 4 }}>
        <DataGrid
          rows={macros}
          columns={columns}
          pageSize={10}
          rowsPerPageOptions={[10, 25, 50]}
          disableSelectionOnClick
          loading={loading}
          autoHeight
          sx={{
            '& .MuiDataGrid-row': {
              cursor: 'pointer',
              '&:hover': {
                backgroundColor: 'primary.light',
              },
            },
            '& .MuiDataGrid-columnHeaders': {
              backgroundColor: 'primary.light',
              color: 'primary.main',
            },
            '& .MuiDataGrid-cell': {
              borderColor: 'custom.lightGray',
            },
            '& .MuiDataGrid-footerContainer': {
              borderTop: 'none',
              backgroundColor: 'background.paper',
            },
          }}
        />
      </Card>
    </Box>
  );
}

export default MacroList; 