import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Copy `.env.example` → `.env` and fill in Project URL + anon key.
 * Leave placeholders empty to run in mock auth mode (no network keys required).
 */
const url = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim() ?? '';
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? '';

const looksConfigured =
  Boolean(url) &&
  Boolean(anonKey) &&
  !url.includes('YOUR_PROJECT') &&
  !anonKey.includes('YOUR_ANON');

export const supabaseConfigured = looksConfigured;

export const supabase: SupabaseClient | null = looksConfigured
  ? createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    })
  : null;
