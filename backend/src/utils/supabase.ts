import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { logger } from './logger';

let sb: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (sb) return sb;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error('Supabase is not configured. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in environment.');
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.SUPABASE_ANON_KEY) {
    // Using anon key on the server typically cannot write to Storage if RLS is enabled
    // (default). This is a common cause of "row-level security" errors.
    logger.warn('Supabase initialized with ANON key. Uploads may fail due to RLS. Set SUPABASE_SERVICE_ROLE_KEY for server-side uploads.');
  }
  sb = createClient(url, key, {
    auth: { persistSession: false },
  });
  return sb;
}

export default getSupabase;