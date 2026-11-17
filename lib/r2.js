/* Shared Cloudflare R2 (S3-compatible) helpers for Vercel API routes. */
import { AwsClient } from "aws4fetch";

export function r2Env() {
  const accountId = process.env.R2_ACCOUNT_ID || "";
  const accessKeyId = process.env.R2_ACCESS_KEY_ID || "";
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || "";
  const bucket = process.env.R2_BUCKET_NAME || process.env.R2_BUCKET || "";
  const publicBase = String(
    process.env.R2_PUBLIC_BASE_URL || process.env.R2_PUBLIC_URL || ""
  ).replace(/\/$/, "");
  const configured = !!(accountId && accessKeyId && secretAccessKey && bucket && publicBase);
  return { accountId, accessKeyId, secretAccessKey, bucket, publicBase, configured };
}

export function r2Client() {
  const env = r2Env();
  if (!env.configured) return null;
  return {
    env,
    aws: new AwsClient({
      accessKeyId: env.accessKeyId,
      secretAccessKey: env.secretAccessKey,
      service: "s3",
      region: "auto",
    }),
  };
}

export function objectUrl(key) {
  const { publicBase } = r2Env();
  const k = String(key || "").replace(/^\/+/, "");
  if (!publicBase || !k) return "";
  // Proxy style: https://mryeboah.study/api/r2-file  →  ?key=uploads/...
  if (/\/api\/r2-file\/?$/i.test(publicBase) || publicBase.includes("r2-file")) {
    const base = publicBase.replace(/\?.*$/, "").replace(/\/$/, "");
    return `${base}?key=${encodeURIComponent(k)}`;
  }
  return `${publicBase}/${k.split("/").map(encodeURIComponent).join("/")}`;
}

export async function signGetUrl(key, expiresSec = 3600, opts = {}) {
  const client = r2Client();
  if (!client) throw new Error("R2 is not configured");
  const url = new URL(endpointForKey(key));
  url.searchParams.set("X-Amz-Expires", String(expiresSec));
  if (opts.filename) {
    const safe = String(opts.filename).replace(/[\r\n"]/g, "").slice(0, 180) || "download";
    // Signed response overrides — browser navigation saves the file (no bucket CORS).
    url.searchParams.set("response-content-disposition", `attachment; filename="${safe}"`);
    url.searchParams.set("response-content-type", "application/octet-stream");
  }
  const signed = await client.aws.sign(new Request(url.toString(), { method: "GET" }), {
    aws: { signQuery: true },
  });
  return signed.url;
}

export function endpointForKey(key) {
  const { accountId, bucket } = r2Env();
  const k = String(key || "").replace(/^\/+/, "");
  return `https://${accountId}.r2.cloudflarestorage.com/${bucket}/${k
    .split("/")
    .map(encodeURIComponent)
    .join("/")}`;
}

export async function signPutUrl(key, contentType, expiresSec = 600) {
  const client = r2Client();
  if (!client) throw new Error("R2 is not configured");
  const url = new URL(endpointForKey(key));
  url.searchParams.set("X-Amz-Expires", String(expiresSec));
  const signed = await client.aws.sign(
    new Request(url.toString(), {
      method: "PUT",
      headers: contentType ? { "Content-Type": contentType } : {},
    }),
    { aws: { signQuery: true } }
  );
  return signed.url;
}

/** Put object bytes server-side (avoids browser → R2 CORS). */
export async function putObject(key, body, contentType) {
  const client = r2Client();
  if (!client) throw new Error("R2 is not configured");
  const headers = {};
  if (contentType) headers["Content-Type"] = contentType;
  const res = await client.aws.fetch(endpointForKey(key), {
    method: "PUT",
    headers,
    body,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`R2 put failed (${res.status}): ${text.slice(0, 200)}`);
  }
  return { etag: res.headers.get("etag") || "" };
}

/** Staging key for chunked uploads (stitched server-side; avoids S3 5MB part minimum). */
export function partStagingKey(finalKey, uploadId, partNumber) {
  const base = String(finalKey || "").replace(/^\/+/, "");
  return `__parts__/${uploadId}/${base}.p${String(partNumber).padStart(4, "0")}`;
}

export function newUploadId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export async function getObjectBytes(key) {
  const client = r2Client();
  if (!client) throw new Error("R2 is not configured");
  const res = await client.aws.fetch(endpointForKey(key), { method: "GET" });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`R2 get failed (${res.status}): ${text.slice(0, 200)}`);
  }
  return new Uint8Array(await res.arrayBuffer());
}

/** Assemble staged proxy chunks into the final R2 object (max 50MB — fine on Node). */
export async function stitchParts(finalKey, uploadId, partCount, contentType) {
  const chunks = [];
  let total = 0;
  for (let i = 1; i <= partCount; i++) {
    const bytes = await getObjectBytes(partStagingKey(finalKey, uploadId, i));
    chunks.push(bytes);
    total += bytes.byteLength;
  }
  const out = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    out.set(c, offset);
    offset += c.byteLength;
  }
  await putObject(finalKey, out, contentType);
  await Promise.all(
    Array.from({ length: partCount }, (_, i) =>
      deleteObject(partStagingKey(finalKey, uploadId, i + 1)).catch(() => {})
    )
  );
}

