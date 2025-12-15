# Push Notifications Setup Guide

This guide explains how to set up and use push notifications with Firebase Admin SDK in the Lunavo app.

## Overview

The push notification system consists of:
1. **Client-side service** (`lib/firebase-push.ts`) - Handles sending notifications via Expo Push API
2. **Backend API** (`api/push-notification.ts`) - Serverless function using Firebase Admin SDK
3. **Notification triggers** (`lib/notification-triggers.ts`) - Updated to use the new push service

## Prerequisites

1. Firebase project with Cloud Messaging enabled
2. Firebase Admin SDK service account key (already added: `lenove-firebase-adminsdk-fbsvc-01ad9dd9cc.json`)
3. **Google Services file for Android** (`google-services.json`) - Required for FCM V1 protocol on Android
4. Supabase project with user push tokens stored in `users.profile_data.pushToken`

## Android FCM V1 Setup

For Android push notifications using the FCM V1 protocol, you need to add the `google-services.json` file:

1. **Download `google-services.json`** from Firebase Console:
   - Go to Firebase Console → Project Settings
   - Select your Android app (or create one with package name: `com.camusmarketzw.Lunavo`)
   - Download `google-services.json`

2. **Place the file** in the project root directory:
   ```
   Lunavo/
   ├── google-services.json  ← Place it here
   ├── app.config.js
   └── ...
   ```

3. **Configuration is already set** in `app.config.js`:
   ```javascript
   android: {
     googleServicesFile: "./google-services.json"
   }
   ```

4. **The file is already in `.gitignore`** to prevent committing sensitive credentials.

## Security Note

⚠️ **Important**: The following files have been added to `.gitignore` to prevent committing sensitive credentials:
- Firebase Admin SDK JSON files (`*-firebase-adminsdk-*.json`)
- Google Services files (`google-services.json`, `GoogleService-Info.plist`)

Make sure these files are never committed to version control.

## Setup Options

### Option 1: Supabase Edge Functions (Recommended)

1. **Install Supabase CLI** (if not already installed):
   ```bash
   npm install -g supabase
   ```

2. **Create Edge Function**:
   ```bash
   supabase functions new push-notification
   ```

3. **Copy the API file**:
   - Copy `api/push-notification.ts` to `supabase/functions/push-notification/index.ts`

4. **Set environment variables**:
   ```bash
   supabase secrets set FIREBASE_SERVICE_ACCOUNT="$(cat lenove-firebase-adminsdk-fbsvc-01ad9dd9cc.json)"
   supabase secrets set SUPABASE_URL="your-supabase-url"
   supabase secrets set SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
   ```

5. **Deploy**:
   ```bash
   supabase functions deploy push-notification
   ```

6. **Update app config**:
   - Set `EXPO_PUBLIC_BACKEND_URL` to your Supabase project URL
   - Example: `https://your-project.supabase.co/functions/v1`

### Option 2: Vercel Serverless Function

1. **Create API route**:
   - Place `api/push-notification.ts` in `api/push-notification.ts` (Vercel auto-detects this)

2. **Install dependencies**:
   ```bash
   npm install firebase-admin @supabase/supabase-js
   ```

3. **Set environment variables** in Vercel dashboard:
   - `FIREBASE_SERVICE_ACCOUNT`: Contents of the JSON file (as string)
   - `SUPABASE_URL`: Your Supabase URL
   - `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key

4. **Deploy to Vercel**:
   ```bash
   vercel deploy
   ```

5. **Update app config**:
   - Set `EXPO_PUBLIC_BACKEND_URL` to your Vercel deployment URL

### Option 3: Standalone Node.js Server

1. **Navigate to API directory**:
   ```bash
   cd api
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set environment variables**:
   Create a `.env` file:
   ```env
   FIREBASE_SERVICE_ACCOUNT_PATH=../lenove-firebase-adminsdk-fbsvc-01ad9dd9cc.json
   SUPABASE_URL=your-supabase-url
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   PORT=3000
   ```

4. **Run the server**:
   ```bash
   npm run dev
   ```

5. **Update app config**:
   - Set `EXPO_PUBLIC_BACKEND_URL` to your server URL (e.g., `http://localhost:3000` for dev)

## Client-Side Configuration

The app automatically uses the push notification service. To configure:

1. **Add `google-services.json` for Android** (required for FCM V1):
   - Download from Firebase Console
   - Place in project root: `./google-services.json`
   - Already configured in `app.config.js`

