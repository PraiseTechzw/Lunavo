/**
 * Supabase Edge Function: Push Notification
 * 
 * This Edge Function sends push notifications using Firebase Admin SDK.
 * 
 * Deploy: supabase functions deploy push-notification
 * 
 * Environment variables (set via supabase secrets):
 * - FIREBASE_SERVICE_ACCOUNT: JSON string of Firebase service account
 * - SUPABASE_URL: Your Supabase project URL (auto-provided)
 * - SUPABASE_SERVICE_ROLE_KEY: Your Supabase service role key (auto-provided)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Initialize Firebase Admin SDK
// Note: For Deno/Edge Functions, we'll use the Firebase REST API or Expo Push API
// Firebase Admin SDK doesn't work directly in Deno, so we'll use Expo Push API

interface PushNotificationRequest {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  token?: string;
}

/**
 * Get user's push token from Supabase
 */
async function getUserPushToken(
  supabaseClient: any,
  userId: string
): Promise<string | null> {
  try {
    const { data, error } = await supabaseClient
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
 * Send push notification via Expo Push API
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

serve(async (req) => {
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

  try {
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        {
          status: 405,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    // Get Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: 'Supabase configuration missing' }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body
    const body: PushNotificationRequest = await req.json();
    const { userId, title, body: messageBody, data, token } = body;

    if (!title || !messageBody) {
      return new Response(
        JSON.stringify({ error: 'Title and body are required' }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    // Get push token
    let pushToken: string | null = null;

    if (token) {
      pushToken = token;
    } else if (userId) {
      pushToken = await getUserPushToken(supabaseClient, userId);
    } else {
      return new Response(
        JSON.stringify({ error: 'Either userId or token is required' }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    if (!pushToken) {
      return new Response(
        JSON.stringify({ error: 'Push token not found for user' }),
        {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    // Send notification via Expo Push API
    const success = await sendExpoPushNotification(
      pushToken,
      title,
      messageBody,
      data
    );

    return new Response(
      JSON.stringify({
        success,
        message: success ? 'Notification sent' : 'Failed to send notification',
      }),
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
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
});
