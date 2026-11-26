import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useEffect } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '@/constants/theme';

const TAB_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  index: 'home-outline',
  libraries: 'library-outline',
  downloads: 'download-outline',
  profile: 'person-outline',
};

const TAB_ICONS_ACTIVE: Record<string, keyof typeof Ionicons.glyphMap> = {
  index: 'home',
  libraries: 'library',
  downloads: 'download',
  profile: 'person',
};

const PILL_PAD_H = 10;
const ICON_SLOT = 48;
const INDICATOR = 36;

/**
 * Floating glass pill tab bar — icons only, sliding active indicator.
 * Accepts Expo Router custom tabBar props (`emitter`, `navigateToTab`).
 */
export function FloatingTabBar(props: {
  state: { index: number; routes: { key: string; name: string; params?: object }[] };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  descriptors: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  emitter?: { emit: (options: any) => { defaultPrevented?: boolean } };
  navigateToTab?: (routeKey: string) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  navigation?: any;
  insets?: { bottom: number };
}) {
  const { state, descriptors, emitter, navigateToTab, navigation } = props;
  const safeInsets = useSafeAreaInsets();
  const bottomInset = props.insets?.bottom ?? safeInsets.bottom;
  const indicatorX = useSharedValue(0);

  useEffect(() => {
    const slotCenter = PILL_PAD_H + state.index * ICON_SLOT + ICON_SLOT / 2 - INDICATOR / 2;
    indicatorX.value = withSpring(slotCenter, {
      damping: 18,
      stiffness: 220,
      mass: 0.7,
    });
  }, [state.index, indicatorX]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorX.value }],
  }));

  const pillInner = (
    <View style={styles.row}>
      <Animated.View style={[styles.indicator, indicatorStyle]} />
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const options = descriptors[route.key]?.options ?? {};
        const label =
          typeof options.tabBarLabel === 'string'
            ? options.tabBarLabel
            : options.title ?? route.name;
        const iconName = focused
          ? TAB_ICONS_ACTIVE[route.name] ?? 'ellipse'
          : TAB_ICONS[route.name] ?? 'ellipse-outline';

        return (
          <Pressable
            key={route.key}
            accessibilityRole="button"
            accessibilityState={focused ? { selected: true } : {}}
            accessibilityLabel={String(label)}
            onPress={() => {
              const event =
                emitter?.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                }) ??
                navigation?.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                });

              if (focused || event?.defaultPrevented) return;

              if (navigateToTab) {
                navigateToTab(route.key);
              } else if (navigation) {
                navigation.navigate(route.name, route.params);
              }
            }}
            style={styles.slot}>
            <Ionicons
              name={iconName}
              size={20}
              color={focused ? colors.paper : colors.forest}
            />
          </Pressable>
        );
      })}
    </View>
  );

  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrap, { bottom: Math.max(bottomInset, 12) + 6 }]}>
      <View style={styles.pillShadow}>
        {Platform.OS === 'web' ? (
          <View style={[styles.pill, styles.pillFallback]}>{pillInner}</View>
        ) : (
          <BlurView intensity={55} tint="light" style={styles.pill}>
            <View style={styles.pillGlass}>{pillInner}</View>
          </BlurView>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 50,
  },
  pillShadow: {
    borderRadius: 999,
    shadowColor: colors.forestDeep,
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  pill: {
    borderRadius: 999,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(122, 31, 31, 0.18)',
  },
  pillFallback: {
    backgroundColor: 'rgba(255, 252, 244, 0.82)',
    ...(Platform.OS === 'web'
      ? ({
          backdropFilter: 'blur(18px)',
          WebkitBackdropFilter: 'blur(18px)',
        } as object)
      : null),
  },
  pillGlass: {
    backgroundColor: 'rgba(255, 252, 244, 0.35)',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: PILL_PAD_H,
    paddingVertical: 8,
    position: 'relative',
  },
  indicator: {
    position: 'absolute',
    left: 0,
    width: INDICATOR,
    height: INDICATOR,
    borderRadius: INDICATOR / 2,
    backgroundColor: colors.forest,
    top: 8 + (ICON_SLOT - 8 - INDICATOR) / 2,
  },
  slot: {
    width: ICON_SLOT,
    height: ICON_SLOT - 8,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
});
