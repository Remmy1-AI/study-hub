import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { getResource } from '@/constants/catalog';
import { colors, spacing, typography } from '@/constants/theme';

/**
 * In-app viewer stub — Adobe Reader cue: page-first canvas;
 * chrome (close / bookmark) appears as secondary overlay, not competing heroes.
 */
export default function ViewerScreen() {
  const { resourceId } = useLocalSearchParams<{ resourceId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const resource = getResource(resourceId);
  const [chromeVisible, setChromeVisible] = useState(true);
  const [bookmarked, setBookmarked] = useState(false);

  return (
    <View style={styles.root}>
      <Stack.Screen options={{ headerShown: false }} />
      <Pressable style={styles.page} onPress={() => setChromeVisible((v) => !v)}>
        <Text style={styles.pageLabel}>{resource?.title ?? 'Resource'}</Text>
        <Text style={styles.pageBody}>
          Page-first viewer stub. Tap to show or hide chrome. Real PDF rendering ships with offline
          file support.
        </Text>
        <Text style={styles.pageNum}>1 / —</Text>
      </Pressable>

      {chromeVisible ? (
        <View style={[styles.chromeTop, { paddingTop: insets.top + 8 }]}>
          <Pressable onPress={() => router.back()} hitSlop={12} accessibilityRole="button">
            <Ionicons name="close" size={26} color={colors.paper} />
          </Pressable>
          <Text style={styles.chromeTitle} numberOfLines={1}>
            {resource?.title ?? 'Viewer'}
          </Text>
          <Pressable
            onPress={() => setBookmarked((b) => !b)}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Bookmark">
            <Ionicons
              name={bookmarked ? 'bookmark' : 'bookmark-outline'}
              size={24}
              color={bookmarked ? colors.ochreSoft : colors.paper}
            />
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.forestDeep,
  },
  page: {
    flex: 1,
    margin: spacing.lg,
    marginTop: 72,
    marginBottom: spacing.xl,
    backgroundColor: colors.card,
    padding: spacing.lg,
    justifyContent: 'space-between',
  },
  pageLabel: {
    fontFamily: typography.bodyBold,
    fontSize: 18,
    color: colors.ink,
  },
  pageBody: {
    fontFamily: typography.body,
    fontSize: 15,
    color: colors.muted,
    lineHeight: 22,
  },
  pageNum: {
    fontFamily: typography.body,
    fontSize: 13,
    color: colors.dim,
    textAlign: 'center',
  },
  chromeTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingBottom: 12,
    backgroundColor: 'rgba(22, 56, 40, 0.92)',
    gap: spacing.sm,
  },
  chromeTitle: {
    flex: 1,
    fontFamily: typography.bodyMedium,
    fontSize: 14,
    color: colors.paper,
    textAlign: 'center',
  },
});
