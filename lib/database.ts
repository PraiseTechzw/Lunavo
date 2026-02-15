/**
 * Database utility functions for Supabase
 * All database operations go through these functions
 */

import { CATEGORIES } from "@/app/constants/categories";
import {
  ActivityLog,
  Announcement,
  Category,
  CheckIn,
  Escalation,
  EscalationLevel,
  Meeting,
  MeetingAttendance,
  MeetingType,
  Notification,
  NotificationType,
  Post,
  PostCategory,
  PostStatus,
  Reply,
  Report,
  SupportMessage,
  SupportSession,
  User,
} from "@/app/types";
import { sendEmailWithResend } from "./email";
import { checkAllBadges } from "./gamification";
import { sendPushNotification } from "./notifications";
import { awardPostCreatedPoints, awardReplyPoints } from "./points-system";
import { supabase } from "./supabase";

// ============================================
// USER OPERATIONS
// ============================================

// ============================================

export interface TopicStats {
  category: PostCategory;
  memberCount: number;
  recentPostCount: number;
  categoryDetails?: Category;
}

export async function createCategory(category: Category): Promise<void> {
  const { error } = await supabase.from("categories").insert([
    {
      slug: category.id,
      name: category.name,
      description: category.description,
      icon: category.icon,
      color: category.color,
    },
  ]);

  if (error) {
    console.error("Error creating category:", error);
    throw error;
  }
}

export async function getCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("name");

  if (error) {
    console.error("Error fetching categories:", error);
    return Object.values(CATEGORIES);
  }

  return data.map((cat) => ({
    id: cat.slug as PostCategory,
    name: cat.name,
    description: cat.description,
    icon: cat.icon,
    color: cat.color,
  }));
}

export async function getTopicStats(): Promise<TopicStats[]> {
  try {
    const dbCategories = await getCategories();
    const stats: TopicStats[] = [];

    // Calculate stats for each category
    const { data: posts } = await supabase
      .from("posts")
      .select("category, created_at, author_id")
      .gte(
        "created_at",
        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      ); // Last 7 days

    const { data: allPosts } = await supabase
      .from("posts")
      .select("category, author_id");

    for (const category of dbCategories) {
      // Recent posts
      const recentCount =
        posts?.filter((p) => p.category === category.id).length || 0;

      // Member count (unique authors)
      const uniqueAuthors = new Set(
        allPosts
          ?.filter((p) => p.category === category.id)
          .map((p) => p.author_id),
      );
      const memberCount = uniqueAuthors.size || 0;

      stats.push({
        category: category.id,
        memberCount: memberCount,
        recentPostCount: recentCount,
        categoryDetails: category,
      });
    }

    return stats;
  } catch (error) {
    console.error("Error fetching topic stats:", error);
    return [];
  }
}

export interface CreateUserData {
  email: string;
  username?: string; // Anonymous username
  full_name: string; // Real name
  student_number: string; // Required - CUT format: Letter + 8 digits + Letter (e.g., C23155538O)
  program?: string; // e.g. BSc Computer Science
  academic_year?: number; // 1-5
  academic_semester?: number; // 1-2
  phone: string; // Required for crisis contact
  emergency_contact_name: string; // Required for crisis contact
  emergency_contact_phone: string; // Required for crisis contact
  location?: string; // Optional but recommended
  preferred_contact_method?: "phone" | "sms" | "email" | "in-person"; // Optional
  role?:
  | "student"
  | "peer-educator"
  | "peer-educator-executive"
  | "moderator"
  | "counselor"
  | "life-coach"
  | "student-affairs"
  | "admin";
  pseudonym: string;
  profile_data?: Record<string, any>;
}

export async function createUser(
  userData: CreateUserData,
  authUserId?: string,
): Promise<User> {
  // Get the current authenticated user's ID from Supabase Auth
  // If authUserId is provided (from signUp), use it directly
  let userId = authUserId;

  if (!userId) {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    if (!authUser) {
      throw new Error("User must be authenticated to create user record");
    }
    userId = authUser.id;
  }

  const { data, error } = await supabase
    .from("users")
    .insert({
      id: userId, // Use the auth user's ID
      email: userData.email,
      username: userData.username || null, // Anonymous username
      full_name: userData.full_name,
      student_number: userData.student_number, // Required
      program: userData.program,
      academic_year: userData.academic_year,
      academic_semester: userData.academic_semester,
      academic_updated_at: new Date().toISOString(),
      phone: userData.phone, // Required for crisis contact
      emergency_contact_name: userData.emergency_contact_name, // Required
      emergency_contact_phone: userData.emergency_contact_phone, // Required
      location: userData.location || null, // Optional
      preferred_contact_method: userData.preferred_contact_method || null, // Optional
      role: userData.role || "student",
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
    .from("users")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null; // Not found
    throw error;
  }

  return mapUserFromDB(data);
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("email", email)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }

  return mapUserFromDB(data);
}

export async function getUserByUsername(
  username: string,
): Promise<User | null> {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("username", username.toLowerCase().trim())
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }

  return mapUserFromDB(data);
}

/**
 * Check if username is available (real-time)
 * Uses a database function to bypass RLS and avoid infinite recursion
 */
export async function checkUsernameAvailability(
  username: string,
): Promise<boolean> {
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
    const { data, error } = await supabase.rpc("check_username_available", {
      check_username: normalizedUsername,
    });

    if (error) {
      // PGRST202 means function not found.
      if (error.code === "PGRST202") {
        console.warn(
          "[Supabase] check_username_available RPC not found, falling back to direct query.",
        );
        const { data: queryData, error: queryError } = await supabase
          .from("users")
          .select("id")
          .eq("username", normalizedUsername)
          .maybeSingle();

        if (queryError && queryError.code !== "PGRST116") {
          throw queryError;
        }

        return !queryData;
      }

      throw error;
    }

    return data === true;
  } catch (error: any) {
    if (error.message?.includes("Network request failed")) {
      console.error(
        "[Supabase] Connection error during username check. Please verify your internet.",
      );
    } else {
      console.error("[Supabase] Error checking username availability:", error);
    }
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
    const { data, error } = await supabase.rpc("check_email_available", {
      check_email: normalizedEmail,
    });

    if (error) {
      // PGRST202 means function not found. We only warn and fallback in this case.
      if (error.code === "PGRST202") {
        console.warn(
          "[Supabase] check_email_available RPC not found, falling back to direct query.",
        );
        const { data: queryData, error: queryError } = await supabase
          .from("users")
          .select("id")
          .eq("email", normalizedEmail)
          .maybeSingle();

        if (queryError && queryError.code !== "PGRST116") {
          throw queryError;
        }
        return !queryData;
      }

      // For any other error (like network failure), throw it to be caught by the catch block
      throw error;
    }

    return data === true;
  } catch (error: any) {
    // If it's a network error, log it specifically
    if (error.message?.includes("Network request failed")) {
      console.error(
        "[Supabase] Connection error during email check. Please verify your internet or Supabase URL.",
      );
    } else {
      console.error("[Supabase] Error checking email availability:", error);
    }
    // On error, assume taken to be safe to prevent duplicate registrations
    return false;
  }
}

