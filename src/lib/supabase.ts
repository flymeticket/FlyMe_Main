import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env } from './env';
import type { Database } from './database.types';

// Public client — safe for use in Server Components and pages. Reads only.
// If env is missing, we still construct a client with placeholders so the build
// doesn't crash; runtime queries will fail loudly instead.
export function getSupabasePublic(): SupabaseClient<Database> {
  return createClient<Database>(
    env.supabaseUrl || 'https://placeholder.supabase.co',
    env.supabaseAnonKey || 'placeholder-anon-key',
    { auth: { persistSession: false } }
  );
}

// Service-role client — bypasses RLS. SERVER-ONLY. Used by seed scripts and the
// content-generation worker. Throws if env vars are missing.
let _adminClient: SupabaseClient<Database> | null = null;
export function getSupabaseAdmin(): SupabaseClient<Database> {
  if (_adminClient) return _adminClient;
  _adminClient = createClient<Database>(
    env.supabaseUrl,
    env.supabaseServiceRoleKey,
    { auth: { persistSession: false } }
  );
  return _adminClient;
}
