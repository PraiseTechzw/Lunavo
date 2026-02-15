/**
 * Gamification System - Badges, Streaks, Points, and Achievements
 */

import { createStreak, getPosts, getReplies, getStreak, getUserBadges, updateStreak } from './database';
import { notifyBadgeEarned, notifyStreakMilestone } from './notification-triggers';
import { awardBadgePoints, awardStreakMilestonePoints } from './points-system';
import { supabase } from './supabase';

// ============================================
// BADGE DEFINITIONS
// ============================================

export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  category: 'check-in' | 'helping' | 'engagement' | 'achievement';
  criteria: {
    type: string;
    value: number;
    description: string;
  };
}

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  // Check-in Badges
  {
    id: 'daily-check-in',
    name: 'Daily Check-in',
    description: 'Complete your first daily check-in',
    icon: 'check-circle',
    color: '#10B981',
    category: 'check-in',
    criteria: { type: 'check_in_count', value: 1, description: 'Complete 1 check-in' },
  },
  {
    id: 'weekly-warrior',
    name: 'Weekly Warrior',
    description: 'Check in 7 days in a row',
    icon: 'calendar-week',
    color: '#3B82F6',
    category: 'check-in',
    criteria: { type: 'check_in_streak', value: 7, description: '7-day check-in streak' },
  },
  {
    id: 'monthly-master',
    name: 'Monthly Master',
    description: 'Check in 30 days in a row',
    icon: 'calendar-month',
    color: '#8B5CF6',
    category: 'check-in',
    criteria: { type: 'check_in_streak', value: 30, description: '30-day check-in streak' },
  },

  // Helping Badges
  {
    id: 'first-response',
    name: 'First Response',
    description: 'Help your first student',
    icon: 'hand-holding-heart',
    color: '#F59E0B',
    category: 'helping',
    criteria: { type: 'response_count', value: 1, description: 'Give 1 helpful response' },
  },
  {
    id: 'helper-hero',
    name: 'Helper Hero',
    description: 'Help 10 students',
    icon: 'superhero',
    color: '#EF4444',
    category: 'helping',
    criteria: { type: 'response_count', value: 10, description: 'Give 10 helpful responses' },
  },
  {
    id: 'support-superstar',
    name: 'Support Superstar',
    description: 'Help 50 students',
    icon: 'star',
    color: '#EC4899',
    category: 'helping',
    criteria: { type: 'response_count', value: 50, description: 'Give 50 helpful responses' },
  },

  // Engagement Badges
  {
    id: 'active-member',
    name: 'Active Member',
    description: 'Be active for 7 days',
    icon: 'account-circle',
    color: '#06B6D4',
    category: 'engagement',
    criteria: { type: 'active_days', value: 7, description: 'Active for 7 days' },
  },
  {
    id: 'community-champion',
    name: 'Community Champion',
    description: 'Be active for 30 days',
    icon: 'trophy',
    color: '#F97316',
    category: 'engagement',
    criteria: { type: 'active_days', value: 30, description: 'Active for 30 days' },
  },
  {
    id: 'forum-favorite',
    name: 'Forum Favorite',
    description: 'Get 10 helpful votes on your responses',
    icon: 'forum',
    color: '#6366F1',
    category: 'engagement',
    criteria: { type: 'helpful_votes', value: 10, description: 'Get 10 helpful votes' },
  },

  // Achievement Badges
  {
    id: 'streak-master',
    name: 'Streak Master',
    description: 'Maintain a 100-day streak',
    icon: 'fire',
    color: '#DC2626',
    category: 'achievement',
    criteria: { type: 'max_streak', value: 100, description: '100-day streak' },
  },
  {
    id: 'quick-responder',
    name: 'Quick Responder',
    description: 'Respond within 1 hour, 10 times',
    icon: 'flash',
    color: '#FBBF24',
    category: 'achievement',
    criteria: { type: 'quick_responses', value: 10, description: '10 quick responses' },
  },
  {
    id: 'category-expert',
    name: 'Category Expert',
    description: 'Become an expert in a category',
    icon: 'school',
    color: '#059669',
    category: 'achievement',
    criteria: { type: 'category_responses', value: 20, description: '20 responses in one category' },
  },
];

// ============================================
// BADGE OPERATIONS
// ============================================

