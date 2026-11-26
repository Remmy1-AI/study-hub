import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

/**
 * Supabase client for phone OTP, catalogue and per-user progress (anon key only).
 *
 * Reads, in order:
 *   1. EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY (inlined by Metro)
 *   2. expo.extra.supabaseUrl / supabaseAnonKey (app.config.js, incl. YEBOAH_* secrets)
 *
 * Leave both unset (or placeholders) to run in mock mode: sample catalogue + OTP 123456.
 */
type Extra = {
  supabaseUrl?: string;
  supabaseAnonKey?: string;
};

export function readSupabasePublicConfig() {
  const extra = (Constants.expoConfig?.extra ?? {}) as Extra;
  const url =
    process.env.EXPO_PUBLIC_SUPABASE_URL?.trim() || extra.supabaseUrl?.trim() || '';
  const anonKey =
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim() || extra.supabaseAnonKey?.trim() || '';
  return { url, anonKey };
}

const { url, anonKey } = readSupabasePublicConfig();

const looksConfigured =
  Boolean(url) &&
  Boolean(anonKey) &&
  !url.includes('YOUR_PROJECT') &&
  !anonKey.includes('YOUR_ANON');

export const supabaseConfigured = looksConfigured;

export const supabase: SupabaseClient | null = looksConfigured
  ? createClient(url, anonKey, {
      auth: {
        storage: AsyncStorage,
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    })
  : null;

/** Public URL for an object in the `materials` Storage bucket. */
export function storagePublicUrl(path: string) {
  if (!supabase || !path) return '';
  return supabase.storage.from('materials').getPublicUrl(path).data.publicUrl;
}
