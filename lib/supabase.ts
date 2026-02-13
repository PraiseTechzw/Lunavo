/**
 * Supabase Client Configuration with AsyncStorage for Session Persistence
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import Constants from "expo-constants";

// Get environment variables (sanitize to avoid quoted/backtick values anywhere)
const sanitize = (v: string | undefined | null): string =>
  (v ?? "").trim().replace(/["'`]/g, "");

const supabaseUrl = sanitize(
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
    Constants.expoConfig?.extra?.supabaseUrl,
);

const supabaseAnonKey = sanitize(
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
    Constants.expoConfig?.extra?.supabaseAnonKey,
);

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables. Add EXPO_PUBLIC_SUPABASE_URL=https://<project>.supabase.co and EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon_key> to .env (without quotes), then restart Expo.",
  );
}

// Basic URL validation to give clearer guidance early
if (!/^https?:\/\/.+/i.test(supabaseUrl)) {
  throw new Error(
    "Invalid EXPO_PUBLIC_SUPABASE_URL. It must start with https:// and contain no quotes or backticks.",
  );
}

/**
 * Supabase client instance with proper session storage
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Use AsyncStorage for session persistence (CRITICAL for React Native)
    storage: AsyncStorage,
    // Automatically refresh the session
    autoRefreshToken: true,
    // Persist the session
    persistSession: true,
    // Detect session from URL (for OAuth redirects)
    detectSessionInUrl: false,
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