export async function checkBadgeEligibility(userId: string, badgeId: string): Promise<boolean> {
  try {
    // Check if user already has this badge
    const userBadges = await getUserBadges(userId);
    if (userBadges.some((b) => b.badgeId === badgeId)) {
      return false; // Already earned
    }

    const badge = BADGE_DEFINITIONS.find((b) => b.id === badgeId);
    if (!badge) return false;

    // Get user stats
    const stats = await getUserStats(userId);

    // Check criteria
    switch (badge.criteria.type) {
      case 'check_in_count':
        return stats.checkInCount >= badge.criteria.value;
      case 'check_in_streak':
        return stats.checkInStreak >= badge.criteria.value;
      case 'response_count':
        return stats.responseCount >= badge.criteria.value;
      case 'active_days':
        return stats.activeDays >= badge.criteria.value;
      case 'helpful_votes':
        return stats.helpfulVotes >= badge.criteria.value;
      case 'max_streak':
        return stats.maxStreak >= badge.criteria.value;
      case 'quick_responses':
        return stats.quickResponses >= badge.criteria.value;
      case 'category_responses':
        // Check if user has 20+ responses in any category
        return Object.values(stats.categoryResponses).some((count) => count >= badge.criteria.value);
      default:
        return false;
    }
  } catch (error) {
    console.error('Error checking badge eligibility:', error);
    return false;
  }
}

export async function awardBadge(userId: string, badgeId: string): Promise<boolean> {
  try {
    const badgeDef = BADGE_DEFINITIONS.find((b) => b.id === badgeId);
    if (!badgeDef) return false;

    // 1. Resolve DB Badge UUID
    let dbBadgeId: string | null = null;

    // Check if badge exists in DB by name
    const { data: existingBadge, error: fetchError } = await supabase
      .from('badges')
      .select('id')
      .eq('name', badgeDef.name)
      .maybeSingle();

    if (existingBadge) {
      dbBadgeId = existingBadge.id;
    } else {
      // Create the badge if it doesn't exist
      const { data: newBadge, error: createError } = await supabase
        .from('badges')
        .insert({
          name: badgeDef.name,
          description: badgeDef.description,
          icon: badgeDef.icon,
          color: badgeDef.color,
          category: badgeDef.category,
          criteria: badgeDef.criteria
        })
        .select('id')
        .single();

      if (createError) {
        console.error("Error creating badge definition:", createError);
        return false;
      }
      dbBadgeId = newBadge.id;
    }

    // 2. Check if user already has this badge (using DB UUID)
    const { data: hasBadge } = await supabase
      .from('user_badges')
      .select('id')
      .eq('user_id', userId)
      .eq('badge_id', dbBadgeId)
      .maybeSingle();

    if (hasBadge) {
      return false; // Already earned
    }

    // 3. Award badge
    const { error: awardError } = await supabase
      .from('user_badges')
      .insert({
        user_id: userId,
        badge_id: dbBadgeId
      });

    if (awardError) throw awardError;

    // 4. Send notification & points
    await notifyBadgeEarned(userId, badgeDef.name, badgeDef.description);
    await awardBadgePoints(userId);

    return true;
  } catch (error) {
    console.error('Error awarding badge:', error);
    return false;
  }
}

export async function checkAllBadges(userId: string): Promise<string[]> {
  const awardedBadges: string[] = [];

  for (const badge of BADGE_DEFINITIONS) {
    const eligible = await checkBadgeEligibility(userId, badge.id);
    if (eligible) {
      const awarded = await awardBadge(userId, badge.id);
      if (awarded) {
        awardedBadges.push(badge.id);
      }
    }
  }

  return awardedBadges;
}

export async function getBadgeProgress(userId: string, badgeId: string): Promise<{
  current: number;
  target: number;
  percentage: number;
}> {
  const badge = BADGE_DEFINITIONS.find((b) => b.id === badgeId);
  if (!badge) {
    return { current: 0, target: 0, percentage: 0 };
  }

  const stats = await getUserStats(userId);
  let current = 0;

  switch (badge.criteria.type) {
    case 'check_in_count':
      current = stats.checkInCount;
      break;
    case 'check_in_streak':
      current = stats.checkInStreak;
      break;
    case 'response_count':
      current = stats.responseCount;
      break;
    case 'active_days':
      current = stats.activeDays;
      break;
    case 'helpful_votes':
      current = stats.helpfulVotes;
      break;
    case 'max_streak':
      current = stats.maxStreak;
      break;
    case 'quick_responses':
      current = stats.quickResponses;
      break;
    case 'category_responses':
      current = Math.max(...Object.values(stats.categoryResponses), 0);
      break;
  }

  const target = badge.criteria.value;
  const percentage = Math.min((current / target) * 100, 100);

  return { current, target, percentage };
}

