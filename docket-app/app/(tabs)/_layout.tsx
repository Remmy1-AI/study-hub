import { Tabs } from 'expo-router';

import { FloatingTabBar } from '@/components/FloatingTabBar';
import { colors, typography } from '@/constants/theme';

export default function TabLayout() {
  return (
    <Tabs
      // Expo Router tabBar prop shape differs slightly from RN Navigation types.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tabBar={(props: any) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerStyle: { backgroundColor: colors.paper },
        headerTintColor: colors.forest,
        headerTitleStyle: {
          fontFamily: typography.bodyBold,
          color: colors.ink,
        },
        headerShadowVisible: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          elevation: 0,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="libraries"
        options={{
          title: 'Libraries',
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="downloads"
        options={{
          title: 'Downloads',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
        }}
      />
    </Tabs>
  );
}
