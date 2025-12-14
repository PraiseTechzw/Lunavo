/**
 * Storage utilities for the app
 * Now using Supabase backend instead of AsyncStorage
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Post, User, Reply, Report, Analytics, CheckIn } from '@/types';
import {
  getPosts as getPostsFromDB,
  createPost as createPostInDB,
  updatePost as updatePostInDB,
  getPost as getPostFromDB,
  getReplies as getRepliesFromDB,
  createReply as createReplyInDB,
  getCurrentUser as getCurrentUserFromDB,
  createCheckIn as createCheckInInDB,
  getCheckIns as getCheckInsFromDB,
  hasCheckedInToday as hasCheckedInTodayFromDB,
  getCheckInStreak as getCheckInStreakFromDB,
  createReport as createReportInDB,
  getReports as getReportsFromDB,
  updateReport as updateReportInDB,
  getAnalytics as getAnalyticsFromDB,
} from '@/lib/database';

const STORAGE_KEYS = {
  USER: '@lunavo:user',
  POSTS: '@lunavo:posts',
  REPLIES: '@lunavo:replies',
  USER_PSEUDONYM: '@lunavo:pseudonym',
  SETTINGS: '@lunavo:settings',
  CHECK_INS: '@lunavo:check_ins',
  LAST_CHECK_IN_DATE: '@lunavo:last_check_in_date',
  REPORTS: '@lunavo:reports',
  ANALYTICS: '@lunavo:analytics',
};

/**
 * User storage (using Supabase)
 */
export async function saveUser(user: User): Promise<void> {
  // User is saved in Supabase, but we can cache pseudonym locally
  if (user.pseudonym) {
    await AsyncStorage.setItem(STORAGE_KEYS.USER_PSEUDONYM, user.pseudonym);
  }
}

export async function getUser(): Promise<User | null> {
  return getCurrentUserFromDB();
}

/**
 * Posts storage (using Supabase)
 */
export async function savePosts(posts: Post[]): Promise<void> {
  // Posts are now stored in Supabase, this function is kept for compatibility
  // but doesn't do anything as posts are fetched from DB
}

export async function getPosts(): Promise<Post[]> {
  return getPostsFromDB();
}

export async function addPost(post: Post): Promise<void> {
  // Auto-detect and escalate if needed
  const { autoEscalatePost } = await import('@/lib/escalation-detection');
  await autoEscalatePost(post);

  await createPostInDB({
    authorId: post.authorId,
    category: post.category,
    title: post.title,
    content: post.content,
    isAnonymous: post.isAnonymous,
    tags: post.tags,
    escalationLevel: post.escalationLevel,
    escalationReason: post.escalationReason,
  });
}

export async function updatePost(postId: string, updates: Partial<Post>): Promise<void> {
  await updatePostInDB(postId, updates);
}

/**
 * Replies storage (using Supabase)
 */
export async function getReplies(): Promise<Reply[]> {
  // This function signature is kept for compatibility
  // In practice, replies are fetched per post using getRepliesFromDB(postId)
  return [];
}

export async function saveReplies(replies: Reply[]): Promise<void> {
  // Replies are now stored in Supabase
}

export async function addReply(reply: Reply): Promise<void> {
  const user = await getCurrentUserFromDB();
  if (!user) throw new Error('User not authenticated');

  await createReplyInDB({
    postId: reply.postId,
    authorId: user.id,
    content: reply.content,
    isAnonymous: reply.isAnonymous,
    isFromVolunteer: reply.isFromVolunteer,
  });
}

/**
 * Pseudonym storage
 */
export async function savePseudonym(pseudonym: string): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.USER_PSEUDONYM, pseudonym);
}

export async function getPseudonym(): Promise<string | null> {
  return await AsyncStorage.getItem(STORAGE_KEYS.USER_PSEUDONYM);
}

/**
 * Settings storage
 */
export async function saveSettings(settings: Record<string, any>): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
}

export async function getSettings(): Promise<Record<string, any>> {
  const data = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
  return data ? JSON.parse(data) : {};
}

/**
 * Check-in storage (using Supabase)
 */
export interface CheckIn {
  id: string;
  userId: string;
  mood: string;
  note?: string;
  feelingStrength?: number;
  date: string; // YYYY-MM-DD format
  timestamp: number;
}

export async function saveCheckIn(checkIn: CheckIn): Promise<void> {
  const user = await getCurrentUserFromDB();
  if (!user) throw new Error('User not authenticated');

  await createCheckInInDB({
    userId: user.id,
    mood: checkIn.mood,
    feelingStrength: checkIn.feelingStrength,
    note: checkIn.note,
    date: checkIn.date,
  });
}

export async function getCheckIns(): Promise<CheckIn[]> {
  const user = await getCurrentUserFromDB();
  if (!user) return [];

  return getCheckInsFromDB(user.id);
}

export async function getCheckInStreak(): Promise<number> {
  const user = await getCurrentUserFromDB();
  if (!user) return 0;

  return getCheckInStreakFromDB(user.id);
}

export async function hasCheckedInToday(): Promise<boolean> {
  const user = await getCurrentUserFromDB();
  if (!user) return false;

  return hasCheckedInTodayFromDB(user.id);
}

/**
 * Reports storage (using Supabase)
 */
export async function getReports(): Promise<Report[]> {
  const user = await getCurrentUserFromDB();
  if (!user) return [];

  return getReportsFromDB({ reporterId: user.id });
}

export async function addReport(report: Report): Promise<void> {
  await createReportInDB({
    targetType: report.targetType,
    targetId: report.targetId,
    reporterId: report.reporterId,
    reason: report.reason,
    description: report.description,
  });
}

export async function updateReport(reportId: string, updates: Partial<Report>): Promise<void> {
  await updateReportInDB(reportId, updates);
}

/**
 * Analytics storage (using Supabase)
 */
export async function getAnalytics(): Promise<Analytics> {
  return getAnalyticsFromDB();
}
