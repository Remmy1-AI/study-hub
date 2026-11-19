import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, typography } from '@/constants/theme';

/**
 * Splash — Notion-like centered wordmark; owner byline bottom-centered.
 * Docket mid-screen; by Mr. Yeboah near the bottom.
 */
export default function SplashScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const t = setTimeout(() => {
      router.replace('/(tabs)');
    }, 1600);
    return () => clearTimeout(t);
  }, [router]);

  return (
    <View style={[styles.root, { paddingBottom: insets.bottom + 28 }]}>
      <View style={styles.center}>
        <Text style={styles.wordmark}>Docket</Text>
      </View>
      <Text style={styles.byline}>by Mr. Yeboah</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.paper,
    justifyContent: 'space-between',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordmark: {
    fontFamily: typography.display,
    fontSize: 48,
    color: colors.forest,
    letterSpacing: -0.8,
  },
  byline: {
    fontFamily: typography.bodyMedium,
    fontSize: 14,
    color: colors.muted,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
});
