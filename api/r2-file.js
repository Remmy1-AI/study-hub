/* Stream / redirect an R2 object for Watch + Download.
   Public catalog files live under uploads/. Inbox is admin-only. */
import {
  corsPreflight,
  json,
  r2Env,
  requireAdmin,
  signGetUrl,
  verifySupabaseUser,
  verifyUploadTicket,
} from "../lib/r2.js";

export const config = { runtime: "edge" };

function classifyKey(key) {
  const k = String(key || "").replace(/^\/+/, "");
  if (!k || k.includes("..") || k.includes("\\")) return { key: "", kind: "" };
  if (k.startsWith("uploads/")) return { key: k, kind: "uploads" };
  if (k.startsWith("inbox/")) return { key: k, kind: "inbox" };
  return { key: "", kind: "" };
}

export default async function handler(req) {
  if (req.method === "OPTIONS") return corsPreflight(req);
  if (req.method !== "GET" && req.method !== "HEAD") {
    return json({ error: "Method not allowed" }, 405, req);
  }

  const env = r2Env();
  if (!env.configured) {
    return json({ error: "R2 is not configured", code: "r2_not_configured" }, 503, req);
  }

  const url = new URL(req.url);
  const { key, kind } = classifyKey(url.searchParams.get("key") || "");
  if (!key) return json({ error: "Invalid or missing key" }, 400, req);

  // Inbox is a private review queue — admin Bearer token or short-lived ticket.
  if (kind === "inbox") {
    const ticket = url.searchParams.get("ticket") || "";
    const ticketOk = ticket ? await verifyUploadTicket(ticket, key) : false;
    if (!ticketOk) {
      const user = await verifySupabaseUser(req.headers.get("authorization"));
      const gate = requireAdmin(user);
      if (!gate.ok) return json({ error: gate.error, code: gate.code }, gate.status, req);
    }
  }

  const wantDownload = url.searchParams.get("download") === "1";
  const filename = wantDownload
    ? url.searchParams.get("name") || key.split("/").pop() || "download"
    : "";

  try {
    const signed = await signGetUrl(key, 3600, wantDownload ? { filename } : {});
    // 302 so browsers / video players hit R2 directly (Range friendly).
    return Response.redirect(signed, 302);
  } catch (err) {
    console.error("[r2-file]", err);
    return json({ error: err.message || "Could not fetch file" }, 500, req);
  }
}
