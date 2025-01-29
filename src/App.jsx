/**
 * Main application component that handles routing and authentication state.
 * This component serves as the root of the application, managing:
 * - Authentication state and session management via Supabase
 * - Application-wide routing configuration
 * - Theme provider setup with Material-UI
 * - Protected route handling with RouteValidator
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from './lib/supabaseClient';
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import Home from './pages/workspaces/Home';
import LandingPage from './pages/LandingPage';
import ResetPassword from './pages/auth/ResetPassword';
import ForgotPassword from './pages/auth/ForgotPassword';
import { WorkspaceDashboard } from './pages/workspaces/dashboard/WorkspaceDashboard';
import Ticket from './pages/tickets/Ticket';
import TicketList from './pages/tickets/TicketList';
import CreateTicket from './pages/tickets/CreateTicket';
import Settings from './pages/workspaces/Settings';
import Help from './pages/Help';
import './App.css'
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme';
import WorkspaceLayout from './components/WorkspaceLayout';
import RouteValidator from './components/RouteValidator';
import NotFound from './pages/NotFound';
import { Box } from '@mui/material';
import Team from './pages/workspaces/Team';
import UserProfile from './pages/workspaces/UserProfile';
import Analytics from './pages/workspaces/Analytics';
import MacroList from './pages/macros/MacroList';
import CreateMacro from './pages/macros/CreateMacro';
import EditMacro from './pages/macros/EditMacro';
import { ThemeProvider as CustomThemeProvider } from './theme/ThemeContext';

/**
 * App Component
 * @returns {JSX.Element} The root application component with routing and authentication setup
 */
function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <CustomThemeProvider>
        <Box sx={{ 
          m: 0, 
          p: 0, 
          minHeight: '100vh',
          width: '100vw',
          maxWidth: '100vw',
          overflow: 'hidden'
        }}>
          <Router>
            <Routes>
              <Route 
                path="/login" 
                element={!session ? <Login /> : <Navigate to="/workspaces" />} 
              />
              <Route 
                path="/signup" 
                element={!session ? <Signup /> : <Navigate to="/workspaces" />} 
              />
              <Route 
                path="/workspaces" 
                element={session ? <WorkspaceDashboard /> : <Navigate to="/login" />} 
              />
              <Route 
                path="/workspaces/:workspaceId" 
                element={session ? 
                  <RouteValidator>
                    <WorkspaceLayout>
                      <Home />
                    </WorkspaceLayout>
                  </RouteValidator> 
                  : <Navigate to="/login" />
                } 
              />
              <Route 
                path="/workspaces/:workspaceId/tickets" 
                element={session ? 
                  <RouteValidator>
                    <WorkspaceLayout>
                      <TicketList />
                    </WorkspaceLayout>
                  </RouteValidator>
                  : <Navigate to="/login" />
                } 
              />
              <Route 
                path="/workspaces/:workspaceId/tickets/:ticketId" 
                element={session ? 
                  <RouteValidator>
                    <WorkspaceLayout>
                      <Ticket />
                    </WorkspaceLayout>
                  </RouteValidator>
                  : <Navigate to="/login" />
                } 
              />
              <Route 
                path="/workspaces/:workspaceId/tickets/create" 
                element={session ? 
                  <WorkspaceLayout>
                    <CreateTicket />
                  </WorkspaceLayout> 
                  : <Navigate to="/login" />
                } 
              />
              <Route 
                path="/workspaces/:workspaceId/macros" 
                element={session ? 
                  <RouteValidator>
                    <WorkspaceLayout>
                      <MacroList />
                    </WorkspaceLayout>
                  </RouteValidator>
                  : <Navigate to="/login" />
                } 
              />
              <Route 
                path="/workspaces/:workspaceId/macros/create" 
                element={session ? 
                  <RouteValidator>
                    <WorkspaceLayout>
                      <CreateMacro />
                    </WorkspaceLayout>
                  </RouteValidator>
                  : <Navigate to="/login" />
                } 
              />
              <Route 
                path="/workspaces/:workspaceId/macros/:macroId" 
                element={session ? 
                  <RouteValidator>
                    <WorkspaceLayout>
                      <EditMacro />
                    </WorkspaceLayout>
                  </RouteValidator>
                  : <Navigate to="/login" />
                } 
              />
              <Route 
                path="/workspaces/:workspaceId/workspace-settings/*" 
                element={session ? 
                  <RouteValidator>
                    <WorkspaceLayout>
                      <Settings />
                    </WorkspaceLayout>
                  </RouteValidator>
                  : <Navigate to="/login" />
                } 
              />
              <Route 
                path="/workspaces/:workspaceId/team" 
                element={session ? 
                  <RouteValidator>
                    <WorkspaceLayout>
                      <Team />
                    </WorkspaceLayout>
                  </RouteValidator>
                  : <Navigate to="/login" />
                } 
              />
              <Route 
                path="/workspaces/:workspaceId/team/:userId" 
                element={session ? 
                  <RouteValidator>
                    <WorkspaceLayout>
                      <UserProfile />
                    </WorkspaceLayout>
                  </RouteValidator>
                  : <Navigate to="/login" />
                } 
              />
              <Route 
                path="/workspaces/:workspaceId/analytics" 
                element={session ? 
                  <RouteValidator>
                    <WorkspaceLayout>
                      <Analytics />
                    </WorkspaceLayout>
                  </RouteValidator>
                  : <Navigate to="/login" />
                } 
              />
              <Route 
                path="/" 
                element={<LandingPage />} 
              />
              <Route 
                path="/reset-password" 
                element={session ? <ResetPassword /> : <Navigate to="/login" />} 
              />
              <Route 
                path="/forgot-password" 
                element={!session ? <ForgotPassword /> : <Navigate to="/workspaces" />} 
              />
              {/* Redirect old dashboard routes to workspaces */}
              <Route 
                path="/dashboard/*" 
                element={<Navigate to="/workspaces" replace />} 
              />
              <Route 
                path="/help" 
                element={<Help />} 
              />
              {/* Catch all invalid routes */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Router>
        </Box>
      </CustomThemeProvider>
    </ThemeProvider>
  );
}

export default App;
