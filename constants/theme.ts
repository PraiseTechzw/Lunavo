/**
 * Theme configuration for Lunavo - Anonymous Peer Support Platform
 * Modern, professional color palette designed for mental health support
 */

import { Platform } from 'react-native';

// Modern, calming primary colors
const primaryLight = '#6366F1'; // Indigo - calming, trustworthy
const primaryDark = '#818CF8'; // Lighter indigo for dark mode

export const Colors = {
  light: {
    text: '#0F172A', // Slate 900 - deep, readable
    background: '#FFFFFF', // Pure white
    surface: '#F8FAFC', // Slate 50 - soft, gentle
    tint: primaryLight,
    icon: '#64748B', // Slate 500 - balanced gray
    tabIconDefault: '#94A3B8', // Slate 400
    tabIconSelected: primaryLight,
    primary: primaryLight, // Indigo 500
    secondary: '#8B5CF6', // Violet 500 - complementary
    success: '#10B981', // Emerald 500 - positive, growth
    warning: '#F59E0B', // Amber 500 - caution
    danger: '#EF4444', // Red 500 - urgent, attention
    info: '#06B6D4', // Cyan 500 - informative
    border: '#E2E8F0', // Slate 200 - subtle separation
    card: '#FFFFFF', // White cards
    shadow: 'rgba(15, 23, 42, 0.08)', // Subtle shadow
    // Support-specific colors - thoughtful, professional
    mentalHealth: '#A855F7', // Purple 500 - calm, thoughtful
    crisis: '#EF4444', // Red 500 - urgent attention
    academic: '#3B82F6', // Blue 500 - knowledge, focus
    social: '#14B8A6', // Teal 500 - connection, growth
    health: '#F97316', // Orange 500 - wellness, energy
    substance: '#EC4899', // Pink 500 - recovery, care
    // Gradients - Beautiful, professional gradients
    gradients: {
      primary: ['#6366F1', '#8B5CF6'], // Indigo to Violet
      secondary: ['#8B5CF6', '#EC4899'], // Violet to Pink
      success: ['#10B981', '#14B8A6'], // Emerald to Teal
      warm: ['#F59E0B', '#F97316'], // Amber to Orange
      cool: ['#3B82F6', '#06B6D4'], // Blue to Cyan
      sunset: ['#F97316', '#EC4899'], // Orange to Pink
      ocean: ['#06B6D4', '#3B82F6'], // Cyan to Blue
      purple: ['#8B5CF6', '#A855F7'], // Violet to Purple
      card: ['#FFFFFF', '#F8FAFC'], // Subtle white gradient
      surface: ['#F8FAFC', '#FFFFFF'], // Soft surface gradient
    },
  },
  dark: {
    text: '#F1F5F9', // Slate 100 - soft on dark
    background: '#0F172A', // Slate 900 - deep, comfortable
    surface: '#1E293B', // Slate 800 - elevated surfaces
    tint: primaryDark,
    icon: '#94A3B8', // Slate 400 - visible but soft
    tabIconDefault: '#64748B', // Slate 500
    tabIconSelected: primaryDark,
    primary: primaryDark, // Indigo 400 - vibrant but not harsh
    secondary: '#A78BFA', // Violet 400
    success: '#34D399', // Emerald 400 - bright but calming
    warning: '#FBBF24', // Amber 400
    danger: '#F87171', // Red 400 - urgent but not jarring
    info: '#22D3EE', // Cyan 400
    border: '#334155', // Slate 700 - clear separation
    card: '#1E293B', // Slate 800 - elevated cards
    shadow: 'rgba(0, 0, 0, 0.4)', // Stronger shadow for depth
    // Support-specific colors - vibrant but not overwhelming
    mentalHealth: '#C084FC', // Purple 400
    crisis: '#F87171', // Red 400
    academic: '#60A5FA', // Blue 400
    social: '#2DD4BF', // Teal 400
    health: '#FB923C', // Orange 400
    substance: '#F472B6', // Pink 400
    // Gradients - Vibrant, beautiful gradients for dark mode
    gradients: {
      primary: ['#818CF8', '#A78BFA'], // Indigo to Violet
      secondary: ['#A78BFA', '#F472B6'], // Violet to Pink
      success: ['#34D399', '#2DD4BF'], // Emerald to Teal
      warm: ['#FBBF24', '#FB923C'], // Amber to Orange
      cool: ['#60A5FA', '#22D3EE'], // Blue to Cyan
      sunset: ['#FB923C', '#F472B6'], // Orange to Pink
      ocean: ['#22D3EE', '#60A5FA'], // Cyan to Blue
      purple: ['#A78BFA', '#C084FC'], // Violet to Purple
      card: ['#1E293B', '#334155'], // Dark card gradient
      surface: ['#0F172A', '#1E293B'], // Dark surface gradient
    },
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const BorderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

export const Typography = {
  h1: {
    fontSize: 32,
    fontWeight: '700' as const,
    lineHeight: 40,
  },
  h2: {
    fontSize: 24,
    fontWeight: '600' as const,
    lineHeight: 32,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 28,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
  },
  caption: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
  },
  small: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
  },
};

/**
 * Platform-specific style utilities
 */
export const PlatformStyles = {
  /**
   * Shadow styles that work on both native and web
   */
  shadow: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    android: {
      elevation: 3,
    },
    web: {
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    },
    default: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
  }),

  /**
   * Card shadow (more prominent)
   */
  cardShadow: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
    },
    android: {
      elevation: 6,
    },
    web: {
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.15)',
    },
    default: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 6,
    },
  }),

  /**
   * Web-specific styles for better desktop experience
   */
  web: Platform.OS === 'web' ? {
    maxWidth: 1200,
    marginHorizontal: 'auto' as const,
    cursor: 'pointer' as const,
  } : {},

  /**
   * Input styles optimized for web
   */
  input: Platform.select({
    web: {
      outlineStyle: 'none' as const,
      WebkitAppearance: 'none' as const,
    },
    default: {},
  }),

  /**
   * Scrollbar styles for web
   */
  scrollbar: Platform.select({
    web: {
      scrollbarWidth: 'thin' as const,
      scrollbarColor: '#C0C0C0 transparent',
    },
    default: {},
  }),
};

/**
 * Responsive spacing for larger screens (web/tablet)
 */
export const ResponsiveSpacing = {
  ...Spacing,
  // Add larger spacing for web/desktop
  container: Platform.OS === 'web' ? 24 : Spacing.md,
  section: Platform.OS === 'web' ? 32 : Spacing.lg,
};

