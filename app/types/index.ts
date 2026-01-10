/**
 * Central Export for all Lunavo Platform Types
 */

export * from './auth';
export * from './forum';
export * from './resources';
export * from './support';
export * from './system';

// Common structures
export interface Analytics {
  totalPosts: number;
  postsByCategory: Record<string, number>;
  escalationCount: number;
  activeUsers: number;
  responseTime: number;
  commonIssues: string[];
}
