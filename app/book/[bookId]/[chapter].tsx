import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { ErrorView, LoadingView } from '@/components/bible/LoadingError';
import { ScreenHeader } from '@/components/bible/ScreenHeader';
import { StackPage } from '@/components/bible/StackPage';
import { VerseGrid } from '@/components/bible/VerseGrid';
import { ThemedText } from '@/components/themed-text';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import { useThemeColor } from '@/hooks/use-theme-color';
import { getBooks, getChapter } from '@/services/bible-api';
import { useBibleStore } from '@/store/bible-store';
import type { BookId } from '@/types/bible';
import { buildReadHref } from '@/utils/navigation';

export default function VersePickerScreen() {
  const { bookId, chapter: chapterParam } = useLocalSearchParams<{
    bookId: BookId;
    chapter: string;
  }>();
  const chapterNumber = Number(chapterParam);
  const translationId = useBibleStore((s) => s.translationId);
  const accent = useThemeColor({}, 'accent');
  const backgroundColor = useThemeColor({}, 'background');
  const { contentContainerStyle } = useResponsiveLayout();

  const [bookName, setBookName] = useState('');
  const [verseCount, setVerseCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadVerses = useCallback(async () => {
    if (!bookId || !chapterNumber) return;
    setLoading(true);
    setError(null);
    try {
      const [booksData, chapterData] = await Promise.all([
        getBooks(translationId),
        getChapter(translationId, bookId, chapterNumber),
      ]);
      const book = booksData.books.find((b) => b.id === bookId);
      setBookName(book?.name ?? bookId);
      setVerseCount(chapterData.numberOfVerses);
    } catch {
      setError('No se pudieron cargar los versículos.');
    } finally {
      setLoading(false);
    }
  }, [bookId, chapterNumber, translationId]);

  useEffect(() => {
    void loadVerses();
  }, [loadVerses]);

  const handleSelectVerse = (verse: number) => {
    if (!bookId) return;
    router.push(buildReadHref(bookId, chapterNumber, verse));
  };

  const handleReadChapter = () => {
    if (!bookId) return;
    router.push(buildReadHref(bookId, chapterNumber));
  };

  const title = bookName ? `${bookName} ${chapterNumber}` : 'Versículos';

  if (loading) {
    return (
      <StackPage header={<ScreenHeader title={title} backLabel="Capítulos" />}>
        <LoadingView message="Cargando versículos..." />
      </StackPage>
    );
  }

  if (error || !verseCount) {
    return (
      <StackPage header={<ScreenHeader title={title} backLabel="Capítulos" />}>
        <ErrorView message={error ?? 'Versículos no disponibles'} onRetry={loadVerses} />
      </StackPage>
    );
  }

  return (
    <StackPage header={<ScreenHeader title={title} backLabel="Capítulos" />}>
      <ScrollView
        style={{ backgroundColor }}
        contentContainerStyle={[contentContainerStyle, styles.container]}>
        <ThemedText style={styles.subtitle}>
          Selecciona un versículo · {verseCount} en total
        </ThemedText>

        <Pressable onPress={handleReadChapter} style={styles.readChapterButton}>
          <ThemedText style={[styles.readChapterText, { color: accent }]}>
            Leer capítulo completo
          </ThemedText>
        </Pressable>

        <VerseGrid totalVerses={verseCount} onSelectVerse={handleSelectVerse} />
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
  readChapterButton: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
  },
  readChapterText: {
    fontWeight: '600',
    fontSize: 15,
  },
});
