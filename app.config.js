/**
 * Expo App Configuration (Production-ready)
 * This file dynamically merges with app.json to inject environment variables
 */

require("dotenv").config();

module.exports = ({ config }) => {
  const baseConfig = config.expo || {};

  return {
    ...config,
    expo: {
      ...baseConfig,
      // Force the professional brand name
      name: "PEACE",
      slug: "peace",
      owner: "camusmarketzw",
      
      // Explicitly ensure icons and splash are picked up
      icon: baseConfig.icon || "./assets/images/icon.png",

      extra: {
        ...(baseConfig.extra || {}),
        router: {},
        eas: {
          projectId: "62ecdcb4-ade7-419b-a404-b15b1e70446f"
        },
        // Environment variables
        supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
        supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
      },

      ios: {
        ...(baseConfig.ios || {}),
        bundleIdentifier: "com.peaceclub.app",
        infoPlist: {
          ...((baseConfig.ios && baseConfig.ios.infoPlist) || {}),
          ITSAppUsesNonExemptEncryption: false
        }
      },

      android: {
        ...(baseConfig.android || {}),
        package: "com.peaceclub.app",
        adaptiveIcon: {
          ...(baseConfig.android?.adaptiveIcon || {}),
          backgroundColor: "#F8FAFC",
          foregroundImage: "./assets/images/adaptive-icon.png"
        },
        permissions: [
          ...(baseConfig.android?.permissions || []),
          "CAMERA",
          "RECORD_AUDIO"
        ]
      },

      // Ensure plugins (like expo-splash-screen) are preserved
      plugins: baseConfig.plugins || []
    }
  };
};