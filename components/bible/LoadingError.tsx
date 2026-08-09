import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';

type LoadingViewProps = {
  message?: string;
};

export function LoadingView({ message = 'Cargando...' }: LoadingViewProps) {
  const accent = useThemeColor({}, 'accent');

  return (
    <ThemedView style={styles.center}>
      <ActivityIndicator size="large" color={accent} />
      <ThemedText style={styles.message}>{message}</ThemedText>
    </ThemedView>
  );
}

type ErrorViewProps = {
  message: string;
  onRetry?: () => void;
};

export function ErrorView({ message, onRetry }: ErrorViewProps) {
  const accent = useThemeColor({}, 'accent');

  return (
    <ThemedView style={styles.center}>
      <ThemedText style={styles.error}>{message}</ThemedText>
      {onRetry ? (
        <Pressable onPress={onRetry} style={[styles.retryButton, { backgroundColor: accent }]}>
          <ThemedText style={styles.retryText}>Reintentar</ThemedText>
        </Pressable>
      ) : null}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  message: {
    opacity: 0.7,
  },
  error: {
    textAlign: 'center',
    lineHeight: 24,
  },
  retryButton: {
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
