import { useMemo } from 'react';
import { useWindowDimensions, type ViewStyle } from 'react-native';

import { Layout, type LayoutVariant } from '@/constants/layout';

type ResponsiveLayoutOptions = {
  variant?: LayoutVariant;
};

export function computeGridMetrics(
  containerWidth: number,
  gap = Layout.gridGap,
  minCell = Layout.gridCellMin,
  maxCell = Layout.gridCellMax,
) {
  if (containerWidth <= 0) {
    return { columns: 6, cellSize: minCell };
  }

  const columns = Math.max(4, Math.floor((containerWidth + gap) / (minCell + gap)));
  const cellSize = Math.min(
    maxCell,
    Math.floor((containerWidth - gap * (columns - 1)) / columns),
  );

  return { columns, cellSize };
}

export function useResponsiveLayout(options: ResponsiveLayoutOptions = {}) {
  const { width } = useWindowDimensions();
  const variant = options.variant ?? 'default';

  return useMemo(() => {
    const isTablet = width >= Layout.tabletBreakpoint;
    const isLargeScreen = width >= Layout.largeBreakpoint;
    const horizontalPadding = isTablet
      ? Layout.horizontalPaddingTablet
      : Layout.horizontalPaddingPhone;

    let maxWidth = width;
    if (isTablet) {
      if (variant === 'reading') maxWidth = Layout.readingMaxWidth;
      else if (variant === 'settings') maxWidth = Layout.settingsMaxWidth;
      else maxWidth = Layout.contentMaxWidth;
    }

    const contentMaxWidth = isTablet ? maxWidth : width;
    const innerWidth = Math.min(width, contentMaxWidth) - horizontalPadding * 2;

    const containerStyle: ViewStyle = isTablet
      ? {
          width: '100%',
          maxWidth: contentMaxWidth,
          alignSelf: 'center',
        }
      : {
          width: '100%',
        };

    const contentContainerStyle: ViewStyle = {
      ...containerStyle,
      paddingHorizontal: horizontalPadding,
    };

    return {
      width,
      isTablet,
      isLargeScreen,
      horizontalPadding,
      contentMaxWidth,
      innerWidth,
      containerStyle,
      contentContainerStyle,
      listNumColumns: isTablet ? 2 : 1,
    };
  }, [variant, width]);
}
