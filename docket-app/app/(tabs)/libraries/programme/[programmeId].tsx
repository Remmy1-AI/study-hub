import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { FlatList, StyleSheet, View } from 'react-native';

import { EmptyState, ListRow, Subtitle } from '@/components/ui';
import { colors, spacing } from '@/constants/theme';
import { useCatalog } from '@/lib/catalog';

export default function ProgrammeCoursesScreen() {
  const { programmeId } = useLocalSearchParams<{ programmeId: string }>();
  const router = useRouter();
  const { getProgramme, getCoursesForProgramme } = useCatalog();
  const programme = getProgramme(programmeId);
  const courses = getCoursesForProgramme(programmeId);

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title: programme?.short ?? 'Programme' }} />
      <View style={styles.intro}>
        <Subtitle>
          {programme?.name ?? 'Programme'} — pick a course to preview resources.
        </Subtitle>
      </View>
      {courses.length === 0 ? (
        <EmptyState
          title="No sample courses yet"
          body="Live catalogue will hydrate from Supabase. Browse other programmes for stubs."
          actionLabel="Back to libraries"
          onAction={() => router.back()}
        />
      ) : (
        <FlatList
          data={courses}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ListRow
              title={item.title}
              subtitle={item.code}
              meta={`Level ${item.level}`}
              onPress={() => router.push(`/(tabs)/libraries/course/${item.id}`)}
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
  },
});
