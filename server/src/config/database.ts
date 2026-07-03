import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/database';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase configuration. Please check your environment variables.');
}

// Warn if service role key is missing (for development)
if (!supabaseServiceKey || supabaseServiceKey === 'your_supabase_service_role_key_here') {
  console.warn('⚠️  SUPABASE_SERVICE_ROLE_KEY not set. Some admin functions may not work.');
  console.warn('   Get your service role key from: https://supabase.com/dashboard/project/qqggoiysyjnwuyvzwrrr/settings/api');
}

// Client for user operations (uses anon key)
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Admin client for server operations (uses service role key)
export const supabaseAdmin = createClient<Database>(
  supabaseUrl,
  supabaseServiceKey || supabaseAnonKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Database connection test
export const testConnection = async (): Promise<boolean> => {
  try {
    // Try with regular client first (works with anon key)
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('Database connection test failed:', error);
      return false;
    }
    
    console.log('Database connection successful');
    return true;
  } catch (error) {
    console.error('Database connection test failed:', error);
    return false;
  }
};
