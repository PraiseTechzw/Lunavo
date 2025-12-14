/**
 * Content Moderation Tools - Auto-moderation, spam detection, duplicate detection
 */

import { Post } from '@/app/types';
import { getPosts } from './database';
import { analyzePost, detectSentiment } from './ai-utils';

export interface ModerationResult {
  flagged: boolean;
  reason: string;
  confidence: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  suggestions: string[];
}

export interface SpamDetectionResult {
  isSpam: boolean;
  confidence: number;
  indicators: string[];
}

export interface DuplicateDetectionResult {
  isDuplicate: boolean;
  similarPosts: Array<{
    postId: string;
    similarity: number;
    title: string;
  }>;
}

// Spam keywords and patterns
const SPAM_KEYWORDS = [
  'buy now', 'click here', 'limited time', 'act now', 'free money',
  'make money fast', 'work from home', 'get rich quick', 'guaranteed',
  'no credit check', 'debt relief', 'lose weight fast', 'miracle cure',
];

const SPAM_PATTERNS = [
  /https?:\/\/[^\s]+/g, // Multiple URLs
  /[A-Z]{5,}/g, // Excessive caps
  /!{3,}/g, // Multiple exclamation marks
  /[0-9]{10,}/g, // Long number sequences (phone numbers)
];

// Inappropriate content keywords
const INAPPROPRIATE_KEYWORDS = [
  'hate', 'violence', 'threat', 'harassment', 'discrimination',
  'offensive', 'abusive', 'inappropriate',
];

/**
 * Auto-moderate a post
 */
export async function autoModeratePost(post: Post): Promise<ModerationResult> {
  const results: ModerationResult[] = [];

  // Check for spam
  const spamResult = detectSpam(post);
  if (spamResult.isSpam) {
    results.push({
      flagged: true,
      reason: 'Potential spam detected',
      confidence: spamResult.confidence,
      severity: spamResult.confidence > 0.8 ? 'high' : 'medium',
      suggestions: ['Review for spam content', 'Check for promotional material'],
    });
  }

  // Check for inappropriate content
  const inappropriateResult = detectInappropriateContent(post);
  if (inappropriateResult.flagged) {
    results.push(inappropriateResult);
  }

  // Check for duplicates
  const duplicateResult = await detectDuplicatePost(post);
  if (duplicateResult.isDuplicate) {
    results.push({
      flagged: true,
      reason: 'Potential duplicate post',
      confidence: Math.max(...duplicateResult.similarPosts.map(p => p.similarity)),
      severity: 'low',
      suggestions: ['Check if this is a duplicate', 'Consider merging with similar posts'],
    });
  }

  // Check sentiment for crisis content
  const sentiment = detectSentiment(post.title, post.content);
  if (sentiment.sentiment === 'crisis') {
    results.push({
      flagged: true,
      reason: 'Crisis content detected - requires immediate attention',
      confidence: sentiment.confidence,
      severity: 'critical',
      suggestions: ['Escalate to counselor immediately', 'Monitor closely'],
    });
  }

  // Return the most severe result
  if (results.length === 0) {
    return {
      flagged: false,
      reason: 'Content appears appropriate',
      confidence: 0,
      severity: 'low',
      suggestions: [],
    };
  }

  const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
  const mostSevere = results.sort((a, b) => severityOrder[b.severity] - severityOrder[a.severity])[0];

  return {
    ...mostSevere,
    suggestions: [...new Set(results.flatMap(r => r.suggestions))],
  };
}

/**
 * Detect spam in a post
 */
export function detectSpam(post: Post): SpamDetectionResult {
  const text = `${post.title} ${post.content}`.toLowerCase();
  const indicators: string[] = [];
  let spamScore = 0;

  // Check for spam keywords
  const keywordMatches = SPAM_KEYWORDS.filter(keyword => text.includes(keyword.toLowerCase()));
  if (keywordMatches.length > 0) {
    spamScore += keywordMatches.length * 0.2;
    indicators.push(`Contains spam keywords: ${keywordMatches.join(', ')}`);
  }

  // Check for spam patterns
  SPAM_PATTERNS.forEach((pattern, index) => {
    const matches = text.match(pattern);
    if (matches && matches.length > 2) {
      spamScore += 0.3;
      indicators.push(`Multiple ${index === 0 ? 'URLs' : index === 1 ? 'capitalized words' : index === 2 ? 'exclamation marks' : 'numbers'} detected`);
    }
  });

  // Check for excessive repetition
  const words = text.split(/\s+/);
  const wordFreq: Record<string, number> = {};
  words.forEach(word => {
    wordFreq[word] = (wordFreq[word] || 0) + 1;
  });
  const maxFreq = Math.max(...Object.values(wordFreq));
  if (maxFreq > words.length * 0.3) {
    spamScore += 0.2;
    indicators.push('Excessive word repetition');
  }

  // Check for very short content with links
  if (post.content.length < 50 && text.match(/https?:\/\/[^\s]+/g)) {
    spamScore += 0.3;
    indicators.push('Short content with links');
  }

  // Check for all caps title
  if (post.title === post.title.toUpperCase() && post.title.length > 10) {
    spamScore += 0.2;
    indicators.push('Title in all caps');
  }

  const confidence = Math.min(spamScore, 1.0);
  return {
    isSpam: confidence > 0.5,
    confidence,
    indicators,
  };
}

