import { useColorScheme as useRNColorScheme } from 'react-native';

/**
 * Enhanced useColorScheme hook that strictly returns 'light' or 'dark'
 * Resolves TypeScript indexing issues with the Colors constant
 */
export function useColorScheme(): 'light' | 'dark' {
  const scheme = useRNColorScheme();
  return (scheme === 'dark' ? 'dark' : 'light');
}







