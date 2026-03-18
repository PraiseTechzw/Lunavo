require("dotenv").config();

module.exports = ({ config }) => {
  return {
    ...config,
    name: "PEACE",
    slug: "peace",
    owner: "camusmarketzw",
    
    // Ensure critical native links are preserved from app.json
    android: {
      ...config.android,
      package: "com.peaceclub.app",
      googleServicesFile: "./google-services.json",
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

    plugins: config.plugins || []
  };
};