/**
 * Check if student ID is available (not already in use by another user)
 */
export async function checkStudentIdAvailability(
  studentId: string,
): Promise<boolean> {
  if (!studentId || !studentId.trim()) {
    return false;
  }

  const normalizedId = studentId.toUpperCase().trim();

  try {
    const { data, error } = await supabase.rpc("check_student_id_available", {
      check_id: normalizedId,
    });

    if (error) {
      if (error.code === "PGRST202") {
        console.warn(
          "[Supabase] check_student_id_available RPC not found, falling back.",
        );
        const { data: queryData, error: queryError } = await supabase
          .from("users")
          .select("id")
          .eq("student_number", normalizedId)
          .maybeSingle();

        if (queryError && queryError.code !== "PGRST116") throw queryError;
        return !queryData;
      }
      throw error;
    }

    return data === true;
  } catch (error: any) {
    console.error("[Supabase] Error checking student ID availability:", error);
    return false;
  }
}

export async function updateUser(
  userId: string,
  updates: Partial<User>,
): Promise<User> {
  const updateData: any = {
    last_active: new Date().toISOString(),
  };

  if (updates.pseudonym !== undefined) updateData.pseudonym = updates.pseudonym;
  if (updates.fullName !== undefined) updateData.full_name = updates.fullName;
  if (updates.username !== undefined) updateData.username = updates.username;
  if (updates.isAnonymous !== undefined)
    updateData.is_anonymous = updates.isAnonymous;
  if (updates.program !== undefined) updateData.program = updates.program;
  if (updates.academicYear !== undefined)
    updateData.academic_year = updates.academicYear;
  if (updates.academicSemester !== undefined)
    updateData.academic_semester = updates.academicSemester;
  if (updates.studentNumber !== undefined)
    updateData.student_number = updates.studentNumber;
  if (updates.phone !== undefined) updateData.phone = updates.phone;
  if (updates.emergencyContactName !== undefined)
    updateData.emergency_contact_name = updates.emergencyContactName;
  if (updates.emergencyContactPhone !== undefined)
    updateData.emergency_contact_phone = updates.emergencyContactPhone;
  if (updates.location !== undefined) updateData.location = updates.location;
  if (updates.preferredContactMethod !== undefined)
    updateData.preferred_contact_method = updates.preferredContactMethod;
  if (updates.bio !== undefined) updateData.bio = updates.bio;
  if (updates.specialization !== undefined)
    updateData.specialization = updates.specialization;
  if (updates.interests !== undefined) updateData.interests = updates.interests;
  if (updates.avatarUrl !== undefined)
    updateData.avatar_url = updates.avatarUrl;
  if (updates.profile_data !== undefined)
    updateData.profile_data = updates.profile_data;

  const { data, error } = await supabase
    .from("users")
    .update(updateData)
    .eq("id", userId)
    .select()
    .single();

  if (error) throw error;

  return mapUserFromDB(data);
}

export async function getCurrentUser(): Promise<User | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  return getUser(user.id);
}

export async function getUsers(limit?: number): Promise<User[]> {
  let query = supabase
    .from("users")
    .select("*")
    .order("created_at", { ascending: false });

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error) throw error;

  return (data || []).map(mapUserFromDB);
}

export async function getCounsellingProviders(): Promise<User[]> {
  const { data, error } = await supabase
    .from("users")
    .select(
      "id,email,pseudonym,username,is_anonymous,role,full_name,specialization,bio,interests,avatar_url,created_at,last_active,profile_data",
    )
    .in("role", ["life-coach", "peer-educator-executive"])
    .order("full_name", { ascending: true });

  if (error) throw error;

  return (data || []).map(mapUserFromDB);
}

