/* Ace with Mr. Yeboah — catalog shell.
   Courses + materials hydrate from Supabase when configured;
   otherwise sample rows keep the UI browsable. */

const EBB = {
  brand: {
    short: "Ace with Mr. Yeboah",
    name: "Ace with Mr. Yeboah",
    tagline: "Learn • Share • Succeed",
    purpose:
      "Study resources for every UMAT student — slides, notes, past questions, and more — curated by Frank Yeboah.",
    closing: "From Frank, for UMAT.",
  },

  /** Built-in programmes; live rows from Supabase programmes table merge on top. */
  departments: [
    { id: "electrical", name: "Electrical", short: "Electrical", code: "EE", icon: "⚡", count: 0 },
    { id: "mechanical", name: "Mechanical", short: "Mechanical", code: "ME", icon: "⚙", count: 0 },
    { id: "petroleum", name: "Petroleum", short: "Petroleum", code: "PE", icon: "🛢", count: 0 },
    { id: "mining", name: "Mining", short: "Mining", code: "MN", icon: "⛏", count: 0 },
    { id: "geology", name: "Geology", short: "Geology", code: "GL", icon: "🪨", count: 0 },
    { id: "geomatics", name: "Geomatics", short: "Geomatics", code: "GM", icon: "🗺", count: 0 },
    { id: "logistics", name: "Logistics and Transport", short: "Logistics", code: "LT", icon: "🚚", count: 0 },
    { id: "computer-science", name: "Computer Science", short: "Computer Science", code: "CS", icon: "💻", count: 0 },
    { id: "data-science", name: "Data Science", short: "Data Science", code: "DS", icon: "📊", count: 0 },
    { id: "robotics-ai", name: "Robotics and AI", short: "Robotics & AI", code: "RAI", icon: "🤖", count: 0 },
    { id: "cyber-security", name: "Cyber Security", short: "Cyber Security", code: "CYB", icon: "🔐", count: 0 },
    { id: "information-systems", name: "Information Systems", short: "Info Systems", code: "IS", icon: "🖥", count: 0 },
    { id: "environmental-safety", name: "Environmental and Safety", short: "Env & Safety", code: "ES", icon: "🌿", count: 0 },
    { id: "land-administration", name: "Land Administration", short: "Land Admin", code: "LA", icon: "🏛", count: 0 },
    { id: "telecommunication", name: "Telecommunication", short: "Telecom", code: "TC", icon: "📡", count: 0 },
    { id: "spatial-planning", name: "Spatial Planning", short: "Spatial Planning", code: "SP", icon: "📐", count: 0 },
    { id: "minerals", name: "Minerals", short: "Minerals", code: "MI", icon: "💎", count: 0 },
  ],

  levels: [
    { id: "100", name: "Level 100", year: 1 },
    { id: "200", name: "Level 200", year: 2 },
    { id: "300", name: "Level 300", year: 3 },
    { id: "400", name: "Level 400", year: 4 },
  ],

  semesters: [
    { id: "1", name: "Semester 1" },
    { id: "2", name: "Semester 2" },
  ],

  materialTypes: [
    { id: "slides", name: "Course Slides", icon: "📊" },
    { id: "notes", name: "Lecture Notes", icon: "📝" },
    { id: "past-questions", name: "Past Questions", icon: "📋" },
    { id: "tutorials", name: "Tutorials", icon: "🧮" },
    { id: "videos", name: "Videos", icon: "🎬" },
    { id: "shared", name: "Shared by Students", icon: "🤝" },
  ],

  /** Populated by EBB.hydrateFromLive() */
  courses: [],
  materials: [],
  liveReady: false,
};

