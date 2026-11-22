import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PROGRAMMES } from '@/constants/catalog';
import { colors, radii, spacing, typography } from '@/constants/theme';
import { useAuth } from '@/lib/auth';

type Phase = 'brand' | 'phone' | 'signup' | 'otp';

/**
 * Splash auth — brand mid/byline bottom, then Docket shrinks up into a
 * flat cream auth plane (no card): SIGN IN / CREATE ACCOUNT → OTP → Home.
 * Web shot helpers: `?shot=brand|phone|signup`.
 */
export default function SplashAuthScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { shot } = useLocalSearchParams<{ shot?: string }>();
  const { user, loading, sendOtp, verifyOtp } = useAuth();
  const [phase, setPhase] = useState<Phase>('brand');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [programmeId, setProgrammeId] = useState('electrical');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [signupMode, setSignupMode] = useState(false);
  const [mainH, setMainH] = useState(0);
  const [contentH, setContentH] = useState(0);

  const progress = useSharedValue(0);
  const centerWhenFits = contentH > 0 && mainH > 0 && contentH <= mainH + 1;

  useEffect(() => {
    if (loading) return;
    if (user) {
      router.replace('/(tabs)');
      return;
    }

    if (shot === 'brand') {
      return;
    }

    const advanceToPhone = () => {
      progress.value = withTiming(1, {
        duration: 700,
        easing: Easing.out(Easing.cubic),
      });
      setPhase('phone');
    };

    if (shot === 'phone') {
      progress.value = 1;
      setPhase('phone');
      return;
    }

    if (shot === 'signup') {
      progress.value = 1;
      setPhase('signup');
      return;
    }

    const t = setTimeout(advanceToPhone, 1400);
    return () => clearTimeout(t);
  }, [loading, user, router, progress, shot]);

  const brandStyle = useAnimatedStyle(() => {
    const p = progress.value;
    return {
      fontSize: interpolate(p, [0, 1], [48, 28]),
      marginBottom: interpolate(p, [0, 1], [0, 4]),
    };
  });

  const formStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0.35, 1], [0, 1]),
  }));

  function browseAsGuest() {
    router.replace('/(tabs)');
  }

  async function onSendFromPhone() {
    setBusy(true);
    setMessage(null);
    const result = await sendOtp(phone);
    setBusy(false);
    if (!result.ok) setMessage(result.message);
    if (result.ok) {
      setSignupMode(false);
      setPhase('otp');
    }
  }

  async function onSendFromSignup() {
    if (!name.trim()) {
      setMessage('Enter your name.');
      return;
    }
    if (!programmeId) {
      setMessage('Pick a programme.');
      return;
    }
    if (!phone.trim()) {
      setMessage('Enter your phone number.');
      return;
    }
    setBusy(true);
    setMessage(null);
    const result = await sendOtp(phone);
    setBusy(false);
    if (!result.ok) setMessage(result.message);
    if (result.ok) {
      setSignupMode(true);
      setPhase('otp');
    }
  }

  async function onVerify() {
    setBusy(true);
    setMessage(null);
    const result = await verifyOtp(
      phone,
      code,
      signupMode
        ? { name: name.trim(), programmeId }
        : name.trim()
          ? { name: name.trim(), programmeId }
          : undefined,
    );
    setBusy(false);
    if (!result.ok) setMessage(result.message);
    if (result.ok) {
      router.replace('/(tabs)');
    }
  }

  const showByline = phase === 'brand' || phase === 'phone' || phase === 'signup' || phase === 'otp';

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.inner, { paddingTop: insets.top }]}>
        {/* Region above byline: centers when short, scrolls from top when tall */}
        <ScrollView
          style={styles.main}
          contentContainerStyle={[
            styles.mainContent,
            centerWhenFits ? styles.mainContentCentered : styles.mainContentScroll,
          ]}
          onLayout={(e) => setMainH(e.nativeEvent.layout.height)}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={phase === 'signup'}
          bounces={phase === 'signup'}>
          <View
            style={styles.centerBlock}
            onLayout={(e) => {
              // Track the auth block itself so centering compares block vs viewport,
              // not the padded content container (which includes flexGrow space).
              setContentH(e.nativeEvent.layout.height);
            }}>
            <Animated.Text style={[styles.wordmark, brandStyle]}>Docket</Animated.Text>

            <Animated.View
              style={[styles.formWrap, formStyle]}
              pointerEvents={phase === 'brand' ? 'none' : 'auto'}>
            {phase === 'phone' ? (
              <View style={styles.plane}>
                <Text style={styles.heading}>SIGN IN</Text>

                <Text style={styles.label}>Phone number</Text>
                <TextInput
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="+233…"
                  placeholderTextColor={colors.dim}
                  keyboardType="phone-pad"
                  autoComplete="tel"
                  style={styles.input}
                />

                <Pressable
                  style={[styles.primaryBtn, (!phone.trim() || busy) && styles.btnDisabled]}
                  disabled={!phone.trim() || busy}
                  onPress={() => void onSendFromPhone()}>
                  <Text style={styles.primaryBtnText}>{busy ? 'Sending…' : 'Continue'}</Text>
                </Pressable>

                <Pressable
                  onPress={() => {
                    setMessage(null);
                    setPhase('signup');
                  }}
                  style={styles.linkBtn}
                  accessibilityRole="button">
                  <Text style={styles.mutedLink}>
                    New here? <Text style={styles.linkAccent}>Sign up</Text>
                  </Text>
                </Pressable>

                <Pressable onPress={browseAsGuest} style={styles.guestBtn} accessibilityRole="button">
                  <Text style={styles.guestText}>Browse as guest</Text>
                </Pressable>
              </View>
            ) : null}

            {phase === 'signup' ? (
              <View style={styles.plane}>
                <Text style={styles.heading}>CREATE ACCOUNT</Text>

                <Text style={styles.label}>Name</Text>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="Your name"
                  placeholderTextColor={colors.dim}
                  autoComplete="name"
                  style={styles.input}
                />

                <Text style={styles.label}>Programme</Text>
                <View style={styles.programmeGrid}>
                  {PROGRAMMES.map((p) => {
                    const active = programmeId === p.id;
                    return (
                      <Pressable
                        key={p.id}
                        onPress={() => setProgrammeId(p.id)}
                        style={[styles.chip, active && styles.chipActive]}>
                        <Text style={[styles.chipText, active && styles.chipTextActive]}>
                          {p.short}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                <Text style={styles.label}>Phone</Text>
                <TextInput
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="+233…"
                  placeholderTextColor={colors.dim}
                  keyboardType="phone-pad"
                  autoComplete="tel"
                  style={styles.input}
                />

                <Pressable
                  style={[
                    styles.primaryBtn,
                    (busy || !name.trim() || !phone.trim()) && styles.btnDisabled,
                  ]}
                  disabled={busy || !name.trim() || !phone.trim()}
                  onPress={() => void onSendFromSignup()}>
                  <Text style={styles.primaryBtnText}>{busy ? 'Sending…' : 'Send code'}</Text>
                </Pressable>

                <Pressable
                  onPress={() => {
                    setMessage(null);
                    setPhase('phone');
                  }}
                  style={styles.linkBtn}
                  accessibilityRole="button">
                  <Text style={styles.mutedLink}>
                    Have an account? <Text style={styles.linkAccent}>Sign in</Text>
                  </Text>
                </Pressable>

                <Pressable onPress={browseAsGuest} style={styles.guestBtn} accessibilityRole="button">
                  <Text style={styles.guestText}>Browse as guest</Text>
                </Pressable>
              </View>
            ) : null}

            {phase === 'otp' ? (
              <View style={styles.plane}>
                <Text style={styles.heading}>ENTER CODE</Text>

                <Text style={styles.label}>OTP</Text>
                <TextInput
                  value={code}
                  onChangeText={setCode}
                  placeholder="••••••"
                  placeholderTextColor={colors.dim}
                  keyboardType="number-pad"
                  maxLength={6}
                  style={styles.input}
                />

                <Pressable
                  style={[
                    styles.primaryBtn,
                    (code.trim().length < 4 || busy) && styles.btnDisabled,
                  ]}
                  disabled={code.trim().length < 4 || busy}
                  onPress={() => void onVerify()}>
                  <Text style={styles.primaryBtnText}>{busy ? 'Verifying…' : 'Continue'}</Text>
                </Pressable>

                <Pressable
                  onPress={() => {
                    setCode('');
                    setMessage(null);
                    setPhase(signupMode ? 'signup' : 'phone');
                  }}
                  style={styles.linkBtn}
                  accessibilityRole="button">
                  <Text style={styles.mutedLink}>Back</Text>
                </Pressable>
              </View>
            ) : null}

            {message ? <Text style={styles.message}>{message}</Text> : null}
            </Animated.View>
          </View>
        </ScrollView>

        {showByline ? (
          <Text style={[styles.byline, { paddingBottom: Math.max(insets.bottom, 16) + 4 }]}>
            by Mr. Yeboah
          </Text>
        ) : null}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  inner: {
    flex: 1,
  },
  /** Space above the byline — centers when content fits, scrolls when tall */
  main: {
    flex: 1,
  },
  mainContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  mainContentCentered: {
    justifyContent: 'center',
  },
  mainContentScroll: {
    justifyContent: 'flex-start',
  },
  centerBlock: {
    width: '100%',
    alignItems: 'stretch',
  },
  wordmark: {
    fontFamily: typography.display,
    fontSize: 48,
    color: colors.forest,
    letterSpacing: -0.8,
    textAlign: 'center',
    alignSelf: 'center',
  },
  formWrap: {
    width: '100%',
  },
  plane: {
    gap: spacing.sm,
    paddingHorizontal: 4,
  },
  heading: {
    fontFamily: typography.bodyBold,
    fontSize: 13,
    color: colors.forest,
    letterSpacing: 1.6,
    textAlign: 'center',
    marginBottom: 10,
  },
  label: {
    fontFamily: typography.bodyMedium,
    fontSize: 13,
    color: colors.muted,
    marginTop: 6,
  },
  input: {
    fontFamily: typography.body,
    fontSize: 17,
    color: colors.ink,
    backgroundColor: 'transparent',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
  },
  programmeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
    overflow: 'visible',
  },
  chip: {
    backgroundColor: colors.forestSoft,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipActive: {
    backgroundColor: colors.forest,
  },
  chipText: {
    fontFamily: typography.bodyMedium,
    fontSize: 13,
    color: colors.forest,
  },
  chipTextActive: {
    color: colors.paper,
  },
  primaryBtn: {
    marginTop: 14,
    backgroundColor: colors.forest,
    borderRadius: radii.md,
    paddingVertical: 15,
    alignItems: 'center',
  },
  primaryBtnText: {
    fontFamily: typography.bodyBold,
    fontSize: 15,
    color: colors.paper,
  },
  btnDisabled: {
    opacity: 0.45,
  },
  linkBtn: {
    alignItems: 'center',
    paddingTop: 14,
    paddingBottom: 4,
  },
  mutedLink: {
    fontFamily: typography.body,
    fontSize: 14,
    color: colors.muted,
  },
  linkAccent: {
    fontFamily: typography.bodyMedium,
    color: colors.forest,
  },
  guestBtn: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  guestText: {
    fontFamily: typography.bodyMedium,
    fontSize: 14,
    color: colors.forest,
  },
  message: {
    marginTop: spacing.sm,
    fontFamily: typography.body,
    fontSize: 13,
    color: colors.muted,
    textAlign: 'center',
  },
  byline: {
    fontFamily: typography.bodyMedium,
    fontSize: 14,
    color: colors.muted,
    textAlign: 'center',
    letterSpacing: 0.2,
    paddingTop: 8,
  },
});
