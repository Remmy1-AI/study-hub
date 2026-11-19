import { useRouter } from 'expo-router';
import { FlatList, StyleSheet, View } from 'react-native';

import { ListRow, Meta, Subtitle } from '@/components/ui';
import { getCoursesForProgramme, PROGRAMMES } from '@/constants/catalog';
import { colors, spacing } from '@/constants/theme';

/**
 * Libraries — Bytepad-like programme-scoped browse entry.
 * Programme → course → resource list (preview before download).
 */
export default function LibrariesScreen() {
  const router = useRouter();

  return (
    <View style={styles.screen}>
      <View style={styles.intro}>
        <Subtitle>Browse by programme. Preview free — sign in to download offline.</Subtitle>
      </View>
      <FlatList
        data={PROGRAMMES}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const count = getCoursesForProgramme(item.id).length;
          return (
            <ListRow
              title={item.name}
              subtitle={item.code}
              meta={count > 0 ? `${count} sample course${count === 1 ? '' : 's'}` : 'Coming soon'}
              onPress={() => router.push(`/(tabs)/libraries/programme/${item.id}`)}
            />
          );
        }}
        ListFooterComponent={
          <Meta style={styles.footer}>Same full UMAT catalogue as Ace on the web.</Meta>
        }
      />
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
  list: {
    paddingBottom: spacing.xl,
  },
  footer: {
    padding: spacing.lg,
  },
});
