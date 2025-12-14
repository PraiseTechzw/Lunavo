/**
 * Content Recommendations Engine - Similar posts, resources, peer educators
 */

import { Post, PostCategory, Resource, User } from '@/types';
import { mapResourceFromDB } from '@/utils/resource-utils';
import { extractKeywords } from './ai-utils';
import { getPosts, getReplies, getResources, getUser } from './database';
import { supabase } from './supabase';

export interface PostRecommendation {
  post: Post;
  score: number;
  reasons: string[];
  similarity: number;
}

export interface ResourceRecommendation {
  resource: Resource;
  score: number;
  reasons: string[];
  relevance: number;
}

export interface PeerEducatorRecommendation {
  peerEducator: User;
  score: number;
  reasons: string[];
  expertise: string[];
}

/**
 * Get recommended posts for a user
 */
export async function getRecommendedPosts(
  userId: string,
  limit: number = 10
): Promise<PostRecommendation[]> {
  try {
    const allPosts = await getPosts();
    const user = await getUser(userId);

    if (!user) return [];

    // Get user's activity
    const userPosts = allPosts.filter((p) => p.authorId === userId);
    const allReplies = await Promise.all(
      allPosts.map((p) => getReplies(p.id))
    );
    const flatReplies = allReplies.flat();
    const userReplies = flatReplies.filter((r) => r.authorId === userId);

    // Analyze user preferences
    const userPreferences = analyzeUserPreferences(userPosts, userReplies);

    // Score each post
    const recommendations: PostRecommendation[] = [];

    for (const post of allPosts) {
      // Skip user's own posts
      if (post.authorId === userId) continue;

      // Skip posts user already replied to
      const hasReplied = userReplies.some((r) => r.postId === post.id);
      if (hasReplied) continue;

      const recommendation = await scorePostRecommendation(
        post,
        userPreferences,
        userPosts
      );

      if (recommendation.score > 0) {
        recommendations.push(recommendation);
      }
    }

    // Sort by score and return top recommendations
    return recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  } catch (error) {
    console.error('Error getting recommended posts:', error);
    return [];
  }
}

/**
 * Analyze user preferences from their activity
 */
function analyzeUserPreferences(
  userPosts: Post[],
  userReplies: any[]
): {
  preferredCategories: Record<PostCategory, number>;
  keywords: string[];
  topics: string[];
} {
  const preferredCategories: Record<PostCategory, number> = {
    'mental-health': 0,
    'relationships': 0,
    'academic': 0,
    'crisis': 0,
    'substance-abuse': 0,
    'sexual-health': 0,
  };

  const allKeywords: string[] = [];
  const allTopics: string[] = [];

  // Analyze posts
  userPosts.forEach((post) => {
    preferredCategories[post.category]++;
    const keywords = extractKeywords(post.title, post.content);
    allKeywords.push(...keywords.keywords);
    allTopics.push(...keywords.topics);
  });

  // Analyze replies (posts user engaged with)
  userReplies.forEach((reply) => {
    const post = userPosts.find((p) => p.id === reply.postId);
    if (post) {
      preferredCategories[post.category]++;
      const keywords = extractKeywords(post.title, post.content);
      allKeywords.push(...keywords.keywords);
      allTopics.push(...keywords.topics);
    }
  });

  // Get top keywords and topics
  const keywordFreq: Record<string, number> = {};
  allKeywords.forEach((kw) => {
    keywordFreq[kw] = (keywordFreq[kw] || 0) + 1;
  });

  const topKeywords = Object.entries(keywordFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([kw]) => kw);

  const uniqueTopics = Array.from(new Set(allTopics));

  return {
    preferredCategories,
    keywords: topKeywords,
    topics: uniqueTopics,
  };
}

/**
 * Score a post recommendation
 */
