/**
 * Global Settings Context - Production Level
 * Manages reactive state across the entire PEACE application
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { AppSettings, DEFAULT_SETTINGS, SettingsService } from '@/lib/settings-service';
import { getCurrentUser } from '@/lib/auth';

interface SettingsContextType {
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => Promise<void>;
  updateNotification: (key: keyof AppSettings['notifications'], value: boolean) => Promise<void>;
  updatePrivacy: (key: keyof AppSettings['privacy'], value: boolean) => Promise<void>;
  isLoading: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initializeSettings();
  }, []);

  const initializeSettings = async () => {
    try {
      const local = await SettingsService.getLocalSettings();
      setSettings(local);
      
      // Optionally sync with user profile if available
      const user = await getCurrentUser();
      if (user?.profile_data?.settings) {
        const merged = { ...local, ...user.profile_data.settings };
        setSettings(merged);
        await SettingsService.saveSettings(merged);
      }
    } catch (e) {
      console.error('[SettingsContext] Initialization failed:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const updateSettings = async (newSettings: Partial<AppSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    const user = await getCurrentUser();
    await SettingsService.saveSettings(updated, user?.id);
  };

  const updateNotification = async (key: keyof AppSettings['notifications'], value: boolean) => {
    const updated = {
      ...settings,
      notifications: { ...settings.notifications, [key]: value }
    };
    setSettings(updated);
    const user = await getCurrentUser();
    await SettingsService.saveSettings(updated, user?.id);
  };

  const updatePrivacy = async (key: keyof AppSettings['privacy'], value: boolean) => {
    const updated = {
      ...settings,
      privacy: { ...settings.privacy, [key]: value }
    };
    setSettings(updated);
    const user = await getCurrentUser();
    await SettingsService.saveSettings(updated, user?.id);
  };

  return (
    <SettingsContext.Provider 
      value={{ 
        settings, 
        updateSettings, 
        updateNotification, 
        updatePrivacy, 
        isLoading 
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
