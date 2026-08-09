import AsyncStorage from '@react-native-async-storage/async-storage';
import { FreeUseBibleApi } from 'free-use-bible-api';

import { BIBLE_API_URL } from '@/constants/api';
import {
  ensureTranslationOffline,
  getOfflineAdjacentChapter,
  getOfflineBooks,
  getOfflineChapter,
  isTranslationOffline,
  searchOfflineVerses,
} from '@/services/offline-bible';
import type {
  ApiTranslation,
  ApiTranslationBookChapter,
  ApiTranslationBooks,
  BookId,
} from '@/types/bible';
import type { VerseSearchResult } from '@/types/offline';

const CACHE_PREFIX = '@biblia/cache/';

const api = new FreeUseBibleApi({
  endpoint: BIBLE_API_URL,
  useCache: true,
});

type CacheEntry<T> = {
  data: T;
  savedAt: number;
};

async function getCached<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(`${CACHE_PREFIX}${key}`);
    if (!raw) return null;
    const entry = JSON.parse(raw) as CacheEntry<T>;
    return entry.data;
  } catch {
    return null;
  }
}

async function setCached<T>(key: string, data: T): Promise<void> {
  try {
    const entry: CacheEntry<T> = { data, savedAt: Date.now() };
    await AsyncStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(entry));
  } catch {
    // Ignore cache write failures.
  }
}

export async function getAvailableTranslations(): Promise<ApiTranslation[]> {
  const cacheKey = 'translations';
  const cached = await getCached<ApiTranslation[]>(cacheKey);
  if (cached) return cached;

  const response = await api.getAvailableTranslations();
  await setCached(cacheKey, response.translations);
  return response.translations;
}

export async function getBooks(translationId: string): Promise<ApiTranslationBooks> {
  const offlineBooks = await getOfflineBooks(translationId);
  if (offlineBooks) return offlineBooks;

  const cacheKey = `books:${translationId}`;
  const cached = await getCached<ApiTranslationBooks>(cacheKey);

  try {
    const response = await api.getTranslationBooks(translationId);
    await setCached(cacheKey, response);
    return response;
  } catch {
    if (cached) return cached;
    throw new Error('No se pudieron cargar los libros.');
  }
}

export async function getChapter(
  translationId: string,
  bookId: BookId,
  chapter: number,
): Promise<ApiTranslationBookChapter> {
  const offlineChapter = await getOfflineChapter(translationId, bookId, chapter);
  if (offlineChapter) return offlineChapter;

  const cacheKey = `chapter:${translationId}:${bookId}:${chapter}`;
  const cached = await getCached<ApiTranslationBookChapter>(cacheKey);

  try {
    const response = await api.getTranslationBookChapter(translationId, bookId, chapter);
    await setCached(cacheKey, response);
    return response;
  } catch {
    if (cached) return cached;
    throw new Error('No se pudo cargar el capítulo.');
  }
}

export async function getNextChapter(
  chapter: ApiTranslationBookChapter,
): Promise<ApiTranslationBookChapter | null> {
  const offline = await getOfflineAdjacentChapter(chapter, 'next');
  if (offline !== undefined) return offline;
  return api.getNextChapter(chapter);
}

export async function getPreviousChapter(
  chapter: ApiTranslationBookChapter,
): Promise<ApiTranslationBookChapter | null> {
  const offline = await getOfflineAdjacentChapter(chapter, 'prev');
  if (offline !== undefined) return offline;
  return api.getPreviousChapter(chapter);
}

export function getVerseText(verse: ApiTranslationBookChapter['chapter']['content'][number]): string {
  if (verse.type !== 'verse') return '';
  return api.getVerseText(verse);
}

export function formatReference(
  book: ApiTranslationBooks['books'][number],
  chapter: number,
  verseStart?: number,
  verseEnd?: number,
): string {
  if (verseStart && verseEnd && verseStart !== verseEnd) {
    return api.formatReference(book, { chapter, verse: verseStart, endVerse: verseEnd });
  }
  if (verseStart) {
    return api.formatReference(book, { chapter, verse: verseStart });
  }
  return api.formatReference(book, { chapter });
}

export async function searchVerses(
  translationId: string,
  query: string,
  limit = 50,
): Promise<VerseSearchResult[]> {
  if (await isTranslationOffline(translationId)) {
    return searchOfflineVerses(translationId, query, limit);
  }
  return [];
}

export {
  ensureTranslationOffline,
  isTranslationOffline,
  getOfflineMeta,
  subscribeOfflineDownload,
  getOfflineDownloadState,
} from '@/services/offline-bible';

export { api as bibleApiClient };