async function scorePostRecommendation(
  post: Post,
  userPreferences: any,
  userPosts: Post[]
): Promise<PostRecommendation> {
  let score = 0;
  const reasons: string[] = [];

  // Factor 1: Category match (30% weight)
  const categoryCount = userPreferences.preferredCategories[post.category] || 0;
  const categoryScore = Math.min(categoryCount / 5, 1.0);
  score += categoryScore * 0.3;
  if (categoryScore > 0.5) {
    reasons.push(`Matches your interest in ${post.category}`);
  }

  // Factor 2: Keyword similarity (25% weight)
  const postKeywords = extractKeywords(post.title, post.content);
  const keywordMatches = postKeywords.keywords.filter((kw) =>
    userPreferences.keywords.includes(kw)
  ).length;
  const keywordScore = Math.min(keywordMatches / 5, 1.0);
  score += keywordScore * 0.25;
  if (keywordScore > 0.3) {
    reasons.push('Contains keywords you engage with');
  }

  // Factor 3: Topic similarity (20% weight)
  const topicMatches = postKeywords.topics.filter((topic) =>
    userPreferences.topics.includes(topic)
  ).length;
  const topicScore = Math.min(topicMatches / 3, 1.0);
  score += topicScore * 0.2;
  if (topicScore > 0.3) {
    reasons.push('Related to topics you follow');
  }

  // Factor 4: Post needs help (15% weight)
  const replies = await getReplies(post.id);
  const needsHelpScore = replies.length === 0 ? 1.0 : Math.max(0, 1 - replies.length / 5);
  score += needsHelpScore * 0.15;
  if (needsHelpScore > 0.7) {
    reasons.push('Post needs responses');
  }

  // Factor 5: Recency (10% weight)
  const hoursSincePost =
    (new Date().getTime() - new Date(post.createdAt).getTime()) /
    (1000 * 60 * 60);
  const recencyScore = Math.max(0, 1 - hoursSincePost / 168); // Decay over 1 week
  score += recencyScore * 0.1;
  if (recencyScore > 0.7) {
    reasons.push('Recently posted');
  }

  // Calculate similarity (0-1)
  const similarity = (categoryScore + keywordScore + topicScore) / 3;

  return {
    post,
    score: Math.min(score, 1.0),
    reasons: reasons.length > 0 ? reasons : ['You might find this helpful'],
    similarity,
  };
}

/**
 * Get recommended resources for a user
 */
export async function getRecommendedResources(
  userId: string,
  limit: number = 10
): Promise<ResourceRecommendation[]> {
  try {
    const allResourcesData = await getResources({ approved: true });
    const user = await getUser(userId);

    if (!user) return [];

    // Map database resources to Resource interface
    const allResources = allResourcesData.map((r: any) => mapResourceFromDB(r));

    // Get user's posts to understand needs
    const allPosts = await getPosts();
    const userPosts = allPosts.filter((p) => p.authorId === userId);

    // Analyze user needs
    const userNeeds = analyzeUserNeeds(userPosts);

    // Score each resource
    const recommendations: ResourceRecommendation[] = [];

    for (const resource of allResources) {
      const recommendation = scoreResourceRecommendation(resource, userNeeds);

      if (recommendation.score > 0) {
        recommendations.push(recommendation);
      }
    }

    // Sort by score and return top recommendations
    return recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  } catch (error) {
    console.error('Error getting recommended resources:', error);
    return [];
  }
}

/**
 * Analyze user needs from their posts
 */
function analyzeUserNeeds(userPosts: Post[]): {
  categories: PostCategory[];
  keywords: string[];
} {
  const categories: PostCategory[] = [];
  const allKeywords: string[] = [];

  userPosts.forEach((post) => {
    categories.push(post.category);
    const keywords = extractKeywords(post.title, post.content);
    allKeywords.push(...keywords.keywords);
  });

  // Get unique categories
  const uniqueCategories = Array.from(new Set(categories));

  // Get top keywords
  const keywordFreq: Record<string, number> = {};
  allKeywords.forEach((kw) => {
    keywordFreq[kw] = (keywordFreq[kw] || 0) + 1;
  });

  const topKeywords = Object.entries(keywordFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([kw]) => kw);

  return {
    categories: uniqueCategories,
    keywords: topKeywords,
  };
}

/**
 * Score a resource recommendation
 */
function scoreResourceRecommendation(
  resource: Resource,
  userNeeds: any
): ResourceRecommendation {
  let score = 0;
  const reasons: string[] = [];

  // Factor 1: Category match (40% weight)
  const categoryMatch = userNeeds.categories.includes(resource.category);
  if (categoryMatch) {
    score += 0.4;
    reasons.push(`Matches your ${resource.category} interests`);
  }

  // Factor 2: Keyword match (30% weight)
  const resourceKeywords = extractKeywords(
    resource.title,
    resource.description || ''
  );
  const keywordMatches = resourceKeywords.keywords.filter((kw) =>
    userNeeds.keywords.includes(kw)
  ).length;
  const keywordScore = Math.min(keywordMatches / 5, 1.0);
  score += keywordScore * 0.3;
  if (keywordScore > 0.3) {
    reasons.push('Relevant to your interests');
  }

  // Factor 3: Resource type (20% weight)
  // Prefer articles and guides for general users
  if (resource.resourceType === 'article' || resource.resourceType === 'guide') {
    score += 0.2;
    reasons.push('Helpful resource type');
  } else {
    score += 0.1;
  }

  // Factor 4: Recency (10% weight)
  // Newer resources are generally better
  const daysSinceCreated =
    (new Date().getTime() - new Date(resource.createdAt).getTime()) /
    (1000 * 60 * 60 * 24);
  const recencyScore = Math.max(0, 1 - daysSinceCreated / 365); // Decay over 1 year
  score += recencyScore * 0.1;

  // Calculate relevance
  const relevance = (categoryMatch ? 0.5 : 0) + keywordScore * 0.5;

  return {
    resource,
    score: Math.min(score, 1.0),
    reasons: reasons.length > 0 ? reasons : ['Recommended for you'],
    relevance,
  };
}

