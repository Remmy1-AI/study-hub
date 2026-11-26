import AsyncStorage from '@react-native-async-storage/async-storage';

import { supabase } from '@/lib/supabase';

/**
 * Per-user progress / bookmarks / downloads.
 * Live: Supabase tables with owner-only RLS (user_id defaults to auth.uid()).
 * Mock: bookmarks stay on device; progress and download sync are no-ops.
 */
const LOCAL_BOOKMARKS_KEY = 'docket.bookmarks.v1';
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function remoteSession() {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  const userId = data.session?.user.id;
  return userId ? { sb: supabase, userId } : null;
}

function isLiveMaterialId(resourceId: string) {
  return UUID_RE.test(resourceId);
}

async function readLocalBookmarks(): Promise<string[]> {
  const raw = await AsyncStorage.getItem(LOCAL_BOOKMARKS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as string[];
  } catch {
    return [];
  }
}

export async function recordProgress(resourceId: string, page = 1, totalPages?: number) {
  const session = await remoteSession();
  if (!session || !isLiveMaterialId(resourceId)) return;
  const percent = totalPages ? Math.min(100, Math.round((page / totalPages) * 10000) / 100) : null;
  await session.sb.from('reading_progress').upsert(
    {
      user_id: session.userId,
      material_id: resourceId,
      page,
      total_pages: totalPages ?? null,
      percent,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,material_id' },
  );
}

/** Most recently opened material ids for the signed-in user. */
export async function listRecentProgress(limit = 10): Promise<string[]> {
  const session = await remoteSession();
  if (!session) return [];
  const { data } = await session.sb
    .from('reading_progress')
    .select('material_id')
    .order('updated_at', { ascending: false })
    .limit(limit);
  return (data ?? []).map((row: { material_id: string }) => row.material_id);
}

export async function isBookmarked(resourceId: string, page = 1): Promise<boolean> {
  const session = await remoteSession();
  if (session && isLiveMaterialId(resourceId)) {
    const { count } = await session.sb
      .from('bookmarks')
      .select('id', { count: 'exact', head: true })
      .eq('material_id', resourceId)
      .eq('page', page);
    return (count ?? 0) > 0;
  }
  return (await readLocalBookmarks()).includes(`${resourceId}#${page}`);
}

export async function setBookmark(resourceId: string, on: boolean, page = 1) {
  const session = await remoteSession();
  if (session && isLiveMaterialId(resourceId)) {
    if (on) {
      await session.sb
        .from('bookmarks')
        .upsert(
          { user_id: session.userId, material_id: resourceId, page },
          { onConflict: 'user_id,material_id,page' },
        );
    } else {
      await session.sb.from('bookmarks').delete().eq('material_id', resourceId).eq('page', page);
    }
    return;
  }
  const key = `${resourceId}#${page}`;
  const existing = (await readLocalBookmarks()).filter((k) => k !== key);
  await AsyncStorage.setItem(
    LOCAL_BOOKMARKS_KEY,
    JSON.stringify(on ? [key, ...existing] : existing),
  );
}

export async function recordDownload(resourceId: string) {
  const session = await remoteSession();
  if (!session || !isLiveMaterialId(resourceId)) return;
  await session.sb
    .from('downloads')
    .upsert(
      { user_id: session.userId, material_id: resourceId },
      { onConflict: 'user_id,material_id' },
    );
  await session.sb.rpc('increment_download', { p_id: resourceId });
}

export async function forgetDownload(resourceId: string) {
  const session = await remoteSession();
  if (!session || !isLiveMaterialId(resourceId)) return;
  await session.sb.from('downloads').delete().eq('material_id', resourceId);
}
