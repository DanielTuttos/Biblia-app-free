import { useColorScheme as useSystemColorScheme } from 'react-native';

import { useBibleStore } from '@/store/bible-store';

export function useColorScheme(): 'light' | 'dark' {
  const preference = useBibleStore((s) => s.colorSchemePreference);
  const systemScheme = useSystemColorScheme() ?? 'light';

  if (preference === 'system') {
    return systemScheme;
  }

  return preference;
}
