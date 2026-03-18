const fs = require("fs");
const path = require("path");
require("dotenv").config();

module.exports = ({ config }) => {
  // Handle google-services.json for EAS Build
  // Since it's gitignored, we provide it via environment variables
  const googleServicesPath = path.resolve(__dirname, "google-services.json");
  const googleServicesBase64 = process.env.ANDROID_GOOGLE_SERVICES_BASE64;
  const googleServicesPlain = process.env.GOOGLE_SERVICES_JSON;

  if (!fs.existsSync(googleServicesPath)) {
    if (googleServicesBase64) {
      console.log("Creating google-services.json from base64 environment variable...");
      try {
        const buffer = Buffer.from(googleServicesBase64, "base64");
        fs.writeFileSync(googleServicesPath, buffer.toString("utf8"));
      } catch (err) {
        console.error("Failed to create google-services.json from base64:", err);
      }
    } else if (googleServicesPlain) {
      console.log("Creating google-services.json from plain environment variable...");
      try {
        fs.writeFileSync(googleServicesPath, googleServicesPlain);
      } catch (err) {
        console.error("Failed to create google-services.json from plain text:", err);
      }
    }
  }

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