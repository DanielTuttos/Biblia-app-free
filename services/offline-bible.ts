import * as FileSystem from 'expo-file-system/legacy';
import { FreeUseBibleApi } from 'free-use-bible-api';

import { BIBLE_API_URL } from '@/constants/api';
import type {
  ApiTranslation,
  ApiTranslationBook,
  ApiTranslationBookChapter,
  ApiTranslationBooks,
  ApiTranslationComplete,
  BookId,
  ChapterVerse,
} from '@/types/bible';
import type {
  OfflineDownloadState,
  OfflineTranslationMeta,
  SearchIndexEntry,
  StoredBooksPayload,
  VerseSearchResult,
} from '@/types/offline';

const OFFLINE_ROOT = `${FileSystem.documentDirectory ?? ''}bible/`;

const api = new FreeUseBibleApi({
  endpoint: BIBLE_API_URL,
  useCache: true,
});

const memoryComplete = new Map<string, ApiTranslationComplete>();
const memorySearchIndex = new Map<string, SearchIndexEntry[]>();

let downloadState: OfflineDownloadState = {
  translationId: null,
  status: 'idle',
  progress: 0,
};

const downloadListeners = new Set<(state: OfflineDownloadState) => void>();

function notifyDownloadListeners() {
  for (const listener of downloadListeners) {
    listener(downloadState);
  }
}

function setDownloadState(next: Partial<OfflineDownloadState>) {
  downloadState = { ...downloadState, ...next };
  notifyDownloadListeners();
}

export function subscribeOfflineDownload(listener: (state: OfflineDownloadState) => void) {
  downloadListeners.add(listener);
  listener(downloadState);
  return () => {
    downloadListeners.delete(listener);
  };
}

export function getOfflineDownloadState() {
  return downloadState;
}

function translationDir(translationId: string) {
  return `${OFFLINE_ROOT}${translationId}/`;
}

function completePath(translationId: string) {
  return `${translationDir(translationId)}complete.json`;
}

function booksPath(translationId: string) {
  return `${translationDir(translationId)}books.json`;
}

function metaPath(translationId: string) {
  return `${translationDir(translationId)}meta.json`;
}

function searchIndexPath(translationId: string) {
  return `${translationDir(translationId)}search-index.json`;
}

async function ensureDir(path: string) {
  const info = await FileSystem.getInfoAsync(path);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(path, { intermediates: true });
  }
}

export async function isTranslationOffline(translationId: string): Promise<boolean> {
  const info = await FileSystem.getInfoAsync(metaPath(translationId));
  return info.exists;
}

function completeBookToApiBook(
  book: ApiTranslationComplete['books'][number],
  translation: ApiTranslation,
): ApiTranslationBook {
  return {
    id: book.id,
    name: book.name,
    commonName: book.commonName,
    title: book.title,
    order: book.order,
    isApocryphal: book.isApocryphal,
    firstChapterNumber: 1,
    firstChapterApiLink: `/api/${translation.id}/${book.id}/1.json`,
    lastChapterNumber: book.numberOfChapters,
    lastChapterApiLink: `/api/${translation.id}/${book.id}/${book.numberOfChapters}.json`,
    firstChapterReference: {
      translationId: translation.id,
      book: book.id,
      chapter: 1,
    },
    lastChapterReference: {
      translationId: translation.id,
      book: book.id,
      chapter: book.numberOfChapters,
    },
    numberOfChapters: book.numberOfChapters,
    totalNumberOfVerses: book.totalNumberOfVerses,
  };
}

function getOrderedBooks(complete: ApiTranslationComplete) {
  return complete.books.filter((book) => !book.isApocryphal);
}

function resolveAdjacentReference(
  complete: ApiTranslationComplete,
  bookId: BookId,
  chapterNumber: number,
  direction: 'next' | 'prev',
): { bookId: BookId; chapter: number } | null {
  const books = getOrderedBooks(complete);
  const bookIndex = books.findIndex((book) => book.id === bookId);
  if (bookIndex === -1) return null;

  const book = books[bookIndex];

  if (direction === 'next') {
    if (chapterNumber < book.numberOfChapters) {
      return { bookId, chapter: chapterNumber + 1 };
    }
    if (bookIndex >= books.length - 1) return null;
    return { bookId: books[bookIndex + 1].id, chapter: 1 };
  }

  if (chapterNumber > 1) {
    return { bookId, chapter: chapterNumber - 1 };
  }
  if (bookIndex <= 0) return null;
  const previousBook = books[bookIndex - 1];
  return { bookId: previousBook.id, chapter: previousBook.numberOfChapters };
}

