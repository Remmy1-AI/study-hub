/* Delete an R2 object — admin allowlist only, managed prefixes only. */
import {
  corsPreflight,
  deleteObject,
  isManagedR2Key,
  json,
  r2Env,
  requireAdmin,
  verifySupabaseUser,
} from "../lib/r2.js";

export const config = { runtime: "edge" };

export default async function handler(req) {
  if (req.method === "OPTIONS") return corsPreflight(req);
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405, req);

  const env = r2Env();
  if (!env.configured) {
    return json({ error: "R2 is not configured", code: "r2_not_configured" }, 503, req);
  }

  const user = await verifySupabaseUser(req.headers.get("authorization"));
  const gate = requireAdmin(user);
  if (!gate.ok) return json({ error: gate.error, code: gate.code }, gate.status, req);

  let body;
  try {
    body = await req.json();
  } catch (_) {
    return json({ error: "Invalid JSON body" }, 400, req);
  }

  const key = String(body?.key || body?.file_path || "").replace(/^\/+/, "");
  if (!isManagedR2Key(key)) return json({ error: "Invalid key" }, 400, req);

  try {
    await deleteObject(key);
    return json({ ok: true, key }, 200, req);
  } catch (err) {
    console.error("[r2-delete]", err);
    return json({ error: err.message || "Delete failed" }, 500, req);
  }
}
