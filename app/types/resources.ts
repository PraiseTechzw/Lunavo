/**
 * Educational and Support Resources
 */

import { PostCategory } from './forum';

export interface Resource {
    id: string;
    title: string;
    description?: string;
    category: PostCategory;
    resourceType: 'article' | 'video' | 'pdf' | 'link' | 'training' | 'image';
    url?: string;
    filePath?: string;
    tags: string[];
    createdBy: string;
    views?: number;
    rating?: number;
    createdAt: Date;
    updatedAt: Date;
}