// ============================================
// STREAK OPERATIONS
// ============================================

export async function updateCheckInStreak(userId: string): Promise<void> {
  try {
    const streak = await getStreak(userId, 'check-in');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (!streak) {
      // Create new streak
      await createStreak({
        userId,
        streakType: 'check-in',
        currentStreak: 1,
        longestStreak: 1,
        lastActivityDate: today,
      });
      return;
    }

    const lastActivity = new Date(streak.lastActivityDate);
    lastActivity.setHours(0, 0, 0, 0);
    const daysDiff = Math.floor((today.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));

    if (daysDiff === 0) {
      // Already checked in today
      return;
    } else if (daysDiff === 1) {
      // Continue streak
      const newStreak = streak.currentStreak + 1;
      await updateStreak(streak.id, {
        currentStreak: newStreak,
        longestStreak: Math.max(streak.longestStreak, newStreak),
        lastActivityDate: today,
      });

      // Check for milestone
      await checkStreakMilestones(userId, 'check-in', newStreak);
    } else {
      // Streak broken, reset
      await updateStreak(streak.id, {
        currentStreak: 1,
        lastActivityDate: today,
      });
    }
  } catch (error) {
    console.error('Error updating check-in streak:', error);
  }
}

export async function updateHelpingStreak(userId: string): Promise<void> {
  try {
    const streak = await getStreak(userId, 'helping');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (!streak) {
      await createStreak({
        userId,
        streakType: 'helping',
        currentStreak: 1,
        longestStreak: 1,
        lastActivityDate: today,
      });
      return;
    }

    const lastActivity = new Date(streak.lastActivityDate);
    lastActivity.setHours(0, 0, 0, 0);
    const daysDiff = Math.floor((today.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));

    if (daysDiff === 0) {
      return;
    } else if (daysDiff === 1) {
      const newStreak = streak.currentStreak + 1;
      await updateStreak(streak.id, {
        currentStreak: newStreak,
        longestStreak: Math.max(streak.longestStreak, newStreak),
        lastActivityDate: today,
      });
      await checkStreakMilestones(userId, 'helping', newStreak);
    } else {
      await updateStreak(streak.id, {
        currentStreak: 1,
        lastActivityDate: today,
      });
    }
  } catch (error) {
    console.error('Error updating helping streak:', error);
  }
}

export async function updateEngagementStreak(userId: string): Promise<void> {
  try {
    const streak = await getStreak(userId, 'engagement');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (!streak) {
      await createStreak({
        userId,
        streakType: 'engagement',
        currentStreak: 1,
        longestStreak: 1,
        lastActivityDate: today,
      });
      return;
    }

    const lastActivity = new Date(streak.lastActivityDate);
    lastActivity.setHours(0, 0, 0, 0);
    const daysDiff = Math.floor((today.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));

    if (daysDiff === 0) {
      return;
    } else if (daysDiff === 1) {
      const newStreak = streak.currentStreak + 1;
      await updateStreak(streak.id, {
        currentStreak: newStreak,
        longestStreak: Math.max(streak.longestStreak, newStreak),
        lastActivityDate: today,
      });
      await checkStreakMilestones(userId, 'engagement', newStreak);
    } else {
      await updateStreak(streak.id, {
        currentStreak: 1,
        lastActivityDate: today,
      });
    }
  } catch (error) {
    console.error('Error updating engagement streak:', error);
  }
}

/**
 * Update engagement streak when user attends a meeting
 */
