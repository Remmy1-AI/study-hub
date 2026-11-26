import { createClient } from "@supabase/supabase-js";
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from "./config.js";

const SUPABASE_URL = __SUPABASE_URL__ || PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = __SUPABASE_ANON_KEY__ || PUBLIC_SUPABASE_ANON_KEY;
const BUCKET = "materials";
const MAX_BYTES = 50 * 1024 * 1024;

const TYPES = [
  { id: "slides", name: "Slides" },
  { id: "notes", name: "Notes" },
  { id: "past-questions", name: "Past questions" },
  { id: "tutorials", name: "Tutorials" },
  { id: "videos", name: "Videos" },
  { id: "shared", name: "Other" },
];
const LEVELS = ["100", "200", "300", "400"];
const SEMESTERS = ["1", "2"];

// Must match allowed_mime_types on the `materials` bucket (supabase/schema_docket.sql).
const MIME_BY_EXT = {
  pdf: "application/pdf",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  txt: "text/plain",
  md: "text/markdown",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  mp4: "video/mp4",
};
const ACCEPT = Object.keys(MIME_BY_EXT).map((e) => "." + e).join(",");

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

const state = {
  sb: null,
  user: null,
  programmes: [],
  courses: [],
  materials: [],
};

function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function show(id, on) {
  const el = typeof id === "string" ? document.getElementById(id) : id;
  if (el) el.hidden = !on;
}

function setAlert(id, msg) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg || "";
  el.hidden = !msg;
}

function errorText(err, fallback) {
  if (!err) return fallback;
  if (err.code === "23503") return "This item is still in use. Remove what depends on it first.";
  if (err.code === "23505") return "That already exists.";
  return err.message || fallback;
}

function codeKey(code) {
  return String(code || "").toUpperCase().replace(/\s+/g, "");
}

