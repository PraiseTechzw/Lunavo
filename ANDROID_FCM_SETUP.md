# Android FCM V1 Setup Guide

This guide explains how to set up Firebase Cloud Messaging (FCM) V1 protocol for Android push notifications in the Lunavo app.

## Overview

Expo supports FCM V1 protocol for Android push notifications, which provides better reliability and features. To enable this, you need to add the `google-services.json` file to your project.

## Steps to Set Up

### 1. Get `google-services.json` from Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (or create a new one)
3. Click the gear icon ⚙️ → **Project Settings**
4. Scroll down to **Your apps** section
5. If you don't have an Android app yet:
   - Click **Add app** → Select **Android**
   - Enter package name: `com.camusmarketzw.Lunavo`
   - Register the app
6. Download the `google-services.json` file

### 2. Add File to Project

1. Place the downloaded `google-services.json` file in the **project root directory**:
   ```
   Lunavo/
   ├── google-services.json  ← Place it here
   ├── app.config.js
   ├── package.json
   └── ...
   ```

2. **Important**: The file is already in `.gitignore`, so it won't be committed to version control.

### 3. Verify Configuration

The `app.config.js` file is already configured with:
```javascript
android: {
  googleServicesFile: "./google-services.json"
}
```

### 4. Rebuild Your App

After adding `google-services.json`, you need to rebuild your app:

```bash
# For development build
npx expo prebuild --clean
npx expo run:android

# Or for EAS Build
eas build --platform android
```

## How It Works

When `google-services.json` is present:

1. **Expo automatically configures FCM V1** during the build process
2. **Android devices receive push notifications** via Firebase Cloud Messaging
3. **Better reliability** compared to legacy FCM
4. **Improved features** like notification channels, priorities, etc.

## Verification

To verify FCM V1 is working:

1. **Check build logs** - You should see FCM configuration messages
2. **Test push notification** - Send a test notification to an Android device
3. **Check token format** - FCM tokens will be different from Expo tokens

## Troubleshooting

### File Not Found Error

If you see an error about `google-services.json` not found:
- Verify the file is in the project root (same directory as `app.config.js`)
- Check the path in `app.config.js` matches the file location
- Ensure the file name is exactly `google-services.json` (case-sensitive)

### Build Errors

If you encounter build errors:
- Make sure the package name in `google-services.json` matches `com.camusmarketzw.Lunavo`
- Clean and rebuild: `npx expo prebuild --clean`
- Check Firebase project settings match your app configuration

### Notifications Not Working

If notifications aren't working on Android:
- Verify `google-services.json` is correctly placed
- Check Firebase Cloud Messaging is enabled in Firebase Console
- Ensure the app has notification permissions
- Verify the push token is being registered correctly

## Security

⚠️ **Important Security Notes**:

1. **Never commit `google-services.json`** to version control
   - Already added to `.gitignore`
   - Contains sensitive Firebase configuration

2. **Use environment-specific files** for different environments:
   - Development: `google-services.dev.json`
   - Production: `google-services.prod.json`
   - Update `app.config.js` accordingly

3. **Restrict Firebase project access**:
   - Only grant access to necessary team members
   - Use Firebase App Check for additional security

## Additional Resources

- [Expo Push Notifications Documentation](https://docs.expo.dev/push-notifications/overview/)
- [Firebase Cloud Messaging Documentation](https://firebase.google.com/docs/cloud-messaging)
- [FCM V1 Migration Guide](https://firebase.google.com/docs/cloud-messaging/migrate-v1)

## Next Steps

After setting up `google-services.json`:

1. ✅ Rebuild your Android app
2. ✅ Test push notifications on Android devices
3. ✅ Verify FCM V1 is working correctly
4. ✅ Monitor notification delivery in Firebase Console
