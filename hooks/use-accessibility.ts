/**
 * Accessibility Hook - Manage accessibility settings and provide utilities
 */

import { useState, useEffect, useCallback } from 'react';
import {
  getAccessibilitySettings,
  saveAccessibilitySettings,
  AccessibilitySettings,
  getFontSizeMultiplier,
  getScaledFontSize,
  getHighContrastColors,
  announceToScreenReader,
} from '@/lib/accessibility';
import { useColorScheme } from './use-color-scheme';

export function useAccessibility() {
  const colorScheme = useColorScheme() ?? 'light';
  const [settings, setSettings] = useState<AccessibilitySettings>({
    fontSize: 'medium',
    highContrast: false,
    reduceMotion: false,
    screenReaderEnabled: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const loadedSettings = await getAccessibilitySettings();
      setSettings(loadedSettings);
    } catch (error) {
      console.error('Error loading accessibility settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = useCallback(async (newSettings: Partial<AccessibilitySettings>) => {
    try {
      await saveAccessibilitySettings(newSettings);
      setSettings((prev) => ({ ...prev, ...newSettings }));
      
      // Announce changes to screen reader
      if (newSettings.fontSize) {
        announceToScreenReader(`Font size changed to ${newSettings.fontSize}`);
      }
      if (newSettings.highContrast !== undefined) {
        announceToScreenReader(`High contrast ${newSettings.highContrast ? 'enabled' : 'disabled'}`);
      }
    } catch (error) {
      console.error('Error updating accessibility settings:', error);
    }
  }, []);

  const fontSizeMultiplier = getFontSizeMultiplier(settings.fontSize);
  const highContrastColors = getHighContrastColors(settings.highContrast, colorScheme);

  const getScaledSize = useCallback(
    (baseSize: number) => getScaledFontSize(baseSize, settings.fontSize),
    [settings.fontSize]
  );

  return {
    settings,
    updateSettings,
    fontSizeMultiplier,
    highContrastColors,
    getScaledSize,
    loading,
  };
}

