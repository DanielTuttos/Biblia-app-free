import { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { ErrorView, LoadingView } from '@/components/bible/LoadingError';
import { HeaderNavButton } from '@/components/bible/HeaderNavButton';
import { ScreenHeader } from '@/components/bible/ScreenHeader';
import { StackPage } from '@/components/bible/StackPage';
import { VerseBlock } from '@/components/bible/VerseBlock';
import { ThemedText } from '@/components/themed-text';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import { useThemeColor } from '@/hooks/use-theme-color';
import { getBooks, getChapter, getNextChapter, getPreviousChapter } from '@/services/bible-api';
import { useBibleStore } from '@/store/bible-store';
import type { ApiTranslationBookChapter, BookId } from '@/types/bible';
import { buildReadHref } from '@/utils/navigation';

export default function ReaderScreen() {
  const { bookId, chapter: chapterParam, verse: verseParam } = useLocalSearchParams<{
    bookId: BookId;
    chapter: string;
    verse?: string;
  }>();
  const chapterNumber = Number(chapterParam);
  const targetVerse = verseParam ? Number(verseParam) : undefined;

  const translationId = useBibleStore((s) => s.translationId);
  const setLastReading = useBibleStore((s) => s.setLastReading);
  const backgroundColor = useThemeColor({}, 'background');
  const { contentContainerStyle } = useResponsiveLayout({ variant: 'reading' });

  const scrollRef = useRef<ScrollView>(null);
  const verseOffsets = useRef<Record<number, number>>({});
  const hasScrolledToVerse = useRef(false);

  const [chapterData, setChapterData] = useState<ApiTranslationBookChapter | null>(null);
  const [bookName, setBookName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [flashVerse, setFlashVerse] = useState<number | undefined>(undefined);

  const loadChapter = useCallback(async () => {
    if (!bookId || !chapterNumber) return;
    setLoading(true);
    setError(null);
    hasScrolledToVerse.current = false;
    verseOffsets.current = {};
    setFlashVerse(undefined);

    try {
      const [booksData, data] = await Promise.all([
        getBooks(translationId),
        getChapter(translationId, bookId, chapterNumber),
      ]);
      const book = booksData.books.find((b) => b.id === bookId);
      setBookName(book?.name ?? bookId);
      setChapterData(data);
      setLastReading({
        bookId,
        chapter: chapterNumber,
        translationId,
        bookName: book?.name,
        verse: targetVerse,
      });
    } catch {
      setError('No se pudo cargar el capítulo. Verifica tu conexión.');
    } finally {
      setLoading(false);
    }
  }, [bookId, chapterNumber, translationId, setLastReading, targetVerse]);

  useEffect(() => {
    void loadChapter();
  }, [loadChapter]);

  useEffect(() => {
    if (targetVerse === undefined || loading) return;

    setFlashVerse(targetVerse);
    const timer = setTimeout(() => setFlashVerse(undefined), 2000);
    return () => clearTimeout(timer);
  }, [targetVerse, chapterNumber, loading]);

  const handleVerseLayout = useCallback(
    (verseNumber: number, y: number) => {
      verseOffsets.current[verseNumber] = y;

      if (
        targetVerse &&
        verseNumber === targetVerse &&
        !hasScrolledToVerse.current &&
        scrollRef.current
      ) {
        hasScrolledToVerse.current = true;
        requestAnimationFrame(() => {
          scrollRef.current?.scrollTo({ y: Math.max(0, y - 24), animated: true });
        });
      }
    },
    [targetVerse],
  );

  const goToChapter = async (direction: 'prev' | 'next') => {
    if (!chapterData) return;
    const next =
      direction === 'next'
        ? await getNextChapter(chapterData)
        : await getPreviousChapter(chapterData);
    if (!next) return;
    router.replace(buildReadHref(next.book.id, next.chapter.number));
  };

  const headerTitle = targetVerse
    ? `${bookName || '...'} ${chapterNumber}:${targetVerse}`
    : `${bookName || '...'} ${chapterNumber}`;

  const headerRight =
    !loading && !error && chapterData ? (
      <View style={styles.navButtons}>
        <HeaderNavButton
          label="‹"
          disabled={!chapterData.previousChapterApiLink}
          onPress={() => void goToChapter('prev')}
        />
        <HeaderNavButton
          label="›"
          disabled={!chapterData.nextChapterApiLink}
          onPress={() => void goToChapter('next')}
        />
      </View>
    ) : undefined;

  if (loading) {
    return (
      <StackPage variant="reading" header={<ScreenHeader title="Leyendo..." backLabel="Atrás" variant="reading" />}>
        <LoadingView message="Cargando capítulo..." />
      </StackPage>
    );
  }

  if (error || !chapterData) {
    return (
      <StackPage variant="reading" header={<ScreenHeader title="Error" backLabel="Atrás" variant="reading" />}>
        <ErrorView message={error ?? 'Capítulo no disponible'} onRetry={loadChapter} />
      </StackPage>
    );
  }

  return (
    <StackPage
      variant="reading"
      header={
        <ScreenHeader title={headerTitle} backLabel="Atrás" right={headerRight} variant="reading" />
      }>
      <ScrollView
        ref={scrollRef}
        style={{ backgroundColor }}
        contentContainerStyle={[contentContainerStyle, styles.content]}>
        <ThemedText type="subtitle" style={styles.chapterTitle}>
          Capítulo {chapterNumber}
        </ThemedText>
        <VerseBlock
          chapter={chapterData}
          flashVerse={flashVerse}
          onVerseLayout={handleVerseLayout}
        />
      </ScrollView>
    </StackPage>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: 8,
    paddingBottom: 48,
  },
  chapterTitle: {
    fontFamily: 'Lora-Bold',
    marginBottom: 20,
  },
  navButtons: {
    flexDirection: 'row',
    gap: 6,
  },
});
