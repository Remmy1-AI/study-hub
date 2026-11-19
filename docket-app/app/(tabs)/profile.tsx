import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Body, Meta, PrimaryButton, SecondaryButton, Title } from '@/components/ui';
import { colors, spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth';

/**
 * Profile — signed-out CTA vs signed-in account.
 * Auth path: Sign in with phone → OTP (Figma phone/OTP primary).
 */
export default function ProfileScreen() {
  const router = useRouter();
  const { user, mockMode, signOut, loading } = useAuth();

  if (loading) {
    return <View style={styles.screen} />;
  }

  if (!user) {
    return (
      <View style={styles.screen}>
        <View style={styles.block}>
          <Title>Profile</Title>
          <Body style={styles.copy}>
            Browse programmes and preview resources without an account. Sign in with phone to
            download offline and save progress.
          </Body>
          {mockMode ? (
            <Meta>Supabase keys not set — mock OTP (code 123456) is enabled.</Meta>
          ) : null}
          <PrimaryButton
            label="Sign in with phone"
            icon="phone-portrait-outline"
            onPress={() => router.push('/auth/phone')}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.block}>
        <Title>Signed in</Title>
        <Meta>Phone</Meta>
        <Body>{user.phone}</Body>
        <Body style={styles.copy}>
          Progress sync and offline downloads are unlocked on this device.
          {mockMode ? ' (Mock session — wire Supabase for production OTP.)' : ''}
        </Body>
        <SecondaryButton label="Sign out" onPress={() => void signOut()} icon="log-out-outline" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.paper,
    padding: spacing.lg,
  },
  block: {
    gap: spacing.md,
  },
  copy: {
    color: colors.muted,
  },
});
