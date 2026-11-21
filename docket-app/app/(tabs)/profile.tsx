import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, spacing, typography } from '@/constants/theme';
import { useAuth } from '@/lib/auth';

const CONTENT_GAP = 40;

function displayLabel(phone: string) {
  const digits = phone.replace(/\D/g, '');
  if (digits.length >= 4) return `··${digits.slice(-4)}`;
  return phone;
}

/**
 * Profile — sticky ~20% hero (no search); signed-out CTA or signed-in flat rows.
 */
export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, signOut, loading } = useAuth();
  const heroHeight = Math.round(Dimensions.get('window').height * 0.2);

  if (loading) {
    return <View style={styles.screen} />;
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{
          paddingTop: heroHeight + CONTENT_GAP,
          paddingBottom: insets.bottom + 110,
          paddingHorizontal: spacing.lg,
        }}
        showsVerticalScrollIndicator={false}>
        <View style={styles.avatarBlock}>
          <View style={styles.avatarLarge}>
            <Ionicons name="person" size={36} color={colors.forest} />
          </View>
          {user ? (
            <>
              <Text style={styles.name}>{displayLabel(user.phone)}</Text>
              <Text style={styles.phone}>{user.phone}</Text>
            </>
          ) : (
            <>
              <Text style={styles.name}>Guest</Text>
              <Text style={styles.phone}>
                Sign in to sync progress and manage offline downloads.
              </Text>
              <Pressable
                style={styles.signInBtn}
                onPress={() => router.push('/auth/phone')}
                accessibilityRole="button">
                <Ionicons name="phone-portrait-outline" size={18} color={colors.paper} />
                <Text style={styles.signInBtnText}>Sign in with phone</Text>
              </Pressable>
            </>
          )}
        </View>

        {user ? (
          <View style={styles.list}>
            <FlatRow
              icon="school-outline"
              label="Programme"
              value="Not set"
              onPress={() => router.push('/(tabs)/libraries')}
            />
            <FlatRow
              icon="folder-outline"
              label="Storage"
              value="On this device"
              onPress={() => router.push('/(tabs)/downloads')}
            />
            <FlatRow
              icon="log-out-outline"
              label="Sign out"
              danger
              onPress={() => void signOut()}
            />
            <FlatRow
              icon="information-circle-outline"
              label="About"
              value="Docket · by Mr. Yeboah"
              onPress={() => undefined}
            />
          </View>
        ) : (
          <View style={styles.list}>
            <FlatRow
              icon="information-circle-outline"
              label="About"
              value="Docket · by Mr. Yeboah"
              onPress={() => undefined}
            />
          </View>
        )}
      </ScrollView>

      <View style={styles.sticky} pointerEvents="box-none">
        <View
          style={[
            styles.hero,
            {
              height: heroHeight,
              paddingTop: insets.top + spacing.sm,
              paddingBottom: spacing.lg,
            },
          ]}>
          <Text style={styles.eyebrow}>Your account</Text>
          <Text style={styles.title}>Profile</Text>
          <Text style={styles.subtitle}>
            {user ? 'Downloads and progress stay with this phone.' : 'Browse free — sign in when you need offline.'}
          </Text>
        </View>
      </View>
    </View>
  );
}

function FlatRow({
  icon,
  label,
  value,
  onPress,
  danger,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <Pressable
      style={styles.row}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}>
      <View style={[styles.rowIcon, danger && styles.rowIconDanger]}>
        <Ionicons name={icon} size={18} color={danger ? colors.danger : colors.forest} />
      </View>
      <View style={styles.rowBody}>
        <Text style={[styles.rowLabel, danger && styles.rowLabelDanger]}>{label}</Text>
        {value ? <Text style={styles.rowValue}>{value}</Text> : null}
      </View>
      {!danger ? <Ionicons name="chevron-forward" size={18} color={colors.dim} /> : null}
    </Pressable>
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
    gap: 4,
  },
  eyebrow: {
    fontFamily: typography.bodyMedium,
    fontSize: 13,
    color: 'rgba(243, 240, 230, 0.82)',
  },
  title: {
    fontFamily: typography.display,
    fontSize: 26,
    color: colors.paper,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontFamily: typography.body,
    fontSize: 14,
    color: 'rgba(243, 240, 230, 0.78)',
    lineHeight: 20,
    marginTop: 2,
  },
  avatarBlock: {
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  avatarLarge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.forestSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontFamily: typography.bodyBold,
    fontSize: 20,
    color: colors.ink,
  },
  phone: {
    fontFamily: typography.body,
    fontSize: 14,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: spacing.md,
  },
  signInBtn: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.forest,
    borderRadius: 14,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
  },
  signInBtnText: {
    fontFamily: typography.bodyBold,
    fontSize: 15,
    color: colors.paper,
  },
  list: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.forestSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowIconDanger: {
    backgroundColor: 'rgba(139, 58, 47, 0.12)',
  },
  rowBody: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  rowLabel: {
    fontFamily: typography.bodyMedium,
    fontSize: 15,
    color: colors.ink,
  },
  rowLabelDanger: {
    color: colors.danger,
  },
  rowValue: {
    fontFamily: typography.body,
    fontSize: 12,
    color: colors.dim,
  },
});
