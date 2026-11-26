import AsyncStorage from '@react-native-async-storage/async-storage';

export const DOWNLOADS_KEY = 'docket.downloads.v1';

export type DownloadedItem = {
  resourceId: string;
  savedAt: string;
  sizeLabel: string;
  title: string;
};

export async function listDownloads(): Promise<DownloadedItem[]> {
  const raw = await AsyncStorage.getItem(DOWNLOADS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as DownloadedItem[];
  } catch {
    return [];
  }
}

export async function addDownload(item: DownloadedItem): Promise<'added' | 'exists'> {
  const existing = await listDownloads();
  if (existing.some((i) => i.resourceId === item.resourceId)) return 'exists';
  await AsyncStorage.setItem(DOWNLOADS_KEY, JSON.stringify([item, ...existing]));
  return 'added';
}

export async function removeDownload(resourceId: string): Promise<void> {
  const existing = await listDownloads();
  await AsyncStorage.setItem(
    DOWNLOADS_KEY,
    JSON.stringify(existing.filter((i) => i.resourceId !== resourceId)),
  );
}
