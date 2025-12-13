/**
 * Database utility functions for Supabase
 * All database operations go through these functions
 */

import { CheckIn, Escalation, EscalationLevel, Meeting, MeetingAttendance, MeetingType, Notification, NotificationType, Post, PostCategory, PostStatus, Reply, Report, User } from '@/app/types';
import { supabase } from './supabase';

// ============================================
// USER OPERATIONS
// ============================================

export interface CreateUserData {
  email: string;
  username?: string; // Anonymous username
  student_number: string; // Required - CUT format: Letter + 8 digits + Letter (e.g., C23155538O)
  phone: string; // Required for crisis contact
  emergency_contact_name: string; // Required for crisis contact
  emergency_contact_phone: string; // Required for crisis contact
  location?: string; // Optional but recommended
  preferred_contact_method?: 'phone' | 'sms' | 'email' | 'in-person'; // Optional
  role?: 'student' | 'peer-educator' | 'peer-educator-executive' | 'moderator' | 'counselor' | 'life-coach' | 'student-affairs' | 'admin';
  pseudonym: string;
  profile_data?: Record<string, any>;
}

export async function createUser(userData: CreateUserData, authUserId?: string): Promise<User> {
  // Get the current authenticated user's ID from Supabase Auth
  // If authUserId is provided (from signUp), use it directly
  let userId = authUserId;
  
  if (!userId) {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) {
      throw new Error('User must be authenticated to create user record');
    }
    userId = authUser.id;
  }

  // Try direct insert first (uses INSERT policy)
  let { data, error } = await supabase
    .from('users')
    .insert({
      id: userId, // Use the auth user's ID
      email: userData.email,
      username: userData.username || null, // Anonymous username
      student_number: userData.student_number, // Required
      phone: userData.phone, // Required for crisis contact
      emergency_contact_name: userData.emergency_contact_name, // Required
      emergency_contact_phone: userData.emergency_contact_phone, // Required
      location: userData.location || null, // Optional
      preferred_contact_method: userData.preferred_contact_method || null, // Optional
      role: userData.role || 'student',
      pseudonym: userData.pseudonym,
      is_anonymous: true,
      verified: false,
      profile_data: userData.profile_data || {},
    })
    .select()
    .single();

  // If direct insert fails due to RLS, use the SECURITY DEFINER function
  if (error && (error.code === '42501' || error.message?.includes('row-level security'))) {
    console.log('Direct insert failed due to RLS, using SECURITY DEFINER function');
    const { data: functionData, error: functionError } = await supabase.rpc('create_user_profile', {
      user_id: userId,
      user_email: userData.email,
      user_student_number: userData.student_number,
      user_phone: userData.phone,
      user_emergency_contact_name: userData.emergency_contact_name,
      user_emergency_contact_phone: userData.emergency_contact_phone,
      user_pseudonym: userData.pseudonym,
      user_username: userData.username || null,
      user_location: userData.location || null,
      user_preferred_contact_method: userData.preferred_contact_method || null,
      user_role_param: userData.role || 'student',
      user_profile_data: userData.profile_data || {},
    });

    if (functionError) {
      throw functionError;
    }

    return mapUserFromDB(functionData);
  }

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

export async function getUserByUsername(username: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('username', username.toLowerCase().trim())
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return mapUserFromDB(data);
}

/**
 * Check if username is available (real-time)
 * Uses a database function to bypass RLS and avoid infinite recursion
 */
export async function checkUsernameAvailability(username: string): Promise<boolean> {
  if (!username || username.trim().length < 3) {
    return false;
  }

  const normalizedUsername = username.toLowerCase().trim();
  
  // Check username format (alphanumeric, underscore, hyphen, 3-20 chars)
  if (!/^[a-z0-9_-]{3,20}$/.test(normalizedUsername)) {
    return false;
  }

  try {
    // Use the database function to check availability (bypasses RLS)
    const { data, error } = await supabase.rpc('check_username_available', {
      check_username: normalizedUsername
    });

    if (error) {
      // Fallback to direct query if function doesn't exist yet
      console.warn('Function check_username_available not found, using direct query:', error);
      const { data: queryData, error: queryError } = await supabase
        .from('users')
        .select('id')
        .eq('username', normalizedUsername)
        .maybeSingle();

      if (queryError && queryError.code !== 'PGRST116') {
        throw queryError;
      }

      return !queryData;
    }

    return data === true;
  } catch (error: any) {
    console.error('Error checking username availability:', error);
    // On error, assume taken to be safe
    return false;
  }
}