export async function updateEngagementStreakFromMeeting(userId: string, meetingDate: Date): Promise<void> {
  try {
    const streak = await getStreak(userId, 'engagement');
    const meetingDay = new Date(meetingDate);
    meetingDay.setHours(0, 0, 0, 0);

    if (!streak) {
      await createStreak({
        userId,
        streakType: 'engagement',
        currentStreak: 1,
        longestStreak: 1,
        lastActivityDate: meetingDay,
      });
      return;
    }

    const lastActivity = new Date(streak.lastActivityDate);
    lastActivity.setHours(0, 0, 0, 0);
    const daysDiff = Math.floor((meetingDay.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));

    if (daysDiff === 0) {
      // Already counted for today
      return;
    } else if (daysDiff === 1) {
      // Continue streak
      const newStreak = streak.currentStreak + 1;
      await updateStreak(streak.id, {
        currentStreak: newStreak,
        longestStreak: Math.max(streak.longestStreak, newStreak),
        lastActivityDate: meetingDay,
      });
      await checkStreakMilestones(userId, 'engagement', newStreak);
    } else if (daysDiff <= 7) {
      // Grace period: if meeting is within 7 days, continue streak
      const newStreak = streak.currentStreak + 1;
      await updateStreak(streak.id, {
        currentStreak: newStreak,
        longestStreak: Math.max(streak.longestStreak, newStreak),
        lastActivityDate: meetingDay,
      });
      await checkStreakMilestones(userId, 'engagement', newStreak);
    } else {
      // Streak broken, reset
      await updateStreak(streak.id, {
        currentStreak: 1,
        lastActivityDate: meetingDay,
      });
    }
  } catch (error) {
    console.error('Error updating engagement streak from meeting:', error);
  }
}

export async function getStreakInfo(userId: string, streakType: 'check-in' | 'helping' | 'engagement') {
  try {
    const streak = await getStreak(userId, streakType);
    if (!streak) {
      return {
        current: 0,
        longest: 0,
        lastActivity: null,
      };
    }

    return {
      current: streak.currentStreak,
      longest: streak.longestStreak,
      lastActivity: streak.lastActivityDate,
    };
  } catch (error) {
    console.error('Error getting streak info:', error);
    return {
      current: 0,
      longest: 0,
      lastActivity: null,
    };
  }
}

export async function resetStreak(userId: string, streakType: 'check-in' | 'helping' | 'engagement'): Promise<void> {
  try {
    const streak = await getStreak(userId, streakType);
    if (streak) {
      await updateStreak(streak.id, {
        currentStreak: 0,
        lastActivityDate: new Date(),
      });
    }
  } catch (error) {
    console.error('Error resetting streak:', error);
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

async function getUserStats(userId: string) {
  // Get check-ins
  const { data: checkIns } = await supabase
    .from('check_ins')
    .select('*')
    .eq('user_id', userId);

  // Get replies
  const replies = await getReplies({ authorId: userId });

  // Get posts
  const allPosts = await getPosts();
  const posts = allPosts.filter((p) => p.authorId === userId);

  // Get streaks
  const checkInStreak = await getStreak(userId, 'check-in');
  const helpingStreak = await getStreak(userId, 'helping');
  const engagementStreak = await getStreak(userId, 'engagement');

  // Calculate stats
  const checkInCount = checkIns?.length || 0;
  const responseCount = replies.length || 0;
  const helpfulVotes = replies.reduce((sum, r) => sum + (r.isHelpful || 0), 0);

  // Active days (unique days with activity)
  const activeDaysSet = new Set<string>();
  [...(checkIns || []), ...replies, ...posts].forEach((item) => {
    const date = new Date(item.createdAt).toDateString();
    activeDaysSet.add(date);
  });
  const activeDays = activeDaysSet.size;

  // Category responses
  const categoryResponses: Record<string, number> = {};
  replies.forEach((r) => {
    // Get post category
    const post = allPosts.find((p) => p.id === r.postId);
    if (post) {
      categoryResponses[post.category] = (categoryResponses[post.category] || 0) + 1;
    }
  });

  // Quick responses (within 1 hour)
  const quickResponses = replies.filter((r) => {
    const replyTime = new Date(r.createdAt).getTime();
    const post = allPosts.find((p) => p.id === r.postId);
    if (!post) return false;
    const postTime = new Date(post.createdAt).getTime();
    return replyTime - postTime <= 60 * 60 * 1000; // 1 hour
  }).length;

  // Max streak
  const maxStreak = Math.max(
    checkInStreak?.longestStreak || 0,
    helpingStreak?.longestStreak || 0,
    engagementStreak?.longestStreak || 0
  );

  return {
    checkInCount,
    checkInStreak: checkInStreak?.currentStreak || 0,
    responseCount,
    activeDays,
    helpfulVotes,
    maxStreak,
    quickResponses,
    categoryResponses,
  };
}

async function checkStreakMilestones(userId: string, streakType: string, days: number) {
  const milestones = [7, 14, 30, 60, 100];
  if (milestones.includes(days)) {
    await notifyStreakMilestone(userId, streakType, days);
    // Award points for streak milestone
    await awardStreakMilestonePoints(userId, days);
  }
}

