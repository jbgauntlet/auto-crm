import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from './lib/supabaseClient';
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import Dashboard from './pages/Dashboard';
import LandingPage from './pages/LandingPage';
import CreateWorkspace from './pages/CreateWorkspace';
import CreateTicket from './pages/CreateTicket';
import Ticket from './pages/Ticket';
import './App.css'

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
    return <div>Loading...</div>; // You might want to create a proper loading component
  }

  return (
    <Router>
      <Routes>
        <Route 
          path="/login" 
          element={!session ? <Login /> : <Navigate to="/dashboard" />} 
        />
        <Route 
          path="/signup" 
          element={!session ? <Signup /> : <Navigate to="/dashboard" />} 
        />
        <Route 
          path="/dashboard/*" 
          element={session ? <Dashboard /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/" 
          element={<LandingPage />} 
        />
        <Route 
          path="/create-workspace" 
          element={session ? <CreateWorkspace /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/create-ticket" 
          element={session ? <CreateTicket /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/ticket/:id" 
          element={session ? <Ticket /> : <Navigate to="/login" />} 
        />
      </Routes>
    </Router>
  );
}

export default App;