function buildChapterResponse(
  complete: ApiTranslationComplete,
  bookId: BookId,
  chapterNumber: number,
): ApiTranslationBookChapter | null {
  const book = complete.books.find((entry) => entry.id === bookId);
  if (!book) return null;

  const chapterData = book.chapters.find((entry) => entry.chapter.number === chapterNumber);
  if (!chapterData) return null;

  const apiBook = completeBookToApiBook(book, complete.translation);
  const nextRef = resolveAdjacentReference(complete, bookId, chapterNumber, 'next');
  const prevRef = resolveAdjacentReference(complete, bookId, chapterNumber, 'prev');
  const verses = chapterData.chapter.content.filter(
    (item): item is ChapterVerse => item.type === 'verse',
  );

  return {
    chapter: chapterData.chapter,
    thisChapterAudioLinks: chapterData.thisChapterAudioLinks,
    translation: complete.translation,
    book: apiBook,
    thisChapterLink: `/api/${complete.translation.id}/${bookId}/${chapterNumber}.json`,
    thisChapterReference: {
      translationId: complete.translation.id,
      book: bookId,
      chapter: chapterNumber,
    },
    nextChapterApiLink: nextRef
      ? `/api/${complete.translation.id}/${nextRef.bookId}/${nextRef.chapter}.json`
      : null,
    nextChapterReference: nextRef
      ? {
          translationId: complete.translation.id,
          book: nextRef.bookId,
          chapter: nextRef.chapter,
        }
      : null,
    nextChapterAudioLinks: null,
    previousChapterApiLink: prevRef
      ? `/api/${complete.translation.id}/${prevRef.bookId}/${prevRef.chapter}.json`
      : null,
    previousChapterReference: prevRef
      ? {
          translationId: complete.translation.id,
          book: prevRef.bookId,
          chapter: prevRef.chapter,
        }
      : null,
    previousChapterAudioLinks: null,
    numberOfVerses: verses.length,
  };
}

function buildSearchIndex(complete: ApiTranslationComplete): SearchIndexEntry[] {
  const entries: SearchIndexEntry[] = [];

  for (const book of getOrderedBooks(complete)) {
    for (const chapter of book.chapters) {
      for (const item of chapter.chapter.content) {
        if (item.type !== 'verse') continue;
        const text = api.getVerseText(item);
        entries.push({
          b: book.id,
          n: book.name,
          c: chapter.chapter.number,
          v: item.number,
          t: text,
          q: normalizeSearchText(text),
        });
      }
    }
  }

  return entries;
}

function buildBooksPayload(complete: ApiTranslationComplete): StoredBooksPayload {
  return {
    translation: complete.translation,
    books: getOrderedBooks(complete).map((book) =>
      completeBookToApiBook(book, complete.translation),
    ),
  };
}

export function normalizeSearchText(value: string) {
  return value
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .trim();
}

async function loadCompleteTranslation(translationId: string): Promise<ApiTranslationComplete | null> {
  if (memoryComplete.has(translationId)) {
    return memoryComplete.get(translationId) ?? null;
  }

  const info = await FileSystem.getInfoAsync(completePath(translationId));
  if (!info.exists) return null;

  const raw = await FileSystem.readAsStringAsync(completePath(translationId));
  const parsed = JSON.parse(raw) as ApiTranslationComplete;
  memoryComplete.set(translationId, parsed);
  return parsed;
}

async function loadSearchIndex(translationId: string): Promise<SearchIndexEntry[]> {
  if (memorySearchIndex.has(translationId)) {
    return memorySearchIndex.get(translationId) ?? [];
  }

  const info = await FileSystem.getInfoAsync(searchIndexPath(translationId));
  if (!info.exists) return [];

  const raw = await FileSystem.readAsStringAsync(searchIndexPath(translationId));
  const parsed = JSON.parse(raw) as SearchIndexEntry[];
  memorySearchIndex.set(translationId, parsed);
  return parsed;
}

const activeDownloads = new Map<string, Promise<void>>();

export async function ensureTranslationOffline(translationId: string): Promise<void> {
  if (await isTranslationOffline(translationId)) {
    setDownloadState({
      translationId,
      status: 'ready',
      progress: 1,
      error: undefined,
    });
    return;
  }

  const existing = activeDownloads.get(translationId);
  if (existing) {
    await existing;
    return;
  }

  const task = downloadTranslation(translationId).finally(() => {
    activeDownloads.delete(translationId);
  });

  activeDownloads.set(translationId, task);
  await task;
}

