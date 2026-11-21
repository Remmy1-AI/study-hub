import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import { colors, radii, spacing, typography } from '@/constants/theme';

export function Screen({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[styles.screen, style]}>{children}</View>;
}

export function Title({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<TextStyle>;
}) {
  return <Text style={[styles.title, style]}>{children}</Text>;
}

export function Subtitle({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<TextStyle>;
}) {
  return <Text style={[styles.subtitle, style]}>{children}</Text>;
}

export function Body({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<TextStyle>;
}) {
  return <Text style={[styles.body, style]}>{children}</Text>;
}

export function Meta({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<TextStyle>;
}) {
  return <Text style={[styles.meta, style]}>{children}</Text>;
}

export function PrimaryButton({
  label,
  onPress,
  disabled,
  loading,
  icon,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.primaryBtn,
        (disabled || loading) && styles.btnDisabled,
        pressed && !disabled && styles.btnPressed,
      ]}>
      {loading ? (
        <ActivityIndicator color={colors.paper} />
      ) : (
        <View style={styles.btnRow}>
          {icon ? <Ionicons name={icon} size={18} color={colors.paper} /> : null}
          <Text style={styles.primaryBtnText}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
}

export function SecondaryButton({
  label,
  onPress,
  disabled,
  icon,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.secondaryBtn,
        disabled && styles.btnDisabled,
        pressed && !disabled && styles.btnPressed,
      ]}>
      <View style={styles.btnRow}>
        {icon ? <Ionicons name={icon} size={18} color={colors.forest} /> : null}
        <Text style={styles.secondaryBtnText}>{label}</Text>
      </View>
    </Pressable>
  );
}

export function ListRow({
  title,
  subtitle,
  meta,
  onPress,
  right,
  locked,
}: {
  title: string;
  subtitle?: string;
  meta?: string;
  onPress?: () => void;
  right?: React.ReactNode;
  locked?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [styles.listRow, pressed && onPress && styles.listRowPressed]}>
      <View style={styles.listRowBody}>
        <Text style={styles.listRowTitle}>{title}</Text>
        {subtitle ? <Text style={styles.listRowSubtitle}>{subtitle}</Text> : null}
        {meta ? <Text style={styles.listRowMeta}>{meta}</Text> : null}
      </View>
      {locked ? (
        <Ionicons name="lock-closed-outline" size={18} color={colors.ochre} style={styles.lock} />
      ) : null}
      {right ?? (onPress ? <Ionicons name="chevron-forward" size={18} color={colors.dim} /> : null)}
    </Pressable>
  );
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return <Text style={styles.sectionLabel}>{children}</Text>;
}

export function EmptyState({
  title,
  body,
  actionLabel,
  onAction,
}: {
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyBody}>{body}</Text>
      {actionLabel && onAction ? (
        <PrimaryButton label={actionLabel} onPress={onAction} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  title: {
    fontFamily: typography.display,
    fontSize: 28,
    color: colors.ink,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontFamily: typography.bodyMedium,
    fontSize: 16,
    color: colors.muted,
    lineHeight: 22,
  },
  body: {
    fontFamily: typography.body,
    fontSize: 15,
    color: colors.ink,
    lineHeight: 22,
  },
  meta: {
    fontFamily: typography.body,
    fontSize: 13,
    color: colors.dim,
  },
  primaryBtn: {
    backgroundColor: colors.forest,
    borderRadius: radii.md,
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    fontFamily: typography.bodyBold,
    fontSize: 15,
    color: colors.paper,
  },
  secondaryBtn: {
    backgroundColor: colors.forestSoft,
    borderRadius: radii.md,
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
  },
  secondaryBtnText: {
    fontFamily: typography.bodyBold,
    fontSize: 15,
    color: colors.forest,
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  btnPressed: {
    opacity: 0.85,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
    backgroundColor: colors.card,
  },
  listRowPressed: {
    backgroundColor: colors.paperDeep,
  },
  listRowBody: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  listRowTitle: {
    fontFamily: typography.bodyMedium,
    fontSize: 16,
    color: colors.ink,
  },
  listRowSubtitle: {
    fontFamily: typography.body,
    fontSize: 14,
    color: colors.muted,
    marginTop: 2,
  },
  listRowMeta: {
    fontFamily: typography.body,
    fontSize: 12,
    color: colors.dim,
    marginTop: 4,
  },
  lock: {
    marginRight: 6,
  },
  sectionLabel: {
    fontFamily: typography.bodyBold,
    fontSize: 12,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: colors.forest,
    marginBottom: spacing.sm,
  },
  empty: {
    padding: spacing.lg,
    gap: spacing.md,
    alignItems: 'flex-start',
  },
  emptyTitle: {
    fontFamily: typography.bodyBold,
    fontSize: 18,
    color: colors.ink,
  },
  emptyBody: {
    fontFamily: typography.body,
    fontSize: 15,
    color: colors.muted,
    lineHeight: 22,
  },
});
