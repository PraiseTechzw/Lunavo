/**
 * Supabase Client Configuration
 * 
 * This file sets up the Supabase client for use throughout the app.
 * Make sure to set your Supabase URL and anon key in your .env file.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Get environment variables
// In Expo, EXPO_PUBLIC_* variables are available via process.env
// For development, you can also set them in app.json extra config
const supabaseUrl = 
  process.env.EXPO_PUBLIC_SUPABASE_URL || 
  Constants.expoConfig?.extra?.supabaseUrl ||
  '';

const supabaseAnonKey = 
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 
  Constants.expoConfig?.extra?.supabaseAnonKey ||
  '';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in your .env file or app.json extra config.'
  );
}

/**
 * Platform-aware storage adapter for Supabase Auth
 * - Uses AsyncStorage for native platforms (iOS/Android)
 * - Uses localStorage for web
 * - Provides no-op storage for SSR (server-side rendering)
 */
function createStorageAdapter() {
  // Check if we're in a browser environment (client-side)
  const isBrowser = typeof window !== 'undefined';
  
  // For web platform, use localStorage
  if (Platform.OS === 'web' && isBrowser) {
    return {
      getItem: (key: string) => {
        try {
          return Promise.resolve(localStorage.getItem(key));
        } catch (error) {
          return Promise.resolve(null);
        }
      },
      setItem: (key: string, value: string) => {
        try {
          localStorage.setItem(key, value);
          return Promise.resolve();
        } catch (error) {
          return Promise.resolve();
        }
      },
      removeItem: (key: string) => {
        try {
          localStorage.removeItem(key);
          return Promise.resolve();
        } catch (error) {
          return Promise.resolve();
        }
      },
    };
  }
  
  // For SSR (server-side rendering), provide no-op storage
  if (!isBrowser) {
    return {
      getItem: () => Promise.resolve(null),
      setItem: () => Promise.resolve(),
      removeItem: () => Promise.resolve(),
    };
  }
  
  // For native platforms (iOS/Android), use AsyncStorage
  return AsyncStorage;
}

/**
 * Supabase client instance
 * Use this client for all database operations
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Use platform-aware storage for session persistence
    storage: createStorageAdapter(),
    // Automatically refresh the session
    autoRefreshToken: true,
    // Persist the session in storage
    persistSession: true,
    // Detect session from URL (for OAuth redirects)
    detectSessionInUrl: Platform.OS === 'web',
  },
  // Enable real-time subscriptions
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

/**
 * Helper function to check if Supabase is properly configured
 */
export function isSupabaseConfigured(): boolean {
  return !!supabaseUrl && !!supabaseAnonKey;
}

/**
 * Get the current Supabase client
 */
export function getSupabaseClient() {
  return supabase;
}

