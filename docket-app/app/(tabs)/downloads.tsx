import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { AuthGateSheet } from '@/components/AuthGateSheet';
import { EmptyState, ListRow, Meta, Subtitle } from '@/components/ui';
import { colors, spacing, typography } from '@/constants/theme';
import { useAuth } from '@/lib/auth';
import {
  listDownloads,
  removeDownload,
  type DownloadedItem,
} from '@/lib/downloads';

/**
 * Downloads — first-class offline destination (Google offline cues):
 * size, open viewer, remove. Gated behind phone OTP.
 */
export default function DownloadsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [items, setItems] = useState<DownloadedItem[]>([]);
  const [gateOpen, setGateOpen] = useState(false);

  const load = useCallback(async () => {
    setItems(await listDownloads());
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  if (!user) {
    return (
      <View style={styles.screen}>
        <View style={styles.intro}>
          <Subtitle>Keep files on device for offline study.</Subtitle>
        </View>
        <EmptyState
          title="Sign in to manage downloads"
          body="Browse is free. Offline downloads and progress sync need phone OTP."
          actionLabel="Sign in with phone"
          onAction={() => setGateOpen(true)}
        />
        <AuthGateSheet visible={gateOpen} onClose={() => setGateOpen(false)} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.intro}>
        <Subtitle>Offline files on this device. Open in the viewer or remove to free space.</Subtitle>
        <Meta>{items.length} downloaded</Meta>
      </View>
      {items.length === 0 ? (
        <EmptyState
          title="Nothing offline yet"
          body="From a resource, tap Download to save a copy here."
          actionLabel="Browse libraries"
          onAction={() => router.push('/(tabs)/libraries')}
        />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.resourceId}
          renderItem={({ item }) => (
            <ListRow
              title={item.title}
              subtitle={item.sizeLabel}
              meta={`Saved ${new Date(item.savedAt).toLocaleDateString()}`}
              onPress={() => router.push(`/viewer/${item.resourceId}`)}
              right={
                <Pressable
                  onPress={() => {
                    void removeDownload(item.resourceId).then(load);
                  }}
                  hitSlop={8}
                  accessibilityRole="button">
                  <Text style={styles.remove}>Remove</Text>
                </Pressable>
              }
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  intro: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    gap: 6,
  },
  remove: {
    fontFamily: typography.bodyMedium,
    fontSize: 13,
    color: colors.danger,
    paddingHorizontal: 8,
  },
});