/** Sample catalog used when Supabase is not configured yet. */
EBB.sampleMaterials = [
  {
    id: "sample-ee-circuits-slides",
    title: "Circuit Theory — Lecture Slides (Sample)",
    course_code: "EE 201",
    material_type: "slides",
    department: "electrical",
    level: "200",
    description: "Sample pack so the site is browsable before live uploads.",
    file_name: "ee201-circuit-theory-slides.pdf",
    file_path: "",
    file_size: 2400000,
    mime_type: "application/pdf",
    download_count: 128,
    share_count: 12,
    created_at: "2026-11-01T10:00:00Z",
    published: true,
    source: "sample",
  },
  {
    id: "sample-ee-pq",
    title: "EE 201 Past Questions 2022–2025 (Sample)",
    course_code: "EE 201",
    material_type: "past-questions",
    department: "electrical",
    level: "200",
    description: "Sample past questions set for Ace with Mr. Yeboah.",
    file_name: "ee201-past-questions.pdf",
    file_path: "",
    file_size: 1800000,
    mime_type: "application/pdf",
    download_count: 340,
    share_count: 41,
    created_at: "2026-11-05T10:00:00Z",
    published: true,
    source: "sample",
  },
  {
    id: "sample-me-notes",
    title: "Engineering Mechanics Notes (Sample)",
    course_code: "ME 151",
    material_type: "notes",
    department: "mechanical",
    level: "100",
    description: "Sample notes for Mechanical students.",
    file_name: "me151-mechanics-notes.pdf",
    file_path: "",
    file_size: 3100000,
    mime_type: "application/pdf",
    download_count: 96,
    share_count: 8,
    created_at: "2026-10-28T10:00:00Z",
    published: true,
    source: "sample",
  },
  {
    id: "sample-cs-dsa",
    title: "Data Structures Tutorial Set (Sample)",
    course_code: "CS 212",
    material_type: "tutorials",
    department: "computer-science",
    level: "200",
    description: "Sample tutorials for Computer Science.",
    file_name: "cs212-dsa-tutorials.pdf",
    file_path: "",
    file_size: 1200000,
    mime_type: "application/pdf",
    download_count: 210,
    share_count: 19,
    created_at: "2026-11-08T10:00:00Z",
    published: true,
    source: "sample",
  },
  {
    id: "sample-mn-notes",
    title: "Introduction to Mining — Lecture Notes (Sample)",
    course_code: "MN 101",
    material_type: "notes",
    department: "mining",
    level: "100",
    description: "Sample notes for Mining.",
    file_name: "mn101-intro-notes.pdf",
    file_path: "",
    file_size: 900000,
    mime_type: "application/pdf",
    download_count: 74,
    share_count: 5,
    created_at: "2026-10-20T10:00:00Z",
    published: true,
    source: "sample",
  },
  {
    id: "sample-ds-slides",
    title: "Probability for Data Science — Slides (Sample)",
    course_code: "DS 205",
    material_type: "slides",
    department: "data-science",
    level: "200",
    description: "Sample slides for Data Science.",
    file_name: "ds205-probability-slides.pdf",
    file_path: "",
    file_size: 2600000,
    mime_type: "application/pdf",
    download_count: 155,
    share_count: 14,
    created_at: "2026-11-10T10:00:00Z",
    published: true,
    source: "sample",
  },
  {
    id: "sample-pe-pq",
    title: "Petroleum Engineering Mid-Sem Pack (Sample)",
    course_code: "PE 301",
    material_type: "past-questions",
    department: "petroleum",
    level: "300",
    description: "Sample mid-sem pack for Petroleum.",
    file_name: "pe301-midsem.pdf",
    file_path: "",
    file_size: 1500000,
    mime_type: "application/pdf",
    download_count: 88,
    share_count: 7,
    created_at: "2026-11-12T10:00:00Z",
    published: true,
    source: "sample",
  },
  {
    id: "sample-gl-shared",
    title: "Field Mapping Checklist (Sample)",
    course_code: "GL 220",
    material_type: "shared",
    department: "geology",
    level: "200",
    description: "Sample shared field guide for Geology.",
    file_name: "gl220-field-checklist.pdf",
    file_path: "",
    file_size: 400000,
    mime_type: "application/pdf",
    download_count: 52,
    share_count: 3,
    created_at: "2026-09-30T10:00:00Z",
    published: true,
    source: "sample",
  },
];

