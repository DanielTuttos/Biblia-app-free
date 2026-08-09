/**
 * Theme tokens for the Bible app.
 */

export const ReadingColors = {
  light: {
    background: '#FAF8F5',
    text: '#2C2416',
    verseNumber: '#B8860B',
    card: '#FFFFFF',
    cardBorder: '#E8E0D4',
    accent: '#B8860B',
    muted: '#6B6358',
  },
  dark: {
    background: '#1A1814',
    text: '#F0EBE3',
    verseNumber: '#D4A843',
    card: '#252219',
    cardBorder: '#3A352C',
    accent: '#D4A843',
    muted: '#A89E90',
  },
};

const tintColorLight = ReadingColors.light.accent;
const tintColorDark = ReadingColors.dark.accent;

export const Colors = {
  light: {
    text: ReadingColors.light.text,
    background: ReadingColors.light.background,
    tint: tintColorLight,
    icon: ReadingColors.light.muted,
    tabIconDefault: ReadingColors.light.muted,
    tabIconSelected: tintColorLight,
    card: ReadingColors.light.card,
    cardBorder: ReadingColors.light.cardBorder,
    accent: ReadingColors.light.accent,
    muted: ReadingColors.light.muted,
    verseNumber: ReadingColors.light.verseNumber,
  },
  dark: {
    text: ReadingColors.dark.text,
    background: ReadingColors.dark.background,
    tint: tintColorDark,
    icon: ReadingColors.dark.muted,
    tabIconDefault: ReadingColors.dark.muted,
    tabIconSelected: tintColorDark,
    card: ReadingColors.dark.card,
    cardBorder: ReadingColors.dark.cardBorder,
    accent: ReadingColors.dark.accent,
    muted: ReadingColors.dark.muted,
    verseNumber: ReadingColors.dark.verseNumber,
  },
};

export const ReadingTypography = {
  lineHeightMultiplier: 1.65,
  verseSpacing: 12,
};
