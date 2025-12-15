/**
 * Push Notification API Endpoint
 * 
 * This is a serverless function/API endpoint that uses Firebase Admin SDK
 * to send push notifications. This can be deployed as:
 * - Supabase Edge Function
 * - Vercel Serverless Function
 * - Netlify Function
 * - Standalone Node.js API endpoint
 * 
 * To use this with Supabase Edge Functions:
 * 1. Create a new Edge Function: supabase functions new push-notification
 * 2. Copy this file to supabase/functions/push-notification/index.ts
 * 3. Deploy: supabase functions deploy push-notification
 * 
 * To use with Vercel/Netlify:
 * 1. Place this file in api/push-notification.ts (Vercel) or netlify/functions/push-notification.ts
 * 2. Install dependencies: npm install firebase-admin
 * 3. Deploy
 */

import { createClient } from '@supabase/supabase-js';
import * as admin from 'firebase-admin';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';

// Initialize Firebase Admin SDK
let firebaseAdmin: admin.app.App;

try {
  // Check if Firebase Admin is already initialized
  if (getApps().length === 0) {
    // Load service account key
    // For serverless functions, you can use environment variables or the service account file
    // Using the correct filename: lenove-firebase-adminsdk-fbsvc-01ad9dd9cc.json
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
      ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
      : require('../lenove-firebase-adminsdk-fbsvc-01ad9dd9cc.json');

    firebaseAdmin = initializeApp({
      credential: cert(serviceAccount),
    });
  } else {
    firebaseAdmin = getApps()[0];
  }
} catch (error) {
  console.error('Error initializing Firebase Admin:', error);
  throw error;
}

// Initialize Supabase client (for fetching user tokens)
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('Supabase credentials not found. Push token fetching may fail.');
}

const supabase = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

interface PushNotificationRequest {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  token?: string; // Optional: direct token instead of userId
}

/**
 * Get user's push token from Supabase
 */
async function getUserPushToken(userId: string): Promise<string | null> {
  if (!supabase) {
    console.error('Supabase client not initialized');
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('users')
      .select('profile_data')
      .eq('id', userId)
      .single();

    if (error || !data) {
      console.error('Error fetching user push token:', error);
      return null;
    }

    return data.profile_data?.pushToken || null;
  } catch (error) {
    console.error('Error in getUserPushToken:', error);
    return null;
  }
}

/**
 * Send push notification using Firebase Admin SDK
 */
async function sendFirebasePushNotification(
  token: string,
  title: string,
  body: string,
  data?: Record<string, any>
): Promise<boolean> {
  try {
    const messaging = getMessaging(firebaseAdmin);

    // Check if token is Expo push token or FCM token
    const isExpoToken = token.startsWith('ExponentPushToken[') || token.startsWith('ExpoPushToken[');
    
    if (isExpoToken) {
      // For Expo tokens, we need to use Expo Push API
      // This endpoint should handle FCM tokens, so we'll convert or use Expo API
      console.log('Expo token detected, using Expo Push API');
      return await sendExpoPushNotification(token, title, body, data);
    }

    // For FCM tokens, use Firebase Admin SDK
    const message = {
      token,
      notification: {
        title,
        body,
      },
      data: data
        ? Object.entries(data).reduce((acc, [key, value]) => {
            acc[key] = String(value);
            return acc;
          }, {} as Record<string, string>)
        : {},
      android: {
        priority: 'high' as const,
        notification: {
          channelId: 'default',
          sound: 'default',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
    };

    const response = await messaging.send(message);
    console.log('Successfully sent FCM message:', response);
    return true;
  } catch (error: any) {
    console.error('Error sending Firebase push notification:', error);
    
    // Handle invalid token errors
    if (error.code === 'messaging/invalid-registration-token' || 
        error.code === 'messaging/registration-token-not-registered') {
      console.log('Invalid or unregistered token, removing from database');
      // Optionally remove invalid token from database
    }
    
    return false;
  }
}

/**
 * Send push notification via Expo Push API (fallback for Expo tokens)
 */
async function sendExpoPushNotification(
  token: string,
  title: string,
  body: string,
  data?: Record<string, any>
): Promise<boolean> {
  try {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: token,
        title,
        body,
        data: data || {},
        sound: 'default',
        priority: 'high',
      }),
    });

    const result = await response.json();
    return result.data?.status === 'ok';
  } catch (error) {
    console.error('Error sending Expo push notification:', error);
    return false;
  }
}

/**
 * Main handler function
 * 
 * For Supabase Edge Functions:
 * export default async function handler(req: Request) { ... }
 * 
 * For Vercel:
 * export default async function handler(req: NextApiRequest, res: NextApiResponse) { ... }
 * 
 * For Netlify:
 * export const handler = async (event: any, context: any) => { ... }
 */

// Supabase Edge Function handler
export default async function handler(req: Request): Promise<Response> {
  try {
    // Handle CORS
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body: PushNotificationRequest = await req.json();
    const { userId, title, body: messageBody, data, token } = body;

    if (!title || !messageBody) {
      return new Response(
        JSON.stringify({ error: 'Title and body are required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Get push token
    let pushToken: string | null = null;
    
    if (token) {
      pushToken = token;
    } else if (userId) {
      pushToken = await getUserPushToken(userId);
    } else {
      return new Response(
        JSON.stringify({ error: 'Either userId or token is required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    if (!pushToken) {
      return new Response(
        JSON.stringify({ error: 'Push token not found for user' }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Send notification
    const success = await sendFirebasePushNotification(
      pushToken,
      title,
      messageBody,
      data
    );

    return new Response(
      JSON.stringify({ success, message: success ? 'Notification sent' : 'Failed to send notification' }),
      {
        status: success ? 200 : 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error: any) {
    console.error('Error in push notification handler:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

// Vercel/Next.js API route handler (uncomment if using Vercel)
/*
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId, title, body: messageBody, data, token } = req.body;

  if (!title || !messageBody) {
    return res.status(400).json({ error: 'Title and body are required' });
  }

  let pushToken: string | null = null;
  
  if (token) {
    pushToken = token;
  } else if (userId) {
    pushToken = await getUserPushToken(userId);
  } else {
    return res.status(400).json({ error: 'Either userId or token is required' });
  }

  if (!pushToken) {
    return res.status(404).json({ error: 'Push token not found for user' });
  }

  const success = await sendFirebasePushNotification(
    pushToken,
    title,
    messageBody,
    data
  );

  return res.status(success ? 200 : 500).json({
    success,
    message: success ? 'Notification sent' : 'Failed to send notification',
  });
}
*/
