/* Same-origin R2 upload proxy — admin auth required; browser never needs bucket CORS.
   Node runtime (60s) so large PDFs can finish assembling. */
import {
  abortStagedUpload,
  corsHeaders,
  isManagedR2Key,
  newUploadId,
  partStagingKey,
  putObject,
  r2Env,
  requireAdmin,
  stitchParts,
  verifyUploadTicket,
  verifySupabaseUser,
} from "../lib/r2.js";

export const config = {
  api: {
    bodyParser: false,
  },
  maxDuration: 60,
};

const MAX_PART = 3.5 * 1024 * 1024;

function setCors(req, res) {
  const headers = corsHeaders(req);
  Object.entries(headers).forEach(([k, v]) => res.setHeader(k, v));
}

function send(req, res, status, data) {
  setCors(req, res);
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(data));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

export default async function handler(req, res) {
  setCors(req, res);
  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }
  if (req.method !== "POST") return send(req, res, 405, { error: "Method not allowed" });

  const env = r2Env();
  if (!env.configured) {
    return send(req, res, 503, { error: "R2 is not configured", code: "r2_not_configured" });
  }

  const user = await verifySupabaseUser(req.headers.authorization || "");
  const gate = requireAdmin(user);
  if (!gate.ok) return send(req, res, gate.status, { error: gate.error, code: gate.code });

  const url = new URL(req.url || "/", "http://localhost");
  const action = String(url.searchParams.get("action") || "put").toLowerCase();
  const key = String(url.searchParams.get("key") || req.headers["x-ebb-key"] || "").replace(
    /^\/+/,
    ""
  );
  const ticket = String(url.searchParams.get("ticket") || req.headers["x-ebb-ticket"] || "");
  const contentType =
    url.searchParams.get("contentType") ||
    req.headers["x-ebb-content-type"] ||
    "application/octet-stream";

  if (!isManagedR2Key(key)) return send(req, res, 403, { error: "Invalid key" });
  if (!(await verifyUploadTicket(ticket, key))) {
    return send(req, res, 403, { error: "Upload ticket expired or invalid. Request a new slot." });
  }

  try {
    if (action === "init") {
      return send(req, res, 200, { ok: true, key, uploadId: newUploadId() });
    }

    if (action === "part") {
      const uploadId = String(url.searchParams.get("uploadId") || "");
      const partNumber = Number(url.searchParams.get("partNumber") || 0);
      if (!uploadId || !Number.isInteger(partNumber) || partNumber < 1 || partNumber > 64) {
        return send(req, res, 400, { error: "uploadId and partNumber required" });
      }
      const body = await readBody(req);
      if (!body.byteLength) return send(req, res, 400, { error: "Empty part" });
      if (body.byteLength > MAX_PART) return send(req, res, 413, { error: "Part too large" });
      await putObject(partStagingKey(key, uploadId, partNumber), body, "application/octet-stream");
      return send(req, res, 200, { ok: true, partNumber, bytes: body.byteLength });
    }

    if (action === "complete") {
      const uploadId = String(url.searchParams.get("uploadId") || "");
      let partCount = Number(url.searchParams.get("partCount") || 0);
      let ct = contentType;
      const raw = await readBody(req);
      if (raw.byteLength) {
        try {
          const body = JSON.parse(raw.toString("utf8"));
          if (body?.partCount) partCount = Number(body.partCount);
          if (body?.contentType) ct = String(body.contentType);
        } catch (_) {}
      }
      if (!uploadId || !Number.isInteger(partCount) || partCount < 1 || partCount > 64) {
        return send(req, res, 400, { error: "uploadId and partCount required" });
      }
      await stitchParts(key, uploadId, partCount, ct);
      return send(req, res, 200, { ok: true, key });
    }

    if (action === "abort") {
      const uploadId = String(url.searchParams.get("uploadId") || "");
      const partCount = Number(url.searchParams.get("partCount") || 32);
      if (uploadId) await abortStagedUpload(key, uploadId, partCount);
      return send(req, res, 200, { ok: true });
    }

    const body = await readBody(req);
    if (!body.byteLength) return send(req, res, 400, { error: "Empty body" });
    if (body.byteLength > MAX_PART) {
      return send(req, res, 413, {
        error: "File too large for single put — use multipart",
        code: "use_multipart",
      });
    }
    const ct =
      url.searchParams.get("contentType") ||
      req.headers["x-ebb-content-type"] ||
      (String(req.headers["content-type"] || "").startsWith("multipart/")
        ? "application/octet-stream"
        : req.headers["content-type"]) ||
      "application/octet-stream";
    await putObject(key, body, ct);
    return send(req, res, 200, { ok: true, key, bytes: body.byteLength });
  } catch (err) {
    console.error("[r2-put]", err);
    return send(req, res, 500, { error: err.message || "Upload failed" });
  }
}
