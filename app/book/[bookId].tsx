import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { ChapterGrid } from '@/components/bible/ChapterGrid';
import { ErrorView, LoadingView } from '@/components/bible/LoadingError';
import { ScreenHeader } from '@/components/bible/ScreenHeader';
import { StackPage } from '@/components/bible/StackPage';
import { ThemedText } from '@/components/themed-text';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import { useThemeColor } from '@/hooks/use-theme-color';
import { getBooks } from '@/services/bible-api';
import { useBibleStore } from '@/store/bible-store';
import type { ApiTranslationBook, BookId } from '@/types/bible';
import { buildVersePickerHref } from '@/utils/navigation';

export default function BookScreen() {
  const { bookId } = useLocalSearchParams<{ bookId: BookId }>();
  const translationId = useBibleStore((s) => s.translationId);
  const backgroundColor = useThemeColor({}, 'background');
  const { contentContainerStyle } = useResponsiveLayout();
  const [book, setBook] = useState<ApiTranslationBook | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadBook = useCallback(async () => {
    if (!bookId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getBooks(translationId);
      const found = data.books.find((b) => b.id === bookId);
      if (!found) throw new Error('Libro no encontrado');
      setBook(found);
    } catch {
      setError('No se pudo cargar el libro.');
    } finally {
      setLoading(false);
    }
  }, [bookId, translationId]);

  useEffect(() => {
    void loadBook();
  }, [loadBook]);

  const handleSelectChapter = (chapter: number) => {
    if (!bookId) return;
    router.push(buildVersePickerHref(bookId, chapter));
  };

  const title = book?.name ?? 'Capítulos';

  if (loading) {
    return (
      <StackPage header={<ScreenHeader title={title} backLabel="Libros" />}>
        <LoadingView />
      </StackPage>
    );
  }

  if (error || !book) {
    return (
      <StackPage header={<ScreenHeader title={title} backLabel="Libros" />}>
        <ErrorView message={error ?? 'Libro no encontrado'} onRetry={loadBook} />
      </StackPage>
    );
  }

  return (
    <StackPage header={<ScreenHeader title={book.name} backLabel="Libros" />}>
      <ScrollView
        style={{ backgroundColor }}
        contentContainerStyle={[contentContainerStyle, styles.container]}>
        <ThemedText style={styles.subtitle}>
          Selecciona un capítulo · {book.numberOfChapters} en total
        </ThemedText>
        <ChapterGrid totalChapters={book.numberOfChapters} onSelectChapter={handleSelectChapter} />
      </ScrollView>
    </StackPage>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 8,
    paddingBottom: 40,
    gap: 16,
  },
  subtitle: {
    opacity: 0.65,
  },
});
