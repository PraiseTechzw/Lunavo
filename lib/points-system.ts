/**
 * Points & Rewards System
 */

import { supabase } from './supabase';
import { getCurrentUser } from './database';

// ============================================
// POINTS CONFIGURATION
// ============================================

export const POINTS_CONFIG = {
  checkIn: 10,
  dailyCheckIn: 5,
  helpfulResponse: 20,
  firstResponse: 15,
  postCreated: 5,
  replyGiven: 10,
  meetingAttended: 25,
  badgeEarned: 50,
  streakMilestone: {
    7: 30,
    14: 50,
    30: 100,
    60: 200,
    100: 500,
  },
};

// ============================================
// POINTS OPERATIONS
// ============================================

export interface PointsTransaction {
  id: string;
  userId: string;
  amount: number;
  type: 'earned' | 'spent';
  category: string;
  description: string;
  createdAt: Date;
}

export async function addPoints(
  userId: string,
  amount: number,
  category: string,
  description: string
): Promise<void> {
  try {
    // Get current points
    const currentPoints = await getUserPoints(userId);

    // Add transaction
    const { error } = await supabase
      .from('user_points')
      .upsert({
        user_id: userId,
        points: currentPoints + amount,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      });

    if (error) throw error;

    // Record transaction
    await recordPointsTransaction({
      userId,
      amount,
      type: 'earned',
      category,
      description,
    });
  } catch (error) {
    console.error('Error adding points:', error);
  }
}

export async function spendPoints(
  userId: string,
  amount: number,
  category: string,
  description: string
): Promise<boolean> {
  try {
    const currentPoints = await getUserPoints(userId);

    if (currentPoints < amount) {
      return false; // Insufficient points
    }

    // Deduct points
    const { error } = await supabase
      .from('user_points')
      .upsert({
        user_id: userId,
        points: currentPoints - amount,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      });

    if (error) throw error;

    // Record transaction
    await recordPointsTransaction({
      userId,
      amount,
      type: 'spent',
      category,
      description,
    });

    return true;
  } catch (error) {
    console.error('Error spending points:', error);
    return false;
  }
}

export async function getUserPoints(userId: string): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('user_points')
      .select('points')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // User doesn't have points record yet, create it
        await supabase
          .from('user_points')
          .insert({
            user_id: userId,
            points: 0,
          });
        return 0;
      }
      throw error;
    }

    return data?.points || 0;
  } catch (error) {
    console.error('Error getting user points:', error);
    return 0;
  }
}

export async function getPointsHistory(
  userId: string,
  limit: number = 50
): Promise<PointsTransaction[]> {
  try {
    const { data, error } = await supabase
      .from('points_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return (data || []).map((t: any) => ({
      id: t.id,
      userId: t.user_id,
      amount: t.amount,
      type: t.type,
      category: t.category,
      description: t.description,
      createdAt: new Date(t.created_at),
    }));
  } catch (error) {
    console.error('Error getting points history:', error);
    return [];
  }
}

async function recordPointsTransaction(transaction: {
  userId: string;
  amount: number;
  type: 'earned' | 'spent';
  category: string;
  description: string;
}): Promise<void> {
  try {
    const { error } = await supabase
      .from('points_transactions')
      .insert({
        user_id: transaction.userId,
        amount: transaction.amount,
        type: transaction.type,
        category: transaction.category,
        description: transaction.description,
      });

    if (error) throw error;
  } catch (error) {
    console.error('Error recording points transaction:', error);
  }
}

// ============================================
// POINTS AWARDING FUNCTIONS
// ============================================

export async function awardCheckInPoints(userId: string): Promise<void> {
  await addPoints(
    userId,
    POINTS_CONFIG.checkIn,
    'check-in',
    'Daily check-in completed'
  );
}

export async function awardHelpfulResponsePoints(userId: string): Promise<void> {
  await addPoints(
    userId,
    POINTS_CONFIG.helpfulResponse,
    'helping',
    'Helpful response given'
  );
}

export async function awardPostCreatedPoints(userId: string): Promise<void> {
  await addPoints(
    userId,
    POINTS_CONFIG.postCreated,
    'engagement',
    'Post created'
  );
}

export async function awardReplyPoints(userId: string): Promise<void> {
  await addPoints(
    userId,
    POINTS_CONFIG.replyGiven,
    'engagement',
    'Reply given'
  );
}

export async function awardMeetingAttendancePoints(userId: string): Promise<void> {
  await addPoints(
    userId,
    POINTS_CONFIG.meetingAttended,
    'meeting',
    'Meeting attended'
  );
}

export async function awardBadgePoints(userId: string): Promise<void> {
  await addPoints(
    userId,
    POINTS_CONFIG.badgeEarned,
    'achievement',
    'Badge earned'
  );
}

export async function awardStreakMilestonePoints(userId: string, days: number): Promise<void> {
  const points = POINTS_CONFIG.streakMilestone[days as keyof typeof POINTS_CONFIG.streakMilestone];
  if (points) {
    await addPoints(
      userId,
      points,
      'streak',
      `${days}-day streak milestone`
    );
  }
}


