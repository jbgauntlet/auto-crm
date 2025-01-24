import React from 'react';
import { Box } from '@mui/material';
import WorkspaceSidebar from './WorkspaceSidebar';

function WorkspaceLayout({ children }) {
  return (
    <Box sx={{ display: 'flex' }}>
      <WorkspaceSidebar />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          backgroundColor: 'background.default',
          minHeight: '100vh',
          position: 'relative',
          zIndex: 1100,
        }}
      >
        {children}
      </Box>
    </Box>
  );
}

export default WorkspaceLayout; 