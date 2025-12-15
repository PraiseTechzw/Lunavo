/**
 * Firebase Push Notification Service
 * 
 * This service handles sending push notifications using Firebase Cloud Messaging (FCM)
 * via the Expo Push Notification service or directly through Firebase Admin SDK.
 */

import { supabase } from './supabase';

// Expo Push Notification API endpoint
const EXPO_PUSH_API_URL = 'https://exp.host/--/api/v2/push/send';

export interface PushNotificationPayload {
  to: string; // Expo push token or FCM token
  title: string;
  body: string;
  data?: Record<string, any>;
  sound?: 'default' | null;
  priority?: 'default' | 'normal' | 'high';
  badge?: number;
  channelId?: string; // Android channel ID
}

/**
 * Send push notification via Expo Push Notification service
 * This is used when the app is using Expo push tokens
 */
export async function sendExpoPushNotification(
  token: string,
  title: string,
  body: string,
  data?: Record<string, any>
): Promise<boolean> {
  try {
    const message: PushNotificationPayload = {
      to: token,
      title,
      body,
      data: data || {},
      sound: 'default',
      priority: 'high',
    };

    const response = await fetch(EXPO_PUSH_API_URL, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    const result = await response.json();
    
    if (result.data?.status === 'ok') {
      console.log('Push notification sent successfully');
      return true;
    } else {
      console.error('Failed to send push notification:', result);
      return false;
    }
  } catch (error) {
    console.error('Error sending Expo push notification:', error);
    return false;
  }
}

/**
 * Send push notification to a user by their user ID
 * Fetches the push token from Supabase and sends the notification
 */
export async function sendPushNotificationToUser(
  userId: string,
  title: string,
  body: string,
  data?: Record<string, any>
): Promise<boolean> {
  try {
    // Get user's push token from Supabase
    const { data: userData, error } = await supabase
      .from('users')
      .select('profile_data')
      .eq('id', userId)
      .single();

    if (error || !userData) {
      console.error('Error fetching user push token:', error);
      return false;
    }

    const pushToken = userData.profile_data?.pushToken;
    if (!pushToken) {
      console.log('User does not have a push token registered');
      return false;
    }

    // Send notification via Expo Push Notification service
    return await sendExpoPushNotification(pushToken, title, body, data);
  } catch (error) {
    console.error('Error sending push notification to user:', error);
    return false;
  }
}

/**
 * Send push notification to multiple users
 */
export async function sendPushNotificationToUsers(
  userIds: string[],
  title: string,
  body: string,
  data?: Record<string, any>
): Promise<{ success: number; failed: number }> {
  let success = 0;
  let failed = 0;

  await Promise.all(
    userIds.map(async (userId) => {
      const result = await sendPushNotificationToUser(userId, title, body, data);
      if (result) {
        success++;
      } else {
        failed++;
      }
    })
  );

  return { success, failed };
}

/**
 * Send push notification using backend API (for Firebase Admin SDK)
 * This calls a backend endpoint that uses Firebase Admin SDK
 */
export async function sendPushNotificationViaBackend(
  userId: string,
  title: string,
  body: string,
  data?: Record<string, any>
): Promise<boolean> {
  try {
    // Get the backend API URL from environment or config
    const backendUrl = 
      process.env.EXPO_PUBLIC_BACKEND_URL || 
      process.env.EXPO_PUBLIC_API_URL ||
      '';

    if (!backendUrl) {
      console.warn('Backend URL not configured, falling back to Expo Push API');
      return await sendPushNotificationToUser(userId, title, body, data);
    }

    // Determine the endpoint URL
    // For Supabase Edge Functions: https://project.supabase.co/functions/v1/push-notification
    // For other APIs: https://api.example.com/api/push-notification
    let endpointUrl: string;
    if (backendUrl.includes('supabase.co/functions')) {
      // Supabase Edge Function
      endpointUrl = `${backendUrl}/push-notification`;
    } else if (backendUrl.includes('/api')) {
      // Already includes /api
      endpointUrl = `${backendUrl}/push-notification`;
    } else {
      // Standard API endpoint
      endpointUrl = `${backendUrl}/api/push-notification`;
    }

    // Get Supabase anon key for Supabase Edge Functions
    const supabaseAnonKey = 
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 
      '';

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add Authorization header for Supabase Edge Functions
    if (backendUrl.includes('supabase.co') && supabaseAnonKey) {
      headers['Authorization'] = `Bearer ${supabaseAnonKey}`;
    }

    const response = await fetch(endpointUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        userId,
        title,
        body,
        data: data || {},
      }),
    });

    if (!response.ok) {

      const errorText = await response.text();
      throw new Error(`Backend API returned ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    return result.success === true;
  } catch (error) {
    console.error('Error sending push notification via backend:', error);
    // Fallback to Expo Push API
    return await sendPushNotificationToUser(userId, title, body, data);
  }
}
