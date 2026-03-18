/**
 * Settings Persistence Service - Production Level
 * Handles AsyncStorage and Supabase Sync
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

const SETTINGS_KEY = '@peace:settings_v1';

export interface AppSettings {
  theme: 'light' | 'dark' | 'auto' | 'gold';
  notifications: {
    mentions: boolean;
    replies: boolean;
    badges: boolean;
    messages: boolean;
  };
  privacy: {
    isAnonymous: boolean;
    showActivity: boolean;
    dataUsage: boolean;
  };
}

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'auto',
  notifications: {
    mentions: true,
    replies: true,
    badges: true,
    messages: true,
  },
  privacy: {
    isAnonymous: false,
    showActivity: true,
    dataUsage: true,
  },
};

export const SettingsService = {
  /**
   * Fetch settings from local storage
   */
  async getLocalSettings(): Promise<AppSettings> {
    try {
      const saved = await AsyncStorage.getItem(SETTINGS_KEY);
      if (!saved) return DEFAULT_SETTINGS;
      
      const parsed = JSON.parse(saved);
      // Ensure schema compatibility
      return { ...DEFAULT_SETTINGS, ...parsed };
    } catch (e) {
      console.error('[Settings] Load error:', e);
      return DEFAULT_SETTINGS;
    }
  },

  /**
   * Persist settings to Local and Remote
   */
  async saveSettings(settings: AppSettings, userId?: string) {
    try {
      // 1. Local Persistence (Instant)
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));

      // 2. Remote Sync (Background)
      if (userId) {
        const { error } = await supabase
          .from('users')
          .update({
            is_anonymous: settings.privacy.isAnonymous,
            profile_data: { 
              settings: settings 
            }
          })
          .eq('id', userId);
        
        if (error) throw error;
      }
      
      console.log('[Settings] Successfully synced to PEACE servers');
    } catch (e) {
      console.error('[Settings] Persist error:', e);
      // Fail silently to keep app usable offline
    }
  },

  /**
   * Reset to factory defaults
   */
  async resetSettings() {
    await AsyncStorage.removeItem(SETTINGS_KEY);
  }
};
