// Public client config: Supabase project URL + anon (public) key only.
// Vercel/process env (YEBOAH_SUPABASE_*) wins at build time; these are the fallback.
// NEVER put a service-role key here.
export const PUBLIC_SUPABASE_URL = "https://sxoywnhssethajnqerkw.supabase.co";
export const PUBLIC_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4b3l3bmhzc2V0aGFqbnFlcmt3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTU2OTIzNjYsImV4cCI6MjExMTI2ODM2Nn0.BOmY61pOJtg9RuH_fkb0mVN7y_SVmay7Feavvl2MSQI"; // pragma: allowlist secret (public anon key)