function slugifyCode(code) {
  return String(code || "unknown")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "unknown";
}

function titleCaseWords(s) {
  return String(s || "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Derive a human course name from materials/year-N/FOLDER/... */
EBB.courseNameFromPath = (filePath, fallbackCode) => {
  const parts = String(filePath || "").replace(/\\/g, "/").split("/");
  const folder = parts.length >= 3 ? parts[2] : "";
  if (!folder) return fallbackCode || "Course";
  const m = folder.match(/^[A-Za-z]+-\d{2,4}-(.+)$/);
  if (m) return titleCaseWords(m[1]);
  if (/^extras/i.test(folder) || /^semester/i.test(folder)) return titleCaseWords(folder);
  return titleCaseWords(folder);
};

EBB.normalizeCode = (code) => String(code || "").toLowerCase().replace(/\s+/g, "");

/**
 * Hydrate courses + materials from live Supabase rows (or sample rows).
 * @param {Array} uiMaterials materials already mapped via EBBApi.toUiMaterial
 */
EBB.hydrateFromLive = (uiMaterials) => {
  const list = Array.isArray(uiMaterials) ? uiMaterials : [];
  const byCode = new Map();

  list.forEach((m) => {
    const code = (m.course_code || "").trim() || "GEN";
    const key = EBB.normalizeCode(code) || "gen";
    let course = byCode.get(key);
    if (!course) {
      const id = slugifyCode(code);
      const name = EBB.courseNameFromPath(m.file_path, code);
      course = {
        id,
        code,
        name: name === code ? `${code} Materials` : name,
        department: m.department || "electrical",
        level: m.level && m.level !== "unknown" ? String(m.level) : "100",
        semester: "1",
        lecturer: "Ace with Mr. Yeboah Library",
        accessCount: 0,
        description: `Materials for ${code}.`,
        materialCount: 0,
      };
      byCode.set(key, course);
    }
    course.materialCount += 1;
    course.accessCount += m.downloads || 0;
    const richer = EBB.courseNameFromPath(m.file_path, code);
    if (richer && richer.length > course.name.length) course.name = richer;
    if (m.department) course.department = m.department;
    if (m.level && m.level !== "unknown") course.level = String(m.level);
    m.courseId = course.id;
  });

  EBB.courses = [...byCode.values()].sort((a, b) =>
    a.code.localeCompare(b.code, undefined, { numeric: true })
  );
  EBB.materials = list.map((m) => {
    const typeMeta = EBB.getTypeMeta(m.type);
    return {
      ...m,
      topic: typeMeta ? typeMeta.name : m.type || "Material",
      live: true,
    };
  });

  EBB.departments.forEach((d) => {
    d.count = EBB.materials.filter((m) => m.department === d.id).length;
  });

  EBB.liveReady = true;
  return { courses: EBB.courses.length, materials: EBB.materials.length };
};

EBB.slugifyProgrammeId = (name) =>
  String(name || "")
    .toLowerCase()
    .trim()
    .replace(/&/g, " and ")
    .replace(/engineering$/i, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-") || "programme";

EBB.applyProgrammes = (rows) => {
  const prevCounts = new Map(
    (EBB.departments || []).map((d) => [d.id, d.count || 0])
  );
  const builtins = (EBB._builtinDepartments || EBB.departments || []).slice();
  if (!EBB._builtinDepartments) {
    EBB._builtinDepartments = builtins.map((d) => ({ ...d, count: 0 }));
  }

  const byId = new Map();
  EBB._builtinDepartments.forEach((d) => {
    byId.set(d.id, { ...d, count: prevCounts.get(d.id) || 0 });
  });

  (Array.isArray(rows) ? rows : []).forEach((row, i) => {
    const id = String(row.id || "").trim();
    if (!id) return;
    const name = String(row.name || id).trim();
    const short =
      String(row.short_name || row.short || "").trim() ||
      name.replace(/\s+Engineering$/i, "") ||
      name;
    const code = String(row.code || "").trim().toUpperCase();
    const existing = byId.get(id);
    byId.set(id, {
      id,
      name,
      short,
      code: code || (existing && existing.code) || id.slice(0, 4).toUpperCase(),
      icon: (existing && existing.icon) || "📘",
      count: prevCounts.get(id) || 0,
      sort_order:
        row.sort_order != null
          ? Number(row.sort_order)
          : existing && existing.sort_order != null
            ? existing.sort_order
            : 100 + i,
      live: true,
    });
  });

  EBB.departments = [...byId.values()].sort((a, b) => {
    const ao = a.sort_order != null ? a.sort_order : 999;
    const bo = b.sort_order != null ? b.sort_order : 999;
    if (ao !== bo) return ao - bo;
    return String(a.name).localeCompare(String(b.name));
  });
  return EBB.departments;
};

/* ---------- Helper accessors ---------- */
EBB.getDepartment = (id) => EBB.departments.find((d) => d.id === id);
EBB.getCourse = (id) => EBB.courses.find((c) => c.id === id);
EBB.getCourseByCode = (code) => {
  const n = EBB.normalizeCode(code);
  if (!n) return null;
  return EBB.courses.find((c) => EBB.normalizeCode(c.code) === n);
};
EBB.getMaterialsForCourse = (courseId) =>
  EBB.materials.filter((m) => m.courseId === courseId);
EBB.getTypeMeta = (typeId) => EBB.materialTypes.find((t) => t.id === typeId);

EBB.coursesForDepartment = (deptId) =>
  EBB.courses.filter((c) => c.department === deptId);

EBB.coursesForDeptLevel = (deptId, levelId) =>
  EBB.courses.filter((c) => c.department === deptId && c.level === levelId);

EBB.actualMaterialCount = (deptId) =>
  EBB.materials.filter((m) => m.department === deptId).length;

EBB.search = (query) => {
  const q = (query || "").toLowerCase().trim();
  if (!q) return { courses: [], materials: [], query: q };

  const courseHits = EBB.courses.filter(
    (c) =>
      c.code.toLowerCase().includes(q) ||
      c.name.toLowerCase().includes(q) ||
      (c.description || "").toLowerCase().includes(q)
  );

  const materialHits = EBB.materials.filter((m) => {
    const course = EBB.getCourse(m.courseId);
    const typeMeta = EBB.getTypeMeta(m.type);
    const hay = [
      m.topic,
      m.title,
      m.type,
      m.course_code,
      m.fileName,
      typeMeta && typeMeta.name,
      course && course.code,
      course && course.name,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return hay.includes(q);
  });

  return { courses: courseHits, materials: materialHits, query: q };
};

EBB.recentMaterials = (n = 6) =>
  [...EBB.materials]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, n);

EBB.mostAccessedCourses = (n = 6) =>
  [...EBB.courses].sort((a, b) => b.accessCount - a.accessCount).slice(0, n);

EBB.filterMaterials = ({ type, department, level, query } = {}) => {
  let list = [...EBB.materials];
  if (type) list = list.filter((m) => m.type === type);
  if (department) list = list.filter((m) => m.department === department);
  if (level) {
    list = list.filter((m) => {
      if (m.level === level) return true;
      const c = EBB.getCourse(m.courseId);
      return c && c.level === level;
    });
  }
  if (query) {
    const q = query.toLowerCase().trim();
    list = list.filter((m) => {
      const c = EBB.getCourse(m.courseId);
      const hay = [m.topic, m.title, m.type, m.course_code, c && c.code, c && c.name]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }
  return list;
};

window.EBB = EBB;
