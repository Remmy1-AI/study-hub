import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Dimensions,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Meta, SectionLabel } from '@/components/ui';
import {
  COURSES,
  RESOURCE_TYPE_LABEL,
  RESOURCES,
} from '@/constants/catalog';
import { colors, radii, spacing, typography } from '@/constants/theme';
import { useAuth } from '@/lib/auth';
import { listDownloads, removeDownload } from '@/lib/downloads';

const CONTENT_GAP = 40;
const COMMUNITY_URL = 'https://mryeboah.study';
const SHARE_MESSAGE =
  'Study with Docket — UMAT resources by Mr. Yeboah. https://mryeboah.study';

function displayLabel(phone: string) {
  const digits = phone.replace(/\D/g, '');
  if (digits.length >= 4) return `··${digits.slice(-4)}`;
  return phone;
}

/**
 * Profile — sticky ~20% hero; signed-in: avatar+phone in hero,
 * Continue learning carousel, flat settings (no bookmarks/FAQ).
 */
export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, signOut, loading } = useAuth();
  const heroHeight = Math.round(Dimensions.get('window').height * 0.2);
  const [offlineCount, setOfflineCount] = useState(0);

  const refreshStorage = useCallback(async () => {
    const items = await listDownloads();
    setOfflineCount(items.length);
  }, []);

  useEffect(() => {
    void refreshStorage();
  }, [refreshStorage, user]);

  const continueItems = RESOURCES.slice(0, 5);

  async function onShare() {
    try {
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({ title: 'Docket', text: SHARE_MESSAGE, url: 'https://mryeboah.study' });
        return;
      }
      await Share.share({ message: SHARE_MESSAGE });
    } catch {
      // user dismissed
    }
  }

  async function onClearOffline() {
    const items = await listDownloads();
    if (items.length === 0) {
      if (Platform.OS === 'web') {
        window.alert('No offline files to clear.');
      } else {
        Alert.alert('Storage', 'No offline files to clear.');
      }
      return;
    }
    const confirmClear =
      Platform.OS === 'web'
        ? window.confirm(`Remove ${items.length} offline file${items.length === 1 ? '' : 's'}?`)
        : await new Promise<boolean>((resolve) => {
            Alert.alert('Clear offline files', `Remove ${items.length} downloads from this device?`, [
              { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
              { text: 'Clear', style: 'destructive', onPress: () => resolve(true) },
            ]);
          });
    if (!confirmClear) return;
    await Promise.all(items.map((i) => removeDownload(i.resourceId)));
    await refreshStorage();
  }

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
        }}
        showsVerticalScrollIndicator={false}>
        {!user ? (
          <View style={[styles.signedOutBlock, { paddingHorizontal: spacing.lg }]}>
            <View style={styles.avatarLarge}>
              <Ionicons name="person" size={36} color={colors.forest} />
            </View>
            <Text style={styles.name}>Guest</Text>
            <Text style={styles.guestCopy}>
              Sign in to sync progress and manage offline downloads.
            </Text>
            <Pressable
              style={styles.signInBtn}
              onPress={() => router.push('/auth/phone')}
              accessibilityRole="button">
              <Ionicons name="phone-portrait-outline" size={18} color={colors.paper} />
              <Text style={styles.signInBtnText}>Sign in with phone</Text>
            </Pressable>
            <View style={styles.list}>
              <FlatRow
                icon="information-circle-outline"
                label="About"
                value="Docket · by Mr. Yeboah"
                onPress={() => undefined}
              />
            </View>
          </View>
        ) : (
          <>
            <View style={styles.carouselSection}>
              <View style={{ paddingHorizontal: spacing.lg }}>
                <SectionLabel>Continue learning</SectionLabel>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.carouselRow}>
                {continueItems.map((r) => {
                  const course = COURSES.find((c) => c.id === r.courseId);
                  return (
                    <Pressable
                      key={r.id}
                      style={({ pressed }) => [styles.continueCard, pressed && styles.pressed]}
                      onPress={() => router.push(`/resource/${r.id}`)}>
                      <Text style={styles.continueType}>{RESOURCE_TYPE_LABEL[r.type]}</Text>
                      <Text style={styles.continueTitle} numberOfLines={2}>
                        {r.title}
                      </Text>
                      <Meta>
                        {course?.code} · {r.sizeLabel}
                      </Meta>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            <View style={[styles.list, { paddingHorizontal: spacing.lg }]}>
              <FlatRow
                icon="school-outline"
                label="Programme"
                value="Electrical · EE"
                onPress={() => router.push('/(tabs)/libraries/programme/electrical')}
              />
              <FlatRow
                icon="folder-outline"
                label="Storage"
                value={
                  offlineCount > 0
                    ? `${offlineCount} offline · Clear`
                    : 'No offline files · Clear'
                }
                onPress={() => void onClearOffline()}
              />
              <FlatRow
                icon="share-outline"
                label="Share Docket"
                value="Invite a classmate"
                onPress={() => void onShare()}
              />
              <FlatRow
                icon="people-outline"
                label="Join community"
                value="mryeboah.study"
                onPress={() => void Linking.openURL(COMMUNITY_URL)}
              />
              <FlatRow
                icon="information-circle-outline"
                label="About"
                value="Docket · by Mr. Yeboah"
                onPress={() => undefined}
              />
              <FlatRow
                icon="log-out-outline"
                label="Sign out"
                danger
                onPress={() => void signOut()}
              />
            </View>
          </>
        )}
      </ScrollView>

      <View style={styles.sticky} pointerEvents="box-none">
        <View
          style={[
            styles.hero,
            {
              height: heroHeight,
              paddingTop: insets.top + spacing.sm,
              paddingBottom: spacing.md,
            },
          ]}>
          {user ? (
            <View style={styles.heroSignedIn}>
              <View style={styles.heroAvatar}>
                <Ionicons name="person" size={22} color={colors.forest} />
              </View>
              <View style={styles.heroCopy}>
                <Text style={styles.eyebrow}>Signed in</Text>
                <Text style={styles.heroName} numberOfLines={1}>
                  {displayLabel(user.phone)}
                </Text>
                <Text style={styles.heroPhone} numberOfLines={1}>
                  {user.phone}
                </Text>
              </View>
            </View>
          ) : (
            <>
              <Text style={styles.eyebrow}>Your account</Text>
              <Text style={styles.title}>Profile</Text>
              <Text style={styles.subtitle}>
                Browse free — sign in when you need offline.
              </Text>
            </>
          )}
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
  heroSignedIn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  heroAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.paper,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
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
  heroName: {
    fontFamily: typography.display,
    fontSize: 24,
    color: colors.paper,
    letterSpacing: -0.3,
  },
  heroPhone: {
    fontFamily: typography.body,
    fontSize: 13,
    color: 'rgba(243, 240, 230, 0.78)',
  },
  subtitle: {
    fontFamily: typography.body,
    fontSize: 14,
    color: 'rgba(243, 240, 230, 0.78)',
    lineHeight: 20,
    marginTop: 2,
  },
  signedOutBlock: {
    alignItems: 'center',
    gap: spacing.sm,
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
  guestCopy: {
    fontFamily: typography.body,
    fontSize: 14,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: spacing.md,
  },
  signInBtn: {
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
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
  carouselSection: {
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  carouselRow: {
    gap: 12,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  continueCard: {
    width: 168,
    backgroundColor: colors.card,
    borderRadius: radii.md,
    padding: spacing.md,
    gap: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
  },
  continueType: {
    fontFamily: typography.bodyBold,
    fontSize: 11,
    color: colors.ochre,
    letterSpacing: 0.4,
  },
  continueTitle: {
    fontFamily: typography.bodyMedium,
    fontSize: 14,
    color: colors.ink,
    minHeight: 36,
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
  pressed: {
    opacity: 0.88,
  },
});