/**
 * Detect inappropriate content
 */
export function detectInappropriateContent(post: Post): ModerationResult {
  const text = `${post.title} ${post.content}`.toLowerCase();
  const inappropriateMatches = INAPPROPRIATE_KEYWORDS.filter(keyword =>
    text.includes(keyword.toLowerCase())
  );

  if (inappropriateMatches.length === 0) {
    return {
      flagged: false,
      reason: 'Content appears appropriate',
      confidence: 0,
      severity: 'low',
      suggestions: [],
    };
  }

  const confidence = Math.min(inappropriateMatches.length * 0.3, 1.0);
  const severity = confidence > 0.7 ? 'high' : confidence > 0.4 ? 'medium' : 'low';

  return {
    flagged: true,
    reason: `Potential inappropriate content: ${inappropriateMatches.join(', ')}`,
    confidence,
    severity,
    suggestions: ['Review for inappropriate language', 'Check context of flagged keywords'],
  };
}

/**
 * Detect duplicate posts
 */
export async function detectDuplicatePost(post: Post): Promise<DuplicateDetectionResult> {
  try {
    const allPosts = await getPosts();
    const similarPosts: Array<{
      postId: string;
      similarity: number;
      title: string;
    }> = [];

    const postText = `${post.title} ${post.content}`.toLowerCase();
    const postWords = new Set(postText.split(/\s+/).filter(w => w.length > 3));

    for (const otherPost of allPosts) {
      if (otherPost.id === post.id) continue; // Skip self

      const otherText = `${otherPost.title} ${otherPost.content}`.toLowerCase();
      const otherWords = new Set(otherText.split(/\s+/).filter(w => w.length > 3));

      // Calculate similarity using Jaccard similarity
      const intersection = new Set([...postWords].filter(w => otherWords.has(w)));
      const union = new Set([...postWords, ...otherWords]);
      const similarity = intersection.size / union.size;

      // Also check title similarity
      const titleSimilarity = calculateStringSimilarity(post.title.toLowerCase(), otherPost.title.toLowerCase());

      // Combined similarity
      const combinedSimilarity = (similarity * 0.6 + titleSimilarity * 0.4);

      if (combinedSimilarity > 0.6) {
        similarPosts.push({
          postId: otherPost.id,
          similarity: combinedSimilarity,
          title: otherPost.title,
        });
      }
    }

    // Sort by similarity (highest first)
    similarPosts.sort((a, b) => b.similarity - a.similarity);

    return {
      isDuplicate: similarPosts.length > 0 && similarPosts[0].similarity > 0.8,
      similarPosts: similarPosts.slice(0, 5), // Top 5 similar posts
    };
  } catch (error) {
    console.error('Error detecting duplicate posts:', error);
    return {
      isDuplicate: false,
      similarPosts: [],
    };
  }
}

/**
 * Calculate string similarity using Levenshtein distance
 */
function calculateStringSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  if (longer.length === 0) return 1.0;

  const distance = levenshteinDistance(longer, shorter);
  return (longer.length - distance) / longer.length;
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j] + 1 // deletion
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

/**
 * Check if content contains identifying information
 */
export function containsIdentifyingInfo(content: string): boolean {
  // Email pattern
  const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  if (emailPattern.test(content)) return true;

  // Phone number patterns
  const phonePatterns = [
    /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, // US format
    /\b\d{10,}\b/g, // Long number sequences
  ];
  if (phonePatterns.some(pattern => pattern.test(content))) return true;

  // Student ID patterns (common formats)
  const studentIdPatterns = [
    /\b\d{8,}\b/g, // 8+ digit numbers
    /\b[A-Z]{2,3}\d{4,}\b/g, // Letters followed by numbers
  ];
  if (studentIdPatterns.some(pattern => pattern.test(content))) return true;

  return false;
}

/**
 * Get moderation rules for auto-moderation
 */
export function getModerationRules(): Array<{
  name: string;
  description: string;
  enabled: boolean;
}> {
  return [
    {
      name: 'Spam Detection',
      description: 'Automatically flag potential spam content',
      enabled: true,
    },
    {
      name: 'Inappropriate Content',
      description: 'Flag content with inappropriate keywords',
      enabled: true,
    },
    {
      name: 'Duplicate Detection',
      description: 'Detect and flag duplicate posts',
      enabled: true,
    },
    {
      name: 'Crisis Detection',
      description: 'Auto-escalate crisis content',
      enabled: true,
    },
    {
      name: 'Identifying Information',
      description: 'Warn about potential identifying information',
      enabled: true,
    },
  ];
}