export async function abortStagedUpload(finalKey, uploadId, partCount) {
  const n = Math.max(0, Number(partCount) || 0);
  await Promise.all(
    Array.from({ length: n }, (_, i) =>
      deleteObject(partStagingKey(finalKey, uploadId, i + 1)).catch(() => {})
    )
  );
}

/** Short-lived HMAC so /api/r2-put only accepts keys from our presign. */
export async function mintUploadTicket(key, expiresSec = 900) {
  const { secretAccessKey } = r2Env();
  const exp = Math.floor(Date.now() / 1000) + expiresSec;
  const payload = `${key}\n${exp}`;
  const sig = await hmacHex(secretAccessKey, payload);
  // base64url(key|exp|sig) — keys may contain dots
  return btoa(`${key}|${exp}|${sig}`).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export async function verifyUploadTicket(ticket, key) {
  if (!ticket || !key) return false;
  try {
    const pad = "=".repeat((4 - (String(ticket).length % 4)) % 4);
    const raw = atob(String(ticket).replace(/-/g, "+").replace(/_/g, "/") + pad);
    const idx1 = raw.indexOf("|");
    const idx2 = raw.indexOf("|", idx1 + 1);
    if (idx1 < 0 || idx2 < 0) return false;
    const ticketKey = raw.slice(0, idx1);
    const expStr = raw.slice(idx1 + 1, idx2);
    const sig = raw.slice(idx2 + 1);
    if (ticketKey !== key) return false;
    const exp = Number(expStr);
    if (!Number.isFinite(exp) || exp < Math.floor(Date.now() / 1000)) return false;
    const { secretAccessKey } = r2Env();
    const expect = await hmacHex(secretAccessKey, `${ticketKey}\n${expStr}`);
    return timingSafeEqual(sig, expect);
  } catch (_) {
    return false;
  }
}

async function hmacHex(secret, message) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function timingSafeEqual(a, b) {
  const x = String(a || "");
  const y = String(b || "");
  if (x.length !== y.length) return false;
  let out = 0;
  for (let i = 0; i < x.length; i++) out |= x.charCodeAt(i) ^ y.charCodeAt(i);
  return out === 0;
}

export async function deleteObject(key) {
  const client = r2Client();
  if (!client) throw new Error("R2 is not configured");
  const res = await client.aws.fetch(endpointForKey(key), { method: "DELETE" });
  if (!res.ok && res.status !== 404) {
    const text = await res.text().catch(() => "");
    throw new Error(`R2 delete failed (${res.status}): ${text.slice(0, 200)}`);
  }
}

/** Same-origin CORS only — never reflect arbitrary Origin or use *. */
export function corsHeaders(req, extra = {}) {
  const headers = {
    "Access-Control-Allow-Headers":
      "Authorization, Content-Type, X-EBB-Key, X-EBB-Ticket, X-EBB-Content-Type",
    "Access-Control-Allow-Methods": "GET, HEAD, POST, OPTIONS",
    Vary: "Origin",
    ...extra,
  };
  try {
    const origin = req && typeof req.headers?.get === "function"
      ? req.headers.get("origin")
      : req?.headers?.origin || "";
    if (!origin) return headers;
    const reqUrl = req?.url ? new URL(req.url, "http://localhost") : null;
    const o = new URL(origin);
    if (reqUrl && o.host === reqUrl.host) {
      headers["Access-Control-Allow-Origin"] = origin;
    }
  } catch (_) {}
  return headers;
}

export function json(data, status = 200, req = null) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders(req),
    },
  });
}

export function corsPreflight(req) {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(req),
  });
}

/** Comma-separated admin allowlist (required for mutating R2 ops). */
export function parseAdminEmails() {
  return String(process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

/** True when the signed-in user is on ADMIN_EMAILS. */
export function isAdminUser(user) {
  if (!user || !user.id) return false;
  const allow = parseAdminEmails();
  if (!allow.length) return false;
  return allow.includes(String(user.email || "").toLowerCase());
}

export function requireAdmin(user) {
  if (!user) return { ok: false, status: 401, error: "Sign in required" };
  if (!parseAdminEmails().length) {
    return {
      ok: false,
      status: 503,
      error: "ADMIN_EMAILS is not configured on the server",
      code: "admin_emails_missing",
    };
  }
  if (!isAdminUser(user)) {
    return { ok: false, status: 403, error: "Admin access required" };
  }
  return { ok: true };
}

export function isManagedR2Key(key) {
  const k = String(key || "").replace(/^\/+/, "");
  if (!k || k.includes("..") || k.includes("\\")) return false;
  return k.startsWith("uploads/") || k.startsWith("inbox/");
}

/** Verify Supabase access token via Auth API (no JWT secret needed). */
export async function verifySupabaseUser(authHeader) {
  const token = String(authHeader || "").replace(/^Bearer\s+/i, "").trim();
  if (!token) return null;
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const anon =
    process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  if (!url || !anon) return null;
  const res = await fetch(`${String(url).replace(/\/$/, "")}/auth/v1/user`, {
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: anon,
    },
  });
  if (!res.ok) return null;
  const user = await res.json().catch(() => null);
  return user && user.id ? user : null;
}

export function safeFileName(name) {
  return String(name || "file")
    .replace(/[^\w.\-()+ ]+/g, "_")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 180) || "file";
}

export function buildObjectKey(prefix, fileName) {
  const safe = safeFileName(fileName);
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const base = String(prefix || "uploads").replace(/^\/+|\/+$/g, "") || "uploads";
  return `${base}/${id}-${safe}`;
}
