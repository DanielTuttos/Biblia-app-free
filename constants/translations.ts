import type { FeaturedTranslation } from '@/types/bible';

export const DEFAULT_LANGUAGE = 'spa';
export const DEFAULT_TRANSLATION_ID = 'spa_r09';

export const FEATURED_TRANSLATIONS: FeaturedTranslation[] = [
  {
    id: 'spa_r09',
    language: 'spa',
    label: 'Reina Valera 1909',
    description: 'Dominio público · Español clásico',
  },
  {
    id: 'spa_bes',
    language: 'spa',
    label: 'Biblia en Español Sencillo',
    description: 'CC BY · Lenguaje contemporáneo',
  },
  {
    id: 'BSB',
    language: 'eng',
    label: 'Berean Standard Bible',
    description: 'Dominio público · Inglés moderno',
  },
  {
    id: 'ENGWEBP',
    language: 'eng',
    label: 'World English Bible',
    description: 'Dominio público · Inglés',
  },
];

export const LANGUAGE_OPTIONS = [
  { code: 'spa', label: 'Español' },
  { code: 'eng', label: 'English' },
  { code: 'por', label: 'Português' },
  { code: 'fra', label: 'Français' },
  { code: 'deu', label: 'Deutsch' },
];

export function getDefaultTranslationForLanguage(language: string): string {
  const featured = FEATURED_TRANSLATIONS.find((t) => t.language === language);
  return featured?.id ?? DEFAULT_TRANSLATION_ID;
}
