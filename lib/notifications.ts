/**
 * Push notification utilities for Expo
 */

import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { supabase } from './supabase';

// Conditional import for expo-notifications to prevent crash in Expo Go (SDK 53+)
let Notifications: any = null;
try {
  if (!(Platform.OS === 'android' && Constants.executionEnvironment === 'storeClient')) {
    Notifications = require('expo-notifications');
  }
} catch (e) {
  console.warn('Failed to load expo-notifications:', e);
}

/**
 * Send a push notification using Supabase Edge Function
 */
export async function sendPushNotification(
  to: string | string[],
  title: string,
  body: string,
  data?: Record<string, any>
): Promise<any> {
  try {
    const { data: result, error } = await supabase.functions.invoke('send-push', {
      body: {
        to,
        title,
        body,
        data,
        sound: 'default',
      },
    });

    if (error) {
      console.error('Error sending push notification:', error);
      throw error;
    }

    return result;
  } catch (error) {
    console.error('Error invoking send-push function:', error);
    return null; // Don't crash the app if notification fails
  }
}

// Configure notification behavior
if (Notifications) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

/**
 * Request notification permissions
 */
export async function requestPermissions(): Promise<boolean> {
  if (!Notifications || !Device.isDevice) {
    console.warn('Must use physical device for Push Notifications');
    return false;
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('Failed to get push token for push notification!');
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error requesting notification permissions:', error);
    return false;
  }
}

/**
 * Register for push notifications and save token to Supabase
 */
export async function registerForPushNotifications(): Promise<string | null> {
  try {
    const hasPermission = await requestPermissions();
    if (!hasPermission) {
      return null;
    }

    // Guard for Expo Go SDK 53+ limitations on Android
    if (Platform.OS === 'android' && Constants.executionEnvironment === 'storeClient') {
      console.warn('Push tokens are not supported in Expo Go on Android (SDK 53+). Please use a Development Build.');
      return null;
    }

    if (!Notifications) return null;

    // Get the Expo push token
    let token = null;
    try {
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId,
      });
      token = tokenData.data;
    } catch (tokenError: any) {
      if (tokenError.message.includes('FirebaseApp is not initialized')) {
        console.warn('❌ Push Notifications: Firebase is not initialized. Make sure you are using a Development Build and have google-services.json correctly configured.');
      } else {
        console.error('❌ Failed to get push token:', tokenError);
      }
      return null;
    }

    if (!token) return null;
    console.log('🚀 Push Notification Token:', token);

    // Save token to Supabase
    const { getCurrentUser } = await import('./auth');
    const user = await getCurrentUser();
    if (user) {
      await supabase
        .from('users')
        .update({
          profile_data: {
            ...(user.profile_data || {}),
            pushToken: token,
          },
        })
        .eq('id', user.id);
    }

    // Configure Android channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    return token;
  } catch (error) {
    console.error('Error registering for push notifications:', error);
    return null;
  }
}

/**
 * Schedule a local notification
 */
export async function scheduleNotification(
  title: string,
  body: string,
  data?: Record<string, any>,
  trigger?: any
): Promise<string> {
  if (!Notifications) return 'notifications-disabled';

  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: data || {},
      sound: true,
    },
    trigger: trigger || null, // null means show immediately
  });

  return notificationId;
}

/**
 * Cancel a scheduled notification
 */
export async function cancelNotification(notificationId: string): Promise<void> {
  if (Notifications) {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  }
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllNotifications(): Promise<void> {
  if (Notifications) {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }
}

/**
 * Get the Expo push token
 */
export async function getNotificationToken(): Promise<string | null> {
  try {
    // Guard for Expo Go SDK 53+ limitations on Android
    if (Platform.OS === 'android' && Constants.executionEnvironment === 'storeClient') {
      return null;
    }

    if (!Notifications) return null;

    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: Constants.expoConfig?.extra?.eas?.projectId,
    });
    return tokenData.data;
  } catch (error) {
    console.error('Error getting notification token:', error);
    return null;
  }
}

/**
 * Get all notification permissions status
 */
export async function getNotificationPermissions(): Promise<any> {
  if (!Notifications) return { status: 'denied' };
  return await Notifications.getPermissionsAsync();
}

/**
 * Set badge count (iOS)
 */
export async function setBadgeCount(count: number): Promise<void> {
  if (Notifications) {
    await Notifications.setBadgeCountAsync(count);
  }
}

/**
 * Clear badge count
 */
export async function clearBadgeCount(): Promise<void> {
  if (Notifications) {
    await Notifications.setBadgeCountAsync(0);
  }
}

/**
 * Get all delivered notifications
 */
export async function getDeliveredNotifications(): Promise<any[]> {
  if (!Notifications) return [];
  return await Notifications.getPresentedNotificationsAsync();
}

/**
 * Remove all delivered notifications
 */
export async function removeAllDeliveredNotifications(): Promise<void> {
  if (Notifications) {
    await Notifications.dismissAllNotificationsAsync();
  }
}

/**
 * Remove a specific delivered notification
 */
export async function removeDeliveredNotification(notificationId: string): Promise<void> {
  if (Notifications) {
    await Notifications.dismissNotificationAsync(notificationId);
  }
}

/**
 * Add notification received listener
 */
export function addNotificationReceivedListener(
  listener: (notification: any) => void
): any {
  if (!Notifications || (Platform.OS === 'android' && Constants.executionEnvironment === 'storeClient')) {
    return null;
  }
  return Notifications.addNotificationReceivedListener(listener);
}

/**
 * Add notification response listener (when user taps notification)
 */
export function addNotificationResponseListener(
  listener: (response: any) => void
): any {
  if (!Notifications || (Platform.OS === 'android' && Constants.executionEnvironment === 'storeClient')) {
    return null;
  }
  return Notifications.addNotificationResponseReceivedListener(listener);
}
