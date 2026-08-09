import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import type { ApiTranslationBook } from '@/types/bible';

type BookListItemProps = {
  book: ApiTranslationBook;
  onPress: (book: ApiTranslationBook) => void;
  variant?: 'list' | 'grid';
};

export function BookListItem({ book, onPress, variant = 'list' }: BookListItemProps) {
  const borderColor = useThemeColor({}, 'cardBorder');
  const cardColor = useThemeColor({}, 'card');
  const isGrid = variant === 'grid';

  return (
    <Pressable
      onPress={() => onPress(book)}
      style={({ pressed }) => [
        styles.row,
        isGrid
          ? {
              backgroundColor: cardColor,
              borderColor,
              borderWidth: 1,
              borderRadius: 12,
              marginBottom: 12,
            }
          : { borderBottomColor: borderColor, borderBottomWidth: StyleSheet.hairlineWidth },
        pressed && styles.pressed,
      ]}>
      <ThemedText type="defaultSemiBold" numberOfLines={isGrid ? 2 : 1} style={isGrid ? styles.gridTitle : undefined}>
        {book.name}
      </ThemedText>
      <ThemedText style={styles.chapters}>{book.numberOfChapters} cap.</ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 12,
    gap: 8,
  },
  gridTitle: {
    flex: 1,
  },
  chapters: {
    fontSize: 14,
    opacity: 0.6,
  },
  pressed: {
    opacity: 0.7,
  },
});
