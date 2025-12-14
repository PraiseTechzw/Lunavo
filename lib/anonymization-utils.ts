/**
 * Data anonymization utilities for Student Affairs
 * Ensures no user IDs or identifying information is exposed
 */

import { Post, Reply, Escalation, User } from '@/app/types';

/**
 * Anonymize a post for analytics (remove user IDs, keep only pseudonyms)
 */
export function anonymizePost(post: Post): Omit<Post, 'authorId'> {
  const { authorId, ...anonymized } = post;
  return anonymized;
}

/**
 * Anonymize a reply for analytics
 */
export function anonymizeReply(reply: Reply): Omit<Reply, 'authorId'> {
  const { authorId, ...anonymized } = reply;
  return anonymized;
}

/**
 * Anonymize an escalation for analytics
 */
export function anonymizeEscalation(escalation: Escalation): Omit<Escalation, 'assignedTo'> {
  const { assignedTo, ...anonymized } = escalation;
  return anonymized;
}

/**
 * Anonymize user data for analytics (only keep role and pseudonym)
 */
export function anonymizeUser(user: User): { role: User['role']; pseudonym: string } {
  return {
    role: user.role,
    pseudonym: user.pseudonym,
  };
}

/**
 * Check if data contains any identifying information
 */
export function containsIdentifyingInfo(data: any): boolean {
  const identifyingFields = ['email', 'studentNumber', 'phone', 'id', 'userId', 'authorId', 'reporterId'];
  
  for (const field of identifyingFields) {
    if (data[field] && typeof data[field] === 'string' && data[field].length > 0) {
      // Check if it's a UUID (which could be identifying)
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (uuidPattern.test(data[field])) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Sanitize analytics data to ensure no identifying information
 */
export function sanitizeAnalyticsData(data: any): any {
  if (Array.isArray(data)) {
    return data.map(sanitizeAnalyticsData);
  }
  
  if (data && typeof data === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(data)) {
      // Skip identifying fields
      if (['id', 'userId', 'authorId', 'reporterId', 'assignedTo', 'email', 'studentNumber'].includes(key)) {
        continue;
      }
      
      // Recursively sanitize nested objects
      if (value && typeof value === 'object') {
        sanitized[key] = sanitizeAnalyticsData(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }
  
  return data;
}


