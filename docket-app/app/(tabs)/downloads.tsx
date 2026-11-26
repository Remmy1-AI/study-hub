import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuthGateSheet } from '@/components/AuthGateSheet';
import {
  RESOURCE_TYPE_LABEL,
  type Course,
  type Resource,
} from '@/constants/catalog';
import { colors, radii, spacing, typography } from '@/constants/theme';
import { useAuth } from '@/lib/auth';
import { useCatalog } from '@/lib/catalog';
import {
  listDownloads,
  removeDownload,
  type DownloadedItem,
} from '@/lib/downloads';
import { forgetDownload } from '@/lib/userData';

const CONTENT_GAP = 40;

type DownloadRow = {
  resourceId: string;
  title: string;
  typeLabel: string;
  courseCode: string;
  sizeLabel: string;
  isSample: boolean;
};

type CatalogLookup = {
  getResource: (id: string) => Resource | undefined;
  getCourse: (id: string) => Course | undefined;
};

function enrich(item: DownloadedItem, { getResource, getCourse }: CatalogLookup): DownloadRow {
  const resource = getResource(item.resourceId);
  const course = resource ? getCourse(resource.courseId) : undefined;
  return {
    resourceId: item.resourceId,
    title: item.title,
    typeLabel: resource ? RESOURCE_TYPE_LABEL[resource.type] : 'Resource',
    courseCode: course?.code ?? '—',
    sizeLabel: item.sizeLabel,
    isSample: false,
  };
}

function sampleRows(resources: Resource[], courses: Course[]): DownloadRow[] {
  return resources.slice(0, 4).map((r: Resource) => {
    const course = courses.find((c) => c.id === r.courseId);
    return {
      resourceId: r.id,
      title: r.title,
      typeLabel: RESOURCE_TYPE_LABEL[r.type],
      courseCode: course?.code ?? '—',
      sizeLabel: r.sizeLabel,
      isSample: true,
    };
  });
}

/**
 * Downloads — sticky ~20% forest hero (no search), offline list with open/remove.
 * Shows sample rows for demo when the device queue is empty.
 */
