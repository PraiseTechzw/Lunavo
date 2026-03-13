/**
 * Predictive Analytics - Escalation likelihood, user needs prediction, peak usage
 */

import { Post, EscalationLevel, PostCategory } from '@/types';
import { getPosts, getReplies, getEscalations } from './database';
import { detectSentiment, analyzePost } from './ai-utils';

export interface EscalationPrediction {
  postId: string;
  likelihood: number; // 0-1
  predictedLevel: EscalationLevel;
  confidence: number;
  factors: string[];
  recommendedAction: string;
}

export interface UserNeedsPrediction {
  userId: string;
  needs: Array<{
    category: PostCategory | 'general';
    likelihood: number;
    urgency: 'low' | 'medium' | 'high';
    suggestedResources: string[];
  }>;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface PeakUsagePrediction {
  hour: number; // 0-23
  dayOfWeek: number; // 0-6 (Sunday = 0)
  expectedActivity: number; // Expected number of posts/replies
  confidence: number;
}

/**
 * Predict escalation likelihood for a post
 */
export async function predictEscalationLikelihood(
  post: Post
): Promise<EscalationPrediction> {
  try {
    const analysis = analyzePost(post.title, post.content, post.category);
    const sentiment = detectSentiment(post.title, post.content);

    let likelihood = 0;
    const factors: string[] = [];
    let predictedLevel: EscalationLevel = 'none';

    // Factor 1: Sentiment analysis (30% weight)
    if (sentiment.sentiment === 'crisis') {
      likelihood += 0.3;
      factors.push('Crisis sentiment detected');
      predictedLevel = 'critical';
    } else if (sentiment.sentiment === 'negative') {
      likelihood += sentiment.score < -0.5 ? 0.2 : 0.1;
      factors.push('Negative sentiment');
    }

    // Factor 2: Category (20% weight)
    if (post.category === 'crisis') {
      likelihood += 0.2;
      factors.push('Post in crisis category');
      if (predictedLevel === 'none') predictedLevel = 'high';
    } else if (post.category === 'mental-health') {
      likelihood += 0.1;
      factors.push('Mental health category');
    }

    // Factor 3: No responses (20% weight)
    const replies = await getReplies(post.id);
    if (replies.length === 0) {
      likelihood += 0.2;
      factors.push('No responses yet');
    } else if (replies.length < 2) {
      likelihood += 0.1;
      factors.push('Few responses');
    }

    // Factor 4: Time since post (15% weight)
    const hoursSincePost =
      (new Date().getTime() - new Date(post.createdAt).getTime()) /
      (1000 * 60 * 60);
    if (hoursSincePost > 24 && replies.length === 0) {
      likelihood += 0.15;
      factors.push('Post unanswered for 24+ hours');
    } else if (hoursSincePost > 12 && replies.length === 0) {
      likelihood += 0.1;
      factors.push('Post unanswered for 12+ hours');
    }

    // Factor 5: Keyword analysis (15% weight)
    const crisisKeywords = [
      'suicide', 'kill myself', 'end it all', 'hopeless', 'no point',
      'self-harm', 'cutting', 'overdose', 'emergency', 'urgent help'
    ];
    const text = `${post.title} ${post.content}`.toLowerCase();
    const crisisKeywordCount = crisisKeywords.filter((kw) =>
      text.includes(kw)
    ).length;
    if (crisisKeywordCount > 0) {
      likelihood += Math.min(crisisKeywordCount * 0.05, 0.15);
      factors.push(`${crisisKeywordCount} crisis keyword(s) detected`);
      if (crisisKeywordCount >= 2) predictedLevel = 'critical';
    }

    // Cap likelihood at 1.0
    likelihood = Math.min(likelihood, 1.0);

    // Determine predicted level if not already set
    if (predictedLevel === 'none') {
      if (likelihood >= 0.8) predictedLevel = 'critical';
      else if (likelihood >= 0.6) predictedLevel = 'high';
      else if (likelihood >= 0.4) predictedLevel = 'medium';
      else if (likelihood >= 0.2) predictedLevel = 'low';
    }

    // Calculate confidence
    const confidence = Math.min(
      (factors.length * 0.15 + likelihood) / 2,
      1.0
    );

    // Recommended action
    let recommendedAction = 'Monitor post';
    if (likelihood >= 0.8) {
      recommendedAction = 'Immediate escalation required';
    } else if (likelihood >= 0.6) {
      recommendedAction = 'Consider escalation and assign counselor';
    } else if (likelihood >= 0.4) {
      recommendedAction = 'Prioritize response and monitor closely';
    } else if (likelihood >= 0.2) {
      recommendedAction = 'Ensure timely response';
    }

    return {
      postId: post.id,
      likelihood,
      predictedLevel,
      confidence,
      factors,
      recommendedAction,
    };
  } catch (error) {
    console.error('Error predicting escalation likelihood:', error);
    return {
      postId: post.id,
      likelihood: 0,
      predictedLevel: 'none',
      confidence: 0,
      factors: [],
      recommendedAction: 'Monitor post',
    };
  }
}

/**
 * Predict user needs based on activity patterns
 */
export async function predictUserNeeds(
  userId: string
): Promise<UserNeedsPrediction> {
  try {
    // Get user's posts and replies
    const allPosts = await getPosts();
    const userPosts = allPosts.filter((p) => p.authorId === userId);

    // Analyze post categories
    const categoryCounts: Record<PostCategory, number> = {
      'mental-health': 0,
      'relationships': 0,
      'academic': 0,
      'crisis': 0,
      'substance-abuse': 0,
      'sexual-health': 0,
    };

    userPosts.forEach((post) => {
      categoryCounts[post.category]++;
    });

    // Analyze sentiment trends
    let negativeSentimentCount = 0;
    let crisisSentimentCount = 0;

    for (const post of userPosts.slice(-10)) {
      // Analyze last 10 posts
      const sentiment = detectSentiment(post.title, post.content);
      if (sentiment.sentiment === 'crisis') {
        crisisSentimentCount++;
      } else if (sentiment.sentiment === 'negative') {
        negativeSentimentCount++;
      }
    }

    // Predict needs
    const needs: UserNeedsPrediction['needs'] = [];

    // Check each category
    Object.entries(categoryCounts).forEach(([category, count]) => {
      if (count > 0) {
        const likelihood = Math.min(count / 5, 1.0); // Normalize
        const urgency =
          category === 'crisis' || crisisSentimentCount > 0
            ? 'high'
            : negativeSentimentCount > 2
            ? 'medium'
            : 'low';

        needs.push({
          category: category as PostCategory,
          likelihood,
          urgency,
          suggestedResources: getSuggestedResources(category as PostCategory),
        });
      }
    });

    // Determine overall risk level
    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    if (crisisSentimentCount > 0 || categoryCounts['crisis'] > 0) {
      riskLevel = 'high';
    } else if (
      negativeSentimentCount > 3 ||
      categoryCounts['mental-health'] > 3
    ) {
      riskLevel = 'medium';
    }

    return {
      userId,
      needs,
      riskLevel,
    };
  } catch (error) {
    console.error('Error predicting user needs:', error);
    return {
      userId,
      needs: [],
      riskLevel: 'low',
    };
  }
}

/**
 * Get suggested resources for a category
 */
function getSuggestedResources(category: PostCategory): string[] {
  const resources: Record<PostCategory, string[]> = {
    'mental-health': [
      'Mental health resources',
      'Crisis hotline',
      'Counseling services',
      'Self-care guide',
    ],
    'relationships': [
      'Relationship counseling',
      'Communication skills',
      'Conflict resolution guide',
    ],
    'academic': [
      'Study skills resources',
      'Time management guide',
      'Academic support services',
    ],
    'crisis': [
      'Crisis hotline',
      'Emergency resources',
      'Immediate support',
    ],
    'substance-abuse': [
      'Substance abuse resources',
      'Recovery support',
      'Treatment options',
    ],
    'sexual-health': [
      'Sexual health resources',
      'STD/STI information',
      'Reproductive health services',
    ],
  };

  return resources[category] || [];
}

/**
 * Predict peak usage times
 */
export async function predictPeakUsage(): Promise<PeakUsagePrediction[]> {
  try {
    // Get all posts and replies
    const allPosts = await getPosts();
    const allReplies = await Promise.all(
      allPosts.map((p) => getReplies(p.id))
    );
    const flatReplies = allReplies.flat();

    // Analyze activity by hour and day of week
    const activityByHour: Record<number, number> = {};
    const activityByDay: Record<number, number> = {};

    // Initialize
    for (let i = 0; i < 24; i++) {
      activityByHour[i] = 0;
    }
    for (let i = 0; i < 7; i++) {
      activityByDay[i] = 0;
    }

    // Count posts
    allPosts.forEach((post) => {
      const date = new Date(post.createdAt);
      const hour = date.getHours();
      const day = date.getDay();
      activityByHour[hour]++;
      activityByDay[day]++;
    });

    // Count replies
    flatReplies.forEach((reply) => {
      const date = new Date(reply.createdAt);
      const hour = date.getHours();
      const day = date.getDay();
      activityByHour[hour]++;
      activityByDay[day]++;
    });

    // Calculate average activity per hour/day
    const totalActivity = allPosts.length + flatReplies.length;
    const avgActivityPerHour = totalActivity / 24;
    const avgActivityPerDay = totalActivity / 7;

    // Generate predictions
    const predictions: PeakUsagePrediction[] = [];

    // Predict by hour
    Object.entries(activityByHour).forEach(([hour, count]) => {
      const expectedActivity = count + avgActivityPerHour * 0.3; // Add some baseline
      const confidence = Math.min(count / Math.max(avgActivityPerHour, 1), 1.0);

      // Find day with highest activity for this hour
      let bestDay = 0;
      let bestDayActivity = 0;
      Object.entries(activityByDay).forEach(([day, dayCount]) => {
        if (dayCount > bestDayActivity) {
          bestDayActivity = dayCount;
          bestDay = parseInt(day);
        }
      });

      predictions.push({
        hour: parseInt(hour),
        dayOfWeek: bestDay,
        expectedActivity: Math.round(expectedActivity),
        confidence,
      });
    });

    // Sort by expected activity (highest first)
    return predictions.sort((a, b) => b.expectedActivity - a.expectedActivity);
  } catch (error) {
    console.error('Error predicting peak usage:', error);
    return [];
  }
}

/**
 * Get early intervention suggestions for a post
 */
export async function getEarlyInterventionSuggestions(
  post: Post
): Promise<string[]> {
  const prediction = await predictEscalationLikelihood(post);
  const suggestions: string[] = [];

  if (prediction.likelihood >= 0.6) {
    suggestions.push('Assign a counselor immediately');
    suggestions.push('Send priority notification to peer educators');
    suggestions.push('Monitor post closely for updates');
  } else if (prediction.likelihood >= 0.4) {
    suggestions.push('Prioritize this post for peer educator response');
    suggestions.push('Consider sending reminder notifications');
    suggestions.push('Check back in 6 hours if no response');
  } else if (prediction.likelihood >= 0.2) {
    suggestions.push('Ensure timely response within 24 hours');
    suggestions.push('Match with appropriate peer educator');
  }

  return suggestions;
}

