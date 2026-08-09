export type VerseSearchResult = {
  bookId: import('@/types/bible').BookId;
  bookName: string;
  chapter: number;
  verse: number;
  text: string;
  reference: string;
};

export type OfflineTranslationMeta = {
  translationId: string;
  downloadedAt: number;
  verseCount: number;
};

export type OfflineDownloadStatus = 'idle' | 'downloading' | 'indexing' | 'ready' | 'error';

export type OfflineDownloadState = {
  translationId: string | null;
  status: OfflineDownloadStatus;
  progress: number;
  error?: string;
};

export type SearchIndexEntry = {
  b: import('@/types/bible').BookId;
  n: string;
  c: number;
  v: number;
  t: string;
  q: string;
};

export type StoredBooksPayload = import('@/types/bible').ApiTranslationBooks;
