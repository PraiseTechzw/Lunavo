/**
 * Type definitions for Lunavo Platform
 */

export type PostCategory =
  | 'mental-health'
  | 'crisis'
  | 'substance-abuse'
  | 'sexual-health'
  | 'stis-hiv'
  | 'family-home'
  | 'academic'
  | 'social'
  | 'relationships'
  | 'campus'
  | 'general';

export type PostStatus = 'active' | 'escalated' | 'resolved' | 'archived';

export type EscalationLevel = 'none' | 'low' | 'medium' | 'high' | 'critical';
export type EscalationStatus = 'pending' | 'in-progress' | 'resolved' | 'dismissed';

export interface Escalation {
  id: string;
  postId: string;
  escalationLevel: EscalationLevel;
  reason: string;
  detectedAt: Date;
  assignedTo?: string;
  status: EscalationStatus;
  resolvedAt?: Date;
  notes?: string;
}

export interface User {
  id: string;
  email: string;
  pseudonym: string;
  username?: string; // Anonymous username (unique)
  isAnonymous: boolean;
  role: 'student' | 'peer-educator' | 'peer-educator-executive' | 'moderator' | 'counselor' | 'life-coach' | 'student-affairs' | 'admin';
  createdAt: Date;
  lastActive: Date;
  profile_data?: Record<string, any>;
}

export interface Post {
  id: string;
  authorId: string;
  authorPseudonym: string;
  category: PostCategory;
  title: string;
  content: string;
  status: PostStatus;
  escalationLevel: EscalationLevel;
  escalationReason?: string;
  isAnonymous: boolean;
  tags: string[];
  upvotes: number;
  replies: Reply[];
  createdAt: Date;
  updatedAt: Date;
  reportedCount: number;
  isFlagged: boolean;
}

export interface Reply {
  id: string;
  postId: string;
  authorId: string;
  authorPseudonym: string;
  content: string;
  isAnonymous: boolean;
  isHelpful: number;
  isFromVolunteer: boolean;
  createdAt: Date;
  updatedAt: Date;
  reportedCount: number;
}

export interface Category {
  id: PostCategory;
  name: string;
  description: string;
  icon: string;
  color: string;
  resources?: string[];
}

export interface EscalationRule {
  keywords: string[];
  phrases: string[];
  level: EscalationLevel;
  category: PostCategory[];
}

export interface Report {
  id: string;
  targetType: 'post' | 'reply' | 'user';
  targetId: string;
  reporterId: string;
  reason: string;
  description?: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  createdAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
}

export interface Analytics {
  totalPosts: number;
  postsByCategory: Record<PostCategory, number>;
  escalationCount: number;
  activeUsers: number;
  responseTime: number;
  commonIssues: string[];
}

export interface CheckIn {
  id: string;
  userId: string;
  mood: string;
  feelingStrength?: number;
  note?: string;
  date: string; // YYYY-MM-DD format
  timestamp: number;
}

export type NotificationType = 'reply' | 'escalation' | 'meeting' | 'achievement' | 'system';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  read: boolean;
  createdAt: Date;
}

export type MeetingType = 'weekly' | 'special' | 'training' | 'orientation';

export interface Meeting {
  id: string;
  title: string;
  description?: string;
  scheduledDate: Date;
  durationMinutes: number;
  location?: string;
  meetingType: MeetingType;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MeetingAttendance {
  id: string;
  meetingId: string;
  userId: string;
  attended: boolean;
  attendedAt?: Date;
  notes?: string;
}

export interface Resource {
  id: string;
  title: string;
  description?: string;
  category: PostCategory;
  resourceType: 'article' | 'video' | 'pdf' | 'link' | 'training';
  url?: string;
  filePath?: string;
  tags: string[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  createdBy: string;
  createdAt: Date;
  scheduledFor?: Date;
  isPublished: boolean;
}




