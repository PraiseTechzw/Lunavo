/**
 * Expo App Configuration
 * This file allows us to use environment variables in app.json
 */

require('dotenv').config();

module.exports = {
  expo: {
    name: "PEACE",
    slug: "peace",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "peace",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.peaceclub.app",
      buildNumber: "1",
      infoPlist: {
        NSCameraUsageDescription: "PEACE needs camera access to upload profile pictures and share images.",
        NSPhotoLibraryUsageDescription: "PEACE needs photo library access to select and share images.",
        NSMicrophoneUsageDescription: "PEACE needs microphone access for voice messages."
      }
    },
    android: {
      adaptiveIcon: {
        backgroundColor: "#0F172A",
        foregroundImage: "./assets/images/icon.png"
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      package: "com.peaceclub.app",
      googleServicesFile: "./google-services.json",
      versionCode: 1,
      permissions: [
        "CAMERA",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE",
        "RECORD_AUDIO"
      ]
    },
    web: {
      output: "static",
      favicon: "./assets/images/icon.png"
    },
    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          image: "./assets/images/icon.png",
          imageWidth: 250,
          resizeMode: "contain",
          backgroundColor: "#0F172A",
          dark: {
            backgroundColor: "#0F172A"
          }
        }
      ]
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true
    },
    extra: {
      router: {},
      eas: {
        projectId: "9691e1c7-68a7-44b7-a1a1-4f51fd66c7b2"
      },
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
    }
  }
};

