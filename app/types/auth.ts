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
    username?: string; // Anonymous username (unique)
    isAnonymous: boolean;
    role: UserRole;
    createdAt: Date;
    lastActive: Date;
    profile_data?: Record<string, any>;
}
