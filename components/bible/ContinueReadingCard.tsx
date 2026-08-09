import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import type { LastReading } from '@/types/bible';
import { buildReadHref } from '@/utils/navigation';

type ContinueReadingCardProps = {
  reading: LastReading;
};

export function ContinueReadingCard({ reading }: ContinueReadingCardProps) {
  const cardColor = useThemeColor({}, 'card');
  const borderColor = useThemeColor({}, 'cardBorder');
  const muted = useThemeColor({}, 'muted');

  const label = reading.bookName
    ? reading.verse
      ? `${reading.bookName} ${reading.chapter}:${reading.verse}`
      : `${reading.bookName} ${reading.chapter}`
    : reading.verse
      ? `${reading.bookId} ${reading.chapter}:${reading.verse}`
      : `${reading.bookId} ${reading.chapter}`;

  return (
    <Pressable
      onPress={() => router.push(buildReadHref(reading.bookId, reading.chapter, reading.verse))}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: cardColor, borderColor },
        pressed && styles.pressed,
      ]}>
      <View>
        <ThemedText style={[styles.label, { color: muted }]}>Continuar leyendo</ThemedText>
        <ThemedText type="defaultSemiBold">{label}</ThemedText>
      </View>
      <ThemedText style={{ color: muted }}>→</ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
  },
  label: {
    fontSize: 13,
    marginBottom: 4,
  },
  pressed: {
    opacity: 0.8,
  },
});
