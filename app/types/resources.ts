/**
 * Educational and Support Resources
 */

import { PostCategory } from './forum';

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
