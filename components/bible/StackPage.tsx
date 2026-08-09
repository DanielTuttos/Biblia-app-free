import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedView } from '@/components/themed-view';
import { type LayoutVariant } from '@/constants/layout';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';

type StackPageProps = {
  header: ReactNode;
  children: ReactNode;
  variant?: LayoutVariant;
};

export function StackPage({ header, children, variant = 'default' }: StackPageProps) {
  const { containerStyle } = useResponsiveLayout({ variant });

  return (
    <ThemedView style={styles.page}>
      {header}
      <View style={[styles.content, containerStyle]}>{children}</View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
  },
  content: {
    flex: 1,
    width: '100%',
  },
});
