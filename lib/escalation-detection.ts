/**
 * Enhanced escalation detection system
 * Intelligent AI-based detection with context awareness
 */

import { Post, EscalationLevel, PostCategory } from '@/app/types';
import { ESCALATION_RULES } from '@/app/constants/escalation';
import { createEscalation } from './database';
import { notifyEscalationAssigned } from './notification-triggers';

/**
 * Detect escalation level for a post
 */
export function detectEscalationLevel(post: Post): {
  level: EscalationLevel;
  reason: string;
  confidence: number;
} {
  const content = `${post.title} ${post.content}`.toLowerCase();
  const category = post.category;

  // Check against escalation rules
  let maxLevel: EscalationLevel = 'none';
  let maxReason = '';
  let maxConfidence = 0;

  ESCALATION_RULES.forEach((rule) => {
    // Check if rule applies to this category
    if (rule.category.length > 0 && !rule.category.includes(category)) {
      return;
    }

    // Check keywords
    const keywordMatches = rule.keywords.filter((keyword) =>
      content.includes(keyword.toLowerCase())
    ).length;

    // Check phrases
    const phraseMatches = rule.phrases.filter((phrase) =>
      content.includes(phrase.toLowerCase())
    ).length;

    // Calculate confidence based on matches
    const totalMatches = keywordMatches + phraseMatches * 2; // Phrases are weighted higher
    const confidence = Math.min(totalMatches / (rule.keywords.length + rule.phrases.length * 2), 1);

    if (confidence > maxConfidence && totalMatches > 0) {
      maxLevel = rule.level;
      maxReason = `Detected ${rule.keywords.length > 0 ? 'keywords' : 'phrases'} related to ${rule.level} escalation`;
      maxConfidence = confidence;
    }
  });

  // Additional intelligent checks
  const additionalChecks = performIntelligentChecks(post, content);
  if (additionalChecks.level !== 'none' && additionalChecks.confidence > maxConfidence) {
    maxLevel = additionalChecks.level;
    maxReason = additionalChecks.reason;
    maxConfidence = additionalChecks.confidence;
  }

  return {
    level: maxLevel,
    reason: maxReason || 'No escalation detected',
    confidence: maxConfidence,
  };
}

/**
 * Perform intelligent checks beyond keyword matching
 */
function performIntelligentChecks(
  post: Post,
  content: string
): { level: EscalationLevel; reason: string; confidence: number } {
  // Check for crisis indicators
  const crisisIndicators = [
    'suicide',
    'kill myself',
    'end it all',
    'want to die',
    'no point living',
    'better off dead',
  ];

  const hasCrisisIndicator = crisisIndicators.some((indicator) =>
    content.includes(indicator)
  );

  if (hasCrisisIndicator) {
    return {
      level: 'critical',
      reason: 'Crisis indicators detected - immediate intervention required',
      confidence: 0.9,
    };
  }

  // Check for urgent help requests
  const urgentPatterns = [
    'need help now',
    'urgent help',
    'immediate help',
    'can\'t cope',
    'breaking down',
    'can\'t handle',
  ];

  const hasUrgentPattern = urgentPatterns.some((pattern) => content.includes(pattern));

  if (hasUrgentPattern) {
    return {
      level: 'high',
      reason: 'Urgent help request detected',
      confidence: 0.7,
    };
  }

  // Check for repeated posts from same user (if we can track anonymously)
  // This would require additional logic to track patterns

  // Check for escalation in language intensity
  const intensityWords = ['extremely', 'terrible', 'awful', 'horrible', 'devastated', 'overwhelmed'];
  const intensityCount = intensityWords.filter((word) => content.includes(word)).length;

  if (intensityCount >= 3) {
    return {
      level: 'high',
      reason: 'High emotional intensity detected',
      confidence: 0.6,
    };
  }

  // Check category-specific patterns
  if (post.category === 'crisis') {
    return {
      level: 'high',
      reason: 'Post in crisis category',
      confidence: 0.8,
    };
  }

  return {
    level: 'none',
    reason: '',
    confidence: 0,
  };
}

/**
 * Auto-escalate a post if needed
 */
export async function autoEscalatePost(post: Post): Promise<boolean> {
  const detection = detectEscalationLevel(post);

  if (detection.level === 'none' || detection.confidence < 0.5) {
    return false;
  }

  try {
    // Create escalation
    await createEscalation({
      postId: post.id,
      level: detection.level,
      reason: detection.reason,
    });

    // If critical or high, try to assign to available counselor
    if (detection.level === 'critical' || detection.level === 'high') {
      // TODO: Implement counselor assignment logic
      // For now, notification will be sent to all counselors
    }

    return true;
  } catch (error) {
    console.error('Error auto-escalating post:', error);
    return false;
  }
}

/**
 * Check if post should be escalated based on multiple factors
 */
export function shouldEscalate(post: Post): boolean {
  const detection = detectEscalationLevel(post);
  
  // Escalate if confidence is high enough
  if (detection.confidence >= 0.5 && detection.level !== 'none') {
    return true;
  }

  // Escalate if post is in crisis category
  if (post.category === 'crisis') {
    return true;
  }

  // Escalate if post has been reported multiple times
  if (post.reportedCount >= 3) {
    return true;
  }

  return false;
}

/**
 * Get escalation priority score (higher = more urgent)
 */
export function getEscalationPriority(level: EscalationLevel, detectedAt: Date): number {
  const levelScores: Record<EscalationLevel, number> = {
    critical: 100,
    high: 75,
    medium: 50,
    low: 25,
    none: 0,
  };

  const ageInHours = (Date.now() - detectedAt.getTime()) / (1000 * 60 * 60);
  const ageScore = Math.min(ageInHours * 2, 20); // Max 20 points for age

  return levelScores[level] + ageScore;
}

