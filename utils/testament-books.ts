import type { ApiTranslationBook } from '@/types/bible';

export const OLD_TESTAMENT_MAX_ORDER = 39;

export type Testament = 'ot' | 'nt';

export function splitBooksByTestament(books: ApiTranslationBook[]) {
  const oldTestament = books.filter((book) => book.order <= OLD_TESTAMENT_MAX_ORDER);
  const newTestament = books.filter((book) => book.order > OLD_TESTAMENT_MAX_ORDER);
  return { oldTestament, newTestament };
}

export function getBooksForTestament(books: ApiTranslationBook[], testament: Testament) {
  const { oldTestament, newTestament } = splitBooksByTestament(books);
  return testament === 'ot' ? oldTestament : newTestament;
}

export function buildTestamentSections(books: ApiTranslationBook[]) {
  const { oldTestament, newTestament } = splitBooksByTestament(books);
  const sections: { title: string; data: ApiTranslationBook[] }[] = [];

  if (oldTestament.length) {
    sections.push({ title: 'Antiguo Testamento', data: oldTestament });
  }
  if (newTestament.length) {
    sections.push({ title: 'Nuevo Testamento', data: newTestament });
  }

  return sections;
}
