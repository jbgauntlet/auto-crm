/**
 * Supabase Client Configuration
 * 
 * Initializes and exports a Supabase client instance for database interactions.
 * Uses environment variables for secure configuration.
 * 
 * Environment Variables Required:
 * - VITE_SUPABASE_URL: The URL of your Supabase project
 * - VITE_SUPABASE_ANON_KEY: The anonymous key for public API access
 * 
 * Usage:
 * import { supabase } from '../lib/supabaseClient';
 * 
 * Security Note:
 * The anon key is safe to use in client-side code as it has
 * limited permissions defined by Supabase Row Level Security (RLS).
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey); 