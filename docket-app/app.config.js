/**
 * Injects client-safe Supabase settings into expo.extra at build/start time.
 *
 * Prefers EXPO_PUBLIC_SUPABASE_* (EAS / local .env), then YEBOAH_SUPABASE_URL /
 * YEBOAH_SUPABASE_ANON_KEY (Cloud Agent secrets) so no values live in the repo.
 *
 * NEVER map service_role, access token, DB password, or BulkClix keys here:
 * everything in expo.extra ships inside the app bundle.
 */
const appJson = require('./app.json');

function readPublicSupabase() {
  const url = (
    process.env.EXPO_PUBLIC_SUPABASE_URL ||
    process.env.YEBOAH_SUPABASE_URL ||
    ''
  ).trim();
  const anonKey = (
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.YEBOAH_SUPABASE_ANON_KEY ||
    ''
  ).trim();
  return { url, anonKey };
}

module.exports = () => {
  const { url, anonKey } = readPublicSupabase();
  const base = appJson.expo;

  return {
    ...base,
    extra: {
      ...(base.extra || {}),
      supabaseUrl: url,
      supabaseAnonKey: anonKey,
    },
  };
};
