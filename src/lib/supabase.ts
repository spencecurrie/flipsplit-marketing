import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Singleton browser client. Reads from PUBLIC_* env vars so it can be
// imported from client-side <script> tags in .astro pages.
//
// On the marketing site, we use Anonymous Auth: the homepage form calls
// signInAnonymously() and inserts a qualification_sessions row. Subsequent
// pages reuse the same anonymous session via localStorage (handled by the
// Supabase client automatically).

const url = import.meta.env.PUBLIC_SUPABASE_URL;
const anonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error(
    'Missing PUBLIC_SUPABASE_URL or PUBLIC_SUPABASE_ANON_KEY. Check .env at project root.'
  );
}

let _client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (_client) return _client;
  _client = createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  });
  return _client;
}
