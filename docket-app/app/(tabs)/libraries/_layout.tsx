import { Stack } from 'expo-router';

import { colors, typography } from '@/constants/theme';

export default function LibrariesLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.paper },
        headerTintColor: colors.forest,
        headerTitleStyle: {
          fontFamily: typography.bodyBold,
          color: colors.ink,
        },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.paper },
      }}>
      <Stack.Screen name="index" options={{ title: 'Libraries', headerShown: false }} />
      <Stack.Screen name="programme/[programmeId]" options={{ title: 'Programme' }} />
      <Stack.Screen name="course/[courseId]" options={{ title: 'Course' }} />
    </Stack>
  );
}
