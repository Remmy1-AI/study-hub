/**
 * Supabase Auth → Send SMS Hook → BulkClix.
 * Ported from engineering-brain-bank (Boye) api/supabase-sms-hook.js + lib/bulkclix.js.
 *
 * Edge Function secrets (never in the Expo app or repo):
 *   YEBOAH_BULKCLIX_API_KEY      required
 *   YEBOAH_SMS_HOOK_SECRET       required, "v1,whsec_<base64>" (same value as Auth hook secret)
 *   YEBOAH_BULKCLIX_SENDER_ID    optional sender UUID override
 *   YEBOAH_BULKCLIX_SENDER_NAME  optional preferred sender name (default "Docket")
 *   YEBOAH_SMS_DRYRUN_PHONES     optional comma list of E.164 numbers that skip the
 *                                BulkClix send (smoke tests without messaging anyone)
 *
 * Deploy with verify_jwt = false: Auth signs requests with Standard Webhooks, not a JWT.
 */

const BULKCLIX_BASE = "https://api.bulkclix.com/api/v1";
const TOLERANCE_SECONDS = 5 * 60;
const FALLBACK_SENDER_NAMES = ["docket", "mryeboah", "yeboah"];

let cachedSender: { id: string; name: string } | null = null;

function env(name: string) {
  return (Deno.env.get(name) ?? "").trim();
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

function hookError(status: number, message: string) {
  return json({ error: { http_code: status, message } }, status);
}

function b64ToBytes(b64: string) {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) out[i] = bin.charCodeAt(i);
  return out;
}

function bytesToB64(bytes: Uint8Array) {
  let bin = "";
  bytes.forEach((b) => {
    bin += String.fromCharCode(b);
  });
  return btoa(bin);
}

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function verifyHookRequest(headers: Headers, rawBody: string) {
  const secret = env("YEBOAH_SMS_HOOK_SECRET");
  if (!secret) return { ok: false as const, reason: "no_signing_secret" };
  let keyBytes: Uint8Array;
  try {
    keyBytes = b64ToBytes(secret.replace(/^v1,/, "").replace(/^whsec_/, ""));
  } catch {
    return { ok: false as const, reason: "bad_signing_secret" };
  }

  const id = headers.get("webhook-id") ?? "";
  const timestamp = headers.get("webhook-timestamp") ?? "";
  const signatureHeader = headers.get("webhook-signature") ?? "";
  if (!id || !timestamp || !signatureHeader) {
    return { ok: false as const, reason: "missing_signature_headers" };
  }
  const ts = Number(timestamp);
  if (!Number.isFinite(ts)) return { ok: false as const, reason: "bad_timestamp" };
  if (Math.abs(Math.floor(Date.now() / 1000) - ts) > TOLERANCE_SECONDS) {
    return { ok: false as const, reason: "stale_timestamp" };
  }

  const key = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signed = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`${id}.${timestamp}.${rawBody}`),
  );
  const expected = bytesToB64(new Uint8Array(signed));
  const ok = signatureHeader
    .split(" ")
    .map((part) => part.trim())
    .filter((part) => part.startsWith("v1,"))
    .some((part) => timingSafeEqual(part.slice(3), expected));
  return ok ? { ok: true as const } : { ok: false as const, reason: "bad_signature" };
}

function bulkclixHeaders(apiKey: string) {
  return { "x-api-key": apiKey, Accept: "application/json", "Content-Type": "application/json" };
}

/** BulkClix accepts local Ghana style (024…) or 233…. */
function normalizeBulkclixPhone(phone: string) {
  const raw = String(phone || "").replace(/\s+/g, "");
  if (!raw) return "";
  if (raw.startsWith("+233") && raw.length >= 13) return `0${raw.slice(4)}`;
  if (raw.startsWith("233") && raw.length >= 12) return `0${raw.slice(3)}`;
  if (raw.startsWith("+")) return raw.slice(1);
  return raw;
}

