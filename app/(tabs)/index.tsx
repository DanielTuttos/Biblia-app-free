import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { ContinueReadingCard } from '@/components/bible/ContinueReadingCard';
import { DailyReadingCard } from '@/components/bible/DailyReadingCard';
import { ErrorView, LoadingView } from '@/components/bible/LoadingError';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import { getDailyReading } from '@/services/daily-reading';
import { formatReference, getBooks, getChapter, getVerseText } from '@/services/bible-api';
import { useBibleStore } from '@/store/bible-store';

export default function HomeScreen() {
  const translationId = useBibleStore((s) => s.translationId);
  const lastReading = useBibleStore((s) => s.lastReading);
  const { contentContainerStyle } = useResponsiveLayout();

  const dailyReading = getDailyReading();
  const [title, setTitle] = useState(dailyReading.label ?? 'Lectura del día');
  const [reference, setReference] = useState('');
  const [preview, setPreview] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDailyReading = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const booksData = await getBooks(translationId);
      const book = booksData.books.find((b) => b.id === dailyReading.bookId);
      if (!book) {
        throw new Error('No se encontró el libro del día.');
      }

      const chapterData = await getChapter(translationId, dailyReading.bookId, dailyReading.chapter);
      const ref = formatReference(
        book,
        dailyReading.chapter,
        dailyReading.verseStart,
        dailyReading.verseEnd,
      );

      setTitle(dailyReading.label ?? book.name);
      setReference(ref);

      const verses = chapterData.chapter.content.filter((v) => v.type === 'verse');
      const start = dailyReading.verseStart ?? 1;
      const end = dailyReading.verseEnd ?? Math.min(start + 2, verses.length);
      const previewVerses = verses.filter((v) => v.number >= start && v.number <= end);
      const previewText = previewVerses.map((v) => getVerseText(v)).join(' ');
      setPreview(previewText);
    } catch {
      setError('No se pudo cargar la lectura del día. Verifica tu conexión.');
    } finally {
      setLoading(false);
    }
  }, [translationId, dailyReading]);

  useEffect(() => {
    void loadDailyReading();
  }, [loadDailyReading]);

  if (error && !preview) {
    return (
      <Screen>
        <ErrorView message={error} onRetry={loadDailyReading} />
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={[contentContainerStyle, styles.content]}>
        <ThemedText type="title" style={styles.heading}>
          Biblia
        </ThemedText>
        <ThemedText style={styles.subheading}>Palabra de Dios para hoy</ThemedText>

        {lastReading && lastReading.translationId === translationId ? (
          <ContinueReadingCard reading={lastReading} />
        ) : null}

        {loading && !preview ? (
          <LoadingView message="Preparando lectura del día..." />
        ) : (
          <DailyReadingCard
            title={title}
            reference={reference}
            preview={preview}
            reading={dailyReading}
            loading={loading}
          />
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: 8,
    gap: 20,
    paddingBottom: 40,
  },
  heading: {
    fontFamily: 'Lora-Bold',
  },
  subheading: {
    opacity: 0.65,
    marginTop: -12,
    marginBottom: 4,
  },
});
