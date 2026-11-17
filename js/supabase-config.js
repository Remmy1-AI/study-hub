/* Ace with Mr. Yeboah — Supabase public client config.
   Anon/publishable key is safe in the front end; RLS protects data.
   NEVER put the service_role key here.

   Leave url/anonKey empty until Frank’s project is created — the site
   falls back to sample materials so UI/admin chrome still work. */
window.EBB_SUPABASE = {
  url: "",
  anonKey: "",
};

/* File warehouse hybrid:
   - Existing library: GitHub materials/ (source=github) — optional later
   - New Admin uploads: Cloudflare R2 (source=r2) when env is set */
window.EBB_FILES = {
  githubRawBase: "",
  r2PublicBase: "/api/r2-file",
};
