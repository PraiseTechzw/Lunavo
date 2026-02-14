/**
 * Expo App Configuration
 * This file allows us to use environment variables in app.json
 */

require("dotenv").config();

module.exports = ({ config }) => {
  const expo = config.expo || {};
  return {
    ...config,
    expo: {
      ...expo,
      scheme: expo.scheme || "peace",
      owner: "camusmarketzw",
      extra: {
        ...(expo.extra || {}),
        router: {},
        eas: { projectId: "62ecdcb4-ade7-419b-a404-b15b1e70446f" },
        supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
        supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
      },
      ios: {
        ...(expo.ios || {}),
        infoPlist: {
          ...((expo.ios && expo.ios.infoPlist) || {}),
          ITSAppUsesNonExemptEncryption: false,
        },
      },
      android: {
        ...(expo.android || {}),
        package: (expo.android && expo.android.package) || "com.peaceclub.app",
        edgeToEdgeEnabled: true,
        predictiveBackGestureEnabled: false,
        permissions: [
          "CAMERA",
          "READ_EXTERNAL_STORAGE",
          "WRITE_EXTERNAL_STORAGE",
          "RECORD_AUDIO",
        ],
      },
    },
  };
};
