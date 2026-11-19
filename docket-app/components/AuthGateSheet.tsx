import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Body, Meta, PrimaryButton, SecondaryButton, Title } from '@/components/ui';
import { colors, radii, spacing, typography } from '@/constants/theme';
import { useAuth } from '@/lib/auth';

type Props = {
  visible: boolean;
  onClose: () => void;
  /** Shown under the title — keep short; browse stays behind the scrim. */
  benefitLine?: string;
  onSignedIn?: () => void;
};

/**
 * Dismissible auth sheet for gated actions (download / progress).
 * Pattern: short benefit → phone → 6-digit OTP (mockable without keys).
 */
export function AuthGateSheet({
  visible,
  onClose,
  benefitLine = 'Sign in to download for offline study and save progress.',
  onSignedIn,
}: Props) {
  const insets = useSafeAreaInsets();
  const { sendOtp, verifyOtp, mockMode } = useAuth();
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function reset() {
    setPhone('');
    setCode('');
    setStep('phone');
    setMessage(null);
    setBusy(false);
  }

  function handleClose() {
    reset();
    onClose();
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
    if (result.ok) {
      reset();
      onClose();
      onSignedIn?.();
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <Pressable style={styles.scrim} onPress={handleClose} accessibilityLabel="Dismiss sign in" />
      <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
        <View style={styles.handle} />
        <View style={styles.headerRow}>
          <Title style={styles.sheetTitle}>Sign in with phone</Title>
          <Pressable onPress={handleClose} hitSlop={12} accessibilityRole="button">
            <Ionicons name="close" size={22} color={colors.muted} />
          </Pressable>
        </View>
        <Body style={styles.benefit}>{benefitLine}</Body>
        {mockMode ? (
          <Meta style={styles.mockHint}>Mock mode — any phone, code 123456</Meta>
        ) : null}

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
              label="Verify & continue"
              onPress={onVerify}
              loading={busy}
              disabled={code.trim().length < 4}
            />
            <SecondaryButton label="Use a different number" onPress={() => setStep('phone')} />
          </>
        )}

        {message ? <Meta style={styles.message}>{message}</Meta> : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    backgroundColor: 'rgba(26, 26, 26, 0.45)',
  },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.paperDeep,
    marginBottom: spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sheetTitle: {
    fontSize: 22,
  },
  benefit: {
    color: colors.muted,
  },
  mockHint: {
    color: colors.ochre,
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
    backgroundColor: colors.paper,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
  },
  message: {
    marginBottom: spacing.sm,
  },
});
