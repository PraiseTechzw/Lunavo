# FCM V1 EAS Setup Guide

This guide explains how to set up Google Service Account Keys in EAS for sending Android push notifications using FCM V1.

## Important: Two Different Files

There are **two different JSON files** with different purposes:

### 1. `google-services.json` (Android App Configuration)
- **Purpose**: Configures your Android app to receive FCM notifications
- **Location**: Project root directory
- **In Config**: `app.config.js` → `android.googleServicesFile: "./google-services.json"`
- **Can commit**: ✅ Yes (contains public identifiers) - **MUST be committed for EAS Build**
- **Status**: ✅ Already configured

### 2. `lenove-firebase-adminsdk-fbsvc-01ad9dd9cc.json` (Service Account Key)
- **Purpose**: Allows EAS to send push notifications via FCM V1
- **Location**: Project root (but should be in `.gitignore`)
- **In Config**: ❌ NOT in app.config.js
- **Can commit**: ❌ NO (contains private keys - already in `.gitignore`)
- **Status**: ⚠️ Needs to be uploaded to EAS

## Setup Steps

### Step 1: Upload Service Account Key to EAS

You need to upload `lenove-firebase-adminsdk-fbsvc-01ad9dd9cc.json` to EAS so it can send notifications:

#### Option A: Using EAS CLI

```bash
# Run EAS credentials command
eas credentials

# Follow the prompts:
# 1. Select: Android
# 2. Select: production (or preview/development)
# 3. Select: Google Service Account
# 4. Select: Manage your Google Service Account Key for Push Notifications (FCM V1)
# 5. Select: Set up a Google Service Account Key for Push Notifications (FCM V1)
# 6. Select: Upload a new service account key
# 7. When prompted, select: Y (to use the file in your project)
```

The EAS CLI will automatically detect `lenove-firebase-adminsdk-fbsvc-01ad9dd9cc.json` in your project directory.

#### Option B: Using EAS Dashboard

1. Go to [expo.dev](https://expo.dev)
2. Navigate to your project
3. Go to **Credentials** → **Android** → **Production** (or Preview/Development)
4. Click **Google Service Account**
5. Select **Manage your Google Service Account Key for Push Notifications (FCM V1)**
6. Upload `lenove-firebase-adminsdk-fbsvc-01ad9dd9cc.json`

### Step 2: Verify Service Account Permissions

Make sure your service account has the correct role:

1. Go to [Google Cloud Console IAM Admin](https://console.cloud.google.com/iam-admin/iam)
2. Find the service account: `firebase-adminsdk-fbsvc@lenove.iam.gserviceaccount.com`
3. Click the pencil icon (Edit)
4. Click **Add Role**
5. Select **Firebase Messaging API Admin**
6. Click **Save**

### Step 3: Verify `google-services.json` Configuration

✅ Already done! Your `app.config.js` has:
```javascript
android: {
  googleServicesFile: "./google-services.json"
}
```

And `google-services.json` is in your project root.

### Step 4: Verify `expo-notifications` Plugin

✅ Already done! Your `app.config.js` has:
```javascript
plugins: [
  // ...
  [
    "expo-notifications",
    {
      icon: "./assets/images/icon.png",
      color: "#ffffff",
      sounds: [],
      mode: "production"
    }
  ]
]
```

## Current Status

| Component | Status | Notes |
|-----------|--------|-------|
| `google-services.json` | ✅ Configured | In project root, referenced in app.config.js |
| `expo-notifications` plugin | ✅ Configured | Added to plugins array |
| Service Account Key file | ✅ Exists | `lenove-firebase-adminsdk-fbsvc-01ad9dd9cc.json` |
| Service Account Key in EAS | ⚠️ **TODO** | Needs to be uploaded to EAS |
| Service Account Permissions | ⚠️ **TODO** | Verify Firebase Messaging API Admin role |

## Next Steps

1. **Upload Service Account Key to EAS** (see Step 1 above)
2. **Verify Service Account Permissions** (see Step 2 above)
3. **Rebuild your app**:
   ```bash
   npx expo prebuild --clean
   npx expo run:android
   ```
4. **Test push notifications** from your backend or using EAS

## Troubleshooting

### "Service account key not found in EAS"
- Make sure you've uploaded the key using `eas credentials` or EAS dashboard
- Verify you're checking the correct build profile (production/preview/development)

### "Permission denied" errors
- Verify the service account has **Firebase Messaging API Admin** role
- Check that the service account email matches: `firebase-adminsdk-fbsvc@lenove.iam.gserviceaccount.com`

### Notifications not sending
- Verify both files are correctly configured:
  - `google-services.json` in app.config.js ✅
  - Service account key uploaded to EAS ⚠️
- Check EAS build logs for FCM configuration messages
- Verify your backend is using the correct push token format

## Summary

- ✅ **App Configuration**: `google-services.json` is correctly set up
- ✅ **Plugin**: `expo-notifications` plugin is configured
- ⚠️ **EAS Configuration**: Service account key needs to be uploaded to EAS
- ⚠️ **Permissions**: Verify service account has correct role

Once you upload the service account key to EAS, you'll be able to send push notifications using FCM V1!
