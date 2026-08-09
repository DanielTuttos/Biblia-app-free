import { StyleSheet, View, type ViewProps } from 'react-native';
import { SafeAreaView, type Edges } from 'react-native-safe-area-context';

import { type LayoutVariant } from '@/constants/layout';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import { useThemeColor } from '@/hooks/use-theme-color';

type ScreenProps = ViewProps & {
  edges?: Edges;
  variant?: LayoutVariant;
};

export function Screen({
  children,
  edges = ['top'],
  variant = 'default',
  style,
  ...rest
}: ScreenProps) {
  const backgroundColor = useThemeColor({}, 'background');
  const { containerStyle } = useResponsiveLayout({ variant });

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor }, style]}
      edges={edges}
      {...rest}>
      <View style={[styles.inner, containerStyle]}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  inner: {
    flex: 1,
    width: '100%',
  },
});
