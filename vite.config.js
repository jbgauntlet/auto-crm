/**
 * Vite Configuration
 * 
 * Basic Vite configuration for React application using SWC compiler.
 * SWC (Speedy Web Compiler) provides faster compilation than Babel.
 * 
 * Features:
 * - React-SWC plugin for optimized React compilation
 * - Default Vite configuration for development and production
 * - Hot Module Replacement (HMR) enabled by default
 * 
 * For more configuration options, visit:
 * https://vitejs.dev/config/
 */

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
})