2. **Set backend URL** (optional, for Firebase Admin SDK):
   - Add to `.env` or `app.config.js`:
     ```javascript
     extra: {
       backendUrl: process.env.EXPO_PUBLIC_BACKEND_URL
     }
     ```
   - Or set `EXPO_PUBLIC_BACKEND_URL` environment variable

3. **Push tokens are automatically registered**:
   - When users log in, the app registers for push notifications
   - Tokens are saved to `users.profile_data.pushToken` in Supabase
   - Android devices will use FCM V1 protocol when `google-services.json` is present

## How It Works

### Flow Diagram

```
User Action → Notification Trigger → Firebase Push Service
                                          ↓
                                    Check Backend URL
                                          ↓
                    ┌─────────────────────┴─────────────────────┐
                    ↓                                           ↓
            Backend API (Firebase Admin SDK)        Expo Push API (Direct)
                    ↓                                           ↓
            Firebase Cloud Messaging                    Expo Push Service
                    ↓                                           ↓
                    └───────────────────┬───────────────────────┘
                                        ↓
                                  Device receives notification
```

### Notification Types

The following events trigger push notifications:

1. **New Reply** - When someone replies to a user's post
2. **Escalation Assigned** - When an escalation is assigned to a counselor
3. **Meeting Reminders** - 24 hours and 1 hour before meetings
4. **Badge Earned** - When a user earns a badge
5. **Streak Milestone** - When a user reaches a streak milestone
6. **New Post in Category** - When a new post is created in a followed category

## Testing

### Test Push Notification

1. **Get a user's push token**:
   ```sql
   SELECT id, profile_data->>'pushToken' as token
   FROM users
   WHERE id = 'user-id';
   ```

2. **Send test notification** (using Expo Push API directly):
   ```bash
   curl -H "Content-Type: application/json" \
     -X POST https://exp.host/--/api/v2/push/send \
     -d '{
       "to": "ExponentPushToken[your-token]",
       "title": "Test Notification",
       "body": "This is a test notification",
       "data": {"test": true}
     }'
   ```

3. **Test via backend API**:
   ```bash
   curl -X POST https://your-api-url.com/api/push-notification \
     -H "Content-Type: application/json" \
     -d '{
       "userId": "user-id",
       "title": "Test Notification",
       "body": "This is a test notification",
       "data": {"test": true}
     }'
   ```

## Troubleshooting

### Notifications not received

1. **Check push token registration**:
   - Verify token is saved in Supabase
   - Check token format (should start with `ExponentPushToken[` or `ExpoPushToken[`)

2. **Check permissions**:
   - Ensure app has notification permissions
   - On iOS, check notification settings in device settings

3. **Check backend logs**:
   - Review server logs for errors
   - Verify Firebase Admin SDK is properly initialized

4. **Verify environment variables**:
   - Ensure all required environment variables are set
   - Check Firebase service account JSON is valid

### Firebase Admin SDK errors

1. **Invalid credentials**:
   - Verify service account JSON file is correct
   - Check Firebase project ID matches

2. **Permission errors**:
   - Ensure service account has Cloud Messaging permissions
   - Check Firebase project has Cloud Messaging API enabled

### Expo Push API errors

1. **Invalid token**:
   - Token may have expired (tokens can expire)
   - Re-register for push notifications

2. **Rate limiting**:
   - Expo Push API has rate limits
   - Consider using Firebase Admin SDK for production

## Production Considerations

1. **Use Firebase Admin SDK** for production:
   - Better reliability and rate limits
   - More control over notification delivery
   - Better analytics and tracking

2. **Monitor notification delivery**:
   - Track success/failure rates
   - Monitor invalid tokens and clean them up

3. **Handle token refresh**:
   - Tokens can expire or change
   - Re-register tokens periodically

4. **Error handling**:
   - Implement retry logic for failed notifications
   - Log errors for debugging

## Files Modified/Created

- ✅ `.gitignore` - Added Firebase Admin SDK JSON files
- ✅ `lib/firebase-push.ts` - Client-side push notification service
- ✅ `api/push-notification.ts` - Backend API endpoint
- ✅ `lib/notification-triggers.ts` - Updated to use new push service
- ✅ `api/package.json` - Dependencies for API server

## Next Steps

1. Deploy the backend API using one of the options above
2. Set the `EXPO_PUBLIC_BACKEND_URL` environment variable
3. Test push notifications with a real device
4. Monitor notification delivery and adjust as needed

## Support

For issues or questions:
- Check Firebase Cloud Messaging documentation
- Review Expo Push Notifications documentation
- Check Supabase Edge Functions documentation (if using that option)
