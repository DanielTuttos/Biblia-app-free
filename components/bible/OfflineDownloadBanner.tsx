import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import {
  getOfflineDownloadState,
  subscribeOfflineDownload,
} from '@/services/bible-api';
import type { OfflineDownloadState } from '@/types/offline';

type OfflineDownloadBannerProps = {
  translationId: string;
};

export function OfflineDownloadBanner({ translationId }: OfflineDownloadBannerProps) {
  const accent = useThemeColor({}, 'accent');
  const cardColor = useThemeColor({}, 'card');
  const borderColor = useThemeColor({}, 'cardBorder');
  const muted = useThemeColor({}, 'muted');
  const [state, setState] = useState<OfflineDownloadState>(getOfflineDownloadState());

  useEffect(() => subscribeOfflineDownload(setState), []);

  if (state.translationId !== translationId) return null;
  if (state.status === 'idle' || state.status === 'ready') return null;

  const label =
    state.status === 'downloading'
      ? 'Descargando Biblia para uso sin conexión...'
      : state.status === 'indexing'
        ? 'Preparando búsqueda offline...'
        : state.error ?? 'No se pudo descargar la Biblia.';

  return (
    <View style={[styles.banner, { backgroundColor: cardColor, borderColor }]}>
      {state.status === 'error' ? null : <ActivityIndicator color={accent} />}
      <View style={styles.textWrap}>
        <ThemedText type="defaultSemiBold">{label}</ThemedText>
        {state.status !== 'error' ? (
          <ThemedText style={[styles.progress, { color: muted }]}>
            {Math.round(state.progress * 100)}%
          </ThemedText>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    marginHorizontal: 20,
    marginBottom: 8,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  textWrap: {
    flex: 1,
    gap: 2,
  },
  progress: {
    fontSize: 13,
  },
});
