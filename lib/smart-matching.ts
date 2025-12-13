/**
 * Smart Matching System - Match peer educators to posts based on expertise and history
 */

import { Post, PostCategory, User } from '@/app/types';
import { getReplies, getPosts, getUser } from './database';
import { analyzePost } from './ai-utils';

export interface MatchResult {
  peerEducatorId: string;
  peerEducatorPseudonym: string;
  score: number;
  reasons: string[];
  matchType: 'expertise' | 'history' | 'availability' | 'category-expert';
}

export interface MatchingStats {
  totalMatches: number;
  successfulMatches: number;
  averageResponseTime: number;
  successRate: number;
}

/**
 * Match peer educators to a post based on multiple factors
 */
export async function matchPeerEducatorsToPost(
  post: Post,
  limit: number = 5
): Promise<MatchResult[]> {
  try {
    // Get all peer educators
    const { data: users, error } = await supabase
      .from('users')
      .select('id, pseudonym, role, profile_data')
      .in('role', ['peer-educator', 'peer-educator-executive']);

    if (error || !users) {
      console.error('Error fetching peer educators:', error);
      return [];
    }

    // Analyze the post
    const analysis = analyzePost(post.title, post.content, post.category);

    // Calculate match scores for each peer educator
    const matches: MatchResult[] = [];

    for (const user of users) {
      const match = await calculateMatchScore(user, post, analysis);
      if (match.score > 0) {
        matches.push(match);
      }
    }

    // Sort by score (highest first) and return top matches
    return matches
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  } catch (error) {
    console.error('Error matching peer educators to post:', error);
    return [];
  }
}

/**
 * Calculate match score for a peer educator and post
 */
async function calculateMatchScore(
  peerEducator: any,
  post: Post,
  analysis: any
): Promise<MatchResult> {
  let score = 0;
  const reasons: string[] = [];

  // 1. Category expertise (40% weight)
  const categoryScore = await getCategoryExpertiseScore(peerEducator.id, post.category);
  score += categoryScore * 0.4;
  if (categoryScore > 0.7) {
    reasons.push(`Expert in ${post.category} category`);
  }

  // 2. Response history (30% weight)
  const historyScore = await getResponseHistoryScore(peerEducator.id, post.category);
  score += historyScore * 0.3;
  if (historyScore > 0.6) {
    reasons.push('Active responder in similar posts');
  }

  // 3. Availability (20% weight)
  const availabilityScore = await getAvailabilityScore(peerEducator.id);
  score += availabilityScore * 0.2;
  if (availabilityScore > 0.7) {
    reasons.push('Recently active');
  }

  // 4. Keyword/expertise match (10% weight)
  const keywordScore = getKeywordMatchScore(peerEducator, analysis);
  score += keywordScore * 0.1;
  if (keywordScore > 0.5) {
    reasons.push('Matches post keywords');
  }

  // Determine match type
  let matchType: 'expertise' | 'history' | 'availability' | 'category-expert' = 'expertise';
  if (categoryScore > 0.8) {
    matchType = 'category-expert';
  } else if (historyScore > availabilityScore) {
    matchType = 'history';
  } else if (availabilityScore > historyScore) {
    matchType = 'availability';
  }

  return {
    peerEducatorId: peerEducator.id,
    peerEducatorPseudonym: peerEducator.pseudonym || 'Anonymous',
    score: Math.min(score, 1), // Cap at 1.0
    reasons,
    matchType,
  };
}

/**
 * Calculate category expertise score (0-1)
 */
async function getCategoryExpertiseScore(
  peerEducatorId: string,
  category: PostCategory
): Promise<number> {
  try {
    // Get all posts in this category
    const allPosts = await getPosts();
    const categoryPosts = allPosts.filter((p) => p.category === category);

    // Get replies by this peer educator in this category
    const allReplies = await Promise.all(
      categoryPosts.map((p) => getReplies(p.id))
    );
    const flatReplies = allReplies.flat();
    const myReplies = flatReplies.filter((r) => r.authorId === peerEducatorId);

    if (categoryPosts.length === 0) return 0.5; // Default if no posts

    // Calculate expertise based on:
    // - Number of responses in this category
    // - Helpful votes received
    // - Response rate
    const responseCount = myReplies.length;
    const helpfulCount = myReplies.filter((r) => (r.isHelpful || 0) > 0).length;
    const responseRate = responseCount / categoryPosts.length;

    // Normalize scores (0-1)
    const responseScore = Math.min(responseCount / 20, 1); // Max at 20 responses
    const helpfulScore = responseCount > 0 ? helpfulCount / responseCount : 0;
    const rateScore = Math.min(responseRate, 1);

    // Weighted average
    return (responseScore * 0.4 + helpfulScore * 0.4 + rateScore * 0.2);
  } catch (error) {
    console.error('Error calculating category expertise:', error);
    return 0;
  }
}

