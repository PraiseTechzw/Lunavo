/**
 * Database utility functions for Supabase
 * All database operations go through these functions
 */

import { CheckIn, Escalation, EscalationLevel, Notification, NotificationType, Post, PostCategory, PostStatus, Reply, Report, User } from '@/app/types';
import { supabase } from './supabase';

// ============================================
// USER OPERATIONS
// ============================================

export interface CreateUserData {
  email: string;
  student_number?: string;
  role?: 'student' | 'peer-educator' | 'peer-educator-executive' | 'moderator' | 'counselor' | 'life-coach' | 'student-affairs' | 'admin';
  pseudonym: string;
  profile_data?: Record<string, any>;
}

export async function createUser(userData: CreateUserData): Promise<User> {
  // Get the current authenticated user's ID from Supabase Auth
  const { data: { user: authUser } } = await supabase.auth.getUser();
  
  if (!authUser) {
    throw new Error('User must be authenticated to create user record');
  }

  const { data, error } = await supabase
    .from('users')
    .insert({
      id: authUser.id, // Use the auth user's ID
      email: userData.email,
      student_number: userData.student_number || null,
      role: userData.role || 'student',
      pseudonym: userData.pseudonym,
      is_anonymous: true,
      verified: false,
      profile_data: userData.profile_data || {},
    })
    .select()
    .single();

  if (error) throw error;

  return mapUserFromDB(data);
}

export async function getUser(userId: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw error;
  }

  return mapUserFromDB(data);
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return mapUserFromDB(data);
}

export async function updateUser(userId: string, updates: Partial<User>): Promise<User> {
  const { data, error } = await supabase
    .from('users')
    .update({
      pseudonym: updates.pseudonym,
      is_anonymous: updates.isAnonymous,
      profile_data: updates.profile_data || {},
      last_active: new Date().toISOString(),
    })
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;

  return mapUserFromDB(data);
}

export async function getCurrentUser(): Promise<User | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  return getUser(user.id);
}

// ============================================
// POST OPERATIONS
// ============================================

export interface CreatePostData {
  authorId: string;
  category: PostCategory;
  title: string;
  content: string;
  isAnonymous: boolean;
  tags?: string[];
  escalationLevel?: EscalationLevel;
  escalationReason?: string;
}

export async function createPost(postData: CreatePostData): Promise<Post> {
  const { data, error } = await supabase
    .from('posts')
    .insert({
      author_id: postData.authorId,
      category: postData.category,
      title: postData.title,
      content: postData.content,
      is_anonymous: postData.isAnonymous,
      tags: postData.tags || [],
      status: postData.escalationLevel && postData.escalationLevel !== 'none' ? 'escalated' : 'active',
      escalation_level: postData.escalationLevel || 'none',
      escalation_reason: postData.escalationReason || null,
      is_flagged: postData.escalationLevel && postData.escalationLevel !== 'none',
    })
    .select()
    .single();

  if (error) throw error;

  // Get author pseudonym
  const author = await getUser(postData.authorId);
  const post = await mapPostFromDB(data, author?.pseudonym || 'Anonymous');

  // If escalated, create escalation record
  if (postData.escalationLevel && postData.escalationLevel !== 'none') {
    await createEscalation({
      postId: post.id,
      level: postData.escalationLevel,
      reason: postData.escalationReason || 'Auto-detected',
    });
  }

  return post;
}

export async function getPosts(filters?: {
  category?: PostCategory;
  status?: PostStatus;
  authorId?: string;
  limit?: number;
  offset?: number;
}): Promise<Post[]> {
  let query = supabase
    .from('posts')
    .select(`
      *,
      users!posts_author_id_fkey(pseudonym)
    `)
    .order('created_at', { ascending: false });

  if (filters?.category) {
    query = query.eq('category', filters.category);
  }

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  if (filters?.authorId) {
    query = query.eq('author_id', filters.authorId);
  }

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  if (filters?.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
  }

  const { data, error } = await query;

  if (error) throw error;

  // Get replies for each post
  const posts = await Promise.all(
    (data || []).map(async (post: any) => {
      const authorPseudonym = post.users?.pseudonym || 'Anonymous';
      const mappedPost = await mapPostFromDB(post, authorPseudonym);
      const replies = await getReplies(mappedPost.id);
      return { ...mappedPost, replies };
    })
  );

  return posts;
}

