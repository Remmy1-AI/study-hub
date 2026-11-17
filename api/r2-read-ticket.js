/* Mint a short-lived ticket so Admin can open inbox objects in a new tab. */
import {
  corsPreflight,
  isManagedR2Key,
  json,
  mintUploadTicket,
  requireAdmin,
  verifySupabaseUser,
} from "../lib/r2.js";

export const config = { runtime: "edge" };

export default async function handler(req) {
  if (req.method === "OPTIONS") return corsPreflight(req);
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405, req);

  const user = await verifySupabaseUser(req.headers.get("authorization"));
  const gate = requireAdmin(user);
  if (!gate.ok) return json({ error: gate.error, code: gate.code }, gate.status, req);

  let body;
  try {
    body = await req.json();
  } catch (_) {
    return json({ error: "Invalid JSON body" }, 400, req);
  }

  const key = String(body?.key || "").replace(/^\/+/, "");
  if (!isManagedR2Key(key) || !key.startsWith("inbox/")) {
    return json({ error: "Only inbox keys need a read ticket" }, 400, req);
  }

  try {
    const ticket = await mintUploadTicket(key, 300);
    return json({ ok: true, key, ticket, expiresIn: 300 }, 200, req);
  } catch (err) {
    console.error("[r2-read-ticket]", err);
    return json({ error: err.message || "Could not mint ticket" }, 500, req);
  }
}