/**
 * Calculate response history score (0-1)
 */
async function getResponseHistoryScore(
  peerEducatorId: string,
  category: PostCategory
): Promise<number> {
  try {
    const allPosts = await getPosts();
    const categoryPosts = allPosts.filter((p) => p.category === category);

    // Get recent replies (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const allReplies = await Promise.all(
      categoryPosts.map((p) => getReplies(p.id))
    );
    const flatReplies = allReplies.flat();
    const recentReplies = flatReplies.filter(
      (r) =>
        r.authorId === peerEducatorId &&
        new Date(r.createdAt) >= thirtyDaysAgo
    );

    // Calculate score based on recent activity
    const recentCount = recentReplies.length;
    const recentScore = Math.min(recentCount / 10, 1); // Max at 10 recent responses

    // Check response time (average time to respond)
    let avgResponseTime = 0;
    if (recentReplies.length > 0) {
      const responseTimes: number[] = [];
      for (const reply of recentReplies) {
        const post = categoryPosts.find((p) => p.id === reply.postId);
        if (post) {
          const timeDiff =
            new Date(reply.createdAt).getTime() -
            new Date(post.createdAt).getTime();
          responseTimes.push(timeDiff);
        }
      }
      if (responseTimes.length > 0) {
        avgResponseTime =
          responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      }
    }

    // Faster responses = higher score (normalize: < 1 hour = 1.0, > 24 hours = 0)
    const timeScore =
      avgResponseTime > 0
        ? Math.max(0, 1 - avgResponseTime / (24 * 60 * 60 * 1000))
        : 0.5;

    return (recentScore * 0.7 + timeScore * 0.3);
  } catch (error) {
    console.error('Error calculating response history:', error);
    return 0;
  }
}

/**
 * Calculate availability score (0-1)
 */
async function getAvailabilityScore(peerEducatorId: string): Promise<number> {
  try {
    // Check recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const allPosts = await getPosts();
    const allReplies = await Promise.all(
      allPosts.map((p) => getReplies(p.id))
    );
    const flatReplies = allReplies.flat();
    const recentActivity = flatReplies.filter(
      (r) =>
        r.authorId === peerEducatorId &&
        new Date(r.createdAt) >= sevenDaysAgo
    );

    // More recent activity = higher availability
    const activityCount = recentActivity.length;
    return Math.min(activityCount / 5, 1); // Max at 5 recent activities
  } catch (error) {
    console.error('Error calculating availability:', error);
    return 0.5; // Default to medium availability
  }
}

/**
 * Calculate keyword match score (0-1)
 */
function getKeywordMatchScore(peerEducator: any, analysis: any): number {
  // This could be enhanced with peer educator profile data
  // For now, return a base score
  return 0.5;
}

/**
 * Get suggested posts for a peer educator
 */
export async function getSuggestedPostsForPeerEducator(
  peerEducatorId: string,
  limit: number = 10
): Promise<Post[]> {
  try {
    const allPosts = await getPosts();
    
    // Filter posts that need help (no replies or few replies)
    const postsNeedingHelp = allPosts.filter((post) => {
      // This would need to check replies count
      // For now, return posts with no escalation or low escalation
      return post.escalationLevel === 'none' || post.escalationLevel === 'low';
    });

    // Score each post based on match
    const scoredPosts = await Promise.all(
      postsNeedingHelp.map(async (post) => {
        const analysis = analyzePost(post.title, post.content, post.category);
        const match = await calculateMatchScore(
          { id: peerEducatorId },
          post,
          analysis
        );
        return { post, score: match.score };
      })
    );

    // Sort by score and return top matches
    return scoredPosts
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((item) => item.post);
  } catch (error) {
    console.error('Error getting suggested posts:', error);
    return [];
  }
}

/**
 * Track matching success rate
 */
export async function trackMatchingSuccess(
  postId: string,
  matchedPeerEducatorId: string,
  responded: boolean,
  responseTime?: number
): Promise<void> {
  try {
    // Store matching statistics
    // This could be stored in a database table for analytics
    console.log('Matching success tracked:', {
      postId,
      matchedPeerEducatorId,
      responded,
      responseTime,
    });
  } catch (error) {
    console.error('Error tracking matching success:', error);
  }
}

/**
 * Get matching statistics
 */
export async function getMatchingStats(): Promise<MatchingStats> {
  try {
    // This would query the matching statistics from the database
    // For now, return mock data
    return {
      totalMatches: 0,
      successfulMatches: 0,
      averageResponseTime: 0,
      successRate: 0,
    };
  } catch (error) {
    console.error('Error getting matching stats:', error);
    return {
      totalMatches: 0,
      successfulMatches: 0,
      averageResponseTime: 0,
      successRate: 0,
    };
  }
}

// Import supabase
import { supabase } from './supabase';

