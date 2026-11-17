/* Presign a Cloudflare R2 PUT for Admin uploads only (auth + ADMIN_EMAILS). */
import {
  buildObjectKey,
  corsPreflight,
  json,
  mintUploadTicket,
  r2Env,
  objectUrl,
  requireAdmin,
  verifySupabaseUser,
} from "../lib/r2.js";

export const config = { runtime: "edge" };

const MAX_BYTES = 50 * 1024 * 1024;

export default async function handler(req) {
  if (req.method === "OPTIONS") return corsPreflight(req);
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405, req);

  const env = r2Env();
  if (!env.configured) {
    return json(
      {
        error:
          "R2 is not configured yet. Add R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, and R2_PUBLIC_BASE_URL in Vercel env.",
        code: "r2_not_configured",
      },
      503,
      req
    );
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

  const fileName = body?.fileName || body?.filename || "";
  const contentType = body?.contentType || body?.content_type || "application/octet-stream";
  const size = Number(body?.size || 0);
  const wantPrefix = String(body?.prefix || "uploads").toLowerCase();

  if (!fileName) return json({ error: "fileName is required" }, 400, req);
  if (!Number.isFinite(size) || size < 0) {
    return json({ error: "size is required" }, 400, req);
  }
  if (size > MAX_BYTES) {
    return json({ error: "File too large (max 50 MB)." }, 413, req);
  }

  // v1: admin site only — forms inbox stays admin-gated until forms ship.
  const prefix = wantPrefix === "inbox" ? "inbox" : "uploads";
  const key = buildObjectKey(prefix, fileName);

  try {
    // Ticket-only: browser uploads via same-origin /api/r2-put (no direct R2 CORS).
    const ticket = await mintUploadTicket(key, 900);
    return json(
      {
        ok: true,
        key,
        ticket,
        publicUrl: objectUrl(key),
        source: "r2",
        contentType,
        prefix,
        expiresIn: 900,
        proxy: true,
      },
      200,
      req
    );
  } catch (err) {
    console.error("[r2-presign]", err);
    return json({ error: err.message || "Could not create upload URL" }, 500, req);
  }
}
