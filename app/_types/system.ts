/**
 * System and operational types (Meetings, Notifications)
 */

export type NotificationType = 'reply' | 'escalation' | 'meeting' | 'achievement' | 'system' | 'announcement';

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

export interface Announcement {
    id: string;
    title: string;
    content: string;
    createdBy: string;
    createdAt: Date;
    scheduledFor?: Date;
    isPublished: boolean;
    // Enhanced Professional Fields
    priority: 'low' | 'normal' | 'high' | 'critical';
    type: 'general' | 'alert' | 'event' | 'spotlight';
    imageUrl?: string;
    actionLink?: string;
    actionLabel?: string;
    expiresAt?: Date;
}
