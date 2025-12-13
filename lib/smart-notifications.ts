/**
 * Smart Notifications System - Priority-based, quiet hours, grouping, smart timing
 */

import * as Notifications from 'expo-notifications';
import { scheduleNotification, cancelNotification } from './notifications';
import { createNotification } from './database';
import { NotificationType } from '@/app/types';

export interface NotificationPriority {
  level: 'low' | 'normal' | 'high' | 'urgent' | 'critical';
  weight: number;
}

export interface QuietHours {
  enabled: boolean;
  startHour: number; // 0-23
  endHour: number; // 0-23
}

export interface NotificationPreferences {
  userId: string;
  quietHours: QuietHours;
  priorityThreshold: 'low' | 'normal' | 'high' | 'urgent' | 'critical';
  groupingEnabled: boolean;
  smartTimingEnabled: boolean;
  digestEnabled: boolean;
  digestInterval: 'hourly' | 'daily' | 'weekly';
}

export interface GroupedNotification {
  groupId: string;
  type: NotificationType;
  title: string;
  count: number;
  notifications: any[];
  priority: NotificationPriority;
  scheduledTime?: Date;
}

// Priority levels
export const PRIORITY_LEVELS: Record<string, NotificationPriority> = {
  critical: { level: 'critical', weight: 5 },
  urgent: { level: 'urgent', weight: 4 },
  high: { level: 'high', weight: 3 },
  normal: { level: 'normal', weight: 2 },
  low: { level: 'low', weight: 1 },
};

// Notification type to priority mapping
const TYPE_PRIORITY_MAP: Record<NotificationType, NotificationPriority> = {
  'escalation-assigned': PRIORITY_LEVELS.critical,
  'escalation-updated': PRIORITY_LEVELS.urgent,
  'new-reply': PRIORITY_LEVELS.normal,
  'post-updated': PRIORITY_LEVELS.low,
  'badge-earned': PRIORITY_LEVELS.normal,
  'streak-milestone': PRIORITY_LEVELS.normal,
  'meeting-reminder': PRIORITY_LEVELS.high,
  'meeting-reminder-1h': PRIORITY_LEVELS.urgent,
  'system': PRIORITY_LEVELS.normal,
  'admin': PRIORITY_LEVELS.high,
};

/**
 * Get default notification preferences
 */
export function getDefaultPreferences(userId: string): NotificationPreferences {
  return {
    userId,
    quietHours: {
      enabled: true,
      startHour: 22, // 10 PM
      endHour: 7, // 7 AM
    },
    priorityThreshold: 'normal',
    groupingEnabled: true,
    smartTimingEnabled: true,
    digestEnabled: false,
    digestInterval: 'daily',
  };
}

/**
 * Get user notification preferences
 */
export async function getUserNotificationPreferences(
  userId: string
): Promise<NotificationPreferences> {
  try {
    // This would fetch from database
    // For now, return defaults
    return getDefaultPreferences(userId);
  } catch (error) {
    console.error('Error getting notification preferences:', error);
    return getDefaultPreferences(userId);
  }
}

/**
 * Check if current time is within quiet hours
 */
export function isQuietHours(quietHours: QuietHours): boolean {
  if (!quietHours.enabled) return false;

  const now = new Date();
  const currentHour = now.getHours();

  if (quietHours.startHour > quietHours.endHour) {
    // Quiet hours span midnight (e.g., 22:00 - 07:00)
    return currentHour >= quietHours.startHour || currentHour < quietHours.endHour;
  } else {
    // Quiet hours within same day (e.g., 14:00 - 16:00)
    return currentHour >= quietHours.startHour && currentHour < quietHours.endHour;
  }
}

/**
 * Calculate smart timing for notification
 * Returns delay in seconds, or 0 for immediate
 */
export function calculateSmartTiming(
  priority: NotificationPriority,
  preferences: NotificationPreferences
): number {
  if (!preferences.smartTimingEnabled) return 0;

  const now = new Date();
  const currentHour = now.getHours();

  // Check quiet hours
  if (isQuietHours(preferences.quietHours)) {
    // Critical/urgent notifications can break quiet hours
    if (priority.level === 'critical' || priority.level === 'urgent') {
      return 0; // Send immediately
    }
    // Schedule for after quiet hours
    const quietEnd = new Date(now);
    quietEnd.setHours(preferences.quietHours.endHour, 0, 0, 0);
    if (quietEnd <= now) {
      quietEnd.setDate(quietEnd.getDate() + 1);
    }
    return Math.floor((quietEnd.getTime() - now.getTime()) / 1000);
  }

  // Smart timing based on priority and time of day
  if (priority.level === 'critical' || priority.level === 'urgent') {
    return 0; // Immediate
  }

  // During work hours (9 AM - 5 PM), delay low priority notifications
  if (currentHour >= 9 && currentHour < 17) {
    if (priority.level === 'low') {
      return 5 * 60; // 5 minutes delay
    }
  }

  // During evening (6 PM - 10 PM), delay normal priority
  if (currentHour >= 18 && currentHour < 22) {
    if (priority.level === 'normal' || priority.level === 'low') {
      return 10 * 60; // 10 minutes delay
    }
  }

  return 0; // Default: immediate
}

/**
 * Check if notification should be sent based on priority threshold
 */
export function shouldSendNotification(
  priority: NotificationPriority,
  preferences: NotificationPreferences
): boolean {
  const thresholdWeight = PRIORITY_LEVELS[preferences.priorityThreshold].weight;
  return priority.weight >= thresholdWeight;
}

/**
 * Group notifications by type and time window
 */
