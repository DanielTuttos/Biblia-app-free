import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';

import { BookListItem } from '@/components/bible/BookListItem';
import { ErrorView, LoadingView } from '@/components/bible/LoadingError';
import { OfflineDownloadBanner } from '@/components/bible/OfflineDownloadBanner';
import { SearchBar } from '@/components/bible/SearchBar';
import { TestamentSwitcher, type Testament } from '@/components/bible/TestamentSwitcher';
import { VerseSearchResultItem } from '@/components/bible/VerseSearchResultItem';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { Layout } from '@/constants/layout';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import { useThemeColor } from '@/hooks/use-theme-color';
import { getBooks, searchVerses } from '@/services/bible-api';
import { useBibleStore } from '@/store/bible-store';
import type { ApiTranslationBook } from '@/types/bible';
import type { VerseSearchResult } from '@/types/offline';
import {
  buildTestamentSections,
  getBooksForTestament,
  splitBooksByTestament,
} from '@/utils/testament-books';

type BookSearchSection = {
  key: string;
  title: string;
  kind: 'books';
  data: ApiTranslationBook[];
};

type VerseSearchSection = {
  key: string;
  title: string;
  kind: 'verses';
  data: VerseSearchResult[];
};

type BibleSearchSection = BookSearchSection | VerseSearchSection;

export default function BibleScreen() {
  const translationId = useBibleStore((s) => s.translationId);
  const [books, setBooks] = useState<ApiTranslationBook[]>([]);
  const [query, setQuery] = useState('');
  const [verseResults, setVerseResults] = useState<VerseSearchResult[]>([]);
  const [activeTestament, setActiveTestament] = useState<Testament>('ot');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cardColor = useThemeColor({}, 'card');
  const borderColor = useThemeColor({}, 'cardBorder');
  const muted = useThemeColor({}, 'muted');
  const { contentContainerStyle, horizontalPadding, listNumColumns } = useResponsiveLayout();

  const loadBooks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getBooks(translationId);
      setBooks(data.books.filter((b) => !b.isApocryphal));
    } catch {
      setError(
        'No se pudieron cargar los libros. Conéctate a internet al menos una vez para descargar la Biblia.',
      );
    } finally {
      setLoading(false);
    }
  }, [translationId]);

  useEffect(() => {
    void loadBooks();
  }, [loadBooks]);

  const isSearching = query.trim().length > 0;
  const normalizedQuery = query.trim();

  useEffect(() => {
    if (normalizedQuery.length < 2) {
      setVerseResults([]);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(() => {
      void searchVerses(translationId, normalizedQuery).then((results) => {
        if (!cancelled) setVerseResults(results);
      });
    }, 180);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [normalizedQuery, translationId]);

  const filteredBooks = useMemo(() => {
    const normalized = normalizedQuery.toLowerCase();
    if (!normalized) return books;
    return books.filter(
      (book) =>
        book.name.toLowerCase().includes(normalized) ||
        book.commonName.toLowerCase().includes(normalized) ||
        book.id.toLowerCase().includes(normalized),
    );
  }, [books, normalizedQuery]);

  const { oldTestament, newTestament } = useMemo(
    () => splitBooksByTestament(books),
    [books],
  );

  const visibleBooks = useMemo(() => {
    if (isSearching) return filteredBooks;
    return getBooksForTestament(books, activeTestament);
  }, [books, filteredBooks, isSearching, activeTestament]);

  const searchSections = useMemo(() => {
    const sections: BibleSearchSection[] = buildTestamentSections(filteredBooks).map(
      (section) => ({
        key: section.title,
        title: section.title,
        kind: 'books' as const,
        data: section.data,
      }),
    );

    if (verseResults.length) {
      sections.push({
        key: 'verses',
        title: 'Versículos',
        kind: 'verses',
        data: verseResults,
      });
    }

    return sections;
  }, [filteredBooks, verseResults]);

  const handleBookPress = (book: ApiTranslationBook) => {
    router.push(`/book/${book.id}`);
  };

  if (loading) {
    return (
      <Screen>
        <LoadingView message="Cargando libros..." />
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen>
        <ErrorView message={error} onRetry={loadBooks} />
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={[styles.header, { paddingHorizontal: horizontalPadding }]}>
        <ThemedText type="title" style={styles.heading}>
          Biblia
        </ThemedText>
        <OfflineDownloadBanner translationId={translationId} />
        <SearchBar
          value={query}
          onChangeText={setQuery}
          placeholder="Buscar libros o versículos..."
        />
        {!isSearching ? (
          <TestamentSwitcher
            value={activeTestament}
            onChange={setActiveTestament}
            oldCount={oldTestament.length}
            newCount={newTestament.length}
          />
        ) : (
          <ThemedText style={[styles.searchHint, { color: muted }]}>
            Buscando libros y versículos en ambos testamentos
          </ThemedText>
        )}
      </View>

      {visibleBooks.length === 0 && !isSearching ? (
        <View style={styles.empty}>
          <ThemedText>No hay libros en esta sección.</ThemedText>
        </View>
      ) : isSearching && searchSections.length === 0 ? (
        <View style={styles.empty}>
          <ThemedText>No se encontraron resultados para «{query}»</ThemedText>
        </View>
      ) : isSearching ? (
        <ScrollView contentContainerStyle={[contentContainerStyle, styles.list]}>
          {searchSections.map((section) => (
            <View key={section.key} style={styles.searchSection}>
              <View style={[styles.sectionHeader, { backgroundColor: cardColor, borderColor }]}>
                <ThemedText type="defaultSemiBold">{section.title}</ThemedText>
                <ThemedText style={[styles.sectionCount, { color: muted }]}>
                  {section.data.length}
                </ThemedText>
              </View>
              {section.kind === 'books'
                ? section.data.map((book) => (
                    <BookListItem key={book.id} book={book} onPress={handleBookPress} />
                  ))
                : section.data.map((result) => (
                    <VerseSearchResultItem
                      key={`${result.bookId}-${result.chapter}-${result.verse}`}
                      result={result}
                    />
                  ))}
            </View>
          ))}
        </ScrollView>
      ) : (
        <FlatList
          key={`books-${listNumColumns}`}
          data={visibleBooks}
          numColumns={listNumColumns}
          keyExtractor={(item) => item.id}
          columnWrapperStyle={listNumColumns > 1 ? styles.columnWrapper : undefined}
          contentContainerStyle={[contentContainerStyle, styles.list]}
          renderItem={({ item }) => (
            <View style={listNumColumns > 1 ? styles.listItemMulti : undefined}>
              <BookListItem
                book={item}
                onPress={handleBookPress}
                variant={listNumColumns > 1 ? 'grid' : 'list'}
              />
            </View>
          )}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 8,
    paddingBottom: 12,
    gap: 12,
  },
  heading: {
    fontFamily: 'Lora-Bold',
  },
  searchHint: {
    fontSize: 13,
    textAlign: 'center',
  },
  list: {
    paddingBottom: 32,
  },
  searchSection: {
    marginBottom: 16,
  },
  columnWrapper: {
    gap: Layout.listColumnGap,
  },
  listItemMulti: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 4,
    borderRadius: 10,
    borderWidth: 1,
  },
  sectionCount: {
    fontSize: 13,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
});
