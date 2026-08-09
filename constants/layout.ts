export const Layout = {
  tabletBreakpoint: 768,
  largeBreakpoint: 1024,
  contentMaxWidth: 680,
  readingMaxWidth: 720,
  settingsMaxWidth: 560,
  horizontalPaddingPhone: 20,
  horizontalPaddingTablet: 32,
  gridGap: 10,
  gridCellMin: 56,
  gridCellMax: 72,
  listColumnGap: 12,
} as const;

export type LayoutVariant = 'default' | 'reading' | 'settings';
