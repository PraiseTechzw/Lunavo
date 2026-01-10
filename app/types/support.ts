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
