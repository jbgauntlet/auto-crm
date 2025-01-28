import { Card, CardContent, Typography, Divider } from '@mui/material';

/**
 * Component for displaying a workspace card
 */
export const WorkspaceCard = ({ workspace, onClick }) => {
  return (
    <Card
      onClick={onClick}
      sx={{
        cursor: 'pointer',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-4px)',
          backgroundColor: 'primary.light',
        }
      }}
    >
      <CardContent>
        <Typography
          variant="h6"
          component="h2"
          sx={{
            color: 'primary.main',
            fontWeight: 600,
            mb: 2,
          }}
        >
          {workspace.name}
        </Typography>
        <Divider sx={{ my: 2 }} />
        <Typography
          variant="body2"
          color="text.secondary"
        >
          Created: {workspace.created_at}
        </Typography>
      </CardContent>
    </Card>
  );
}; 