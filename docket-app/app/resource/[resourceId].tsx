import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AuthGateSheet } from '@/components/AuthGateSheet';
import { Body, Meta, PrimaryButton, SecondaryButton, Title } from '@/components/ui';
import { RESOURCE_TYPE_LABEL } from '@/constants/catalog';
import { colors, radii, spacing, typography } from '@/constants/theme';
import { useAuth } from '@/lib/auth';
import { useCatalog } from '@/lib/catalog';
import { addDownload } from '@/lib/downloads';
import { recordDownload } from '@/lib/userData';

/**
 * Resource detail — preview-first; Open viewer + Download as secondary chrome.
 * Download while logged out → dismissible auth sheet (not a hard wall).
 */
export default function ResourceDetailScreen() {
  const { resourceId } = useLocalSearchParams<{ resourceId: string }>();
  const router = useRouter();
  const { requireAuthForAction } = useAuth();
  const { getCourse, getResource, loading } = useCatalog();
  const resource = getResource(resourceId);
  const course = resource ? getCourse(resource.courseId) : undefined;
  const [gateOpen, setGateOpen] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [pendingDownload, setPendingDownload] = useState(false);

  async function saveDownload() {
    if (!resource) return;
    const result = await addDownload({
      resourceId: resource.id,
      title: resource.title,
      sizeLabel: resource.sizeLabel,
      savedAt: new Date().toISOString(),
    });
    if (result === 'added') void recordDownload(resource.id);
    setStatus(result === 'exists' ? 'Already in Downloads.' : 'Saved offline — see Downloads.');
  }

  function onDownload() {
    if (requireAuthForAction('download')) {
      setPendingDownload(true);
      setGateOpen(true);
      return;
    }
    void saveDownload();
  }

  if (!resource) {
    return (
      <View style={styles.screen}>
        <Stack.Screen options={{ title: 'Resource' }} />
        <Title>{loading ? 'Loading…' : 'Not found'}</Title>
        {loading ? null : <Body>This resource is missing.</Body>}
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title: RESOURCE_TYPE_LABEL[resource.type] }} />
      <View style={styles.preview}>
        <Meta>{course?.code}</Meta>
        <Title style={styles.title}>{resource.title}</Title>
        <Body style={styles.metaLine}>
          {RESOURCE_TYPE_LABEL[resource.type]} · {resource.sizeLabel}
        </Body>
        <Text style={styles.previewHint}>
          Preview stub — in-app PDF/viewer lands next. Bookmark stays local for v1 guest use.
        </Text>
      </View>

      <View style={styles.actions}>
        <PrimaryButton
          label="Open in viewer"
          icon="book-outline"
          onPress={() => router.push(`/viewer/${resource.id}`)}
        />
        <SecondaryButton
          label="Download for offline"
          icon="download-outline"
          onPress={onDownload}
        />
        {status ? <Meta>{status}</Meta> : null}
      </View>

      <AuthGateSheet
        visible={gateOpen}
        onClose={() => {
          setGateOpen(false);
          setPendingDownload(false);
        }}
        benefitLine="Sign in to download this file for offline study."
        onSignedIn={() => {
          if (pendingDownload) void saveDownload();
          setPendingDownload(false);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.paper,
    padding: spacing.lg,
    gap: spacing.lg,
  },
  preview: {
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: spacing.lg,
    gap: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
    minHeight: 220,
  },
  title: {
    fontSize: 24,
  },
  metaLine: {
    color: colors.muted,
  },
  previewHint: {
    marginTop: spacing.md,
    fontFamily: typography.body,
    fontSize: 14,
    color: colors.dim,
    lineHeight: 20,
  },
  actions: {
    gap: spacing.sm,
  },
});