export async function getPost(postId: string): Promise<Post | null> {
  const { data, error } = await supabase
    .from('posts')
    .select(`
      *,
      users!posts_author_id_fkey(pseudonym)
    `)
    .eq('id', postId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  const authorPseudonym = data.users?.pseudonym || 'Anonymous';
  const post = await mapPostFromDB(data, authorPseudonym);
  const replies = await getReplies(post.id);

  return { ...post, replies };
}

export async function updatePost(postId: string, updates: Partial<Post>): Promise<Post> {
  const { data, error } = await supabase
    .from('posts')
    .update({
      title: updates.title,
      content: updates.content,
      status: updates.status,
      escalation_level: updates.escalationLevel,
      escalation_reason: updates.escalationReason,
      is_flagged: updates.isFlagged,
      reported_count: updates.reportedCount,
      upvotes: updates.upvotes,
    })
    .eq('id', postId)
    .select()
    .single();

  if (error) throw error;

  const author = await getUser(data.author_id);
  return mapPostFromDB(data, author?.pseudonym || 'Anonymous');
}

export async function deletePost(postId: string): Promise<void> {
  const { error } = await supabase
    .from('posts')
    .delete()
    .eq('id', postId);

  if (error) throw error;
}

export async function upvotePost(postId: string): Promise<number> {
  // Get current upvotes
  const post = await getPost(postId);
  if (!post) throw new Error('Post not found');

  const newUpvotes = post.upvotes + 1;

  await supabase
    .from('posts')
    .update({ upvotes: newUpvotes })
    .eq('id', postId);

  return newUpvotes;
}

// ============================================
// REPLY OPERATIONS
// ============================================

export interface CreateReplyData {
  postId: string;
  authorId: string;
  content: string;
  isAnonymous: boolean;
  isFromVolunteer?: boolean;
}

export async function createReply(replyData: CreateReplyData): Promise<Reply> {
  const { data, error } = await supabase
    .from('replies')
    .insert({
      post_id: replyData.postId,
      author_id: replyData.authorId,
      content: replyData.content,
      is_anonymous: replyData.isAnonymous,
      is_from_volunteer: replyData.isFromVolunteer || false,
    })
    .select()
    .single();

  if (error) throw error;

  const author = await getUser(replyData.authorId);
  return mapReplyFromDB(data, author?.pseudonym || 'Anonymous');
}

export async function getReplies(postId: string): Promise<Reply[]> {
  const { data, error } = await supabase
    .from('replies')
    .select(`
      *,
      users!replies_author_id_fkey(pseudonym)
    `)
    .eq('post_id', postId)
    .order('created_at', { ascending: true });

  if (error) throw error;

  return (data || []).map((reply: any) => {
    const authorPseudonym = reply.users?.pseudonym || 'Anonymous';
    return mapReplyFromDB(reply, authorPseudonym);
  });
}

export async function updateReply(replyId: string, updates: Partial<Reply>): Promise<Reply> {
  const { data, error } = await supabase
    .from('replies')
    .update({
      content: updates.content,
      is_helpful: updates.isHelpful,
      reported_count: updates.reportedCount,
    })
    .eq('id', replyId)
    .select()
    .single();

  if (error) throw error;

  const author = await getUser(data.author_id);
  return mapReplyFromDB(data, author?.pseudonym || 'Anonymous');
}

export async function deleteReply(replyId: string): Promise<void> {
  const { error } = await supabase
    .from('replies')
    .delete()
    .eq('id', replyId);

  if (error) throw error;
}

export async function markReplyHelpful(replyId: string): Promise<number> {
  const reply = await supabase
    .from('replies')
    .select('is_helpful')
    .eq('id', replyId)
    .single();

  if (reply.error) throw reply.error;

  const newHelpful = (reply.data.is_helpful || 0) + 1;

  await supabase
    .from('replies')
    .update({ is_helpful: newHelpful })
    .eq('id', replyId);

  return newHelpful;
}

// ============================================
// REPORT OPERATIONS
// ============================================

export interface CreateReportData {
  targetType: 'post' | 'reply' | 'user';
  targetId: string;
  reporterId: string;
  reason: string;
  description?: string;
}

export async function createReport(reportData: CreateReportData): Promise<Report> {
  const { data, error } = await supabase
    .from('reports')
    .insert({
      target_type: reportData.targetType,
      target_id: reportData.targetId,
      reporter_id: reportData.reporterId,
      reason: reportData.reason,
      description: reportData.description || null,
      status: 'pending',
    })
    .select()
    .single();

  if (error) throw error;

  return mapReportFromDB(data);
}

export async function getReports(filters?: {
  status?: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  reporterId?: string;
}): Promise<Report[]> {
  let query = supabase
    .from('reports')
    .select('*')
    .order('created_at', { ascending: false });

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  if (filters?.reporterId) {
    query = query.eq('reporter_id', filters.reporterId);
  }

  const { data, error } = await query;

  if (error) throw error;

  return (data || []).map(mapReportFromDB);
}

export async function updateReport(reportId: string, updates: Partial<Report>): Promise<Report> {
  const { data, error } = await supabase
    .from('reports')
    .update({
      status: updates.status,
      reviewed_at: updates.reviewedAt ? new Date(updates.reviewedAt).toISOString() : null,
      reviewed_by: updates.reviewedBy || null,
    })
    .eq('id', reportId)
    .select()
    .single();

  if (error) throw error;

  return mapReportFromDB(data);
}

// ============================================
// ESCALATION OPERATIONS
// ============================================

export interface CreateEscalationData {
  postId: string;
  level: EscalationLevel;
  reason: string;
  assignedTo?: string;
}

export async function createEscalation(escalationData: CreateEscalationData): Promise<Escalation> {
  const { data, error } = await supabase
    .from('escalations')
    .insert({
      post_id: escalationData.postId,
      level: escalationData.level,
      reason: escalationData.reason,
      assigned_to: escalationData.assignedTo || null,
      status: 'pending',
    })
    .select()
    .single();

  if (error) throw error;

  return mapEscalationFromDB(data);
}

export async function getEscalations(filters?: {
  status?: 'pending' | 'in-progress' | 'resolved' | 'dismissed';
  assignedTo?: string;
  level?: EscalationLevel;
}): Promise<Escalation[]> {
  let query = supabase
    .from('escalations')
    .select('*')
    .order('detected_at', { ascending: false });

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  if (filters?.assignedTo) {
    query = query.eq('assigned_to', filters.assignedTo);
  }

  if (filters?.level) {
    query = query.eq('level', filters.level);
  }

  const { data, error } = await query;

  if (error) throw error;

  return (data || []).map(mapEscalationFromDB);
}

export async function updateEscalation(escalationId: string, updates: Partial<Escalation>): Promise<Escalation> {
  const updateData: any = {};
  
  if (updates.status) updateData.status = updates.status;
  if (updates.assignedTo !== undefined) updateData.assigned_to = updates.assignedTo || null;
  if (updates.resolvedAt) updateData.resolved_at = updates.resolvedAt.toISOString();
  if (updates.notes !== undefined) updateData.notes = updates.notes || null;

  const { data, error } = await supabase
    .from('escalations')
    .update(updateData)
    .eq('id', escalationId)
    .select()
    .single();

  if (error) throw error;

  return mapEscalationFromDB(data);
}

export async function getEscalationById(escalationId: string): Promise<Escalation | null> {
  const { data, error } = await supabase
    .from('escalations')
    .select('*')
    .eq('id', escalationId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return mapEscalationFromDB(data);
}

// ============================================
// CHECK-IN OPERATIONS
// ============================================

export interface CreateCheckInData {
  userId: string;
  mood: string;
  feelingStrength?: number;
  note?: string;
  date: string; // YYYY-MM-DD format
}

export async function createCheckIn(checkInData: CreateCheckInData): Promise<CheckIn> {
  const { data, error } = await supabase
    .from('check_ins')
    .insert({
      user_id: checkInData.userId,
      mood: checkInData.mood,
      feeling_strength: checkInData.feelingStrength || null,
      note: checkInData.note || null,
      date: checkInData.date,
    })
    .select()
    .single();

  if (error) {
    // If duplicate, update instead
    if (error.code === '23505') {
      const { data: updated, error: updateError } = await supabase
        .from('check_ins')
        .update({
          mood: checkInData.mood,
          feeling_strength: checkInData.feelingStrength || null,
          note: checkInData.note || null,
        })
        .eq('user_id', checkInData.userId)
        .eq('date', checkInData.date)
        .select()
        .single();

      if (updateError) throw updateError;
      return mapCheckInFromDB(updated);
    }
    throw error;
  }

  return mapCheckInFromDB(data);
}

export async function getCheckIns(userId: string, limit?: number): Promise<CheckIn[]> {
  let query = supabase
    .from('check_ins')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false });

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error) throw error;

  return (data || []).map(mapCheckInFromDB);
}

