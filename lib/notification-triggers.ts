/**
 * Notification trigger functions
 * These functions create notifications for various events
 */

import { createNotification, getPost } from './database';
import { getCurrentUser } from './auth';
import { scheduleNotification } from './notifications';
import { NotificationType } from '@/types';

/**
 * Send notification when a new reply is added to user's post
 */
export async function notifyNewReply(postId: string, replyAuthor: string) {
  try {
    const post = await getPost(postId);
    if (!post) return;

    // Don't notify if user replied to their own post
    const currentUser = await getCurrentUser();
    if (currentUser?.id === post.authorId) return;

    // Create notification in database
    await createNotification({
      userId: post.authorId,
      type: 'reply',
      title: 'New Reply',
      message: `${replyAuthor} replied to your post: "${post.title}"`,
      data: { postId, replyAuthor },
      read: false,
    });

    // Send push notification
    await scheduleNotification(
      'New Reply',
      `${replyAuthor} replied to your post`,
      { postId, type: 'reply' }
    );
  } catch (error) {
    console.error('Error sending reply notification:', error);
  }
}

/**
 * Send notification when escalation is assigned to counselor
 */
export async function notifyEscalationAssigned(
  counselorId: string,
  postId: string,
  escalationLevel: string
) {
  try {
    const post = await getPost(postId);
    if (!post) return;

    await createNotification({
      userId: counselorId,
      type: 'escalation',
      title: 'New Escalation Assigned',
      message: `A ${escalationLevel} level escalation requires your attention: "${post.title}"`,
      data: { postId, escalationLevel },
      read: false,
    });

    await scheduleNotification(
      'New Escalation',
      `A ${escalationLevel} level escalation requires your attention`,
      { postId, type: 'escalation' }
    );
  } catch (error) {
    console.error('Error sending escalation notification:', error);
  }
}

/**
 * Schedule meeting reminder (1 hour before)
 */
export async function scheduleMeetingReminder(
  userId: string,
  meetingId: string,
  meetingTitle: string,
  scheduledDate: Date
) {
  try {
    const oneHourBefore = new Date(scheduledDate.getTime() - 60 * 60 * 1000);
    const now = new Date();

    // Only schedule if meeting is more than 1 hour away
    if (oneHourBefore <= now) return;

    // Create notification in database
    await createNotification({
      userId,
      type: 'meeting',
      title: 'Meeting Reminder',
      message: `Peer Educator Club meeting in 1 hour: "${meetingTitle}"`,
      data: { meetingId, meetingTitle },
      read: false,
    });

    // Schedule push notification
    await scheduleNotification(
      'Meeting Reminder',
      `Peer Educator Club meeting in 1 hour: "${meetingTitle}"`,
      { meetingId, type: 'meeting' },
      { date: oneHourBefore }
    );
  } catch (error) {
    console.error('Error scheduling meeting reminder:', error);
  }
}

/**
 * Schedule meeting reminder (24 hours before)
 */
export async function scheduleMeetingReminder24h(
  userId: string,
  meetingId: string,
  meetingTitle: string,
  scheduledDate: Date
) {
  try {
    const twentyFourHoursBefore = new Date(scheduledDate.getTime() - 24 * 60 * 60 * 1000);
    const now = new Date();

    // Only schedule if meeting is more than 24 hours away
    if (twentyFourHoursBefore <= now) return;

    // Create notification in database
    await createNotification({
      userId,
      type: 'meeting',
      title: 'Meeting Reminder',
      message: `Peer Educator Club meeting tomorrow: "${meetingTitle}"`,
      data: { meetingId, meetingTitle },
      read: false,
    });

    // Schedule push notification
    await scheduleNotification(
      'Meeting Reminder',
      `Peer Educator Club meeting tomorrow: "${meetingTitle}"`,
      { meetingId, type: 'meeting' },
      { date: twentyFourHoursBefore }
    );
  } catch (error) {
    console.error('Error scheduling 24h meeting reminder:', error);
  }
}

/**
 * Schedule all meeting reminders for a meeting
 */
export async function scheduleAllMeetingReminders(
  meetingId: string,
  meetingTitle: string,
  scheduledDate: Date
) {
  try {
    // Get all peer educators from Supabase
    const { supabase } = await import('./supabase');
    const { data: peerEducators } = await supabase
      .from('users')
      .select('id')
      .in('role', ['peer-educator', 'peer-educator-executive']);

    if (!peerEducators) return;

    // Schedule reminders for all members
    await Promise.all(
      peerEducators.map((member: any) => {
        scheduleMeetingReminder24h(member.id, meetingId, meetingTitle, scheduledDate);
        scheduleMeetingReminder(member.id, meetingId, meetingTitle, scheduledDate);
      })
    );
  } catch (error) {
    console.error('Error scheduling meeting reminders:', error);
  }
}

/**
 * Send notification when badge is earned
 */
export async function notifyBadgeEarned(userId: string, badgeName: string, badgeDescription: string) {
  try {
    await createNotification({
      userId,
      type: 'achievement',
      title: 'Badge Earned! 🎉',
      message: `You earned the "${badgeName}" badge: ${badgeDescription}`,
      data: { badgeName, badgeDescription },
      read: false,
    });

    await scheduleNotification(
      'Badge Earned! 🎉',
      `You earned the "${badgeName}" badge`,
      { type: 'achievement', badgeName }
    );
  } catch (error) {
    console.error('Error sending badge notification:', error);
  }
}

/**
 * Send notification for streak milestone
 */
export async function notifyStreakMilestone(userId: string, streakType: string, days: number) {
  try {
    await createNotification({
      userId,
      type: 'achievement',
      title: 'Streak Milestone! 🔥',
      message: `Amazing! You've maintained a ${streakType} streak for ${days} days!`,
      data: { streakType, days },
      read: false,
    });

    await scheduleNotification(
      'Streak Milestone! 🔥',
      `You've maintained a ${streakType} streak for ${days} days!`,
      { type: 'achievement', streakType, days }
    );
  } catch (error) {
    console.error('Error sending streak notification:', error);
  }
}

/**
 * Send notification for new post in followed category
 */
export async function notifyNewPostInCategory(
  userId: string,
  postId: string,
  category: string,
  postTitle: string
) {
  try {
    await createNotification({
      userId,
      type: 'system',
      title: 'New Post in Your Category',
      message: `A new post in ${category}: "${postTitle}"`,
      data: { postId, category },
      read: false,
    });

    await scheduleNotification(
      'New Post',
      `A new post in ${category}: "${postTitle}"`,
      { postId, type: 'system', category }
    );
  } catch (error) {
    console.error('Error sending category notification:', error);
  }
}

