import { supabaseConfig } from "./config.js";

export const SITE = "https://mryeboah.study";
export const BRAND = "Docket by Mr. Yeboah";
export const PLAY_URL = "https://play.google.com/store/apps/details?id=study.mryeboah.docket";

const TYPE_LABELS = {
  slides: "Slides",
  notes: "Lecture notes",
  "past-questions": "Past paper",
  tutorials: "Tutorial",
  videos: "Video",
  shared: "Shared material",
};

export function typeLabel(type) {
  return TYPE_LABELS[type] || "Study material";
}

export function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function slugify(s) {
  return (
    String(s || "")
      .toLowerCase()
      .trim()
      .replace(/&/g, " and ")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60)
      .replace(/-+$/g, "") || "material"
  );
}

export function courseSlug(code) {
  const raw = String(code || "").trim().toLowerCase().replace(/\s+/g, "");
  if (!raw) return "general";
  const m = raw.match(/^([a-z]+)(\d+)/);
  return m ? `${m[1]}-${m[2]}` : slugify(raw);
}

export function cleanTitle(title, courseCode) {
  let s = String(title || "").trim();
  s = s.replace(/\.(pdf|pptx?|docx?|xlsx?|mp4|zip)$/i, "");
  s = s.replace(/[_]+/g, " ").replace(/\s+/g, " ").trim();
  if (courseCode) {
    const compact = String(courseCode).trim().replace(/\s+/g, "");
    const spaced = String(courseCode).trim();
    for (const c of [spaced, compact]) {
      const re = new RegExp(`^${c.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*[-–—:.]?\\s*`, "i");
      const next = s.replace(re, "");
      if (next && next !== s) {
        s = next;
        break;
      }
    }
  }
  return s.trim() || String(title || "").trim();
}

export function shortId(id) {
  return String(id || "").replace(/-/g, "").slice(0, 8).toLowerCase();
}

export function shareUrl(m) {
  return `${SITE}/s/${courseSlug(m.course_code)}/${slugify(cleanTitle(m.title, m.course_code))}~${shortId(m.id)}`;
}

export function parseShareId(...parts) {
  for (const raw of parts) {
    const m = String(raw || "").match(/~([0-9a-f]{6,32})$/i);
    if (m) return m[1].toLowerCase();
  }
  return null;
}

function padUuid(hex, fill) {
  const h = hex.padEnd(32, fill);
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

const FIELDS = "id,title,description,course_code,department,level,material_type,updated_at";

export async function fetchMaterial(idHex) {
  if (!idHex || !/^[0-9a-f]{6,32}$/.test(idHex)) return null;
  const { url, anonKey } = supabaseConfig();
  const range =
    idHex.length === 32
      ? `id=eq.${padUuid(idHex, "0")}`
      : `id=gte.${padUuid(idHex, "0")}&id=lte.${padUuid(idHex, "f")}`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 4000);
  try {
    const res = await fetch(
      `${url}/rest/v1/materials?select=${FIELDS}&published=eq.true&${range}&limit=2`,
      { headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` }, signal: ctrl.signal },
    );
    if (!res.ok) return null;
    const rows = await res.json();
    return Array.isArray(rows) && rows.length === 1 ? rows[0] : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export function cardFields(m) {
  const code = String(m.course_code || "").trim().toUpperCase();
  return {
    typeLabel: typeLabel(m.material_type),
    code,
    title: cleanTitle(m.title, m.course_code),
  };
}