export async function hasCheckedInToday(userId: string): Promise<boolean> {
  const today = new Date().toISOString().split('T')[0];
  const { data, error } = await supabase
    .from('check_ins')
    .select('id')
    .eq('user_id', userId)
    .eq('date', today)
    .single();

  if (error && error.code === 'PGRST116') return false;
  if (error) throw error;

  return !!data;
}

export async function getCheckInStreak(userId: string): Promise<number> {
  // This is a simplified version - you might want to implement a more sophisticated streak calculation
  const { data, error } = await supabase
    .from('streaks')
    .select('current_streak')
    .eq('user_id', userId)
    .eq('streak_type', 'check-in')
    .single();

  if (error && error.code === 'PGRST116') return 0;
  if (error) throw error;

  return data?.current_streak || 0;
}

// ============================================
// ANALYTICS OPERATIONS
// ============================================

export async function getAnalytics(): Promise<any> {
  // Get total posts
  const { count: totalPosts } = await supabase
    .from('posts')
    .select('*', { count: 'exact', head: true });

  // Get posts by category
  const { data: postsByCategory } = await supabase
    .from('posts')
    .select('category');

  const categoryCounts: Record<string, number> = {};
  postsByCategory?.forEach((post: any) => {
    categoryCounts[post.category] = (categoryCounts[post.category] || 0) + 1;
  });

  // Get escalation count
  const { count: escalationCount } = await supabase
    .from('escalations')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');

  // Get active users (users active in last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const { count: activeUsers } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .gte('last_active', thirtyDaysAgo.toISOString());

  return {
    totalPosts: totalPosts || 0,
    postsByCategory: categoryCounts,
    escalationCount: escalationCount || 0,
    activeUsers: activeUsers || 0,
    responseTime: 0, // Calculate based on escalation response times
    commonIssues: [], // Extract from posts
  };
}

