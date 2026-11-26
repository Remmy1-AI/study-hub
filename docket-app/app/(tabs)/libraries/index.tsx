import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { type Programme } from '@/constants/catalog';
import { useCatalog } from '@/lib/catalog';
import { colors, radii, spacing, typography } from '@/constants/theme';

const SEARCH_OVERLAP = 18;
const SEARCH_BAR_H = 46;
/** Gap below overlapping search so first tiles are fully visible at rest. */
const CONTENT_GAP = 40;

/**
 * Libraries — Home-matched sticky ~22% forest hero + overlapping search;
 * 2-column programme tiles scroll underneath. Floating glass nav from tabs.
 */
export default function LibrariesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { programmes: allProgrammes } = useCatalog();
  const [query, setQuery] = useState('');

  const heroHeight = Math.round(Dimensions.get('window').height * 0.2);
  const stickyStackH = heroHeight + SEARCH_BAR_H - SEARCH_OVERLAP;

  const programmes = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allProgrammes;
    return allProgrammes.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.short.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q),
    );
  }, [query, allProgrammes]);

  return (
    <View style={styles.screen}>
      <FlatList
        data={programmes}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={[
          styles.grid,
          {
            paddingTop: stickyStackH + CONTENT_GAP,
            paddingBottom: insets.bottom + 110,
          },
        ]}
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

      {/* Sticky hero + overlapping search — content scrolls underneath */}
      <View style={styles.sticky} pointerEvents="box-none">
        <View
          style={[
            styles.hero,
            {
              height: heroHeight,
              paddingTop: insets.top + spacing.sm,
              paddingBottom: spacing.lg + 10,
            },
          ]}>
          <View style={styles.heroCopy}>
            <Text style={styles.eyebrow}>UMAT catalogue</Text>
            <Text style={styles.title}>Libraries</Text>
          </View>
        </View>

        <View style={[styles.searchWrap, { marginTop: -SEARCH_OVERLAP }]}>
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
      </View>
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
  const { getCoursesForProgramme } = useCatalog();
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
  },
  heroCopy: {
    gap: 4,
  },
  eyebrow: {
    fontFamily: typography.bodyMedium,
    fontSize: 14,
    color: 'rgba(243, 240, 230, 0.82)',
  },
  title: {
    fontFamily: typography.display,
    fontSize: 26,
    color: colors.paper,
    letterSpacing: -0.4,
  },
  searchWrap: {
    paddingHorizontal: spacing.lg,
    zIndex: 2,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: SEARCH_BAR_H,
    backgroundColor: colors.card,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
    shadowColor: colors.forestDeep,
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
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
