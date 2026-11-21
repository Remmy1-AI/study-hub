import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getCoursesForProgramme, PROGRAMMES, type Programme } from '@/constants/catalog';
import { colors, radii, spacing, typography } from '@/constants/theme';

/**
 * Libraries — flat cream 2-column programme tiles (not a twin of Home’s green hero).
 * Sticky mini header + search; floating glass nav stays from tab layout.
 */
export default function LibrariesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');

  const programmes = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return PROGRAMMES;
    return PROGRAMMES.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.short.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q),
    );
  }, [query]);

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.stickyHeader}>
        <Text style={styles.title}>Libraries</Text>
        <Text style={styles.subtitle}>Browse by programme — preview free, download after sign-in.</Text>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={colors.dim} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search programmes"
            placeholderTextColor={colors.dim}
            style={styles.searchInput}
            accessibilityLabel="Search programmes"
            returnKeyType="search"
          />
          {query.length > 0 ? (
            <Pressable onPress={() => setQuery('')} hitSlop={8} accessibilityLabel="Clear search">
              <Ionicons name="close-circle" size={18} color={colors.dim} />
            </Pressable>
          ) : null}
        </View>
      </View>

      <FlatList
        data={programmes}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={[styles.grid, { paddingBottom: insets.bottom + 110 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <Text style={styles.empty}>No programmes match “{query.trim()}”.</Text>
        }
        renderItem={({ item }) => (
          <ProgrammeTile
            programme={item}
            onPress={() => router.push(`/(tabs)/libraries/programme/${item.id}`)}
          />
        )}
      />
    </View>
  );
}

function ProgrammeTile({
  programme,
  onPress,
}: {
  programme: Programme;
  onPress: () => void;
}) {
  const count = getCoursesForProgramme(programme.id).length;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${programme.name}, ${count} courses`}
      onPress={onPress}
      style={({ pressed }) => [styles.tile, pressed && styles.pressed]}>
      <Text style={styles.tileCode}>{programme.code}</Text>
      <Text style={styles.tileName} numberOfLines={3}>
        {programme.short}
      </Text>
      <Text style={styles.tileCount}>
        {count > 0 ? `${count} course${count === 1 ? '' : 's'}` : 'Browse'}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  stickyHeader: {
    backgroundColor: colors.paper,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
    zIndex: 5,
    gap: 6,
  },
  title: {
    fontFamily: typography.display,
    fontSize: 28,
    color: colors.ink,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontFamily: typography.body,
    fontSize: 14,
    color: colors.muted,
    lineHeight: 20,
    marginBottom: 4,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.card,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 11,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
  },
  searchInput: {
    flex: 1,
    fontFamily: typography.body,
    fontSize: 15,
    color: colors.ink,
    paddingVertical: 0,
  },
  grid: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  row: {
    gap: 12,
    marginBottom: 12,
  },
  tile: {
    flex: 1,
    minHeight: 132,
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
    justifyContent: 'space-between',
    gap: 8,
  },
  tileCode: {
    fontFamily: typography.bodyBold,
    fontSize: 13,
    color: colors.ochre,
    letterSpacing: 0.6,
  },
  tileName: {
    fontFamily: typography.bodyBold,
    fontSize: 17,
    color: colors.ink,
    lineHeight: 22,
    flexGrow: 1,
  },
  tileCount: {
    fontFamily: typography.body,
    fontSize: 13,
    color: colors.muted,
  },
  empty: {
    fontFamily: typography.body,
    fontSize: 15,
    color: colors.muted,
    padding: spacing.lg,
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.88,
    backgroundColor: colors.forestSoft,
  },
});
