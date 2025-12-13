/**
 * Escalation Analytics
 * Provides analytics specifically for escalations
 */

import { getEscalations, getPosts } from './database';
import { Escalation, EscalationLevel, EscalationStatus } from '@/app/types';

export interface EscalationAnalytics {
  totalEscalations: number;
  byLevel: Record<EscalationLevel, number>;
  byStatus: Record<EscalationStatus, number>;
  averageResponseTime: number; // in hours
  resolutionRate: number; // percentage
  escalationRate: number; // percentage of posts escalated
  trends: {
    daily: Record<string, number>;
    byCategory: Record<string, number>;
  };
}

/**
 * Get escalation analytics
 */
export async function getEscalationAnalytics(): Promise<EscalationAnalytics> {
  const [escalations, posts] = await Promise.all([
    getEscalations(),
    getPosts(),
  ]);

  // By level
  const byLevel: Record<EscalationLevel, number> = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    none: 0,
  };
  escalations.forEach((e) => {
    byLevel[e.escalationLevel] = (byLevel[e.escalationLevel] || 0) + 1;
  });

  // By status
  const byStatus: Record<EscalationStatus, number> = {
    pending: 0,
    'in-progress': 0,
    resolved: 0,
    dismissed: 0,
  };
  escalations.forEach((e) => {
    byStatus[e.status] = (byStatus[e.status] || 0) + 1;
  });

  // Average response time
  const resolvedEscalations = escalations.filter(
    (e) => e.status === 'resolved' && e.resolvedAt
  );
  let totalResponseTime = 0;
  resolvedEscalations.forEach((e) => {
    if (e.resolvedAt) {
      const timeDiff = new Date(e.resolvedAt).getTime() - new Date(e.detectedAt).getTime();
      totalResponseTime += timeDiff;
    }
  });
  const averageResponseTime =
    resolvedEscalations.length > 0
      ? totalResponseTime / resolvedEscalations.length / (1000 * 60 * 60) // Convert to hours
      : 0;

  // Resolution rate
  const resolutionRate =
    escalations.length > 0
      ? (resolvedEscalations.length / escalations.length) * 100
      : 0;

  // Escalation rate
  const escalationRate = posts.length > 0 ? (escalations.length / posts.length) * 100 : 0;

  // Daily trends (anonymized - only dates)
  const daily: Record<string, number> = {};
  escalations.forEach((e) => {
    const dateKey = new Date(e.detectedAt).toISOString().split('T')[0];
    daily[dateKey] = (daily[dateKey] || 0) + 1;
  });

  // By category (anonymized - only category, no user IDs)
  const byCategory: Record<string, number> = {};
  escalations.forEach((e) => {
    const post = posts.find((p) => p.id === e.postId);
    if (post) {
      byCategory[post.category] = (byCategory[post.category] || 0) + 1;
    }
  });

  return {
    totalEscalations: escalations.length,
    byLevel,
    byStatus,
    averageResponseTime: Math.round(averageResponseTime * 10) / 10,
    resolutionRate: Math.round(resolutionRate * 10) / 10,
    escalationRate: Math.round(escalationRate * 10) / 10,
    trends: {
      daily,
      byCategory,
    },
  };
}