export default function DownloadsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const catalog = useCatalog();
  const [stored, setStored] = useState<DownloadedItem[]>([]);
  const [gateOpen, setGateOpen] = useState(false);

  const heroHeight = Math.round(Dimensions.get('window').height * 0.2);
  const stickyStackH = heroHeight;

  const load = useCallback(async () => {
    setStored(await listDownloads());
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const rows = useMemo(() => {
    if (stored.length > 0) return stored.map((item) => enrich(item, catalog));
    if (catalog.live) return [];
    return sampleRows(catalog.resources, catalog.courses);
  }, [stored, catalog]);

  const showingSamples = stored.length === 0 && !catalog.live;

  return (
    <View style={styles.screen}>
      <FlatList
        data={rows}
        keyExtractor={(item) => item.resourceId}
        contentContainerStyle={{
          paddingTop: stickyStackH + CONTENT_GAP,
          paddingBottom: insets.bottom + 110,
          paddingHorizontal: spacing.lg,
        }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          showingSamples ? (
            <Text style={styles.sampleHint}>
              Sample offline files for preview — real downloads appear after you save a resource.
            </Text>
          ) : (
            <Text style={styles.countHint}>{stored.length} on this device</Text>
          )
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Nothing offline yet</Text>
            <Text style={styles.emptyBody}>
              From a resource, tap Download to keep a copy on this device.
            </Text>
            <Pressable
              style={styles.emptyBtn}
              onPress={() => router.push('/(tabs)/libraries')}>
              <Text style={styles.emptyBtnText}>Browse libraries</Text>
            </Pressable>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Pressable
              style={styles.rowMain}
              onPress={() => {
                if (!user && !item.isSample) {
                  setGateOpen(true);
                  return;
                }
                router.push(`/viewer/${item.resourceId}`);
              }}
              accessibilityRole="button"
              accessibilityLabel={`Open ${item.title}`}>
              <View style={styles.icon}>
                <Ionicons name="document-text-outline" size={18} color={colors.forest} />
              </View>
              <View style={styles.rowBody}>
                <Text style={styles.rowTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={styles.rowMeta} numberOfLines={1}>
                  {item.typeLabel} · {item.courseCode} · {item.sizeLabel}
                </Text>
              </View>
            </Pressable>
            <View style={styles.actions}>
              <Pressable
                onPress={() => {
                  if (!user && !item.isSample) {
                    setGateOpen(true);
                    return;
                  }
                  router.push(`/viewer/${item.resourceId}`);
                }}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel="Open"
                style={styles.actionBtn}>
                <Ionicons name="open-outline" size={20} color={colors.forest} />
              </Pressable>
              <Pressable
                onPress={() => {
                  if (item.isSample) return;
                  if (!user) {
                    setGateOpen(true);
                    return;
                  }
                  void Promise.all([
                    removeDownload(item.resourceId),
                    forgetDownload(item.resourceId),
                  ]).then(load);
                }}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel="Delete"
                style={[styles.actionBtn, { opacity: item.isSample ? 0.35 : 1 }]}>
                <Ionicons name="trash-outline" size={20} color={colors.danger} />
              </Pressable>
            </View>
          </View>
        )}
      />

      <View style={styles.sticky} pointerEvents="box-none">
        <View
          style={[
            styles.hero,
            {
              height: heroHeight,
              paddingTop: insets.top + spacing.sm,
              paddingBottom: spacing.lg,
            },
          ]}>
          <Text style={styles.eyebrow}>Offline on this device</Text>
          <Text style={styles.title}>Downloads</Text>
          <Text style={styles.subtitle}>
            Keep slides and notes for study without data.
          </Text>
        </View>
      </View>

      <AuthGateSheet visible={gateOpen} onClose={() => setGateOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  sticky: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
  },
  hero: {
    backgroundColor: colors.forest,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    paddingHorizontal: spacing.lg,
    justifyContent: 'flex-end',
    gap: 4,
  },
  eyebrow: {
    fontFamily: typography.bodyMedium,
    fontSize: 13,
    color: 'rgba(243, 240, 230, 0.82)',
  },
  title: {
    fontFamily: typography.display,
    fontSize: 26,
    color: colors.paper,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontFamily: typography.body,
    fontSize: 14,
    color: 'rgba(243, 240, 230, 0.78)',
    lineHeight: 20,
    marginTop: 2,
  },
  sampleHint: {
    fontFamily: typography.body,
    fontSize: 13,
    color: colors.muted,
    marginBottom: spacing.md,
    lineHeight: 18,
  },
  countHint: {
    fontFamily: typography.bodyMedium,
    fontSize: 13,
    color: colors.forest,
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
    gap: 8,
  },
  rowMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minWidth: 0,
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.forestSoft,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  rowBody: {
    flex: 1,
    minWidth: 0,
    gap: 2,
    paddingRight: 4,
  },
  rowTitle: {
    fontFamily: typography.bodyMedium,
    fontSize: 15,
    color: colors.ink,
  },
  rowMeta: {
    fontFamily: typography.body,
    fontSize: 12,
    color: colors.dim,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
    gap: 2,
  },
  actionBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    paddingVertical: spacing.xl,
    gap: spacing.sm,
  },
  emptyTitle: {
    fontFamily: typography.bodyBold,
    fontSize: 18,
    color: colors.ink,
  },
  emptyBody: {
    fontFamily: typography.body,
    fontSize: 15,
    color: colors.muted,
    lineHeight: 22,
  },
  emptyBtn: {
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
    backgroundColor: colors.forest,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
  },
  emptyBtnText: {
    fontFamily: typography.bodyBold,
    fontSize: 14,
    color: colors.paper,
  },
});
