/**
 * Expo App Configuration (Production-ready)
 * This file dynamically merges with app.json to inject environment variables
 */
require("dotenv").config();

module.exports = ({ config }) => {
  // In Expo, 'config' passed here is already the parsed content from app.json
  // specifically the contents of the "expo" object.
  return {
    ...config,
    name: "PEACE",
    slug: "peace",
    owner: "camusmarketzw",
    
    // Ensure critical native links are preserved from app.json
    // Specifically googleServicesFile for Android push notifications
    android: {
      ...config.android,
      package: "com.peaceclub.app",
      googleServicesFile: config.android?.googleServicesFile || "./google-services.json",
    },

    ios: {
      ...config.ios,
      bundleIdentifier: "com.peaceclub.app",
      supportsTablet: true,
    },

    extra: {
      ...config.extra,
      // Environment variables for Supabase
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
      eas: {
        projectId: "62ecdcb4-ade7-419b-a404-b15b1e70446f"
      }
    },

    // Ensure all plugins from app.json are preserved
    plugins: config.plugins || []
  };
};