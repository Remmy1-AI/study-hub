import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Meta, SectionLabel } from '@/components/ui';
import {
  COURSES,
  getCoursesForProgramme,
  PROGRAMMES,
  RESOURCE_TYPE_LABEL,
  RESOURCES,
} from '@/constants/catalog';
import { colors, radii, spacing, typography } from '@/constants/theme';
import { useAuth } from '@/lib/auth';

function greetingForHour(hour: number) {
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function displayNameFromUser(phone: string | undefined) {
  if (!phone) return 'there';
  const digits = phone.replace(/\D/g, '');
  if (digits.length >= 4) return `··${digits.slice(-4)}`;
  return phone;
}

const SEARCH_OVERLAP = 18;
const SEARCH_BAR_H = 46;
/** Gap below overlapping search so first content is fully visible at rest. */
const CONTENT_GAP = 40;

/**
 * Home — sticky forest hero + search; carousel/trending scroll underneath.
 */
export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [query, setQuery] = useState('');

  const greeting = useMemo(() => greetingForHour(new Date().getHours()), []);
  const name = displayNameFromUser(user?.phone);
  const heroHeight = Math.round(Dimensions.get('window').height * 0.2);
  // Sticky stack height includes search that hangs below the sheet.
  const stickyStackH = heroHeight + SEARCH_BAR_H - SEARCH_OVERLAP;

  const carouselItems = useMemo(() => {
    const withCourses = PROGRAMMES.filter((p) => getCoursesForProgramme(p.id).length > 0);
    const rest = PROGRAMMES.filter((p) => getCoursesForProgramme(p.id).length === 0).slice(0, 8);
    return [...withCourses, ...rest];
  }, []);

  const trending = RESOURCES.slice(0, 6);

  function onSearchSubmit() {
    router.push('/(tabs)/libraries');
  }

  return (
    <View style={styles.screen}>
      {/* Content scrolls under the sticky hero */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{
          paddingTop: stickyStackH + CONTENT_GAP,
          paddingBottom: insets.bottom + 100,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View style={styles.body}>
          <SectionLabel>Courses & departments</SectionLabel>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.courseRow}
            decelerationRate="fast">
            {carouselItems.map((programme) => {
              const count = getCoursesForProgramme(programme.id).length;
              return (
                <Pressable
                  key={programme.id}
                  style={({ pressed }) => [styles.courseCard, pressed && styles.pressed]}
                  onPress={() => router.push(`/(tabs)/libraries/programme/${programme.id}`)}>
                  <Text style={styles.courseCode}>{programme.code}</Text>
                  <Text style={styles.courseTitle} numberOfLines={2}>
                    {programme.short}
                  </Text>
                  <Meta>{count > 0 ? `${count} course${count === 1 ? '' : 's'}` : 'Browse'}</Meta>
                </Pressable>
              );
            })}
            <Pressable
              style={({ pressed }) => [
                styles.courseCard,
                styles.courseCardMore,
                pressed && styles.pressed,
              ]}
              onPress={() => router.push('/(tabs)/libraries')}>
              <Text style={styles.courseTitle}>All libraries</Text>
              <Meta>Full catalogue</Meta>
            </Pressable>
          </ScrollView>

          <View style={styles.activityHeader}>
            <SectionLabel>Trending learning materials</SectionLabel>
          </View>
          {trending.map((r) => {
            const course = COURSES.find((c) => c.id === r.courseId);
            return (
              <Pressable
                key={r.id}
                style={({ pressed }) => [styles.activityRow, pressed && styles.pressed]}
                onPress={() => router.push(`/resource/${r.id}`)}>
                <View style={styles.activityIcon}>
                  <Ionicons name="flame-outline" size={18} color={colors.forest} />
                </View>
                <View style={styles.activityBody}>
                  <Text style={styles.activityTitle} numberOfLines={2}>
                    {r.title}
                  </Text>
                  <Meta>
                    {RESOURCE_TYPE_LABEL[r.type]} · {course?.code} · {r.sizeLabel}
                  </Meta>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.dim} />
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      {/* Fixed hero + overlapping search — never scrolls away */}
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
          <View style={styles.heroRow}>
            <View style={styles.heroCopy}>
              <Text style={styles.greeting}>{greeting}</Text>
              <Text style={styles.name} numberOfLines={1}>
                {name}
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open profile"
              onPress={() => router.push('/(tabs)/profile')}
              style={({ pressed }) => [styles.avatarBtn, pressed && styles.pressed]}>
              <Ionicons name="person" size={20} color={colors.forest} />
            </Pressable>
          </View>
        </View>

        <View style={[styles.searchWrap, { marginTop: -SEARCH_OVERLAP }]}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={18} color={colors.dim} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search courses & resources"
              placeholderTextColor={colors.dim}
              returnKeyType="search"
              onSubmitEditing={onSearchSubmit}
              style={styles.searchInput}
              accessibilityLabel="Search"
            />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  scroll: {
    flex: 1,
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
  heroRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  heroCopy: {
    flex: 1,
    gap: 4,
  },
  greeting: {
    fontFamily: typography.bodyMedium,
    fontSize: 14,
    color: 'rgba(243, 240, 230, 0.82)',
  },
  name: {
    fontFamily: typography.display,
    fontSize: 26,
    color: colors.paper,
    letterSpacing: -0.4,
  },
  avatarBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.paper,
    alignItems: 'center',
    justifyContent: 'center',
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
  body: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  courseRow: {
    gap: 12,
    paddingBottom: spacing.sm,
    paddingRight: spacing.md,
  },
  courseCard: {
    width: 148,
    backgroundColor: colors.card,
    borderRadius: radii.md,
    padding: spacing.md,
    gap: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
  },
  courseCardMore: {
    backgroundColor: colors.forestSoft,
    justifyContent: 'center',
  },
  courseCode: {
    fontFamily: typography.bodyBold,
    fontSize: 12,
    color: colors.ochre,
    letterSpacing: 0.4,
  },
  courseTitle: {
    fontFamily: typography.bodyMedium,
    fontSize: 15,
    color: colors.ink,
    minHeight: 40,
  },
  activityHeader: {
    marginTop: spacing.md,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  activityIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.forestSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityBody: {
    flex: 1,
    gap: 2,
  },
  activityTitle: {
    fontFamily: typography.bodyMedium,
    fontSize: 15,
    color: colors.ink,
  },
  pressed: {
    opacity: 0.88,
  },
});