export async function getUserCount(): Promise<number> {
  const { count, error } = await supabase
    .from("users")
    .select("*", { count: "exact", head: true });

  if (error) throw error;
  return count || 0;
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
  let escalationLevel = postData.escalationLevel || "none";
  let escalationReason = postData.escalationReason;

  if (!postData.escalationLevel || postData.escalationLevel === "none") {
    try {
      const { detectEscalationLevel } = await import("./escalation-detection");
      const tempPost: Post = {
        id: "temp",
        authorId: postData.authorId,
        authorPseudonym: "temp",
        category: postData.category,
        title: postData.title,
        content: postData.content,
        status: "active",
        escalationLevel: "none",
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
      if (escalation.level !== "none" && escalation.confidence >= 0.5) {
        escalationLevel = escalation.level;
        escalationReason = escalation.reason;
      }
    } catch (error) {
      console.error("Error detecting escalation:", error);
      // Continue with post creation even if detection fails
    }
  }

  const { data, error } = await supabase
    .from("posts")
    .insert({
      author_id: postData.authorId,
      category: postData.category,
      title: postData.title,
      content: postData.content,
      is_anonymous: postData.isAnonymous,
      tags: postData.tags || [],
      status: escalationLevel !== "none" ? "escalated" : "active",
      escalation_level: escalationLevel,
      escalation_reason: escalationReason || null,
      is_flagged: escalationLevel !== "none",
    })
    .select()
    .maybeSingle();

  if (error) {
    console.error("[Database] Error creating post:", error);
    throw error;
  }

  // Get author pseudonym
  const author = await getUser(postData.authorId);
  const authorName = author?.pseudonym || "Anonymous";

  if (!data) {
    console.warn(
      "[Database] Post created but select returned no rows. Constructing fallback.",
    );
    const fallbackPost: Post = {
      id: `tmp-${Date.now()}`,
      authorId: postData.authorId,
      authorPseudonym: authorName,
      category: postData.category,
      title: postData.title,
      content: postData.content,
      isAnonymous: postData.isAnonymous,
      tags: postData.tags || [],
      status: escalationLevel !== "none" ? "escalated" : "active",
      escalationLevel: escalationLevel,
      escalationReason: escalationReason || undefined,
      isFlagged: escalationLevel !== "none",
      upvotes: 0,
      replies: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      reportedCount: 0,
    };

    // Create escalation record if needed (we won't have the real postId here though, which is problematic)
    // In a real scenario, this fallback is a last resort.
    return fallbackPost;
  }

  const post = await mapPostFromDB(data, authorName);

  // Create escalation record if needed
  if (escalationLevel !== "none") {
    try {
      await createEscalation({
        postId: post.id,
        level: escalationLevel,
        reason: escalationReason || "Auto-detected",
      });
    } catch (escalationError) {
      console.error("Error creating escalation:", escalationError);
      // Don't fail post creation if escalation fails
    }
  }

  // Award points for creating post
  try {
    await awardPostCreatedPoints(postData.authorId);
    await checkAllBadges(postData.authorId);
  } catch (pointsError) {
    console.error("Error awarding points:", pointsError);
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
    .from("posts")
    .select(
      `
      *,
      users!posts_author_id_fkey(pseudonym)
    `,
    )
    .order("created_at", { ascending: false });

  if (filters?.category) {
    query = query.eq("category", filters.category);
  }

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }

  if (filters?.authorId) {
    query = query.eq("author_id", filters.authorId);
  }

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  if (filters?.offset) {
    query = query.range(
      filters.offset,
      filters.offset + (filters.limit || 10) - 1,
    );
  }

  const { data, error } = await query;

  if (error) throw error;

  // Get replies for each post
  const posts = await Promise.all(
    (data || []).map(async (post: any) => {
      const authorPseudonym = post.users?.pseudonym || "Anonymous";
      const mappedPost = await mapPostFromDB(post, authorPseudonym);
      const replies = await getReplies(mappedPost.id);
      return { ...mappedPost, replies };
    }),
  );

  return posts;
}

export async function getPost(postId: string): Promise<Post | null> {
  const { data, error } = await supabase
    .from("posts")
    .select(
      `
      *,
      users!posts_author_id_fkey(pseudonym)
    `,
    )
    .eq("id", postId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }

  const authorPseudonym = data.users?.pseudonym || "Anonymous";
  const post = await mapPostFromDB(data, authorPseudonym);
  const replies = await getReplies(post.id);

  return { ...post, replies };
}

export async function updatePost(
  postId: string,
  updates: Partial<Post>,
): Promise<Post> {
  const { data, error } = await supabase
    .from("posts")
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
    .eq("id", postId)
    .select()
    .maybeSingle();

  if (error) {
    console.error("[Database] Error updating post:", error);
    throw error;
  }

  if (!data) {
    // If we can't select the row back, it's likely because of RLS
    // (e.g., trying to update a post you don't own)
    const existing = await getPost(postId);
    if (!existing) throw new Error("Post not found or unauthorized to update");
    return existing;
  }

  const author = await getUser(data.author_id);
  return await mapPostFromDB(data, author?.pseudonym || "Anonymous");
}

export async function deletePost(postId: string): Promise<void> {
  const { error } = await supabase.from("posts").delete().eq("id", postId);

  if (error) throw error;
}

export async function hasUserLikedPost(
  userId: string,
  postId: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from("post_likes")
    .select("id")
    .eq("post_id", postId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("Error checking post like:", error);
    return false;
  }

  return !!data;
}

export async function togglePostLike(
  userId: string,
  postId: string,
): Promise<{ liked: boolean; count: number }> {
  // Check if already liked
  const liked = await hasUserLikedPost(userId, postId);
  let newCount = 0;

  if (liked) {
    // Unlike
    const { error: deleteError } = await supabase
      .from("post_likes")
      .delete()
      .eq("post_id", postId)
      .eq("user_id", userId);

    if (deleteError) throw deleteError;

    // Decrement count manually (fallback if trigger doesn't exist)
    // We fetch clean count to be sure
    const post = await getPost(postId);
    if (post) {
      newCount = Math.max(0, post.upvotes - 1);
      await supabase.from("posts").update({ upvotes: newCount }).eq("id", postId);
    }

    return { liked: false, count: newCount };
  } else {
    // Like
    const { error: insertError } = await supabase
      .from("post_likes")
      .insert({ post_id: postId, user_id: userId });

    if (insertError) throw insertError;

    // Increment count manually (fallback)
    const post = await getPost(postId);
    if (post) {
      newCount = post.upvotes + 1;
      await supabase.from("posts").update({ upvotes: newCount }).eq("id", postId);
    }

    return { liked: true, count: newCount };
  }
}

// Deprecated: use togglePostLike instead
export async function upvotePost(postId: string): Promise<number> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Must be logged in");

  const { count } = await togglePostLike(user.id, postId);
  return count;
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
    .from("replies")
    .insert({
      post_id: replyData.postId,
      author_id: replyData.authorId,
      content: replyData.content,
      is_anonymous: replyData.isAnonymous,
      is_from_volunteer: replyData.isFromVolunteer || false,
    })
    .select()
    .maybeSingle();

  if (error) {
    console.error("[Database] Error creating reply:", error);
    throw error;
  }

  const author = await getUser(replyData.authorId);
  const authorPseudonym = author?.pseudonym || "Anonymous";

  if (!data) {
    console.warn(
      "[Database] Reply created but select returned no rows. Constructing fallback.",
    );
    // Construct a fallback reply object since the record was created but RLS prevents immediate selection
    return {
      id: `tmp-${Date.now()}`,
      postId: replyData.postId,
      authorId: replyData.authorId,
      authorPseudonym,
      content: replyData.content,
      isAnonymous: replyData.isAnonymous,
      isHelpful: 0,
      isFromVolunteer: replyData.isFromVolunteer || false,
      createdAt: new Date(),
      updatedAt: new Date(),
      reportedCount: 0,
    };
  }

  const reply = mapReplyFromDB(data, authorPseudonym);

  // Award points for reply
  try {
    await awardReplyPoints(replyData.authorId);
    await checkAllBadges(replyData.authorId);
  } catch (pointsError) {
    console.error("Error awarding points:", pointsError);
  }

  // Send push notification to post author
  try {
    const post = await getPost(replyData.postId);
    if (post && post.authorId !== replyData.authorId) {
      const author = await getUser(post.authorId);
      const replier = await getUser(replyData.authorId);
      const replierName = replier?.pseudonym || "Someone";

      // Use profile_data.pushToken
      // Since getUser returns mapped User object, we need to check if we expose pushToken
      // It is in profileData (mapped from profile_data)
      const pushToken = author?.profileData?.pushToken;

      if (pushToken) {
        await sendPushNotification(
          pushToken,
          "New Reply",
          `${replierName} replied to your post: "${post.title.substring(0, 20)}..."`,
          { postId: post.id }
        );
      }

      // Send email notification if user has email
      if (author?.email) {
        await sendEmailWithResend({
          to: author.email,
          subject: "New Reply to your Post",
          html: `
             <h1>New Reply on PEACE</h1>
             <p>${replierName} replied to your post "<b>${post.title}</b>":</p>
             <blockquote style="border-left: 4px solid #ccc; padding-left: 10px; margin-left: 0;">
               ${replyData.content.substring(0, 200)}${replyData.content.length > 200 ? "..." : ""}
             </blockquote>
             <p>Open the app to view the full reply.</p>
           `,
          text: `${replierName} replied to your post "${post.title}": ${replyData.content.substring(0, 100)}...`
        });
      }
    }
  } catch (notifyError) {
    console.error("Error sending notification:", notifyError);
  }

  return reply;
}

