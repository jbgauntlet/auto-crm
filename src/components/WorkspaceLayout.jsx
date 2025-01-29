/**
 * WorkspaceLayout Component
 * 
 * A layout wrapper component that provides the basic structure for workspace pages.
 * Combines the workspace sidebar with a main content area.
 * 
 * Features:
 * - Consistent layout structure across workspace pages
 * - Responsive design with flexible content area
 * - Fixed sidebar navigation
 * - Proper z-index layering
 * 
 * Props:
 * @param {ReactNode} children - The main content to render in the layout
 * 
 * Layout Structure:
 * - Sidebar: Fixed position, contains workspace navigation
 * - Main Content: Flexible width, scrollable
 * 
 * Styling:
 * - Uses Material-UI's Box component for layout
 * - Maintains consistent padding and spacing
 * - Handles background colors and z-indexing
 * - Full viewport height support
 */

import React from 'react';
import { Box } from '@mui/material';
import WorkspaceSidebar from './WorkspaceSidebar';

function WorkspaceLayout({ children }) {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        position: 'relative',
        zIndex: 1,
      }}
    >
      <WorkspaceSidebar />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          backgroundColor: 'background.default',
          position: 'relative',
        }}
      >
        {children}
      </Box>
    </Box>
  );
}

export default WorkspaceLayout; 