async function downloadTranslation(translationId: string) {
  if (!FileSystem.documentDirectory) {
    throw new Error('No hay almacenamiento disponible en el dispositivo.');
  }

  setDownloadState({
    translationId,
    status: 'downloading',
    progress: 0,
    error: undefined,
  });

  try {
    await ensureDir(OFFLINE_ROOT);
    await ensureDir(translationDir(translationId));

    const downloadUrl = `${BIBLE_API_URL}api/${encodeURIComponent(translationId)}/complete.json`;
    const targetPath = completePath(translationId);

    const download = FileSystem.createDownloadResumable(
      downloadUrl,
      targetPath,
      {},
      (progress) => {
        const total = progress.totalBytesExpectedToWrite || 1;
        const ratio = progress.totalBytesWritten / total;
        setDownloadState({
          translationId,
          status: 'downloading',
          progress: Math.min(ratio * 0.85, 0.85),
        });
      },
    );

    const result = await download.downloadAsync();
    if (!result?.uri) {
      throw new Error('No se pudo guardar la traducción en el dispositivo.');
    }

    setDownloadState({
      translationId,
      status: 'indexing',
      progress: 0.9,
    });

    const complete = await loadCompleteTranslation(translationId);
    if (!complete) {
      throw new Error('No se pudo leer la traducción descargada.');
    }

    const booksPayload = buildBooksPayload(complete);
    const searchIndex = buildSearchIndex(complete);
    const meta: OfflineTranslationMeta = {
      translationId,
      downloadedAt: Date.now(),
      verseCount: searchIndex.length,
    };

    await FileSystem.writeAsStringAsync(booksPath(translationId), JSON.stringify(booksPayload));
    await FileSystem.writeAsStringAsync(searchIndexPath(translationId), JSON.stringify(searchIndex));
    await FileSystem.writeAsStringAsync(metaPath(translationId), JSON.stringify(meta));

    memorySearchIndex.set(translationId, searchIndex);

    setDownloadState({
      translationId,
      status: 'ready',
      progress: 1,
      error: undefined,
    });
  } catch (error) {
    setDownloadState({
      translationId,
      status: 'error',
      progress: 0,
      error: error instanceof Error ? error.message : 'Error al descargar la Biblia.',
    });
    throw error;
  }
}

export async function getOfflineBooks(translationId: string): Promise<ApiTranslationBooks | null> {
  const info = await FileSystem.getInfoAsync(booksPath(translationId));
  if (!info.exists) {
    const complete = await loadCompleteTranslation(translationId);
    if (!complete) return null;
    return buildBooksPayload(complete);
  }

  const raw = await FileSystem.readAsStringAsync(booksPath(translationId));
  return JSON.parse(raw) as ApiTranslationBooks;
}

export async function getOfflineChapter(
  translationId: string,
  bookId: BookId,
  chapter: number,
): Promise<ApiTranslationBookChapter | null> {
  const complete = await loadCompleteTranslation(translationId);
  if (!complete) return null;
  return buildChapterResponse(complete, bookId, chapter);
}

export async function getOfflineAdjacentChapter(
  chapter: ApiTranslationBookChapter,
  direction: 'next' | 'prev',
): Promise<ApiTranslationBookChapter | null | undefined> {
  const complete = await loadCompleteTranslation(chapter.translation.id);
  if (!complete) return undefined;

  const adjacent = resolveAdjacentReference(
    complete,
    chapter.book.id,
    chapter.chapter.number,
    direction,
  );
  if (!adjacent) return null;

  return buildChapterResponse(complete, adjacent.bookId, adjacent.chapter);
}

export async function searchOfflineVerses(
  translationId: string,
  query: string,
  limit = 50,
): Promise<VerseSearchResult[]> {
  const normalizedQuery = normalizeSearchText(query);
  if (normalizedQuery.length < 2) return [];

  const index = await loadSearchIndex(translationId);
  if (!index.length) return [];

  const results: VerseSearchResult[] = [];

  for (const entry of index) {
    if (!entry.q.includes(normalizedQuery)) continue;
    results.push({
      bookId: entry.b,
      bookName: entry.n,
      chapter: entry.c,
      verse: entry.v,
      text: entry.t,
      reference: `${entry.n} ${entry.c}:${entry.v}`,
    });
    if (results.length >= limit) break;
  }

  return results;
}

export async function getOfflineMeta(translationId: string): Promise<OfflineTranslationMeta | null> {
  const info = await FileSystem.getInfoAsync(metaPath(translationId));
  if (!info.exists) return null;
  const raw = await FileSystem.readAsStringAsync(metaPath(translationId));
  return JSON.parse(raw) as OfflineTranslationMeta;
}