/**
 * @author: Praise Masunga 
 * Check if email is available (real-time)
 * Uses a database function to check both users table and auth.users
 */
export async function checkEmailAvailability(email: string): Promise<boolean> {
  if (!email || !email.trim()) {
    return false;
  }

  const normalizedEmail = email.toLowerCase().trim();
  
  // Basic email format validation
  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
  if (!emailRegex.test(normalizedEmail)) {
    return false;
  }

  try {
    // Use the database function to check availability (bypasses RLS)
    const { data, error } = await supabase.rpc('check_email_available', {
      check_email: normalizedEmail
    });

    if (error) {
      // Fallback to direct query if function doesn't exist yet
      console.warn('Function check_email_available not found, using direct query:', error);
      const { data: queryData, error: queryError } = await supabase
        .from('users')
        .select('id')
        .eq('email', normalizedEmail)
        .maybeSingle();

      if (queryError && queryError.code !== 'PGRST116') {
        throw queryError;
      }

      return !queryData;
    }

    return data === true;
  } catch (error: any) {
    console.error('Error checking email availability:', error);
    // On error, assume taken to be safe
    return false;
  }
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

export async function getUsers(limit?: number): Promise<User[]> {
  let query = supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false });

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error) throw error;

  return (data || []).map(mapUserFromDB);
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
  // Auto-detect escalation if not provided
  let escalationLevel = postData.escalationLevel || 'none';
  let escalationReason = postData.escalationReason;

  if (!postData.escalationLevel || postData.escalationLevel === 'none') {
    try {
      const { detectEscalationLevel } = await import('./escalation-detection');
      const tempPost: Post = {
        id: 'temp',
        authorId: postData.authorId,
        authorPseudonym: 'temp',
        category: postData.category,
        title: postData.title,
        content: postData.content,
        status: 'active',
        escalationLevel: 'none',
        isAnonymous: postData.isAnonymous || false,
        tags: postData.tags || [],
        upvotes: 0,
        replies: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        reportedCount: 0,
        isFlagged: false,
      };
      
      const escalation = detectEscalationLevel(tempPost);
      if (escalation.level !== 'none' && escalation.confidence >= 0.5) {
        escalationLevel = escalation.level;
        escalationReason = escalation.reason;
      }
    } catch (error) {
      console.error('Error detecting escalation:', error);
      // Continue with post creation even if detection fails
    }
  }

  const { data, error } = await supabase
    .from('posts')
    .insert({
      author_id: postData.authorId,
      category: postData.category,
      title: postData.title,
      content: postData.content,
      is_anonymous: postData.isAnonymous,
      tags: postData.tags || [],
      status: escalationLevel !== 'none' ? 'escalated' : 'active',
      escalation_level: escalationLevel,
      escalation_reason: escalationReason || null,
      is_flagged: escalationLevel !== 'none',
    })
    .select()
    .single();

  if (error) throw error;

  // Get author pseudonym
  const author = await getUser(postData.authorId);
  const post = await mapPostFromDB(data, author?.pseudonym || 'Anonymous');

  // Create escalation record if needed
  if (escalationLevel !== 'none') {
    try {
      await createEscalation({
        postId: post.id,
        level: escalationLevel,
        reason: escalationReason || 'Auto-detected',
      });
    } catch (escalationError) {
      console.error('Error creating escalation:', escalationError);
      // Don't fail post creation if escalation fails
    }
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
// MEETING OPERATIONS
// ============================================

export interface CreateMeetingData {
  title: string;
  description?: string;
  scheduledDate: Date;
  durationMinutes?: number;
  location?: string;
  meetingType?: MeetingType;
  createdBy: string;
}

export async function createMeeting(meetingData: CreateMeetingData): Promise<Meeting> {
  const { data, error } = await supabase
    .from('meetings')
    .insert({
      title: meetingData.title,
      description: meetingData.description || null,
      scheduled_date: meetingData.scheduledDate.toISOString(),
      duration_minutes: meetingData.durationMinutes || 30,
      location: meetingData.location || null,
      meeting_type: meetingData.meetingType || 'weekly',
      created_by: meetingData.createdBy,
    })
    .select()
    .single();

  if (error) throw error;

  return mapMeetingFromDB(data);
}

export async function getMeetings(filters?: {
  meetingType?: MeetingType;
  upcoming?: boolean;
  past?: boolean;
}): Promise<Meeting[]> {
  let query = supabase
    .from('meetings')
    .select('*')
    .order('scheduled_date', { ascending: true });

  if (filters?.meetingType) {
    query = query.eq('meeting_type', filters.meetingType);
  }

  if (filters?.upcoming) {
    query = query.gte('scheduled_date', new Date().toISOString());
  }

  if (filters?.past) {
    query = query.lt('scheduled_date', new Date().toISOString());
  }

  const { data, error } = await query;

  if (error) throw error;

  return (data || []).map(mapMeetingFromDB);
}

export async function getMeeting(meetingId: string): Promise<Meeting | null> {
  const { data, error } = await supabase
    .from('meetings')
    .select('*')
    .eq('id', meetingId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return mapMeetingFromDB(data);
}

export async function updateMeeting(meetingId: string, updates: Partial<Meeting>): Promise<Meeting> {
  const updateData: any = {};

  if (updates.title) updateData.title = updates.title;
  if (updates.description !== undefined) updateData.description = updates.description || null;
  if (updates.scheduledDate) updateData.scheduled_date = updates.scheduledDate.toISOString();
  if (updates.durationMinutes) updateData.duration_minutes = updates.durationMinutes;
  if (updates.location !== undefined) updateData.location = updates.location || null;
  if (updates.meetingType) updateData.meeting_type = updates.meetingType;

  const { data, error } = await supabase
    .from('meetings')
    .update(updateData)
    .eq('id', meetingId)
    .select()
    .single();

  if (error) throw error;

  return mapMeetingFromDB(data);
}

export async function deleteMeeting(meetingId: string): Promise<void> {
  const { error } = await supabase
    .from('meetings')
    .delete()
    .eq('id', meetingId);

  if (error) throw error;
}

// ============================================
// MEETING ATTENDANCE OPERATIONS
// ============================================

export interface CreateAttendanceData {
  meetingId: string;
  userId: string;
  attended: boolean;
  notes?: string;
}

export async function createOrUpdateAttendance(attendanceData: CreateAttendanceData): Promise<MeetingAttendance> {
  const { data, error } = await supabase
    .from('meeting_attendance')
    .upsert({
      meeting_id: attendanceData.meetingId,
      user_id: attendanceData.userId,
      attended: attendanceData.attended,
      attended_at: attendanceData.attended ? new Date().toISOString() : null,
      notes: attendanceData.notes || null,
    }, {
      onConflict: 'meeting_id,user_id',
    })
    .select()
    .single();

  if (error) throw error;

  const result = mapAttendanceFromDB(data);

  // Update engagement streak and award points if attending
  if (attendanceData.attended) {
    try {
      const meeting = await getMeeting(attendanceData.meetingId);
      if (meeting) {
        // Update engagement streak from meeting attendance
        const { updateEngagementStreakFromMeeting } = await import('./gamification');
        await updateEngagementStreakFromMeeting(attendanceData.userId, meeting.scheduledDate);
        
        // Award points for meeting attendance
        const { awardMeetingAttendancePoints } = await import('./points-system');
        await awardMeetingAttendancePoints(attendanceData.userId);
      }
    } catch (error) {
      console.error('Error updating streak/points from meeting attendance:', error);
    }
  }

  return result;
}

export async function getMeetingAttendance(meetingId: string): Promise<MeetingAttendance[]> {
  const { data, error } = await supabase
    .from('meeting_attendance')
    .select('*')
    .eq('meeting_id', meetingId);

  if (error) throw error;

  return (data || []).map(mapAttendanceFromDB);
}

export async function getUserAttendance(userId: string): Promise<MeetingAttendance[]> {
  const { data, error } = await supabase
    .from('meeting_attendance')
    .select('*')
    .eq('user_id', userId)
    .order('attended_at', { ascending: false });

  if (error) throw error;

  return (data || []).map(mapAttendanceFromDB);
}

// ============================================
// RESOURCE OPERATIONS
// ============================================

export interface CreateResourceData {
  title: string;
  description?: string;
  category: PostCategory;
  resourceType: 'article' | 'video' | 'pdf' | 'link' | 'training';
  url?: string;
  filePath?: string;
  tags?: string[];
  createdBy: string;
}

export async function createResource(resourceData: CreateResourceData): Promise<any> {
  const { data, error } = await supabase
    .from('resources')
    .insert({
      title: resourceData.title,
      description: resourceData.description || null,
      category: resourceData.category,
      resource_type: resourceData.resourceType,
      url: resourceData.url || null,
      file_path: resourceData.filePath || null,
      tags: resourceData.tags || [],
      created_by: resourceData.createdBy,
    })
    .select()
    .single();

  if (error) throw error;

  return data;
}

export async function getResources(filters?: {
  category?: PostCategory;
  resourceType?: 'article' | 'video' | 'pdf' | 'link' | 'training';
}): Promise<any[]> {
  let query = supabase
    .from('resources')
    .select('*')
    .order('created_at', { ascending: false });

  if (filters?.category) {
    query = query.eq('category', filters.category);
  }

  if (filters?.resourceType) {
    query = query.eq('resource_type', filters.resourceType);
  }

  const { data, error } = await query;

  if (error) throw error;

  return data || [];
}

export async function getResource(resourceId: string): Promise<any | null> {
  const { data, error } = await supabase
    .from('resources')
    .select('*')
    .eq('id', resourceId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return data;
}

export async function updateResource(resourceId: string, updates: Partial<CreateResourceData>): Promise<any> {
  const updateData: any = {};

  if (updates.title) updateData.title = updates.title;
  if (updates.description !== undefined) updateData.description = updates.description || null;
  if (updates.category) updateData.category = updates.category;
  if (updates.resourceType) updateData.resource_type = updates.resourceType;
  if (updates.url !== undefined) updateData.url = updates.url || null;
  if (updates.filePath !== undefined) updateData.file_path = updates.filePath || null;
  if (updates.tags) updateData.tags = updates.tags;

  const { data, error } = await supabase
    .from('resources')
    .update(updateData)
    .eq('id', resourceId)
    .select()
    .single();

  if (error) throw error;

  return data;
}

export async function deleteResource(resourceId: string): Promise<void> {
  const { error } = await supabase
    .from('resources')
    .delete()
    .eq('id', resourceId);

  if (error) throw error;
}

// ============================================
// BADGE OPERATIONS
// ============================================

export interface CreateBadgeData {
  name: string;
  description: string;
  icon: string;
  color: string;
  category: 'check-in' | 'helping' | 'engagement' | 'achievement';
  criteria: any;
}

export async function createBadge(badgeData: CreateBadgeData): Promise<any> {
  const { data, error } = await supabase
    .from('badges')
    .insert({
      name: badgeData.name,
      description: badgeData.description,
      icon: badgeData.icon,
      color: badgeData.color,
      category: badgeData.category,
      criteria: badgeData.criteria,
    })
    .select()
    .single();

  if (error) throw error;

  return data;
}

export async function getBadges(): Promise<any[]> {
  const { data, error } = await supabase
    .from('badges')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) throw error;

  return data || [];
}

export async function getBadge(badgeId: string): Promise<any | null> {
  const { data, error } = await supabase
    .from('badges')
    .select('*')
    .eq('id', badgeId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return data;
}

export async function getUserBadges(userId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from('user_badges')
    .select('*, badges(*)')
    .eq('user_id', userId)
    .order('earned_at', { ascending: false });

  if (error) throw error;

  return (data || []).map((ub: any) => ({
    id: ub.id,
    userId: ub.user_id,
    badgeId: ub.badge_id,
    earnedAt: new Date(ub.earned_at),
    badge: ub.badges ? {
      id: ub.badges.id,
      name: ub.badges.name,
      description: ub.badges.description,
      icon: ub.badges.icon,
      color: ub.badges.color,
      category: ub.badges.category,
    } : null,
  }));
}

export async function createUserBadge(userBadgeData: { userId: string; badgeId: string }): Promise<any> {
  const { data, error } = await supabase
    .from('user_badges')
    .insert({
      user_id: userBadgeData.userId,
      badge_id: userBadgeData.badgeId,
    })
    .select()
    .single();

  if (error) throw error;

  return data;
}

// ============================================
// STREAK OPERATIONS
// ============================================

export interface CreateStreakData {
  userId: string;
  streakType: 'check-in' | 'helping' | 'engagement';
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: Date;
}

export async function createStreak(streakData: CreateStreakData): Promise<any> {
  const { data, error } = await supabase
    .from('streaks')
    .insert({
      user_id: streakData.userId,
      streak_type: streakData.streakType,
      current_streak: streakData.currentStreak,
      longest_streak: streakData.longestStreak,
      last_activity_date: streakData.lastActivityDate.toISOString().split('T')[0],
    })
    .select()
    .single();

  if (error) throw error;

  return data;
}

export async function getStreak(userId: string, streakType: 'check-in' | 'helping' | 'engagement'): Promise<any | null> {
  const { data, error } = await supabase
    .from('streaks')
    .select('*')
    .eq('user_id', userId)
    .eq('streak_type', streakType)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return {
    id: data.id,
    userId: data.user_id,
    streakType: data.streak_type,
    currentStreak: data.current_streak,
    longestStreak: data.longest_streak,
    lastActivityDate: new Date(data.last_activity_date),
    updatedAt: new Date(data.updated_at),
  };
}

export async function getUserStreaks(userId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from('streaks')
    .select('*')
    .eq('user_id', userId);

  if (error) throw error;

  return (data || []).map((s: any) => ({
    id: s.id,
    userId: s.user_id,
    streakType: s.streak_type,
    currentStreak: s.current_streak,
    longestStreak: s.longest_streak,
    lastActivityDate: new Date(s.last_activity_date),
    updatedAt: new Date(s.updated_at),
  }));
}

export async function updateStreak(streakId: string, updates: {
  currentStreak?: number;
  longestStreak?: number;
  lastActivityDate?: Date;
}): Promise<any> {
  const updateData: any = {};

  if (updates.currentStreak !== undefined) updateData.current_streak = updates.currentStreak;
  if (updates.longestStreak !== undefined) updateData.longest_streak = updates.longestStreak;
  if (updates.lastActivityDate) updateData.last_activity_date = updates.lastActivityDate.toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('streaks')
    .update(updateData)
    .eq('id', streakId)
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    userId: data.user_id,
    streakType: data.streak_type,
    currentStreak: data.current_streak,
    longestStreak: data.longest_streak,
    lastActivityDate: new Date(data.last_activity_date),
    updatedAt: new Date(data.updated_at),
  };
}

// ============================================
// MAPPING FUNCTIONS (DB -> App Types)
// ============================================

function mapUserFromDB(data: any): User {
  return {
    id: data.id,
    pseudonym: data.pseudonym,
    username: data.username || undefined,
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

function mapMeetingFromDB(data: any): Meeting {
  return {
    id: data.id,
    title: data.title,
    description: data.description || undefined,
    scheduledDate: new Date(data.scheduled_date),
    durationMinutes: data.duration_minutes || 30,
    location: data.location || undefined,
    meetingType: data.meeting_type,
    createdBy: data.created_by,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
  };
}

function mapAttendanceFromDB(data: any): MeetingAttendance {
  return {
    id: data.id,
    meetingId: data.meeting_id,
    userId: data.user_id,
    attended: data.attended,
    attendedAt: data.attended_at ? new Date(data.attended_at) : undefined,
    notes: data.notes || undefined,
  };
}

// ============================================
// TOPIC/STATISTICS OPERATIONS
// ============================================

export interface TopicStats {
  category: PostCategory;
  postCount: number;
  memberCount: number;
  onlineCount: number; // Estimated based on recent activity
  recentPostCount: number; // Posts in last 24 hours
}

/**
 * Get statistics for all topics/categories
 */
export async function getTopicStats(): Promise<TopicStats[]> {
  try {
    // Get post counts per category
    const { data: postCounts, error: postError } = await supabase
      .from('posts')
      .select('category, author_id, created_at')
      .eq('status', 'active');

    if (postError) throw postError;

    // Get unique authors per category (member count)
    const { data: allPosts, error: allPostsError } = await supabase
      .from('posts')
      .select('category, author_id, created_at')
      .eq('status', 'active');

    if (allPostsError) throw allPostsError;

    // Calculate stats per category
    const statsMap = new Map<PostCategory, {
      postCount: number;
      members: Set<string>;
      recentPosts: number;
      recentMembers: Set<string>;
    }>();

    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);

    (allPosts || []).forEach((post: any) => {
      const category = post.category as PostCategory;
      if (!statsMap.has(category)) {
        statsMap.set(category, {
          postCount: 0,
          members: new Set(),
          recentPosts: 0,
          recentMembers: new Set(),
        });
      }

      const stats = statsMap.get(category)!;
      stats.postCount++;
      stats.members.add(post.author_id);

      const postDate = new Date(post.created_at);
      if (postDate >= oneDayAgo) {
        stats.recentPosts++;
      }
      if (postDate >= oneHourAgo) {
        stats.recentMembers.add(post.author_id);
      }
    });

    // Convert to array format
    const stats: TopicStats[] = Array.from(statsMap.entries()).map(([category, data]) => ({
      category,
      postCount: data.postCount,
      memberCount: data.members.size,
      onlineCount: data.recentMembers.size, // Users active in last hour
      recentPostCount: data.recentPosts,
    }));

    // Add categories with zero posts
    const allCategories: PostCategory[] = [
      'mental-health', 'crisis', 'substance-abuse', 'sexual-health',
      'stis-hiv', 'family-home', 'academic', 'social', 'relationships',
      'campus', 'general'
    ];

    allCategories.forEach(category => {
      if (!stats.find(s => s.category === category)) {
        stats.push({
          category,
          postCount: 0,
          memberCount: 0,
          onlineCount: 0,
          recentPostCount: 0,
        });
      }
    });

    return stats;
  } catch (error) {
    console.error('Error getting topic stats:', error);
    return [];
  }
}

/**
 * Get trending posts based on engagement (upvotes, replies, recency)
 */
export async function getTrendingPosts(category?: PostCategory, limit: number = 20): Promise<Post[]> {
  try {
    let query = supabase
      .from('posts')
      .select(`
        *,
        users!posts_author_id_fkey(pseudonym)
      `)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query.limit(limit * 2); // Get more to calculate trending

    if (error) throw error;

    // Get replies for each post to calculate engagement
    const postsWithReplies = await Promise.all(
      (data || []).map(async (post: any) => {
        const authorPseudonym = post.users?.pseudonym || 'Anonymous';
        const mappedPost = await mapPostFromDB(post, authorPseudonym);
        const replies = await getReplies(mappedPost.id);
        return { ...mappedPost, replies };
      })
    );

    // Calculate trending score: (upvotes * 2 + replies * 3) / hours_since_creation
    const now = new Date();
    const trendingPosts = postsWithReplies
      .map(post => {
        const hoursSinceCreation = (now.getTime() - new Date(post.createdAt).getTime()) / (1000 * 60 * 60);
        const engagementScore = (post.upvotes * 2 + post.replies.length * 3) / Math.max(hoursSinceCreation, 1);
        return { ...post, trendingScore: engagementScore };
      })
      .sort((a, b) => b.trendingScore - a.trendingScore)
      .slice(0, limit)
      .map(({ trendingScore, ...post }) => post);

    return trendingPosts;
  } catch (error) {
    console.error('Error getting trending posts:', error);
    return [];
  }
}

/**
 * Get unanswered posts (posts with no replies)
 */
export async function getUnansweredPosts(category?: PostCategory, limit: number = 20): Promise<Post[]> {
  try {
    let query = supabase
      .from('posts')
      .select(`
        *,
        users!posts_author_id_fkey(pseudonym)
      `)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query.limit(limit * 3); // Get more to filter

    if (error) throw error;

    // Filter posts with no replies
    const postsWithReplies = await Promise.all(
      (data || []).map(async (post: any) => {
        const authorPseudonym = post.users?.pseudonym || 'Anonymous';
        const mappedPost = await mapPostFromDB(post, authorPseudonym);
        const replies = await getReplies(mappedPost.id);
        return { ...mappedPost, replies };
      })
    );

    const unanswered = postsWithReplies
      .filter(post => post.replies.length === 0)
      .slice(0, limit);

    return unanswered;
  } catch (error) {
    console.error('Error getting unanswered posts:', error);
    return [];
  }
}