export async function getReplies(
  postIdOrFilters?: string | { postId?: string; authorId?: string },
): Promise<Reply[]> {
  let query = supabase
    .from("replies")
    .select(
      `
      *,
      users!replies_author_id_fkey(pseudonym)
    `,
    )
    .order("created_at", { ascending: true });

  const postId =
    typeof postIdOrFilters === "string"
      ? postIdOrFilters
      : postIdOrFilters?.postId;
  const authorId =
    typeof postIdOrFilters === "object"
      ? postIdOrFilters?.authorId
      : undefined;

  if (postId) {
    query = query.eq("post_id", postId);
  }

  if (authorId) {
    query = query.eq("author_id", authorId);
  }

  const { data, error } = await query;

  if (error) throw error;

  return (data || []).map((reply: any) => {
    const authorPseudonym = reply.users?.pseudonym || "Anonymous";
    return mapReplyFromDB(reply, authorPseudonym);
  });
}

export async function updateReply(
  replyId: string,
  updates: Partial<Reply>,
): Promise<Reply> {
  const { data, error } = await supabase
    .from("replies")
    .update({
      content: updates.content,
      is_helpful: updates.isHelpful,
      reported_count: updates.reportedCount,
    })
    .eq("id", replyId)
    .select()
    .single();

  if (error) throw error;

  const author = await getUser(data.author_id);
  return mapReplyFromDB(data, author?.pseudonym || "Anonymous");
}

export async function deleteReply(replyId: string): Promise<void> {
  const { error } = await supabase.from("replies").delete().eq("id", replyId);

  if (error) throw error;
}

export async function markReplyHelpful(replyId: string): Promise<number> {
  const reply = await supabase
    .from("replies")
    .select("is_helpful")
    .eq("id", replyId)
    .single();

  if (reply.error) throw reply.error;

  const newHelpful = (reply.data.is_helpful || 0) + 1;

  await supabase
    .from("replies")
    .update({ is_helpful: newHelpful })
    .eq("id", replyId);

  return newHelpful;
}

// ============================================
// REPORT OPERATIONS
// ============================================

export interface CreateReportData {
  targetType: "post" | "reply" | "user";
  targetId: string;
  reporterId: string;
  reason: string;
  description?: string;
}

export async function createReport(
  reportData: CreateReportData,
): Promise<Report> {
  const { data, error } = await supabase
    .from("reports")
    .insert({
      target_type: reportData.targetType,
      target_id: reportData.targetId,
      reporter_id: reportData.reporterId,
      reason: reportData.reason,
      description: reportData.description || null,
      status: "pending",
    })
    .select()
    .single();

  if (error) throw error;

  return mapReportFromDB(data);
}

export async function getReports(filters?: {
  status?: "pending" | "reviewed" | "resolved" | "dismissed";
  reporterId?: string;
}): Promise<Report[]> {
  let query = supabase
    .from("reports")
    .select("*")
    .order("created_at", { ascending: false });

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }

  if (filters?.reporterId) {
    query = query.eq("reporter_id", filters.reporterId);
  }

  const { data, error } = await query;

  if (error) throw error;

  return (data || []).map(mapReportFromDB);
}

export async function updateReport(
  reportId: string,
  updates: Partial<Report>,
): Promise<Report> {
  const { data, error } = await supabase
    .from("reports")
    .update({
      status: updates.status,
      reviewed_at: updates.reviewedAt
        ? new Date(updates.reviewedAt).toISOString()
        : null,
      reviewed_by: updates.reviewedBy || null,
    })
    .eq("id", reportId)
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

export async function createEscalation(
  escalationData: CreateEscalationData,
): Promise<Escalation> {
  const { data, error } = await supabase
    .from("escalations")
    .insert({
      post_id: escalationData.postId,
      level: escalationData.level,
      reason: escalationData.reason,
      assigned_to: escalationData.assignedTo || null,
      status: "pending",
    })
    .select()
    .single();

  if (error) throw error;

  return mapEscalationFromDB(data);
}

export async function getEscalations(filters?: {
  status?: "pending" | "in-progress" | "resolved" | "dismissed";
  assignedTo?: string;
  level?: EscalationLevel;
}): Promise<Escalation[]> {
  let query = supabase
    .from("escalations")
    .select("*")
    .order("detected_at", { ascending: false });

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }

  if (filters?.assignedTo) {
    query = query.eq("assigned_to", filters.assignedTo);
  }

  if (filters?.level) {
    query = query.eq("level", filters.level);
  }

  const { data, error } = await query;

  if (error) throw error;

  return (data || []).map(mapEscalationFromDB);
}

