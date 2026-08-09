import { useEffect, useState } from 'react';
import { useColorScheme as useSystemColorScheme } from 'react-native';

import { useBibleStore } from '@/store/bible-store';

/**
 * To support static rendering, this value needs to be re-calculated on the client side for web.
 */
export function useColorScheme(): 'light' | 'dark' {
  const [hasHydrated, setHasHydrated] = useState(false);
  const preference = useBibleStore((s) => s.colorSchemePreference);
  const systemScheme = useSystemColorScheme() ?? 'light';

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  if (!hasHydrated) {
    return 'light';
  }

  if (preference === 'system') {
    return systemScheme;
  }

  return preference;
}
