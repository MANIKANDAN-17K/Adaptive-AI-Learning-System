/**
 * Database Client Configuration
 * 
 * Provides a configured Supabase client for database operations
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in environment variables');
}

// Create Supabase client with service role key for backend operations
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey);
