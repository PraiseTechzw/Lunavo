/**
 * Accessibility Utilities - Screen reader, keyboard navigation, high contrast, font size
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export interface AccessibilitySettings {
  fontSize: 'small' | 'medium' | 'large' | 'extra-large';
  highContrast: boolean;
  reduceMotion: boolean;
  screenReaderEnabled: boolean;
}

const DEFAULT_SETTINGS: AccessibilitySettings = {
  fontSize: 'medium',
  highContrast: false,
  reduceMotion: false,
  screenReaderEnabled: false,
};

const ACCESSIBILITY_SETTINGS_KEY = '@lunavo:accessibility_settings';

/**
 * Get accessibility settings from storage
 */
export async function getAccessibilitySettings(): Promise<AccessibilitySettings> {
  try {
    const settingsJson = await AsyncStorage.getItem(ACCESSIBILITY_SETTINGS_KEY);
    if (settingsJson) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(settingsJson) };
    }
    return DEFAULT_SETTINGS;
  } catch (error) {
    console.error('Error loading accessibility settings:', error);
    return DEFAULT_SETTINGS;
  }
}

/**
 * Save accessibility settings to storage
 */
export async function saveAccessibilitySettings(
  settings: Partial<AccessibilitySettings>
): Promise<void> {
  try {
    const currentSettings = await getAccessibilitySettings();
    const newSettings = { ...currentSettings, ...settings };
    await AsyncStorage.setItem(ACCESSIBILITY_SETTINGS_KEY, JSON.stringify(newSettings));
  } catch (error) {
    console.error('Error saving accessibility settings:', error);
  }
}

/**
 * Get font size multiplier based on setting
 */
export function getFontSizeMultiplier(fontSize: AccessibilitySettings['fontSize']): number {
  switch (fontSize) {
    case 'small':
      return 0.875; // 14px base
    case 'medium':
      return 1; // 16px base
    case 'large':
      return 1.25; // 20px base
    case 'extra-large':
      return 1.5; // 24px base
    default:
      return 1;
  }
}

/**
 * Get scaled font size
 */
export function getScaledFontSize(baseSize: number, fontSize: AccessibilitySettings['fontSize']): number {
  return baseSize * getFontSizeMultiplier(fontSize);
}

/**
 * Get high contrast colors
 */
export function getHighContrastColors(isHighContrast: boolean, colorScheme: 'light' | 'dark') {
  if (!isHighContrast) {
    return null;
  }

  if (colorScheme === 'dark') {
    return {
      text: '#FFFFFF',
      background: '#000000',
      surface: '#1A1A1A',
      border: '#FFFFFF',
      primary: '#00FFFF', // Cyan for high contrast
      secondary: '#FFFF00', // Yellow for high contrast
    };
  } else {
    return {
      text: '#000000',
      background: '#FFFFFF',
      surface: '#F5F5F5',
      border: '#000000',
      primary: '#0000FF', // Blue for high contrast
      secondary: '#FF0000', // Red for high contrast
    };
  }
}

/**
 * Generate accessibility label for screen readers
 */
export function generateAccessibilityLabel(
  text: string,
  role?: string,
  state?: string
): string {
  let label = text;
  
  if (role) {
    label = `${role}: ${label}`;
  }
  
  if (state) {
    label = `${label}, ${state}`;
  }
  
  return label;
}

/**
 * Check if screen reader is enabled (platform-specific)
 */
export async function isScreenReaderEnabled(): Promise<boolean> {
  if (Platform.OS === 'web') {
    // On web, check for screen reader usage patterns
    // This is a simplified check - in production, use a library like react-native-accessibility
    return false; // Would need actual detection
  }
  
  // On native, this would use AccessibilityInfo
  // For now, return false as a default
  return false;
}

/**
 * Announce message to screen reader
 */
export function announceToScreenReader(message: string): void {
  if (Platform.OS === 'web') {
    // Create a live region for screen reader announcements
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.style.position = 'absolute';
    announcement.style.left = '-10000px';
    announcement.style.width = '1px';
    announcement.style.height = '1px';
    announcement.style.overflow = 'hidden';
    announcement.textContent = message;
    document.body.appendChild(announcement);
    
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  } else {
    // On native, use AccessibilityInfo
    // This would require react-native-accessibility or similar
    console.log('Screen reader announcement:', message);
  }
}

/**
 * Get keyboard navigation hints
 */
export function getKeyboardNavigationHints(): {
  tabIndex?: number;
  accessible?: boolean;
  accessibilityRole?: string;
} {
  return {
    accessible: true,
    accessibilityRole: 'button',
  };
}

