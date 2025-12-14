/**
 * Platform-specific style utilities
 * Helps create styles that work well on web, Windows, iOS, and Android
 */

import { Platform, StyleSheet, ViewStyle, TextStyle } from 'react-native';

/**
 * Create shadow styles that work across all platforms
 */
export function createShadow(
  elevation: number = 3,
  shadowColor: string = '#000',
  shadowOpacity: number = 0.1
): ViewStyle {
  if (Platform.OS === 'web') {
    return {
      boxShadow: `0 ${elevation}px ${elevation * 2}px rgba(0, 0, 0, ${shadowOpacity})`,
    };
  }

  if (Platform.OS === 'ios') {
    return {
      shadowColor,
      shadowOffset: { width: 0, height: elevation },
      shadowOpacity,
      shadowRadius: elevation * 1.5,
    };
  }

  // Android
  return {
    elevation,
  };
}

/**
 * Create card shadow (more prominent)
 */
export function createCardShadow(): ViewStyle {
  return createShadow(6, '#000', 0.15);
}

/**
 * Web-optimized input styles
 */
export function createInputStyle(): TextStyle {
  if (Platform.OS === 'web') {
    return {
      outlineStyle: 'none',
      WebkitAppearance: 'none',
    } as TextStyle;
  }
  return {};
}

/**
 * Responsive container width for web
 */
export function getContainerStyle(): ViewStyle {
  if (Platform.OS === 'web') {
    return {
      maxWidth: 1200,
      marginHorizontal: 'auto',
      width: '100%',
    } as ViewStyle;
  }
  return {};
}

/**
 * Cursor pointer for web interactive elements
 */
export function getCursorStyle(): ViewStyle {
  if (Platform.OS === 'web') {
    return {
      cursor: 'pointer',
    } as ViewStyle;
  }
  return {};
}

/**
 * Web scrollbar styling
 */
export function getScrollViewStyle(): ViewStyle {
  if (Platform.OS === 'web') {
    return {
      scrollbarWidth: 'thin',
      scrollbarColor: '#C0C0C0 transparent',
    } as ViewStyle;
  }
  return {};
}

/**
 * Platform-specific font family
 */
export function getFontFamily(style: 'sans' | 'serif' | 'mono' = 'sans'): TextStyle {
  if (Platform.OS === 'web') {
    const fonts = {
      sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
      serif: "Georgia, 'Times New Roman', serif",
      mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
    };
    return {
      fontFamily: fonts[style],
    };
  }
  return {};
}

/**
 * Combine multiple style objects with platform-specific handling
 */
export function combineStyles(...styles: (ViewStyle | TextStyle | undefined)[]): ViewStyle | TextStyle {
  return StyleSheet.flatten(styles.filter(Boolean));
}