/**
 * Get recommended peer educators for a post
 */
export async function getRecommendedPeerEducators(
  postId: string,
  limit: number = 5
): Promise<PeerEducatorRecommendation[]> {
  try {
    const post = (await getPosts()).find((p) => p.id === postId);
    if (!post) return [];

    // Get all peer educators
    const { data: users, error } = await supabase
      .from('users')
      .select('id, pseudonym, role, profile_data')
      .in('role', ['peer-educator', 'peer-educator-executive']);

    if (error || !users) return [];

    // Score each peer educator
    const recommendations: PeerEducatorRecommendation[] = [];

    for (const user of users) {
      const recommendation = await scorePeerEducatorRecommendation(
        user,
        post
      );

      if (recommendation.score > 0) {
        recommendations.push(recommendation);
      }
    }

    // Sort by score and return top recommendations
    return recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  } catch (error) {
    console.error('Error getting recommended peer educators:', error);
    return [];
  }
}

/**
 * Score a peer educator recommendation
 */
async function scorePeerEducatorRecommendation(
  peerEducator: any,
  post: Post
): Promise<PeerEducatorRecommendation> {
  let score = 0;
  const reasons: string[] = [];
  const expertise: string[] = [];

  // Factor 1: Category expertise (40% weight)
  const allPosts = await getPosts();
  const categoryPosts = allPosts.filter((p) => p.category === post.category);
  const allReplies = await Promise.all(
    categoryPosts.map((p) => getReplies(p.id))
  );
  const flatReplies = allReplies.flat();
  const categoryReplies = flatReplies.filter(
    (r) => r.authorId === peerEducator.id
  );

  if (categoryReplies.length > 0) {
    const expertiseScore = Math.min(categoryReplies.length / 10, 1.0);
    score += expertiseScore * 0.4;
    expertise.push(post.category);
    reasons.push(`Expert in ${post.category}`);
  }

  // Factor 2: Response quality (30% weight)
  const helpfulReplies = categoryReplies.filter((r) => (r.isHelpful || 0) > 0);
  if (categoryReplies.length > 0) {
    const qualityScore = helpfulReplies.length / categoryReplies.length;
    score += qualityScore * 0.3;
    if (qualityScore > 0.7) {
      reasons.push('High quality responses');
    }
  }

  // Factor 3: Availability (20% weight)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const recentReplies = flatReplies.filter(
    (r) =>
      r.authorId === peerEducator.id &&
      new Date(r.createdAt) >= sevenDaysAgo
  );
  const availabilityScore = Math.min(recentReplies.length / 5, 1.0);
  score += availabilityScore * 0.2;
  if (availabilityScore > 0.5) {
    reasons.push('Recently active');
  }

  // Factor 4: Response time (10% weight)
  // This would require tracking response times
  score += 0.1; // Default

  return {
    peerEducator: {
      id: peerEducator.id,
      pseudonym: peerEducator.pseudonym || 'Anonymous',
      role: peerEducator.role,
    } as User,
    score: Math.min(score, 1.0),
    reasons: reasons.length > 0 ? reasons : ['Available peer educator'],
    expertise,
  };
}

/**
 * Track recommendation effectiveness
 */
export async function trackRecommendationEffectiveness(
  recommendationId: string,
  userId: string,
  type: 'post' | 'resource' | 'peer-educator',
  clicked: boolean,
  engaged: boolean
): Promise<void> {
  try {
    // Store recommendation tracking data
    // This could be stored in a database table for analytics
    console.log('Recommendation tracked:', {
      recommendationId,
      userId,
      type,
      clicked,
      engaged,
    });
  } catch (error) {
    console.error('Error tracking recommendation effectiveness:', error);
  }
}