// ============================================
// NOTIFICATION OPERATIONS
// ============================================

export async function getNotifications(userId: string, filters?: { read?: boolean }): Promise<Notification[]> {
  let query = supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (filters?.read !== undefined) {
    query = query.eq('read', filters.read);
  }

  const { data, error } = await query;
  if (error) throw error;

  return data.map((n: any) => ({
    id: n.id,
    userId: n.user_id,
    type: n.type as NotificationType,
    title: n.title,
    message: n.message,
    data: n.data || {},
    read: n.read,
    createdAt: new Date(n.created_at),
  }));
}

export async function createNotification(notification: Partial<Notification>): Promise<Notification> {
  const { data, error } = await supabase
    .from('notifications')
    .insert({
      user_id: notification.userId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      data: notification.data || {},
      read: notification.read || false,
    })
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    userId: data.user_id,
    type: data.type,
    title: data.title,
    message: data.message,
    data: data.data || {},
    read: data.read,
    createdAt: new Date(data.created_at),
  };
}

export async function markNotificationAsRead(notificationId: string): Promise<Notification> {
  const { data, error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', notificationId)
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    userId: data.user_id,
    type: data.type,
    title: data.title,
    message: data.message,
    data: data.data || {},
    read: data.read,
    createdAt: new Date(data.created_at),
  };
}

export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', userId)
    .eq('read', false);

  if (error) throw error;
}

export async function deleteNotification(notificationId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', notificationId);

  if (error) throw error;
}

// ============================================
// MAPPING FUNCTIONS (DB -> App Types)
// ============================================

function mapUserFromDB(data: any): User {
  return {
    id: data.id,
    pseudonym: data.pseudonym,
    isAnonymous: data.is_anonymous,
    role: data.role as User['role'],
    createdAt: new Date(data.created_at),
    lastActive: new Date(data.last_active),
    profile_data: data.profile_data || {},
  };
}

async function mapPostFromDB(data: any, authorPseudonym: string): Promise<Post> {
  return {
    id: data.id,
    authorId: data.author_id,
    authorPseudonym,
    category: data.category,
    title: data.title,
    content: data.content,
    status: data.status,
    escalationLevel: data.escalation_level,
    escalationReason: data.escalation_reason || undefined,
    isAnonymous: data.is_anonymous,
    tags: data.tags || [],
    upvotes: data.upvotes || 0,
    replies: [], // Will be populated separately
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
    reportedCount: data.reported_count || 0,
    isFlagged: data.is_flagged || false,
  };
}

function mapReplyFromDB(data: any, authorPseudonym: string): Reply {
  return {
    id: data.id,
    postId: data.post_id,
    authorId: data.author_id,
    authorPseudonym,
    content: data.content,
    isAnonymous: data.is_anonymous,
    isHelpful: data.is_helpful || 0,
    isFromVolunteer: data.is_from_volunteer || false,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
    reportedCount: data.reported_count || 0,
  };
}

function mapReportFromDB(data: any): Report {
  return {
    id: data.id,
    targetType: data.target_type,
    targetId: data.target_id,
    reporterId: data.reporter_id,
    reason: data.reason,
    description: data.description || undefined,
    status: data.status,
    createdAt: new Date(data.created_at),
    reviewedAt: data.reviewed_at ? new Date(data.reviewed_at) : undefined,
    reviewedBy: data.reviewed_by || undefined,
  };
}

function mapCheckInFromDB(data: any): CheckIn {
  return {
    id: data.id,
    userId: data.user_id,
    mood: data.mood,
    feelingStrength: data.feeling_strength || undefined,
    note: data.note || undefined,
    date: data.date,
    timestamp: new Date(data.created_at).getTime(),
  };
}

function mapEscalationFromDB(data: any): Escalation {
  return {
    id: data.id,
    postId: data.post_id,
    escalationLevel: data.level,
    reason: data.reason,
    detectedAt: new Date(data.detected_at),
    assignedTo: data.assigned_to || undefined,
    status: data.status,
    resolvedAt: data.resolved_at ? new Date(data.resolved_at) : undefined,
    notes: data.notes || undefined,
  };
}