export async function updateEscalation(
  escalationId: string,
  updates: Partial<Escalation>,
): Promise<Escalation> {
  const updateData: any = {};

  if (updates.status) updateData.status = updates.status;
  if (updates.assignedTo !== undefined)
    updateData.assigned_to = updates.assignedTo || null;
  if (updates.resolvedAt)
    updateData.resolved_at = updates.resolvedAt.toISOString();
  if (updates.notes !== undefined) updateData.notes = updates.notes || null;

  const { data, error } = await supabase
    .from("escalations")
    .update(updateData)
    .eq("id", escalationId)
    .select()
    .single();

  if (error) throw error;

  return mapEscalationFromDB(data);
}

export async function getEscalationById(
  escalationId: string,
): Promise<Escalation | null> {
  const { data, error } = await supabase
    .from("escalations")
    .select("*")
    .eq("id", escalationId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
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

export async function createCheckIn(
  checkInData: CreateCheckInData,
): Promise<CheckIn> {
  const { data, error } = await supabase
    .from("check_ins")
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
    if (error.code === "23505") {
      const { data: updated, error: updateError } = await supabase
        .from("check_ins")
        .update({
          mood: checkInData.mood,
          feeling_strength: checkInData.feelingStrength || null,
          note: checkInData.note || null,
        })
        .eq("user_id", checkInData.userId)
        .eq("date", checkInData.date)
        .select()
        .single();

      if (updateError) throw updateError;
      return mapCheckInFromDB(updated);
    }
    throw error;
  }

  return mapCheckInFromDB(data);
}

export async function getCheckIns(
  userId: string,
  limit?: number,
): Promise<CheckIn[]> {
  let query = supabase
    .from("check_ins")
    .select("*")
    .eq("user_id", userId)
    .order("date", { ascending: false });

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error) throw error;

  return (data || []).map(mapCheckInFromDB);
}

export async function hasCheckedInToday(userId: string): Promise<boolean> {
  const today = new Date().toISOString().split("T")[0];
  const { data, error } = await supabase
    .from("check_ins")
    .select("id")
    .eq("user_id", userId)
    .eq("date", today)
    .single();

  if (error && error.code === "PGRST116") return false;
  if (error) throw error;

  return !!data;
}

export async function getCheckInStreak(userId: string): Promise<number> {
  // This is a simplified version - you might want to implement a more sophisticated streak calculation
  const { data, error } = await supabase
    .from("streaks")
    .select("current_streak")
    .eq("user_id", userId)
    .eq("streak_type", "check-in")
    .single();

  if (error && error.code === "PGRST116") return 0;
  if (error) throw error;

  return data?.current_streak || 0;
}

// ============================================
// ANALYTICS OPERATIONS
// ============================================

