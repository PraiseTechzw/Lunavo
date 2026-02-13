/**
 * Storage utilities using Supabase backend
 * This replaces the AsyncStorage-based storage.ts
 */

import {
  getPosts as getPostsFromDB,
  createPost as createPostInDB,
  updatePost as updatePostInDB,
  getPost as getPostFromDB,
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
import { Post, Reply, Report, User, CheckIn, Analytics } from '@/app/types';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  USER_PSEUDONYM: '@lunavo:pseudonym',
  SETTINGS: '@lunavo:settings',
};

// ============================================
// USER OPERATIONS (using Supabase)
// ============================================

export async function getUser(): Promise<User | null> {
  return getCurrentUserFromDB();
}

export async function saveUser(user: User): Promise<void> {
  // User is saved in Supabase, but we can cache pseudonym locally
  if (user.pseudonym) {
    await AsyncStorage.setItem(STORAGE_KEYS.USER_PSEUDONYM, user.pseudonym);
  }
}

// ============================================
// POST OPERATIONS (using Supabase)
// ============================================

export async function getPosts(): Promise<Post[]> {
  return getPostsFromDB();
}

export async function addPost(post: Post): Promise<void> {
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

export async function getPost(postId: string): Promise<Post | null> {
  return getPostFromDB(postId);
}

// ============================================
// REPLY OPERATIONS (using Supabase)
// ============================================

export async function getReplies(): Promise<Reply[]> {
  // This function signature is kept for compatibility
  // In practice, replies are fetched per post
  return [];
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

// ============================================
// PSEUDONYM OPERATIONS (local cache)
// ============================================

export async function savePseudonym(pseudonym: string): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.USER_PSEUDONYM, pseudonym);
}

export async function getPseudonym(): Promise<string | null> {
  return await AsyncStorage.getItem(STORAGE_KEYS.USER_PSEUDONYM);
}

// ============================================
// SETTINGS OPERATIONS (local storage)
// ============================================

export async function saveSettings(settings: Record<string, any>): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
}

export async function getSettings(): Promise<Record<string, any>> {
  const data = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
  return data ? JSON.parse(data) : {};
}

// ============================================
// CHECK-IN OPERATIONS (using Supabase)
// ============================================

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

// ============================================
// REPORT OPERATIONS (using Supabase)
// ============================================

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

// ============================================
// ANALYTICS OPERATIONS (using Supabase)
// ============================================

export async function getAnalytics(): Promise<Analytics> {
  return getAnalyticsFromDB();
}

// Re-export CheckIn type for compatibility
export type { CheckIn };