function slug(text) {
  return String(text || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-");
}

function safeFileName(name) {
  const dot = name.lastIndexOf(".");
  const base = dot > 0 ? name.slice(0, dot) : name;
  const ext = dot > 0 ? name.slice(dot + 1).toLowerCase() : "";
  const cleanBase = base.replace(/[^A-Za-z0-9._-]+/g, "-").replace(/-+/g, "-").slice(0, 80) || "file";
  return ext ? `${cleanBase}.${ext}` : cleanBase;
}

function fileExt(name) {
  const dot = name.lastIndexOf(".");
  return dot > 0 ? name.slice(dot + 1).toLowerCase() : "";
}

function formatBytes(bytes) {
  if (!bytes) return "–";
  if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function typeName(id) {
  return TYPES.find((t) => t.id === id)?.name || "Other";
}

function programmeName(id) {
  const p = state.programmes.find((x) => x.id === id);
  return p ? p.short_name || p.name : id || "–";
}

function options(list, { selected = "", blank = null } = {}) {
  const head = blank != null ? `<option value="">${esc(blank)}</option>` : "";
  return (
    head +
    list
      .map((o) => `<option value="${esc(o.value)}"${o.value === selected ? " selected" : ""}>${esc(o.label)}</option>`)
      .join("")
  );
}

const programmeOptions = () => state.programmes.map((p) => ({ value: p.id, label: p.name }));
const typeOptions = () => TYPES.map((t) => ({ value: t.id, label: t.name }));
const levelOptions = () => LEVELS.map((l) => ({ value: l, label: `Level ${l}` }));
const semesterOptions = () => SEMESTERS.map((s) => ({ value: s, label: `Semester ${s}` }));

function fileUrl(row) {
  if (row.external_url) return row.external_url;
  if (row.download_url) return row.download_url;
  if ((row.source || "storage") === "storage" && row.file_path) {
    return state.sb.storage.from(BUCKET).getPublicUrl(row.file_path).data.publicUrl;
  }
  return "";
}

// ---------- panels ----------

function showPanel(name) {
  for (const p of ["loading", "setup", "login", "denied", "dash"]) show(`panel-${p}`, p === name);
  const signedIn = name === "dash" || name === "denied";
  show("btn-logout", signedIn);
  show("whoami", signedIn);
}

async function handleSession(session) {
  if (!session) {
    state.user = null;
    showPanel("login");
    return;
  }
  state.user = session.user;
  $("#whoami").textContent = session.user.email || session.user.phone || "Signed in";
  const { data: isAdmin, error } = await state.sb.rpc("is_admin");
  if (error || !isAdmin) {
    $("#denied-uid").textContent = session.user.id;
    showPanel("denied");
    return;
  }
  showPanel("dash");
  await refreshAll();
}

// ---------- data ----------

async function refreshAll() {
  setAlert("dash-error", "");
  const sb = state.sb;
  const [p, c, m] = await Promise.all([
    sb.from("programmes").select("*").order("sort_order").order("name"),
    sb.from("courses").select("*").order("sort_order").order("code"),
    sb.from("materials").select("*").order("created_at", { ascending: false }).limit(2000),
  ]);
  const failed = p.error || c.error || m.error;
  if (failed) {
    setAlert("dash-error", errorText(failed, "Could not load data."));
    return;
  }
  state.programmes = p.data || [];
  state.courses = c.data || [];
  state.materials = m.data || [];
  fillSelects();
  renderAll();
  loadStats();
}

async function loadStats() {
  const { data } = await state.sb.rpc("admin_stats");
  const stats = {
    materials: data?.materials ?? state.materials.length,
    downloads: data?.downloads ?? state.materials.reduce((n, r) => n + (r.download_count || 0), 0),
    shares: data?.shares ?? state.materials.reduce((n, r) => n + (r.share_count || 0), 0),
    courses: state.courses.length,
  };
  for (const [key, value] of Object.entries(stats)) {
    const el = $(`[data-stat="${key}"]`);
    if (el) el.textContent = Number(value).toLocaleString();
  }
}

// ---------- selects ----------

function fillSelects() {
  const keep = (sel) => $(sel)?.value || "";
  const progs = programmeOptions();

  $("#up-programme").innerHTML = options(progs, { selected: keep("#up-programme"), blank: "Choose…" });
  $("#co-programme").innerHTML = options(progs, { selected: keep("#co-programme"), blank: "Choose…" });
  $("#res-filter-programme").innerHTML = options(progs, { selected: keep("#res-filter-programme"), blank: "All programmes" });
  $("#co-filter-programme").innerHTML = options(progs, { selected: keep("#co-filter-programme"), blank: "All programmes" });
  $("#res-filter-type").innerHTML = options(typeOptions(), { selected: keep("#res-filter-type"), blank: "All types" });

  if (!$("#up-type").options.length) {
    $("#up-type").innerHTML = options(typeOptions(), { selected: "slides" });
    $("#up-level").innerHTML = options(levelOptions(), { blank: "—" });
    $("#co-level").innerHTML = options(levelOptions(), { blank: "—" });
    $("#co-semester").innerHTML = options(semesterOptions(), { blank: "—" });
    $("#up-file").setAttribute("accept", ACCEPT);
  }
  fillCourseList();
}

function courseCodesFor(programmeId) {
  const codes = new Map();
  for (const c of state.courses) {
    if (!programmeId || c.programme_id === programmeId) codes.set(codeKey(c.code), { code: c.code, title: c.title });
  }
  for (const m of state.materials) {
    if (!m.course_code || (programmeId && m.department !== programmeId)) continue;
    const key = codeKey(m.course_code);
    if (!codes.has(key)) codes.set(key, { code: m.course_code, title: "" });
  }
  return [...codes.values()].sort((a, b) => a.code.localeCompare(b.code));
}

function fillCourseList() {
  const programmeId = $("#up-programme").value;
  $("#up-course-list").innerHTML = courseCodesFor(programmeId)
    .map((c) => `<option value="${esc(c.code)}">${esc(c.title)}</option>`)
    .join("");
}

// ---------- render ----------

function renderAll() {
  renderResources();
  renderCourses();
  renderProgrammes();
}

function shareLink(m) {
  const slug = (s) =>
    String(s || "")
      .toLowerCase()
      .replace(/&/g, " and ")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60)
      .replace(/-+$/g, "") || "material";
  const code = String(m.course_code || "").trim().toLowerCase().replace(/\s+/g, "");
  const cm = code.match(/^([a-z]+)(\d+)/);
  const course = !code ? "general" : cm ? `${cm[1]}-${cm[2]}` : slug(code);
  let title = String(m.title || "").replace(/\.(pdf|pptx?|docx?|xlsx?|mp4|zip)$/i, "").replace(/_+/g, " ").trim();
  if (m.course_code) {
    const stripped = title.replace(new RegExp(`^${String(m.course_code).trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s*")}\\s*[-–—:.]?\\s*`, "i"), "");
    if (stripped) title = stripped;
  }
  return `https://mryeboah.study/s/${course}/${slug(title)}~${String(m.id).replace(/-/g, "").slice(0, 8)}`;
}

function renderResources() {
  const programmeId = $("#res-filter-programme").value;
  const type = $("#res-filter-type").value;
  const q = $("#res-filter-q").value.trim().toLowerCase();
  const rows = state.materials.filter((m) => {
    if (programmeId && m.department !== programmeId) return false;
    if (type && (m.material_type || "shared") !== type) return false;
    if (q && !`${m.title} ${m.course_code || ""}`.toLowerCase().includes(q)) return false;
    return true;
  });

  $("#res-tbody").innerHTML = rows
    .map(
      (m) => `<tr>
        <td><div class="cell-title">${esc(m.title)}</div><div class="cell-sub">${esc(m.file_name)}</div></td>
        <td><div>${esc(m.course_code || "General")}</div><div class="cell-sub">${esc(programmeName(m.department))}${m.level ? " · L" + esc(m.level) : ""}</div></td>
        <td>${esc(typeName(m.material_type))}</td>
        <td>${esc(formatBytes(m.file_size))}</td>
        <td><span class="pill ${m.published ? "pill-on" : "pill-off"}">${m.published ? "Published" : "Hidden"}</span></td>
        <td class="actions">
          <button class="link" data-act="open" data-id="${esc(m.id)}" type="button">Open</button>
          ${m.published ? `<button class="link" data-act="share" data-id="${esc(m.id)}" type="button">Copy link</button>` : ""}
          <button class="link" data-act="edit" data-id="${esc(m.id)}" type="button">Edit</button>
          <button class="link" data-act="toggle" data-id="${esc(m.id)}" type="button">${m.published ? "Hide" : "Publish"}</button>
          <button class="link danger" data-act="delete" data-id="${esc(m.id)}" type="button">Delete</button>
        </td>
      </tr>`,
    )
    .join("");
  show("res-empty", rows.length === 0);
}

function renderCourses() {
  const programmeId = $("#co-filter-programme").value;
  const rows = state.courses.filter((c) => !programmeId || c.programme_id === programmeId);
  const countFor = (c) =>
    state.materials.filter((m) => m.department === c.programme_id && codeKey(m.course_code) === codeKey(c.code)).length;

  $("#co-tbody").innerHTML = rows
    .map(
      (c) => `<tr>
        <td><strong>${esc(c.code)}</strong></td>
        <td>${esc(c.title)}</td>
        <td>${esc(programmeName(c.programme_id))}</td>
        <td>${c.level ? "L" + esc(c.level) : "–"}${c.semester ? " · S" + esc(c.semester) : ""}</td>
        <td>${countFor(c)}</td>
        <td><span class="pill ${c.published ? "pill-on" : "pill-off"}">${c.published ? "Published" : "Hidden"}</span></td>
        <td class="actions">
          <button class="link" data-act="edit" data-id="${esc(c.id)}" type="button">Edit</button>
          <button class="link danger" data-act="delete" data-id="${esc(c.id)}" type="button">Delete</button>
        </td>
      </tr>`,
    )
    .join("");
  show("co-empty", rows.length === 0);
}

function renderProgrammes() {
  $("#pr-tbody").innerHTML = state.programmes
    .map((p) => {
      const courses = state.courses.filter((c) => c.programme_id === p.id).length;
      const resources = state.materials.filter((m) => m.department === p.id).length;
      return `<tr>
        <td><strong>${esc(p.code || "–")}</strong></td>
        <td>${esc(p.name)}</td>
        <td><code>${esc(p.id)}</code></td>
        <td>${courses}</td>
        <td>${resources}</td>
        <td>${esc(p.sort_order)}</td>
        <td class="actions">
          <button class="link" data-act="edit" data-id="${esc(p.id)}" type="button">Edit</button>
          <button class="link danger" data-act="delete" data-id="${esc(p.id)}" type="button">Delete</button>
        </td>
      </tr>`;
    })
    .join("");
}

// ---------- tabs ----------

function setTab(id) {
  const tab = ["resources", "courses", "programmes"].includes(id) ? id : "resources";
  $$("#tabs .tab").forEach((b) => {
    const on = b.dataset.tab === tab;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-selected", String(on));
  });
  $$("[data-panel]").forEach((p) => (p.hidden = p.dataset.panel !== tab));
  try {
    sessionStorage.setItem("mryeboah-admin-tab", tab);
  } catch {}
}

// ---------- storage ----------

function validateFile(file) {
  if (!file) return "Choose a file.";
  if (file.size > MAX_BYTES) return "File is larger than 50 MB.";
  if (!MIME_BY_EXT[fileExt(file.name)]) return `Unsupported file type. Allowed: ${ACCEPT.replaceAll(",", ", ")}`;
  return "";
}

async function uploadFile(file, programmeId, courseCode) {
  const folder = `${programmeId || "general"}/${slug(courseCode) || "general"}`;
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeFileName(file.name)}`;
  const contentType = MIME_BY_EXT[fileExt(file.name)] || file.type || undefined;
  const { error } = await state.sb.storage.from(BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType,
  });
  if (error) throw error;
  return { path, contentType };
}

async function removeStored(row) {
  if ((row.source || "storage") !== "storage" || !row.file_path) return;
  await state.sb.storage.from(BUCKET).remove([row.file_path]);
}

// ---------- forms ----------

function setProgress(ratio) {
  show("upload-progress", ratio != null);
  $("#upload-progress-bar").style.width = `${Math.round((ratio || 0) * 100)}%`;
}

async function onUpload(e) {
  e.preventDefault();
  setAlert("upload-error", "");
  setAlert("upload-ok", "");
  const file = $("#up-file").files[0];
  const programmeId = $("#up-programme").value;
  const courseCode = $("#up-course").value.trim().toUpperCase().replace(/\s+/g, " ");
  const title = $("#up-title").value.trim();
  const invalid = validateFile(file) || (!programmeId && "Choose a programme.") || (!courseCode && "Enter a course code.");
  if (invalid) return setAlert("upload-error", invalid);

  const btn = $("#upload-submit");
  btn.disabled = true;
  btn.textContent = "Uploading…";
  setProgress(0.15);
  let uploaded = null;
  try {
    uploaded = await uploadFile(file, programmeId, courseCode);
    setProgress(0.85);
    const { error } = await state.sb.from("materials").insert({
      title,
      description: $("#up-description").value.trim() || null,
      course_code: courseCode,
      department: programmeId,
      level: $("#up-level").value || null,
      material_type: $("#up-type").value,
      file_path: uploaded.path,
      file_name: file.name,
      mime_type: uploaded.contentType || null,
      file_size: file.size,
      published: $("#up-published").checked,
      source: "storage",
      uploaded_by: state.user?.id || null,
    });
    if (error) throw error;
    setProgress(1);
    setAlert("upload-ok", `Uploaded “${title}”.`);
    const keepProgramme = programmeId;
    $("#upload-form").reset();
    $("#up-programme").value = keepProgramme;
    $("#up-published").checked = true;
    await refreshAll();
  } catch (err) {
    if (uploaded) await state.sb.storage.from(BUCKET).remove([uploaded.path]).catch(() => {});
    setAlert("upload-error", errorText(err, "Upload failed."));
  } finally {
    btn.disabled = false;
    btn.textContent = "Upload";
    setTimeout(() => setProgress(null), 900);
  }
}

async function onAddCourse(e) {
  e.preventDefault();
  setAlert("course-error", "");
  const programmeId = $("#co-programme").value;
  const code = $("#co-code").value.trim().toUpperCase().replace(/\s+/g, " ");
  if (!programmeId) return setAlert("course-error", "Choose a programme.");
  const { error } = await state.sb.from("courses").insert({
    id: `${programmeId}--${codeKey(code).toLowerCase()}`,
    programme_id: programmeId,
    code,
    title: $("#co-title").value.trim(),
    level: $("#co-level").value || null,
    semester: $("#co-semester").value || null,
    sort_order: Number($("#co-sort").value) || 100,
    published: $("#co-published").checked,
  });
  if (error) return setAlert("course-error", errorText(error, "Could not add course."));
  $("#course-form").reset();
  $("#co-programme").value = programmeId;
  $("#co-published").checked = true;
  await refreshAll();
}

async function onAddProgramme(e) {
  e.preventDefault();
  setAlert("programme-error", "");
  const id = slug($("#pr-id").value);
  if (!id) return setAlert("programme-error", "Enter an id like “electrical”.");
  const { error } = await state.sb.from("programmes").insert({
    id,
    name: $("#pr-name").value.trim(),
    short_name: $("#pr-short").value.trim() || null,
    code: $("#pr-code").value.trim().toUpperCase() || null,
    sort_order: Number($("#pr-sort").value) || 100,
  });
  if (error) return setAlert("programme-error", errorText(error, "Could not add programme."));
  $("#programme-form").reset();
  delete $("#pr-id").dataset.touched;
  await refreshAll();
}

// ---------- edit dialog ----------

let editSubmit = null;

function fieldHtml(f) {
  const id = `edit-${f.name}`;
  const span = f.span ? " span-2" : "";
  const req = f.required ? " required" : "";
  if (f.type === "checkbox") {
    return `<label class="check${span}"><input id="${id}" type="checkbox"${f.value ? " checked" : ""}> ${esc(f.label)}</label>`;
  }
  let input;
  if (f.type === "select") {
    input = `<select id="${id}"${req}>${options(f.options, { selected: f.value ?? "", blank: f.blank ?? null })}</select>`;
  } else if (f.type === "textarea") {
    input = `<textarea id="${id}" rows="2">${esc(f.value)}</textarea>`;
  } else if (f.type === "file") {
    input = `<input id="${id}" type="file" accept="${ACCEPT}">`;
  } else {
    const list = f.list ? ` list="${f.list}"` : "";
    const ro = f.readonly ? " readonly" : "";
    input = `<input id="${id}" type="${f.type || "text"}" value="${esc(f.value)}"${req}${list}${ro}>`;
  }
  const hint = f.hint ? ` <span class="opt">${esc(f.hint)}</span>` : "";
  return `<label class="field${span}"><span>${esc(f.label)}${hint}</span>${input}</label>`;
}

function openEdit(title, fields, onSave) {
  $("#edit-heading").textContent = title;
  $("#edit-fields").innerHTML = fields.map(fieldHtml).join("");
  setAlert("edit-error", "");
  editSubmit = async () => {
    const values = {};
    for (const f of fields) {
      const el = document.getElementById(`edit-${f.name}`);
      values[f.name] = f.type === "checkbox" ? el.checked : f.type === "file" ? el.files[0] || null : el.value.trim();
    }
    await onSave(values);
  };
  $("#edit-dialog").showModal();
}

async function onEditSubmit(e) {
  e.preventDefault();
  if (!editSubmit) return;
  const btn = $("#edit-save");
  btn.disabled = true;
  setAlert("edit-error", "");
  try {
    await editSubmit();
    $("#edit-dialog").close();
    await refreshAll();
  } catch (err) {
    setAlert("edit-error", errorText(err, "Could not save."));
  } finally {
    btn.disabled = false;
  }
}

function editResource(row) {
  openEdit(
    "Edit resource",
    [
      { name: "title", label: "Title", value: row.title, required: true, span: true },
      { name: "department", label: "Programme", type: "select", options: programmeOptions(), value: row.department || "", required: true },
      { name: "course_code", label: "Course code", value: row.course_code || "", required: true, list: "up-course-list" },
      { name: "material_type", label: "Type", type: "select", options: typeOptions(), value: row.material_type || "shared" },
      { name: "level", label: "Level", type: "select", options: levelOptions(), value: row.level || "", blank: "—" },
      { name: "description", label: "Description", type: "textarea", value: row.description || "", span: true },
      { name: "file", label: "Replace file", type: "file", hint: "optional", span: true },
      { name: "published", label: "Published", type: "checkbox", value: row.published },
    ],
    async (v) => {
      const patch = {
        title: v.title,
        department: v.department,
        course_code: v.course_code.toUpperCase().replace(/\s+/g, " "),
        material_type: v.material_type,
        level: v.level || null,
        description: v.description || null,
        published: v.published,
      };
      let uploaded = null;
      if (v.file) {
        const invalid = validateFile(v.file);
        if (invalid) throw new Error(invalid);
        uploaded = await uploadFile(v.file, patch.department, patch.course_code);
        Object.assign(patch, {
          file_path: uploaded.path,
          file_name: v.file.name,
          mime_type: uploaded.contentType || null,
          file_size: v.file.size,
          source: "storage",
          external_url: null,
          download_url: null,
        });
      }
      const { error } = await state.sb.from("materials").update(patch).eq("id", row.id);
      if (error) {
        if (uploaded) await state.sb.storage.from(BUCKET).remove([uploaded.path]).catch(() => {});
        throw error;
      }
      if (uploaded) await removeStored(row).catch(() => {});
    },
  );
}

function editCourse(row) {
  openEdit(
    "Edit course",
    [
      { name: "programme_id", label: "Programme", type: "select", options: programmeOptions(), value: row.programme_id, required: true },
      { name: "code", label: "Code", value: row.code, required: true },
      { name: "title", label: "Title", value: row.title, required: true, span: true },
      { name: "level", label: "Level", type: "select", options: levelOptions(), value: row.level || "", blank: "—" },
      { name: "semester", label: "Semester", type: "select", options: semesterOptions(), value: row.semester || "", blank: "—" },
      { name: "sort_order", label: "Sort order", type: "number", value: row.sort_order },
      { name: "published", label: "Published", type: "checkbox", value: row.published },
    ],
    async (v) => {
      const { error } = await state.sb
        .from("courses")
        .update({
          programme_id: v.programme_id,
          code: v.code.toUpperCase().replace(/\s+/g, " "),
          title: v.title,
          level: v.level || null,
          semester: v.semester || null,
          sort_order: Number(v.sort_order) || 100,
          published: v.published,
        })
        .eq("id", row.id);
      if (error) throw error;
    },
  );
}

function editProgramme(row) {
  openEdit(
    "Edit programme",
    [
      { name: "name", label: "Name", value: row.name, required: true, span: true },
      { name: "id", label: "Id", value: row.id, readonly: true, hint: "fixed" },
      { name: "short_name", label: "Short name", value: row.short_name || "" },
      { name: "code", label: "Code", value: row.code || "" },
      { name: "sort_order", label: "Sort order", type: "number", value: row.sort_order },
    ],
    async (v) => {
      const { error } = await state.sb
        .from("programmes")
        .update({
          name: v.name,
          short_name: v.short_name || null,
          code: v.code.toUpperCase() || null,
          sort_order: Number(v.sort_order) || 100,
        })
        .eq("id", row.id);
      if (error) throw error;
    },
  );
}

// ---------- row actions ----------

async function run(fn) {
  setAlert("dash-error", "");
  try {
    await fn();
  } catch (err) {
    setAlert("dash-error", errorText(err, "Action failed."));
  }
}

function onResourceAction(e) {
  const btn = e.target.closest("[data-act]");
  if (!btn) return;
  const row = state.materials.find((m) => m.id === btn.dataset.id);
  if (!row) return;
  const act = btn.dataset.act;
  if (act === "open") {
    const url = fileUrl(row);
    if (url) window.open(url, "_blank", "noopener");
  } else if (act === "share") {
    const link = shareLink(row);
    navigator.clipboard
      .writeText(link)
      .then(() => {
        btn.textContent = "Copied";
        setTimeout(() => (btn.textContent = "Copy link"), 1500);
      })
      .catch(() => window.prompt("Copy this link", link));
  } else if (act === "edit") {
    fillCourseList();
    editResource(row);
  } else if (act === "toggle") {
    run(async () => {
      const { error } = await state.sb.from("materials").update({ published: !row.published }).eq("id", row.id);
      if (error) throw error;
      await refreshAll();
    });
  } else if (act === "delete") {
    if (!confirm(`Delete “${row.title}” and its file? Students will lose access in Docket.`)) return;
    run(async () => {
      const { error } = await state.sb.from("materials").delete().eq("id", row.id);
      if (error) throw error;
      await removeStored(row).catch(() => {});
      await refreshAll();
    });
  }
}

function onCourseAction(e) {
  const btn = e.target.closest("[data-act]");
  if (!btn) return;
  const row = state.courses.find((c) => c.id === btn.dataset.id);
  if (!row) return;
  if (btn.dataset.act === "edit") return editCourse(row);
  if (btn.dataset.act === "delete") {
    if (!confirm(`Delete course ${row.code}? Its resources stay and still appear under this code in Docket.`)) return;
    run(async () => {
      const { error } = await state.sb.from("courses").delete().eq("id", row.id);
      if (error) throw error;
      await refreshAll();
    });
  }
}

function onProgrammeAction(e) {
  const btn = e.target.closest("[data-act]");
  if (!btn) return;
  const row = state.programmes.find((p) => p.id === btn.dataset.id);
  if (!row) return;
  if (btn.dataset.act === "edit") return editProgramme(row);
  if (btn.dataset.act === "delete") {
    const courses = state.courses.filter((c) => c.programme_id === row.id).length;
    const resources = state.materials.filter((m) => m.department === row.id).length;
    if (courses || resources) {
      setAlert("dash-error", `${row.name} still has ${courses} course(s) and ${resources} resource(s). Move or delete them first.`);
      return;
    }
    if (!confirm(`Delete programme ${row.name}?`)) return;
    run(async () => {
      const { error } = await state.sb.from("programmes").delete().eq("id", row.id);
      if (error) throw error;
      await refreshAll();
    });
  }
}

// ---------- boot ----------

function bind() {
  $("#tabs").addEventListener("click", (e) => {
    const b = e.target.closest(".tab");
    if (b) setTab(b.dataset.tab);
  });

  $("#login-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    setAlert("login-error", "");
    const btn = $("#login-submit");
    btn.disabled = true;
    const { error } = await state.sb.auth.signInWithPassword({
      email: $("#login-email").value.trim(),
      password: $("#login-password").value,
    });
    btn.disabled = false;
    if (error) setAlert("login-error", error.message || "Sign-in failed.");
  });

  $("#btn-logout").addEventListener("click", () => state.sb.auth.signOut());
  $("#btn-copy-uid").addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText($("#denied-uid").textContent);
      $("#btn-copy-uid").textContent = "Copied";
    } catch {}
  });

  $("#upload-form").addEventListener("submit", onUpload);
  $("#course-form").addEventListener("submit", onAddCourse);
  $("#programme-form").addEventListener("submit", onAddProgramme);
  $("#up-programme").addEventListener("change", fillCourseList);

  $("#up-course").addEventListener("change", () => {
    const programmeId = $("#up-programme").value;
    const course = state.courses.find(
      (c) => c.programme_id === programmeId && codeKey(c.code) === codeKey($("#up-course").value),
    );
    if (course?.level && !$("#up-level").value) $("#up-level").value = course.level;
  });

  $("#pr-name").addEventListener("input", () => {
    if ($("#pr-id").dataset.touched) return;
    $("#pr-id").value = slug($("#pr-name").value.replace(/\bengineering\b/i, ""));
  });
  $("#pr-id").addEventListener("input", () => {
    $("#pr-id").dataset.touched = $("#pr-id").value ? "1" : "";
  });

  $("#res-filter-programme").addEventListener("change", renderResources);
  $("#res-filter-type").addEventListener("change", renderResources);
  $("#res-filter-q").addEventListener("input", renderResources);
  $("#co-filter-programme").addEventListener("change", renderCourses);

  $("#res-tbody").addEventListener("click", onResourceAction);
  $("#co-tbody").addEventListener("click", onCourseAction);
  $("#pr-tbody").addEventListener("click", onProgrammeAction);

  $("#edit-form").addEventListener("submit", onEditSubmit);
  $("#edit-cancel").addEventListener("click", () => $("#edit-dialog").close());
}

async function boot() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    showPanel("setup");
    return;
  }
  state.sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, storageKey: "mryeboah-admin-auth" },
  });
  bind();

  let saved = "resources";
  try {
    saved = sessionStorage.getItem("mryeboah-admin-tab") || saved;
  } catch {}
  setTab(saved);

  const { data } = await state.sb.auth.getSession();
  await handleSession(data.session);

  state.sb.auth.onAuthStateChange((event, session) => {
    if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
      // Defer: Supabase warns against awaiting client calls inside this callback.
      setTimeout(() => handleSession(session), 0);
    }
  });
}

boot();