function squash(name: unknown) {
  return String(name ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

/**
 * Preferred sender: YEBOAH_BULKCLIX_SENDER_ID, then an approved sender named
 * YEBOAH_BULKCLIX_SENDER_NAME / Docket / Mr Yeboah, then any approved sender.
 */
async function resolveSender(apiKey: string) {
  const explicitId = env("YEBOAH_BULKCLIX_SENDER_ID");
  if (explicitId) return { id: explicitId, name: "configured" };
  if (cachedSender) return cachedSender;

  const res = await fetch(`${BULKCLIX_BASE}/sms-api/senderIds`, {
    method: "GET",
    headers: bulkclixHeaders(apiKey),
  });
  if (!res.ok) throw new Error(`BulkClix senderIds failed (${res.status})`);
  const body = await res.json();
  const list: Array<{ id?: string; name?: string; status?: string }> = Array.isArray(body?.data)
    ? body.data
    : [];
  const approved = list.filter((s) => s?.id && String(s.status ?? "").toLowerCase() === "approved");
  const wanted = [squash(env("YEBOAH_BULKCLIX_SENDER_NAME") || "Docket"), ...FALLBACK_SENDER_NAMES];
  const match =
    wanted.map((w) => approved.find((s) => squash(s.name) === w)).find(Boolean) ?? approved[0];
  if (!match?.id) throw new Error("No approved BulkClix sender ID");
  cachedSender = { id: String(match.id), name: String(match.name ?? "") };
  return cachedSender;
}

async function sendBulkclixSms(phone: string, message: string) {
  const apiKey = env("YEBOAH_BULKCLIX_API_KEY");
  if (!apiKey) return { ok: false, code: "bulkclix_not_configured", status: 503 };
  const recipient = normalizeBulkclixPhone(phone);
  if (!recipient) return { ok: false, code: "bad_phone", status: 400 };

  let sender: { id: string; name: string };
  try {
    sender = await resolveSender(apiKey);
  } catch (err) {
    console.error("[send-sms-hook] sender resolve failed:", err instanceof Error ? err.message : err);
    return { ok: false, code: "sender_resolve_failed", status: 502 };
  }

  const res = await fetch(`${BULKCLIX_BASE}/sms-api/send`, {
    method: "POST",
    headers: bulkclixHeaders(apiKey),
    body: JSON.stringify({ sender_id: sender.id, message, recipients: [recipient] }),
  });
  if (!res.ok) {
    console.error("[send-sms-hook] BulkClix send failed:", res.status);
    return { ok: false, code: "send_failed", status: 502 };
  }
  return { ok: true, code: "sent", status: 200 };
}

function isDryRunPhone(phone: string) {
  const list = env("YEBOAH_SMS_DRYRUN_PHONES")
    .split(",")
    .map((p) => p.trim().replace(/^\+/, ""))
    .filter(Boolean);
  return list.includes(phone.replace(/^\+/, ""));
}

Deno.serve(async (req) => {
  if (req.method === "GET") {
    return json({
      ok: true,
      service: "send-sms-hook",
      bulkclix: env("YEBOAH_BULKCLIX_API_KEY") ? "configured" : "missing_api_key",
      hook_secret: env("YEBOAH_SMS_HOOK_SECRET") ? "configured" : "missing",
    });
  }
  if (req.method !== "POST") return hookError(405, "Method not allowed");

  const rawBody = await req.text();
  const verified = await verifyHookRequest(req.headers, rawBody);
  if (!verified.ok) {
    return hookError(verified.reason === "no_signing_secret" ? 503 : 401, "Unauthorized");
  }

  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return hookError(400, "Invalid JSON");
  }

  const phone = String(payload?.user?.phone || payload?.sms?.phone || payload?.phone || "");
  const otp = String(payload?.sms?.otp || payload?.otp || "");
  if (!phone || !otp) return hookError(400, "phone and otp required");

  if (isDryRunPhone(phone)) {
    const apiKey = env("YEBOAH_BULKCLIX_API_KEY");
    let senderResolved = false;
    if (apiKey) {
      try {
        await resolveSender(apiKey);
        senderResolved = true;
      } catch {
        senderResolved = false;
      }
    }
    console.log("[send-sms-hook] dry run: SMS not sent", { senderResolved });
    return json({ dry_run: true, sender_resolved: senderResolved });
  }

  const message = `Your Docket verification code is ${otp}. It expires soon. Do not share this code.`;
  const result = await sendBulkclixSms(phone, message);
  if (!result.ok) return hookError(result.status, result.code);
  return json({});
});
