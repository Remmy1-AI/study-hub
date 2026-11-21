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
 * Splash auth — brand mid/byline bottom, then Docket shrinks up into
 * phone OTP or Sign up (name · programme · number) → OTP → Home.
 * Web shot helpers: `?shot=brand` holds splash; `?shot=phone` opens auth sheet.
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

  const progress = useSharedValue(0);

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

    const t = setTimeout(advanceToPhone, 1400);
    return () => clearTimeout(t);
  }, [loading, user, router, progress, shot]);

  const brandStyle = useAnimatedStyle(() => {
    const p = progress.value;
    return {
      transform: [
        { translateY: interpolate(p, [0, 1], [0, -140]) },
        { scale: interpolate(p, [0, 1], [1, 0.55]) },
      ],
    };
  });

  const bylineStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.45, 1], [1, 0.2, 0]),
  }));

  const formStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0.35, 1], [0, 1]),
    transform: [{ translateY: interpolate(progress.value, [0.35, 1], [28, 0]) }],
  }));

  async function onSendFromPhone() {
    setBusy(true);
    setMessage(null);
    const result = await sendOtp(phone);
    setBusy(false);
    setMessage(result.message);
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
    setBusy(true);
    setMessage(null);
    const result = await sendOtp(phone);
    setBusy(false);
    setMessage(result.message);
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
    setMessage(result.message);
    if (result.ok) {
      router.replace('/(tabs)');
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.inner, { paddingBottom: insets.bottom + 24, paddingTop: insets.top + 12 }]}>
        <View style={styles.stage}>
          <Animated.View style={[styles.brandWrap, brandStyle]}>
            <Text style={styles.wordmark}>Docket</Text>
          </Animated.View>

          <Animated.View style={[styles.formWrap, formStyle]} pointerEvents={phase === 'brand' ? 'none' : 'auto'}>
            {phase === 'phone' ? (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Sign in with phone</Text>
                <Text style={styles.cardHint}>Enter your number to get a one-time code.</Text>
                <Text style={styles.label}>Mobile number</Text>
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
                  style={styles.linkBtn}>
                  <Text style={styles.linkText}>Sign up</Text>
                </Pressable>
              </View>
            ) : null}

            {phase === 'signup' ? (
              <ScrollView
                style={styles.signupScroll}
                contentContainerStyle={styles.card}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}>
                <Text style={styles.cardTitle}>Create your Docket</Text>
                <Text style={styles.cardHint}>Name, programme, and phone — then verify with OTP.</Text>

                <Text style={styles.label}>Full name</Text>
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
                  {PROGRAMMES.slice(0, 8).map((p) => {
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

                <Text style={styles.label}>Mobile number</Text>
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
                  style={[styles.primaryBtn, busy && styles.btnDisabled]}
                  disabled={busy}
                  onPress={() => void onSendFromSignup()}>
                  <Text style={styles.primaryBtnText}>{busy ? 'Sending…' : 'Send code'}</Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    setMessage(null);
                    setPhase('phone');
                  }}
                  style={styles.linkBtn}>
                  <Text style={styles.linkText}>Already have an account? Sign in</Text>
                </Pressable>
              </ScrollView>
            ) : null}

            {phase === 'otp' ? (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Enter code</Text>
                <Text style={styles.cardHint}>We sent a 6-digit code to {phone.trim() || 'your phone'}.</Text>
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
                  style={[styles.primaryBtn, (code.trim().length < 4 || busy) && styles.btnDisabled]}
                  disabled={code.trim().length < 4 || busy}
                  onPress={() => void onVerify()}>
                  <Text style={styles.primaryBtnText}>{busy ? 'Verifying…' : 'Verify & continue'}</Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    setCode('');
                    setMessage(null);
                    setPhase(signupMode ? 'signup' : 'phone');
                  }}
                  style={styles.linkBtn}>
                  <Text style={styles.linkText}>Back</Text>
                </Pressable>
              </View>
            ) : null}

            {message ? <Text style={styles.message}>{message}</Text> : null}
          </Animated.View>
        </View>

        <Animated.Text style={[styles.byline, bylineStyle]}>by Mr. Yeboah</Animated.Text>
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
    paddingHorizontal: spacing.lg,
  },
  stage: {
    flex: 1,
    justifyContent: 'center',
  },
  brandWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  wordmark: {
    fontFamily: typography.display,
    fontSize: 48,
    color: colors.forest,
    letterSpacing: -0.8,
  },
  formWrap: {
    marginTop: -40,
    zIndex: 1,
  },
  signupScroll: {
    maxHeight: 420,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: spacing.lg,
    gap: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
  },
  cardTitle: {
    fontFamily: typography.bodyBold,
    fontSize: 20,
    color: colors.ink,
  },
  cardHint: {
    fontFamily: typography.body,
    fontSize: 14,
    color: colors.muted,
    lineHeight: 20,
    marginBottom: 4,
  },
  label: {
    fontFamily: typography.bodyMedium,
    fontSize: 13,
    color: colors.forest,
    marginTop: 4,
  },
  input: {
    fontFamily: typography.body,
    fontSize: 17,
    color: colors.ink,
    backgroundColor: colors.paper,
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
  },
  chip: {
    backgroundColor: colors.forestSoft,
    borderRadius: radii.sm,
    paddingHorizontal: 10,
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
    marginTop: 8,
    backgroundColor: colors.forest,
    borderRadius: radii.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryBtnText: {
    fontFamily: typography.bodyBold,
    fontSize: 15,
    color: colors.paper,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  linkBtn: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  linkText: {
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
  },
});
