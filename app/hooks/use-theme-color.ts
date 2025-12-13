/**
 * Hook for accessing theme colors
 */

import { Colors } from '@/app/constants/theme';
import { useColorScheme } from './use-color-scheme';

// Exclude gradients from color name keys since gradients are objects, not strings
type ColorName = Exclude<keyof typeof Colors.light, 'gradients'>;

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: ColorName
): string {
  const theme = useColorScheme() ?? 'light';
  const colorFromProps = props[theme];

  if (colorFromProps) {
    return colorFromProps;
  } else {
    return Colors[theme][colorName] as string;
  }
}


