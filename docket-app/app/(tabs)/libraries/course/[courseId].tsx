import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { FlatList, StyleSheet, View } from 'react-native';

import { EmptyState, ListRow, Subtitle } from '@/components/ui';
import {
  getCourse,
  getResourcesForCourse,
  RESOURCE_TYPE_LABEL,
} from '@/constants/catalog';
import { colors, spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth';

/** Course resource list — preview before download (Bytepad spine). */
export default function CourseResourcesScreen() {
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const course = getCourse(courseId);
  const resources = getResourcesForCourse(courseId);

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title: course?.code ?? 'Course' }} />
      <View style={styles.intro}>
        <Subtitle>
          {course?.title ?? 'Course'} — open to preview; download needs sign-in.
        </Subtitle>
      </View>
      {resources.length === 0 ? (
        <EmptyState
          title="No resources yet"
          body="Owner uploads stay on the web admin. Sample packs appear here when wired."
        />
      ) : (
        <FlatList
          data={resources}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ListRow
              title={item.title}
              subtitle={RESOURCE_TYPE_LABEL[item.type]}
              meta={item.sizeLabel}
              locked={!user}
              onPress={() => router.push(`/resource/${item.id}`)}
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
