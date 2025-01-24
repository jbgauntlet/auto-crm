import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
} from '@mui/material';
import {
  ArrowDropDown as DropdownIcon,
  CheckBox as CheckboxIcon,
  TextFields as TextIcon,
  Notes as MultilineIcon,
  List as MultiSelectIcon,
} from '@mui/icons-material';

function CreateCustomFieldSettings() {
  const navigate = useNavigate();
  const { workspaceId } = useParams();

  const fieldTypes = [
    {
      type: 'dropdown',
      label: 'Dropdown',
      icon: <DropdownIcon sx={{ fontSize: 40 }} />,
      description: 'Single selection from a list of options',
    },
    {
      type: 'checkbox',
      label: 'Checkbox',
      icon: <CheckboxIcon sx={{ fontSize: 40 }} />,
      description: 'Yes/No or True/False selection',
    },
    {
      type: 'text',
      label: 'Text',
      icon: <TextIcon sx={{ fontSize: 40 }} />,
      description: 'Single line text input',
    },
    {
      type: 'multiline',
      label: 'Multiline Text',
      icon: <MultilineIcon sx={{ fontSize: 40 }} />,
      description: 'Multiple lines of text input',
    },
    {
      type: 'multiselect',
      label: 'Multi-Select',
      icon: <MultiSelectIcon sx={{ fontSize: 40 }} />,
      description: 'Multiple selections from a list of options',
    },
  ];

  return (
    <Box>
      <Typography variant="h4" component="h1" sx={{ color: 'primary.main', fontWeight: 600, mb: 4 }}>
        Create Custom Field
      </Typography>
      <Typography variant="body1" sx={{ mb: 4 }}>
        Select the type of field you want to create:
      </Typography>
      <Grid container spacing={3}>
        {fieldTypes.map((field) => (
          <Grid item xs={12} sm={6} md={4} key={field.type}>
            <Card
              sx={{
                height: '100%',
                cursor: 'pointer',
                transition: 'transform 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  backgroundColor: 'primary.light',
                },
              }}
              onClick={() => navigate(`/workspaces/${workspaceId}/workspace-settings/tickets/create-field/${field.type}`)}
            >
              <CardContent sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center',
                textAlign: 'center',
                height: '100%',
                p: 3,
              }}>
                <Box sx={{ 
                  color: 'primary.main',
                  mb: 2,
                }}>
                  {field.icon}
                </Box>
                <Typography variant="h6" component="h2" sx={{ mb: 1, color: 'primary.main' }}>
                  {field.label}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {field.description}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

export default CreateCustomFieldSettings; 