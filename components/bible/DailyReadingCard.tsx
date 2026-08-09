import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import type { DailyReadingRef } from '@/types/bible';
import { buildReadHref } from '@/utils/navigation';

type DailyReadingCardProps = {
  title: string;
  reference: string;
  preview?: string;
  reading: DailyReadingRef;
  loading?: boolean;
};

export function DailyReadingCard({
  title,
  reference,
  preview,
  reading,
  loading,
}: DailyReadingCardProps) {
  const cardColor = useThemeColor({}, 'card');
  const borderColor = useThemeColor({}, 'cardBorder');
  const accent = useThemeColor({}, 'accent');
  const muted = useThemeColor({}, 'muted');

  const handlePress = () => {
    router.push(buildReadHref(reading.bookId, reading.chapter, reading.verseStart));
  };

  return (
    <View style={[styles.card, { backgroundColor: cardColor, borderColor }]}>
      <ThemedText style={[styles.badge, { color: accent }]}>Lectura del día</ThemedText>
      <ThemedText type="subtitle" style={styles.title}>
        {title}
      </ThemedText>
      <ThemedText style={[styles.reference, { color: muted }]}>{reference}</ThemedText>

      {loading ? (
        <ActivityIndicator style={styles.loader} color={accent} />
      ) : preview ? (
        <ThemedText style={[styles.preview, { fontFamily: 'Lora' }]} numberOfLines={4}>
          {preview}
        </ThemedText>
      ) : null}

      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [styles.button, { backgroundColor: accent }, pressed && styles.buttonPressed]}>
        <ThemedText style={styles.buttonText}>Leer completo</ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    gap: 8,
  },
  badge: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  title: {
    marginTop: 4,
  },
  reference: {
    fontSize: 15,
  },
  preview: {
    marginTop: 8,
    lineHeight: 26,
    fontSize: 17,
  },
  loader: {
    marginVertical: 16,
  },
  button: {
    marginTop: 12,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
});