export async function getAnalytics(): Promise<any> {
  // Get total posts
  const { count: totalPosts } = await supabase
    .from("posts")
    .select("*", { count: "exact", head: true });

  // Get posts by category
  const { data: postsByCategory } = await supabase
    .from("posts")
    .select("category");

  const categoryCounts: Record<string, number> = {};
  postsByCategory?.forEach((post: any) => {
    categoryCounts[post.category] = (categoryCounts[post.category] || 0) + 1;
  });

  // Get escalation count
  const { count: escalationCount } = await supabase
    .from("escalations")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending");

  // Get active users (users active in last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const { count: activeUsers } = await supabase
    .from("users")
    .select("*", { count: "exact", head: true })
    .gte("last_active", thirtyDaysAgo.toISOString());

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

export async function getNotifications(
  userId: string,
  filters?: { read?: boolean },
): Promise<Notification[]> {
  let query = supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (filters?.read !== undefined) {
    query = query.eq("read", filters.read);
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

export async function createNotification(
  notification: Partial<Notification>,
): Promise<Notification> {
  const { data, error } = await supabase
    .from("notifications")
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

export async function markNotificationAsRead(
  notificationId: string,
): Promise<Notification> {
  const { data, error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("id", notificationId)
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

export async function markAllNotificationsAsRead(
  userId: string,
): Promise<void> {
  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("user_id", userId)
    .eq("read", false);

  if (error) throw error;
}

export async function deleteNotification(
  notificationId: string,
): Promise<void> {
  const { error } = await supabase
    .from("notifications")
    .delete()
    .eq("id", notificationId);

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

export async function createMeeting(
  meetingData: CreateMeetingData,
): Promise<Meeting> {
  const { data, error } = await supabase
    .from("meetings")
    .insert({
      title: meetingData.title,
      description: meetingData.description || null,
      scheduled_date: meetingData.scheduledDate.toISOString(),
      duration_minutes: meetingData.durationMinutes || 30,
      location: meetingData.location || null,
      meeting_type: meetingData.meetingType || "weekly",
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
    .from("meetings")
    .select("*")
    .order("scheduled_date", { ascending: true });

  if (filters?.meetingType) {
    query = query.eq("meeting_type", filters.meetingType);
  }

  if (filters?.upcoming) {
    query = query.gte("scheduled_date", new Date().toISOString());
  }

  if (filters?.past) {
    query = query.lt("scheduled_date", new Date().toISOString());
  }

  const { data, error } = await query;

  if (error) throw error;

  return (data || []).map(mapMeetingFromDB);
}

export async function getMeeting(meetingId: string): Promise<Meeting | null> {
  const { data, error } = await supabase
    .from("meetings")
    .select("*")
    .eq("id", meetingId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }

  return mapMeetingFromDB(data);
}

export async function updateMeeting(
  meetingId: string,
  updates: Partial<Meeting>,
): Promise<Meeting> {
  const updateData: any = {};

  if (updates.title) updateData.title = updates.title;
  if (updates.description !== undefined)
    updateData.description = updates.description || null;
  if (updates.scheduledDate)
    updateData.scheduled_date = updates.scheduledDate.toISOString();
  if (updates.durationMinutes)
    updateData.duration_minutes = updates.durationMinutes;
  if (updates.location !== undefined)
    updateData.location = updates.location || null;
  if (updates.meetingType) updateData.meeting_type = updates.meetingType;

  const { data, error } = await supabase
    .from("meetings")
    .update(updateData)
    .eq("id", meetingId)
    .select()
    .single();

  if (error) throw error;

  return mapMeetingFromDB(data);
}

export async function deleteMeeting(meetingId: string): Promise<void> {
  const { error } = await supabase
    .from("meetings")
    .delete()
    .eq("id", meetingId);

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

export async function createOrUpdateAttendance(
  attendanceData: CreateAttendanceData,
): Promise<MeetingAttendance> {
  const { data, error } = await supabase
    .from("meeting_attendance")
    .upsert(
      {
        meeting_id: attendanceData.meetingId,
        user_id: attendanceData.userId,
        attended: attendanceData.attended,
        attended_at: attendanceData.attended ? new Date().toISOString() : null,
        notes: attendanceData.notes || null,
      },
      {
        onConflict: "meeting_id,user_id",
      },
    )
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
        const { updateEngagementStreakFromMeeting } =
          await import("./gamification");
        await updateEngagementStreakFromMeeting(
          attendanceData.userId,
          meeting.scheduledDate,
        );

        // Award points for meeting attendance
        const { awardMeetingAttendancePoints } =
          await import("./points-system");
        await awardMeetingAttendancePoints(attendanceData.userId);
      }
    } catch (error) {
      console.error(
        "Error updating streak/points from meeting attendance:",
        error,
      );
    }
  }

  return result;
}

export async function getMeetingAttendance(
  meetingId: string,
): Promise<MeetingAttendance[]> {
  const { data, error } = await supabase
    .from("meeting_attendance")
    .select("*")
    .eq("meeting_id", meetingId);

  if (error) throw error;

  return (data || []).map(mapAttendanceFromDB);
}

export async function getUserAttendance(
  userId: string,
): Promise<MeetingAttendance[]> {
  const { data, error } = await supabase
    .from("meeting_attendance")
    .select("*")
    .eq("user_id", userId)
    .order("attended_at", { ascending: false });

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
  resourceType:
  | "article"
  | "video"
  | "pdf"
  | "link"
  | "training"
  | "image"
  | "tool";
  url?: string;
  filePath?: string;
  tags?: string[];
  createdBy: string;
}

export async function createResource(
  resourceData: CreateResourceData,
): Promise<any> {
  const { data, error } = await supabase
    .from("resources")
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
  resourceType?: "article" | "video" | "pdf" | "link" | "training" | "image";
}): Promise<any[]> {
  let query = supabase
    .from("resources")
    .select("*")
    .order("created_at", { ascending: false });

  if (filters?.category) {
    query = query.eq("category", filters.category);
  }

  if (filters?.resourceType) {
    query = query.eq("resource_type", filters.resourceType);
  }

  const { data, error } = await query;

  if (error) throw error;

  return data || [];
}

export async function getResourceStats(): Promise<Record<string, number>> {
  const { data, error } = await supabase.from("resources").select("category");

  if (error) throw error;

  const stats: Record<string, number> = {};
  (data || []).forEach((r: any) => {
    stats[r.category] = (stats[r.category] || 0) + 1;
  });

  return stats;
}

export async function getResource(resourceId: string): Promise<any | null> {
  const { data, error } = await supabase
    .from("resources")
    .select("*")
    .eq("id", resourceId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }

  return data;
}

export async function incrementResourceViews(
  resourceId: string,
): Promise<void> {
  try {
    const { error } = await supabase.rpc("increment_resource_views", {
      resource_id: resourceId,
    });

    if (!error) return;

    // Fallback if RPC fails
    const { data: resource, error: fetchError } = await supabase
      .from("resources")
      .select("views")
      .eq("id", resourceId)
      .single();

    if (fetchError || !resource) return;

    await supabase
      .from("resources")
      .update({ views: (resource.views || 0) + 1 })
      .eq("id", resourceId);
  } catch (e) {
    console.log("Error incrementing views:", e);
  }
}

export async function addResourceRating(
  resourceId: string,
  userId: string,
  rating: number,
): Promise<void> {
  // Store individual rating
  const { error: ratingError } = await supabase.from("resource_ratings").upsert(
    {
      resource_id: resourceId,
      user_id: userId,
      rating: rating,
      created_at: new Date().toISOString(),
    },
    {
      onConflict: "resource_id,user_id",
    },
  );

  if (ratingError) {
    console.error("Error saving rating:", ratingError);
    throw ratingError;
  }

  // Calculate new average rating
  const { data: ratings } = await supabase
    .from("resource_ratings")
    .select("rating")
    .eq("resource_id", resourceId);

  if (ratings && ratings.length > 0) {
    const avgRating =
      ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
    await supabase
      .from("resources")
      .update({ rating: avgRating })
      .eq("id", resourceId);
  }
}

export async function getGalleryImages(): Promise<any[]> {
  const { data, error } = await supabase
    .from("resources")
    .select("*")
    .eq("category", "gallery")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data || [];
}

export async function updateResource(
  resourceId: string,
  updates: Partial<CreateResourceData>,
): Promise<any> {
  const updateData: any = {};

  if (updates.title) updateData.title = updates.title;
  if (updates.description !== undefined)
    updateData.description = updates.description || null;
  if (updates.category) updateData.category = updates.category;
  if (updates.resourceType) updateData.resource_type = updates.resourceType;
  if (updates.url !== undefined) updateData.url = updates.url || null;
  if (updates.filePath !== undefined)
    updateData.file_path = updates.filePath || null;
  if (updates.tags) updateData.tags = updates.tags;

  const { data, error } = await supabase
    .from("resources")
    .update(updateData)
    .eq("id", resourceId)
    .select()
    .single();

  if (error) throw error;

  return data;
}

/**
 * Uploads a file to the system-resources storage bucket
 */
export async function uploadResourceFile(
  uri: string,
  userId: string,
): Promise<string> {
  try {
    console.log("Starting robust upload for URI:", uri);

    const fileExt = uri.split(".").pop()?.split("?")[0].toLowerCase() || "bin";
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${userId}/${fileName}`;

    // Determine content type
    let contentType = "application/octet-stream";
    if (["jpg", "jpeg"].includes(fileExt)) contentType = "image/jpeg";
    else if (fileExt === "png") contentType = "image/png";
    else if (fileExt === "gif") contentType = "image/gif";
    else if (fileExt === "pdf") contentType = "application/pdf";

    console.log(
      "Uploading via FormData to path:",
      filePath,
      "ContentType:",
      contentType,
    );

    const formData = new FormData();
    formData.append("file", {
      uri: uri,
      name: fileName,
      type: contentType,
    } as any);

    const { data, error } = await supabase.storage
      .from("system-resources")
      .upload(filePath, formData, {
        contentType: contentType,
        upsert: false,
      });

    if (error) {
      console.error("Supabase Storage Upload Error:", error);
      throw error;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("system-resources").getPublicUrl(filePath);

    console.log("Upload successful. Public URL:", publicUrl);
    return publicUrl;
  } catch (error: any) {
    console.error("Final Error in uploadResourceFile:", error);
    throw error;
  }
}

export async function deleteResource(resourceId: string): Promise<void> {
  const { error } = await supabase
    .from("resources")
    .delete()
    .eq("id", resourceId);

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
  category: "check-in" | "helping" | "engagement" | "achievement";
  criteria: any;
}

export async function createBadge(badgeData: CreateBadgeData): Promise<any> {
  const { data, error } = await supabase
    .from("badges")
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
    .from("badges")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) throw error;

  return data || [];
}

export async function getBadge(badgeId: string): Promise<any | null> {
  const { data, error } = await supabase
    .from("badges")
    .select("*")
    .eq("id", badgeId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }

  return data;
}

export async function getUserBadges(userId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from("user_badges")
    .select("*, badges(*)")
    .eq("user_id", userId)
    .order("earned_at", { ascending: false });

  if (error) throw error;

  return (data || []).map((ub: any) => ({
    id: ub.id,
    userId: ub.user_id,
    badgeId: ub.badge_id,
    earnedAt: new Date(ub.earned_at),
    badge: ub.badges
      ? {
        id: ub.badges.id,
        name: ub.badges.name,
        description: ub.badges.description,
        icon: ub.badges.icon,
        color: ub.badges.color,
        category: ub.badges.category,
      }
      : null,
  }));
}

export async function createUserBadge(userBadgeData: {
  userId: string;
  badgeId: string;
}): Promise<any> {
  const { data, error } = await supabase
    .from("user_badges")
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
  streakType: "check-in" | "helping" | "engagement";
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: Date;
}

export async function createStreak(streakData: CreateStreakData): Promise<any> {
  const { data, error } = await supabase
    .from("streaks")
    .insert({
      user_id: streakData.userId,
      streak_type: streakData.streakType,
      current_streak: streakData.currentStreak,
      longest_streak: streakData.longestStreak,
      last_activity_date: streakData.lastActivityDate
        .toISOString()
        .split("T")[0],
    })
    .select()
    .single();

  if (error) throw error;

  return data;
}

export async function getStreak(
  userId: string,
  streakType: "check-in" | "helping" | "engagement",
): Promise<any | null> {
  const { data, error } = await supabase
    .from("streaks")
    .select("*")
    .eq("user_id", userId)
    .eq("streak_type", streakType)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
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
    .from("streaks")
    .select("*")
    .eq("user_id", userId);

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

export async function updateStreak(
  streakId: string,
  updates: {
    currentStreak?: number;
    longestStreak?: number;
    lastActivityDate?: Date;
  },
): Promise<any> {
  const updateData: any = {};

  if (updates.currentStreak !== undefined)
    updateData.current_streak = updates.currentStreak;
  if (updates.longestStreak !== undefined)
    updateData.longest_streak = updates.longestStreak;
  if (updates.lastActivityDate)
    updateData.last_activity_date = updates.lastActivityDate
      .toISOString()
      .split("T")[0];

  const { data, error } = await supabase
    .from("streaks")
    .update(updateData)
    .eq("id", streakId)
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
// PEER EDUCATOR & SUPPORT OPERATIONS
// ============================================

export async function getActivityLogs(userId: string): Promise<ActivityLog[]> {
  const { data, error } = await supabase
    .from("pe_activity_logs")
    .select("*")
    .eq("user_id", userId)
    .order("date", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createActivityLog(
  logData: Partial<ActivityLog>,
): Promise<ActivityLog> {
  const { data, error } = await supabase
    .from("pe_activity_logs")
    .insert({
      user_id: logData.user_id,
      activity_type: logData.activity_type,
      title: logData.title,
      duration_minutes: logData.duration_minutes,
      date: logData.date,
      notes: logData.notes,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getSupportSessions(
  status?: string,
): Promise<SupportSession[]> {
  let query = supabase.from("support_sessions").select("*");
  if (status) query = query.eq("status", status);

  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getUserSupportSessions(
  userId: string,
): Promise<SupportSession[]> {
  // First get the user's pseudonym
  const user = await getUser(userId);
  if (!user) return [];

  const { data, error } = await supabase
    .from("support_sessions")
    .select("*")
    .or(`educator_id.eq.${userId},student_pseudonym.eq.${user.pseudonym}`)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createSupportSession(
  session: Omit<SupportSession, "id" | "created_at">,
): Promise<SupportSession> {
  const { data, error } = await supabase
    .from("support_sessions")
    .insert(session)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Starts a new support session for the current user
 */
export async function startNewSupportSession(params: {
  educator_id?: string;
  category: string;
  priority?: "normal" | "urgent";
}): Promise<SupportSession> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated");

  return createSupportSession({
    student_pseudonym: user.pseudonym,
    educator_id: params.educator_id || null,
    category: params.category,
    status: "pending",
    priority: params.priority || "normal",
    preview: "Session started",

    accepted_at: null,
    resolved_at: null,
    notes: null,
  });
}

export async function updateSupportSession(
  id: string,
  updates: Partial<SupportSession>,
): Promise<SupportSession> {
  const { data, error } = await supabase
    .from("support_sessions")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getSupportMessages(
  sessionId: string,
): Promise<SupportMessage[]> {
  const { data, error } = await supabase
    .from("support_messages")
    .select("*")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getSupportMessagesBefore(
  sessionId: string,
  beforeIso: string,
  limit = 20,
): Promise<SupportMessage[]> {
  const { data, error } = await supabase
    .from("support_messages")
    .select("*")
    .eq("session_id", sessionId)
    .lt("created_at", beforeIso)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data || []).reverse();
}

export async function getLastSupportMessage(
  sessionId: string,
): Promise<SupportMessage | null> {
  const { data, error } = await supabase
    .from("support_messages")
    .select("*")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) throw error;
  return (data && data[0]) || null;
}

export async function sendSupportMessage(
  message: Omit<SupportMessage, "id" | "created_at" | "is_read">,
): Promise<SupportMessage> {
  const { data, error } = await supabase
    .from("support_messages")
    .insert(message)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ============================================
// PE EXECUTIVE OPERATIONS
// ============================================

export async function getPEUsers(): Promise<User[]> {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .in("role", ["peer-educator", "peer-educator-executive"]);

  if (error) throw error;
  return (data || []).map(mapUserFromDB);
}

export async function getNetworkStats(): Promise<{
  totalSessions: number;
  totalHours: number;
  activeSessions: number;
  totalPEs: number;
}> {
  const [sessions, logs, pes, active] = await Promise.all([
    supabase.from("support_sessions").select("id", { count: "exact" }),
    supabase.from("pe_activity_logs").select("duration_minutes"),
    supabase
      .from("users")
      .select("id", { count: "exact" })
      .in("role", ["peer-educator", "peer-educator-executive"]),
    supabase
      .from("support_sessions")
      .select("id", { count: "exact" })
      .eq("status", "active"),
  ]);

  const totalMinutes = (logs.data || []).reduce(
    (acc: number, log: any) => acc + (log.duration_minutes || 0),
    0,
  );

  return {
    totalSessions: sessions.count || 0,
    totalHours: Math.round(totalMinutes / 60),
    activeSessions: active.count || 0,
    totalPEs: pes.count || 0,
  };
}

// ============================================
// MAPPING FUNCTIONS (DB -> App Types)
// ============================================

function mapUserFromDB(data: any): User {
  return {
    id: data.id,
    email: data.email,
    pseudonym: data.pseudonym,
    username: data.username || undefined,
    isAnonymous: data.is_anonymous,
    role: data.role as User["role"],
    fullName: data.full_name || undefined,
    program: data.program || undefined,
    academicYear: data.academic_year,
    academicSemester: data.academic_semester,
    academicUpdatedAt: data.academic_updated_at
      ? new Date(data.academic_updated_at)
      : undefined,
    studentNumber: data.student_number || undefined,
    phone: data.phone || undefined,
    emergencyContactName: data.emergency_contact_name || undefined,
    emergencyContactPhone: data.emergency_contact_phone || undefined,
    location: data.location || undefined,
    preferredContactMethod: data.preferred_contact_method || undefined,
    bio: data.bio || undefined,
    specialization: data.specialization || undefined,
    interests: data.interests || [],
    avatarUrl: data.avatar_url || undefined,
    createdAt: new Date(data.created_at),
    lastActive: new Date(data.last_active),
    profile_data: data.profile_data || {},
  };
}

async function mapPostFromDB(
  data: any,
  authorPseudonym: string,
): Promise<Post> {
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
// ANNOUNCEMENTS OPERATIONS
// ============================================

export async function getAnnouncements(): Promise<Announcement[]> {
  const { data, error } = await supabase
    .from("announcements")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data || []).map(mapAnnouncementFromDB);
}

export async function createAnnouncement(
  announcement: Omit<Announcement, "id" | "createdAt">,
): Promise<Announcement> {
  const { data, error } = await supabase
    .from("announcements")
    .insert({
      title: announcement.title,
      content: announcement.content,
      created_by: announcement.createdBy,
      scheduled_for: announcement.scheduledFor?.toISOString() || null,
      is_published: announcement.isPublished,
      priority: announcement.priority,
      type: announcement.type,
      image_url: announcement.imageUrl || null,
      action_link: announcement.actionLink || null,
      action_label: announcement.actionLabel || null,
      expires_at: announcement.expiresAt?.toISOString() || null,
    })
    .select()
    .single();

  if (error) throw error;

  return mapAnnouncementFromDB(data);
}

export async function updateAnnouncement(
  id: string,
  updates: Partial<Announcement>,
): Promise<Announcement> {
  const updateData: any = {};
  if (updates.title) updateData.title = updates.title;
  if (updates.content) updateData.content = updates.content;
  if (updates.scheduledFor !== undefined)
    updateData.scheduled_for = updates.scheduledFor?.toISOString() || null;
  if (updates.isPublished !== undefined)
    updateData.is_published = updates.isPublished;
  if (updates.priority) updateData.priority = updates.priority;
  if (updates.type) updateData.type = updates.type;
  if (updates.imageUrl !== undefined)
    updateData.image_url = updates.imageUrl || null;
  if (updates.actionLink !== undefined)
    updateData.action_link = updates.actionLink || null;
  if (updates.actionLabel !== undefined)
    updateData.action_label = updates.actionLabel || null;
  if (updates.expiresAt !== undefined)
    updateData.expires_at = updates.expiresAt?.toISOString() || null;

  const { data, error } = await supabase
    .from("announcements")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  return mapAnnouncementFromDB(data);
}

export async function deleteAnnouncement(id: string): Promise<void> {
  const { error } = await supabase.from("announcements").delete().eq("id", id);

  if (error) throw error;
}

function mapAnnouncementFromDB(dbAnn: any): Announcement {
  return {
    id: dbAnn.id,
    title: dbAnn.title,
    content: dbAnn.content,
    createdBy: dbAnn.created_by,
    createdAt: new Date(dbAnn.created_at),
    scheduledFor: dbAnn.scheduled_for
      ? new Date(dbAnn.scheduled_for)
      : undefined,
    isPublished: dbAnn.is_published,
    priority: dbAnn.priority || "normal",
    type: dbAnn.type || "general",
    imageUrl: dbAnn.image_url || undefined,
    actionLink: dbAnn.action_link || undefined,
    actionLabel: dbAnn.action_label || undefined,
    expiresAt: dbAnn.expires_at ? new Date(dbAnn.expires_at) : undefined,
  };
}
