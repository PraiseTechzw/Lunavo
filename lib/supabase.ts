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
 * Supabase client instance
 * Use this client for all database operations
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Automatically refresh the session
    autoRefreshToken: true,
    // Persist the session in AsyncStorage (React Native) or localStorage (Web)
    persistSession: true,
    // Detect session from URL (for OAuth redirects) - only on web
    detectSessionInUrl: Platform.OS === 'web',
    // Use AsyncStorage for React Native, undefined for web (uses localStorage by default)
    ...(Platform.OS !== 'web' && { storage: AsyncStorage }),
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

