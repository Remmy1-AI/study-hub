import { defineConfig, loadEnv } from "vite";

function looksPrivileged(key) {
  if (!key) return false;
  if (key.startsWith("sb_secret_")) return true;
  const part = key.split(".")[1];
  if (!part) return false;
  try {
    const payload = JSON.parse(Buffer.from(part, "base64url").toString("utf8"));
    return payload.role === "service_role";
  } catch {
    return false;
  }
}

// Only the Supabase URL and anon/publishable key reach the browser bundle.
// Never expose YEBOAH_SUPABASE_SERVICE_ROLE_KEY (or any other env) here.
export default defineConfig(({ mode }) => {
  const env = { ...loadEnv(mode, process.cwd(), ""), ...process.env };
  const url = env.YEBOAH_SUPABASE_URL || env.VITE_SUPABASE_URL || "";
  const anonKey = env.YEBOAH_SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY || "";

  if (looksPrivileged(anonKey)) {
    throw new Error("YEBOAH_SUPABASE_ANON_KEY is a service-role/secret key. Use the anon (public) key.");
  }

  return {
    define: {
      __SUPABASE_URL__: JSON.stringify(url),
      __SUPABASE_ANON_KEY__: JSON.stringify(anonKey),
    },
    build: { outDir: "dist" },
  };
});
