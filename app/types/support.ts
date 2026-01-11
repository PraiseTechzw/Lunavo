/**
 * Support, Escalation and Mental Wellness types
 */

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

export interface CheckIn {
    id: string;
    userId: string;
    mood: string;
    feelingStrength?: number;
    note?: string;
    date: string; // YYYY-MM-DD format
    timestamp: number;
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

export interface SupportSession {
    id: string;
    educator_id: string | null;
    student_pseudonym: string;
    status: 'pending' | 'active' | 'resolved' | 'escalated';
    priority: 'urgent' | 'normal' | 'low';
    category: string | null;
    preview: string | null;
    created_at: string;
    updated_at?: string;
    accepted_at: string | null;
    resolved_at: string | null;
    notes: string | null;
}

export interface ActivityLog {
    id: string;
    user_id: string;
    activity_type: 'session' | 'training' | 'meeting' | 'outreach';
    title: string;
    duration_minutes: number;
    date: string;
    notes: string | null;
    verified: boolean;
    created_at: string;
}

export interface SupportMessage {
    id: string;
    session_id: string;
    sender_id: string | null;
    content: string;
    type: 'text' | 'image' | 'system';
    is_read: boolean;
    created_at: string;
}
