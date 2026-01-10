/**
 * Theme configuration for PEACE - Peer Education Club Platform
 * Modern, professional color palette designed for peer support and wellness
 */

import { Platform } from 'react-native';

// Professional Premium Palette (HSL-based for harmony)
const Brand = {
  indigo: {
    50: '#EEF2FF',
    100: '#E0E7FF',
    500: '#6366F1',
    600: '#4F46E5', // Primary Brand
    700: '#4338CA',
  },
  emerald: {
    500: '#10B981', // Success
    600: '#059669',
  },
  violet: {
    500: '#8B5CF6', // Mental Health / Wellness
  },
  slate: {
    50: '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    500: '#64748B',
    800: '#1E293B',
    900: '#0F172A', // Background Dark
  },
};

export const Colors = {
  light: {
    text: Brand.slate[900],
    background: '#FFFFFF',
    surface: Brand.slate[50],
    tint: Brand.indigo[600],
    icon: Brand.slate[500],
    tabIconDefault: Brand.slate[500],
    tabIconSelected: Brand.indigo[600],
    primary: Brand.indigo[600],
    secondary: Brand.violet[500],
    success: Brand.emerald[500],
    warning: '#F59E0B',
    danger: '#EF4444',
    info: '#06B6D4',
    border: Brand.slate[200],
    card: '#FFFFFF',
    shadow: 'rgba(15, 23, 42, 0.08)',
    // Glassmorphism tokens
    glass: {
      background: 'rgba(255, 255, 255, 0.7)',
      border: 'rgba(255, 255, 255, 0.5)',
      indicator: 'rgba(15, 23, 42, 0.1)',
    },
    // Gradients
    gradients: {
      primary: [Brand.indigo[500], Brand.violet[500]],
      secondary: [Brand.violet[500], '#C084FC'],
      success: [Brand.emerald[500], '#14B8A6'],
      danger: ['#EF4444', '#F43F5E'],
      warm: ['#F59E0B', '#F97316'],
      cool: ['#3B82F6', '#06B6D4'],
      glass: ['rgba(255, 255, 255, 0.8)', 'rgba(255, 255, 255, 0.4)'],
    },
  },
  dark: {
    text: Brand.slate[100],
    background: Brand.slate[900],
    surface: Brand.slate[800],
    tint: Brand.indigo[100],
    icon: Brand.slate[500],
    tabIconDefault: Brand.slate[500],
    tabIconSelected: Brand.indigo[100],
    primary: Brand.indigo[500],
    secondary: '#A78BFA',
    success: Brand.emerald[500],
    warning: '#FBBF24',
    danger: '#F87171',
    info: '#22D3EE',
    border: '#334155',
    card: Brand.slate[800],
    shadow: 'rgba(0, 0, 0, 0.4)',
    // Glassmorphism tokens
    glass: {
      background: 'rgba(30, 41, 59, 0.7)',
      border: 'rgba(255, 255, 255, 0.1)',
      indicator: 'rgba(255, 255, 255, 0.1)',
    },
    // Gradients
    gradients: {
      primary: ['#818CF8', '#A78BFA'],
      secondary: ['#A78BFA', '#C084FC'],
      success: ['#34D399', '#2DD4BF'],
      danger: ['#F87171', '#FB7185'],
      warm: ['#FBBF24', '#FB923C'],
      cool: ['#60A5FA', '#22D3EE'],
      glass: ['rgba(30, 41, 59, 0.8)', 'rgba(30, 41, 59, 0.4)'],
    },
  },
};

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
  xxl: 24,
  full: 9999,
};

export const Typography = {
  h1: {
    fontSize: 32,
    fontWeight: '800' as const,
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: 24,
    fontWeight: '700' as const,
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
    fontWeight: '500' as const,
    lineHeight: 16,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
};

// Animation Presets
export const Animations = {
  durations: {
    fast: 200,
    normal: 350,
    slow: 500,
    verySlow: 800,
  },
  spring: {
    damping: 15,
    stiffness: 120,
    mass: 1,
  },
};

export const PlatformStyles = {
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

  // Multi-layered premium shadow
  premiumShadow: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.1,
      shadowRadius: 20,
    },
    android: {
      elevation: 10,
    },
    web: {
      boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.1), 0 4px 10px -5px rgba(0, 0, 0, 0.04)',
    },
    default: {
      elevation: 10,
    },
  }),
};


