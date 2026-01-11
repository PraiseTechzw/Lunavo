/**
 * Forum and Social Interaction types
 */

export type PostCategory =
    | 'mental-health'
    | 'substance-abuse'
    | 'sexual-health'
    | 'stis-hiv'
    | 'family-home'
    | 'academic'
    | 'relationships'
    | (string & {});

export type PostStatus = 'active' | 'escalated' | 'resolved' | 'archived';

export interface Post {
    id: string;
    authorId: string;
    authorPseudonym: string;
    category: PostCategory;
    title: string;
    content: string;
    status: PostStatus;
    escalationLevel: string; // From support.ts but string here to avoid circular dep if needed, or better use support.ts
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