export function groupNotifications(
  notifications: any[],
  timeWindowMinutes: number = 15
): GroupedNotification[] {
  const groups: Map<string, GroupedNotification> = new Map();

  notifications.forEach((notification) => {
    const type = notification.type as NotificationType;
    const priority = TYPE_PRIORITY_MAP[type] || PRIORITY_LEVELS.normal;
    const groupId = `${type}-${priority.level}`;

    if (!groups.has(groupId)) {
      groups.set(groupId, {
        groupId,
        type,
        title: getGroupTitle(type, 1),
        count: 0,
        notifications: [],
        priority,
      });
    }

    const group = groups.get(groupId)!;
    group.count++;
    group.notifications.push(notification);
    group.title = getGroupTitle(type, group.count);
  });

  return Array.from(groups.values());
}

/**
 * Get group title for notification type
 */
function getGroupTitle(type: NotificationType, count: number): string {
  const titles: Record<NotificationType, string> = {
    'escalation-assigned': `${count} new escalation${count > 1 ? 's' : ''}`,
    'escalation-updated': `${count} escalation update${count > 1 ? 's' : ''}`,
    'new-reply': `${count} new repl${count > 1 ? 'ies' : 'y'}`,
    'post-updated': `${count} post update${count > 1 ? 's' : ''}`,
    'badge-earned': `${count} badge${count > 1 ? 's' : ''} earned`,
    'streak-milestone': `${count} streak milestone${count > 1 ? 's' : ''}`,
    'meeting-reminder': `${count} meeting reminder${count > 1 ? 's' : ''}`,
    'meeting-reminder-1h': `${count} meeting starting soon`,
    'system': `${count} system notification${count > 1 ? 's' : ''}`,
    'admin': `${count} admin notification${count > 1 ? 's' : ''}`,
  };

  return titles[type] || `${count} notification${count > 1 ? 's' : ''}`;
}

/**
 * Send smart notification with all features
 */
export async function sendSmartNotification(
  userId: string,
  type: NotificationType,
  title: string,
  body: string,
  data?: Record<string, any>
): Promise<string | null> {
  try {
    const preferences = await getUserNotificationPreferences(userId);
    const priority = TYPE_PRIORITY_MAP[type] || PRIORITY_LEVELS.normal;

    // Check if notification should be sent
    if (!shouldSendNotification(priority, preferences)) {
      console.log('Notification filtered by priority threshold');
      return null;
    }

    // Check quiet hours (unless critical/urgent)
    if (isQuietHours(preferences.quietHours)) {
      if (priority.level !== 'critical' && priority.level !== 'urgent') {
        // Schedule for after quiet hours
        const delay = calculateSmartTiming(priority, preferences);
        if (delay > 0) {
          const notificationId = await scheduleNotification(
            title,
            body,
            data,
            { seconds: delay }
          );
          // Store in database for tracking
          await createNotification({
            userId,
            type,
            title,
            body,
            data: data || {},
            priority: priority.level,
            scheduled: true,
          });
          return notificationId;
        }
      }
    }

    // Calculate smart timing delay
    const delay = calculateSmartTiming(priority, preferences);

    // Create notification in database
    await createNotification({
      userId,
      type,
      title,
      body,
      data: data || {},
      priority: priority.level,
      scheduled: delay > 0,
    });

    // Schedule notification
    if (delay > 0) {
      return await scheduleNotification(title, body, data, { seconds: delay });
    } else {
      return await scheduleNotification(title, body, data);
    }
  } catch (error) {
    console.error('Error sending smart notification:', error);
    return null;
  }
}

/**
 * Create notification digest
 */
export async function createNotificationDigest(
  userId: string,
  preferences: NotificationPreferences
): Promise<void> {
  try {
    // Get unread notifications from last interval
    const { data: notifications } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .eq('read', false)
      .order('created_at', { ascending: false });

    if (!notifications || notifications.length === 0) {
      return;
    }

    // Group notifications
    const grouped = groupNotifications(notifications);

    // Create digest message
    const digestTitle = `You have ${notifications.length} new notification${notifications.length > 1 ? 's' : ''}`;
    let digestBody = '';
    
    grouped.forEach((group, index) => {
      if (index > 0) digestBody += '\n';
      digestBody += `• ${group.title}`;
    });

    // Send digest
    await sendSmartNotification(
      userId,
      'system',
      digestTitle,
      digestBody,
      { digest: true, count: notifications.length }
    );
  } catch (error) {
    console.error('Error creating notification digest:', error);
  }
}

/**
 * Schedule notification digest based on preferences
 */
export async function scheduleNotificationDigest(
  userId: string,
  preferences: NotificationPreferences
): Promise<void> {
  if (!preferences.digestEnabled) return;

  // Cancel existing digest schedules
  // (This would need to track scheduled digest IDs)

  // Schedule next digest
  const now = new Date();
  let nextDigest: Date;

  switch (preferences.digestInterval) {
    case 'hourly':
      nextDigest = new Date(now.getTime() + 60 * 60 * 1000);
      nextDigest.setMinutes(0, 0, 0);
      break;
    case 'daily':
      nextDigest = new Date(now);
      nextDigest.setDate(nextDigest.getDate() + 1);
      nextDigest.setHours(9, 0, 0, 0); // 9 AM
      break;
    case 'weekly':
      nextDigest = new Date(now);
      nextDigest.setDate(nextDigest.getDate() + 7);
      nextDigest.setHours(9, 0, 0, 0); // 9 AM Monday
      break;
    default:
      return;
  }

  const delay = Math.floor((nextDigest.getTime() - now.getTime()) / 1000);
  
  await scheduleNotification(
    'Notification Digest',
    'Your notification summary is ready',
    { type: 'digest', userId },
    { seconds: delay }
  );
}

// Import supabase
import { supabase } from './supabase';

