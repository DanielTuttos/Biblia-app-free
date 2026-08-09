import { Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import type { VerseSearchResult } from '@/types/offline';
import { buildReadHref } from '@/utils/navigation';

type VerseSearchResultItemProps = {
  result: VerseSearchResult;
};

export function VerseSearchResultItem({ result }: VerseSearchResultItemProps) {
  const borderColor = useThemeColor({}, 'cardBorder');
  const muted = useThemeColor({}, 'muted');
  const accent = useThemeColor({}, 'accent');

  return (
    <Pressable
      onPress={() => router.push(buildReadHref(result.bookId, result.chapter, result.verse))}
      style={({ pressed }) => [
        styles.row,
        { borderBottomColor: borderColor },
        pressed && styles.pressed,
      ]}>
      <ThemedText type="defaultSemiBold" style={{ color: accent }}>
        {result.reference}
      </ThemedText>
      <ThemedText style={[styles.preview, { color: muted }]} numberOfLines={2}>
        {result.text}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 4,
  },
  preview: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'Lora',
  },
  pressed: {
    opacity: 0.7,
  },
});
