import type { Href } from 'expo-router';

import type { BookId } from '@/types/bible';

export function buildReadHref(bookId: BookId, chapter: number, verse?: number): Href {
  if (verse) {
    return {
      pathname: '/read/[bookId]/[chapter]',
      params: {
        bookId,
        chapter: String(chapter),
        verse: String(verse),
      },
    };
  }

  return {
    pathname: '/read/[bookId]/[chapter]',
    params: {
      bookId,
      chapter: String(chapter),
    },
  };
}

export function parseReadNotificationUrl(url: string): Href | null {
  const [path, query = ''] = url.split('?');
  const match = path.match(/^\/read\/([^/]+)\/(\d+)$/);
  if (!match) return null;

  const [, bookId, chapter] = match;
  const verseMatch = query.match(/(?:^|&)verse=(\d+)/);
  const verse = verseMatch ? Number(verseMatch[1]) : undefined;

  return buildReadHref(bookId as BookId, Number(chapter), verse);
}

export function buildVersePickerHref(bookId: BookId, chapter: number): Href {
  return {
    pathname: '/book/[bookId]/[chapter]',
    params: {
      bookId,
      chapter: String(chapter),
    },
  };
}
