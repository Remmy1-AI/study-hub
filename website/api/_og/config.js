// Public Supabase project URL + anon (public) key only. NEVER a service-role key.
// Vercel env (YEBOAH_SUPABASE_URL / YEBOAH_SUPABASE_ANON_KEY) wins; these are the fallback.
const PUBLIC_SUPABASE_URL = "https://sxoywnhssethajnqerkw.supabase.co";
const PUBLIC_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4b3l3bmhzc2V0aGFqbnFlcmt3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTU2OTIzNjYsImV4cCI6MjExMTI2ODM2Nn0.BOmY61pOJtg9RuH_fkb0mVN7y_SVmay7Feavvl2MSQI"; // pragma: allowlist secret (public anon key)

function isPrivileged(key) {
  if (!key) return false;
  if (key.startsWith("sb_secret_")) return true;
  try {
    const payload = JSON.parse(Buffer.from(key.split(".")[1] || "", "base64url").toString("utf8"));
    return payload.role === "service_role";
  } catch {
    return false;
  }
}

export function supabaseConfig() {
  const envKey = process.env.YEBOAH_SUPABASE_ANON_KEY || "";
  const useEnv = envKey && !isPrivileged(envKey);
  return {
    url: ((useEnv && process.env.YEBOAH_SUPABASE_URL) || PUBLIC_SUPABASE_URL).replace(/\/+$/, ""),
    anonKey: useEnv ? envKey : PUBLIC_SUPABASE_ANON_KEY,
  };
}
