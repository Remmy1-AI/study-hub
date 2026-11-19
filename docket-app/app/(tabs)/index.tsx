import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Body, Meta, SectionLabel, Subtitle, Title } from '@/components/ui';
import { COURSES, PROGRAMMES, RESOURCES } from '@/constants/catalog';
import { colors, radii, spacing, typography } from '@/constants/theme';

/**
 * Home — resume-first (Lumen cue): one continue strip + short recent row;
 * calm first viewport, shortcuts into Libraries.
 */
export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const continueResource = RESOURCES[0];
  const continueCourse = COURSES.find((c) => c.id === continueResource.courseId);
  const recent = RESOURCES.slice(0, 4);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}>
      <View style={styles.heroCopy}>
        <Meta>UMAT study</Meta>
        <Title>Continue where you left off</Title>
        <Subtitle>Browse free. Sign in when you download or save progress.</Subtitle>
      </View>

      <Pressable
        style={({ pressed }) => [styles.resumeCard, pressed && styles.pressed]}
        onPress={() => router.push(`/resource/${continueResource.id}`)}>
        <SectionLabel>Continue reading</SectionLabel>
        <Text style={styles.resumeTitle}>{continueResource.title}</Text>
        <Meta>
          {continueCourse?.code} · {continueCourse?.title}
        </Meta>
      </Pressable>

      <View style={styles.section}>
        <SectionLabel>Recent</SectionLabel>
        {recent.map((r) => {
          const course = COURSES.find((c) => c.id === r.courseId);
          return (
            <Pressable
              key={r.id}
              style={({ pressed }) => [styles.recentRow, pressed && styles.pressed]}
              onPress={() => router.push(`/resource/${r.id}`)}>
              <View style={{ flex: 1 }}>
                <Text style={styles.recentTitle}>{r.title}</Text>
                <Meta>{course?.code}</Meta>
              </View>
              <Text style={styles.chev}>›</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.section}>
        <SectionLabel>Browse programmes</SectionLabel>
        <Body style={styles.hint}>Full UMAT catalogue — same spine as Ace on the web.</Body>
        <View style={styles.chips}>
          {PROGRAMMES.slice(0, 6).map((p) => (
            <Pressable
              key={p.id}
              style={({ pressed }) => [styles.chip, pressed && styles.pressed]}
              onPress={() => router.push(`/(tabs)/libraries/programme/${p.id}`)}>
              <Text style={styles.chipText}>{p.short}</Text>
            </Pressable>
          ))}
          <Pressable
            style={({ pressed }) => [styles.chip, styles.chipAll, pressed && styles.pressed]}
            onPress={() => router.push('/(tabs)/libraries')}>
            <Text style={[styles.chipText, styles.chipAllText]}>All libraries</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  heroCopy: {
    gap: spacing.sm,
  },
  resumeCard: {
    backgroundColor: colors.forest,
    borderRadius: radii.lg,
    padding: spacing.lg,
    gap: 6,
  },
  resumeTitle: {
    fontFamily: typography.bodyBold,
    fontSize: 18,
    color: colors.paper,
  },
  section: {
    gap: spacing.sm,
  },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  recentTitle: {
    fontFamily: typography.bodyMedium,
    fontSize: 15,
    color: colors.ink,
  },
  chev: {
    fontSize: 22,
    color: colors.dim,
    paddingLeft: spacing.sm,
  },
  hint: {
    color: colors.muted,
    marginBottom: spacing.xs,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: colors.forestSoft,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.sm,
  },
  chipText: {
    fontFamily: typography.bodyMedium,
    fontSize: 13,
    color: colors.forest,
  },
  chipAll: {
    backgroundColor: colors.ochreSoft,
  },
  chipAllText: {
    color: colors.forestDeep,
  },
  pressed: {
    opacity: 0.85,
  },
});
