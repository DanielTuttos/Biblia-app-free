import type {
  ApiTranslation,
  ApiTranslationBook,
  ApiTranslationBookChapter,
  ApiTranslationBooks,
  ApiTranslationComplete,
  BookId,
  ChapterVerse,
} from 'free-use-bible-api';

export type { ApiTranslation, ApiTranslationBook, ApiTranslationBookChapter, ApiTranslationBooks, ApiTranslationComplete, BookId, ChapterVerse };

export type ColorSchemePreference = 'light' | 'dark' | 'system';

export type DailyReadingRef = {
  bookId: BookId;
  chapter: number;
  verseStart?: number;
  verseEnd?: number;
  label?: string;
};

export type LastReading = {
  bookId: BookId;
  chapter: number;
  translationId: string;
  bookName?: string;
  verse?: number;
};

export type FeaturedTranslation = {
  id: string;
  language: string;
  label: string;
  description: string;
};
