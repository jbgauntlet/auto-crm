/**
 * Main entry point for the Auto-CRM application.
 * This file initializes the React application and renders the root component.
 * It sets up React's StrictMode for additional development checks and better debugging.
 */

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
