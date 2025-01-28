import { Card, Box, Typography, Button, CircularProgress } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';

/**
 * Component for displaying a workspace invitation card
 */
export const InvitationCard = ({ 
  invite, 
  onAccept, 
  onReject, 
  processing 
}) => {
  const renderActionButton = (action, icon, label, color) => (
    <Button
      variant="contained"
      disabled={processing}
      onClick={action}
      startIcon={processing ? (
        <CircularProgress size={20} color="inherit" />
      ) : icon}
      sx={{ 
        minWidth: 120,
        backgroundColor: `${color}.main`,
        '&:hover': {
          backgroundColor: `${color}.dark`,
        },
        '& .MuiCircularProgress-root': {
          mr: 1
        }
      }}
    >
      {processing ? 'Processing...' : label}
    </Button>
  );

  return (
    <Card
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        p: 2,
        opacity: processing ? 0.7 : 1,
        transition: 'opacity 0.2s ease-in-out'
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
            Workspace
          </Typography>
          <Typography variant="h6" sx={{ color: 'primary.main' }}>
            {invite.workspaceName}
          </Typography>
        </Box>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          gap: 0.5,
        }}>
          <Typography variant="body2" color="text.secondary">
            Invited Role
          </Typography>
          <Box sx={{
            backgroundColor: 'primary.light',
            color: 'primary.main',
            px: 2,
            py: 0.5,
            borderRadius: 0,
            fontWeight: 500,
          }}>
            {invite.role}
          </Box>
        </Box>
        {invite.groupName && (
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            gap: 0.5,
          }}>
            <Typography variant="body2" color="text.secondary">
              Team Group
            </Typography>
            <Box sx={{
              backgroundColor: 'secondary.light',
              color: 'secondary.main',
              px: 2,
              py: 0.5,
              borderRadius: 0,
              fontWeight: 500,
            }}>
              {invite.groupName}
            </Box>
          </Box>
        )}
      </Box>
      <Box sx={{ display: 'flex', gap: 1 }}>
        {renderActionButton(
          onAccept,
          <CheckCircleIcon />,
          'Accept',
          'success'
        )}
        {renderActionButton(
          onReject,
          <CancelIcon />,
          'Decline',
          'error'
        )}
      </Box>
    </Card>
  );
}; 