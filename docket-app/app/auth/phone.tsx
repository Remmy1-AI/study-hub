import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { Body, Meta, PrimaryButton, SecondaryButton, Title } from '@/components/ui';
import { colors, radii, spacing, typography } from '@/constants/theme';
import { useAuth } from '@/lib/auth';

/**
 * Full-screen phone → OTP path (Profile destination).
 * Same mockable flow as the auth gate sheet.
 */
export default function PhoneAuthScreen() {
  const router = useRouter();
  const { sendOtp, verifyOtp, user } = useAuth();
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (user) {
    return (
      <View style={styles.screen}>
        <Title>Already signed in</Title>
        <Body>{user.name?.trim() || user.phone}</Body>
        <PrimaryButton label="Back to profile" onPress={() => router.back()} />
      </View>
    );
  }

  async function onSend() {
    setBusy(true);
    setMessage(null);
    const result = await sendOtp(phone);
    setBusy(false);
    setMessage(result.message);
    if (result.ok) setStep('otp');
  }

  async function onVerify() {
    setBusy(true);
    setMessage(null);
    const result = await verifyOtp(phone, code);
    setBusy(false);
    setMessage(result.message);
    if (result.ok) router.back();
  }

  return (
    <View style={styles.screen}>
      <Title>Sign in with phone</Title>
      <Body style={styles.copy}>
        Unlock offline downloads and progress sync. Browse stays free without signing in.
      </Body>

      {step === 'phone' ? (
        <>
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
          <PrimaryButton label="Send code" onPress={onSend} loading={busy} disabled={!phone.trim()} />
        </>
      ) : (
        <>
          <Text style={styles.label}>6-digit code</Text>
          <TextInput
            value={code}
            onChangeText={setCode}
            placeholder="••••••"
            placeholderTextColor={colors.dim}
            keyboardType="number-pad"
            maxLength={6}
            style={styles.input}
          />
          <PrimaryButton
            label="Verify"
            onPress={onVerify}
            loading={busy}
            disabled={code.trim().length < 4}
          />
          <SecondaryButton label="Different number" onPress={() => setStep('phone')} />
        </>
      )}

      {message ? <Meta>{message}</Meta> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.paper,
    padding: spacing.lg,
    gap: spacing.md,
  },
  copy: {
    color: colors.muted,
  },
  label: {
    fontFamily: typography.bodyMedium,
    fontSize: 13,
    color: colors.forest,
  },
  input: {
    fontFamily: typography.body,
    fontSize: 17,
    color: colors.ink,
    backgroundColor: colors.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
  },
});
