/**
 * Auth related types
 */

export type UserRole =
    | 'student'
    | 'peer-educator'
    | 'peer-educator-executive'
    | 'moderator'
    | 'counselor'
    | 'life-coach'
    | 'student-affairs'
    | 'admin';

export interface User {
    id: string;
    email: string;
    pseudonym: string;
    fullName?: string;
    username?: string; // Anonymous username (unique)
    isAnonymous: boolean;
    role: UserRole;
    program?: string;
    academicYear?: number;
    academicSemester?: number;
    academicUpdatedAt?: Date;
    studentNumber?: string;
    phone?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    location?: string;
    preferredContactMethod?: string;
    bio?: string;
    specialization?: string;
    interests?: string[];
    avatarUrl?: string;
    createdAt: Date;
    lastActive: Date;
    profile_data?: Record<string, any>;
}
