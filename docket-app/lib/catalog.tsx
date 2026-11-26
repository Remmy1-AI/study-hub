import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import {
  COURSES,
  PROGRAMMES,
  RESOURCES,
  type Course,
  type Programme,
  type Resource,
} from '@/constants/catalog';
import { storagePublicUrl, supabase } from '@/lib/supabase';

type ProgrammeRow = {
  id: string;
  name: string;
  short_name: string | null;
  code: string | null;
};

type CourseRow = {
  id: string;
  programme_id: string;
  code: string;
  title: string;
  level: string | null;
};

type MaterialRow = {
  id: string;
  title: string;
  course_code: string | null;
  department: string | null;
  level: string | null;
  material_type: string | null;
  file_path: string;
  file_size: number | null;
  source: string | null;
  external_url: string | null;
  download_url: string | null;
};

type CatalogContextValue = {
  programmes: Programme[];
  courses: Course[];
  resources: Resource[];
  /** True when rows come from Supabase rather than the bundled sample. */
  live: boolean;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  getProgramme: (id: string) => Programme | undefined;
  getCourse: (id: string) => Course | undefined;
  getCoursesForProgramme: (programmeId: string) => Course[];
  getResourcesForCourse: (courseId: string) => Resource[];
  getResource: (id: string) => Resource | undefined;
};

const RESOURCE_TYPES: Resource['type'][] = [
  'slides',
  'notes',
  'past-questions',
  'tutorials',
  'videos',
  'shared',
];

function sizeLabel(bytes: number | null) {
  if (!bytes) return '';
  if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function codeKey(code: string) {
  return code.toUpperCase().replace(/\s+/g, '');
}

function materialFileUrl(row: MaterialRow) {
  if (row.external_url) return row.external_url;
  if (row.download_url) return row.download_url;
  if ((row.source ?? 'storage') === 'storage') return storagePublicUrl(row.file_path);
  return '';
}

/**
 * Ace web uploads only set materials.course_code + department, so courses are the
 * explicit `courses` rows plus any (department, course_code) pair seen on materials.
 */
export function buildLiveCatalog(
  programmeRows: ProgrammeRow[],
  courseRows: CourseRow[],
  materialRows: MaterialRow[],
) {
  const programmes: Programme[] = programmeRows.map((p) => ({
    id: p.id,
    name: p.name,
    short: p.short_name || p.name,
    code: p.code || '',
  }));

  const courses: Course[] = courseRows.map((c) => ({
    id: c.id,
    programmeId: c.programme_id,
    code: c.code,
    title: c.title,
    level: c.level ?? '',
  }));
  const byKey = new Map(courses.map((c) => [`${c.programmeId}|${codeKey(c.code)}`, c]));

  const resources: Resource[] = materialRows.map((m) => {
    const programmeId = m.department || 'general';
    const code = m.course_code?.trim() || 'General';
    const key = `${programmeId}|${codeKey(code)}`;
    let course = byKey.get(key);
    if (!course) {
      course = {
        id: `${programmeId}--${codeKey(code).toLowerCase()}`,
        programmeId,
        code,
        title: code,
        level: m.level ?? '',
      };
      byKey.set(key, course);
      courses.push(course);
    }
    const type = RESOURCE_TYPES.includes(m.material_type as Resource['type'])
      ? (m.material_type as Resource['type'])
      : 'shared';
    return {
      id: m.id,
      courseId: course.id,
      title: m.title,
      type,
      sizeLabel: sizeLabel(m.file_size),
      fileUrl: materialFileUrl(m) || undefined,
    };
  });

  return { programmes, courses, resources };
}

const CatalogContext = createContext<CatalogContextValue | null>(null);

export function CatalogProvider({ children }: { children: React.ReactNode }) {
  const live = Boolean(supabase);
  const [programmes, setProgrammes] = useState<Programme[]>(PROGRAMMES);
  const [courses, setCourses] = useState<Course[]>(live ? [] : COURSES);
  const [resources, setResources] = useState<Resource[]>(live ? [] : RESOURCES);
  const [loading, setLoading] = useState(live);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      const [p, c, m] = await Promise.all([
        supabase
          .from('programmes')
          .select('id,name,short_name,code')
          .order('sort_order', { ascending: true })
          .order('name', { ascending: true }),
        supabase
          .from('courses')
          .select('id,programme_id,code,title,level')
          .order('sort_order', { ascending: true })
          .order('code', { ascending: true }),
        supabase
          .from('materials')
          .select(
            'id,title,course_code,department,level,material_type,file_path,file_size,source,external_url,download_url',
          )
          .eq('published', true)
          .order('created_at', { ascending: false })
          .limit(1000),
      ]);
      const failed = p.error ?? c.error ?? m.error;
      if (failed) throw failed;
      const next = buildLiveCatalog(
        (p.data ?? []) as ProgrammeRow[],
        (c.data ?? []) as CourseRow[],
        (m.data ?? []) as MaterialRow[],
      );
      if (next.programmes.length > 0) setProgrammes(next.programmes);
      setCourses(next.courses);
      setResources(next.resources);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load catalogue.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo<CatalogContextValue>(() => {
    const programmeById = new Map(programmes.map((p) => [p.id, p]));
    const courseById = new Map(courses.map((c) => [c.id, c]));
    const resourceById = new Map(resources.map((r) => [r.id, r]));
    return {
      programmes,
      courses,
      resources,
      live,
      loading,
      error,
      refresh,
      getProgramme: (id) => programmeById.get(id),
      getCourse: (id) => courseById.get(id),
      getCoursesForProgramme: (programmeId) => courses.filter((c) => c.programmeId === programmeId),
      getResourcesForCourse: (courseId) => resources.filter((r) => r.courseId === courseId),
      getResource: (id) => resourceById.get(id),
    };
  }, [programmes, courses, resources, live, loading, error, refresh]);

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalog() {
  const ctx = useContext(CatalogContext);
  if (!ctx) throw new Error('useCatalog must be used within CatalogProvider');
  return ctx;
}
