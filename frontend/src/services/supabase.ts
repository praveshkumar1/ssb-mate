import { createClient } from '@supabase/supabase-js';

// Frontend Supabase client using anon key
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabase = url && anon ? createClient(url, anon, {
  auth: { persistSession: false }
}) : null as any;

export default supabase;
