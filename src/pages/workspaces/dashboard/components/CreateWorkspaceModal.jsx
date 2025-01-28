import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Typography,
  Box,
  TextField,
  Alert,
  Button,
  CircularProgress,
  InputAdornment,
} from '@mui/material';
import { Business as BusinessIcon } from '@mui/icons-material';

/**
 * Modal component for creating a new workspace
 */
export const CreateWorkspaceModal = ({
  open,
  onClose,
  onSubmit,
  error,
  creating
}) => {
  const [name, setName] = useState('');
  const [localError, setLocalError] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setLocalError('Workspace name is required');
      return;
    }
    onSubmit(name);
  };

  const handleClose = () => {
    setName('');
    setLocalError(null);
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle
        sx={{
          color: 'primary.main',
          fontWeight: 600,
          pb: 1,
        }}
      >
        Create Workspace
      </DialogTitle>
      <DialogContent>
        <Typography 
          variant="body2" 
          color="text.secondary"
          sx={{ mb: 3 }}
        >
          Give your workspace a name to get started
        </Typography>

        {(error || localError) && (
          <Alert 
            severity="error" 
            sx={{ mb: 3 }}
          >
            {error || localError}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <TextField
              required
              fullWidth
              label="Workspace Name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setLocalError(null);
              }}
              disabled={creating}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <BusinessIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                onClick={handleClose}
                disabled={creating}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={creating || !name.trim()}
                startIcon={creating ? (
                  <CircularProgress size={20} color="inherit" />
                ) : undefined}
                sx={{
                  minWidth: 140,
                  '& .MuiCircularProgress-root': {
                    mr: 1
                  }
                }}
              >
                {creating ? 'Creating...' : 'Create Workspace'}
              </Button>
            </Box>
          </Box>
        </form>

        {creating && (
          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ mb: 1 }}
            >
              Setting up your workspace...
            </Typography>
            <Typography 
              variant="caption" 
              color="text.secondary"
              sx={{ 
                display: 'block',
                fontStyle: 'italic'
              }}
            >
              This may take a few moments while we configure everything
            </Typography>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}; 