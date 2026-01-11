/**
 * Rewards & Leaderboard Screen - Full Gamification Experience
 */

import { ThemedText } from '@/app/components/themed-text';
import { ThemedView } from '@/app/components/themed-view';
import { BorderRadius, Colors, PlatformStyles, Spacing } from '@/app/constants/theme';
import { useColorScheme } from '@/app/hooks/use-color-scheme';
import { getCurrentUser, getUsers } from '@/lib/database';
import { BADGE_DEFINITIONS } from '@/lib/gamification';
import { getPointsHistory, getUserPoints, POINTS_CONFIG } from '@/lib/points-system';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeInRight } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function RewardsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'points' | 'leaderboard' | 'badges'>('points');
  const [pointsHistory, setPointsHistory] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [currentUserRank, setCurrentUserRank] = useState(0);
  const [userPoints, setUserPoints] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await getCurrentUser();
      if (!currentUser) return;

      const [history, points, allUsers] = await Promise.all([
        getPointsHistory(currentUser.id, 50),
        getUserPoints(currentUser.id),
        getUsers(100),
      ]);

      setPointsHistory(history);
      setUserPoints(points);

      // Build leaderboard
      const usersWithPoints = await Promise.all(
        allUsers.map(async (user) => ({
          id: user.id,
          name: user.fullName || user.username || user.pseudonym,
          pseudonym: user.pseudonym,
          points: await getUserPoints(user.id),
        }))
      );

      const sorted = usersWithPoints
        .sort((a, b) => b.points - a.points)
        .slice(0, 50);

      setLeaderboard(sorted);

      const rank = sorted.findIndex((u) => u.id === currentUser.id) + 1;
      setCurrentUserRank(rank);
    } catch (error) {
      console.error('Error loading rewards data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ThemedView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <ThemedText type="h1">Rewards</ThemedText>
          <View style={{ width: 40 }} />
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'points' && { backgroundColor: colors.primary }]}
            onPress={() => setActiveTab('points')}
          >
            <ThemedText style={[styles.tabText, activeTab === 'points' && styles.tabTextActive]}>
              Points
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'leaderboard' && { backgroundColor: colors.primary }]}
            onPress={() => setActiveTab('leaderboard')}
          >
            <ThemedText style={[styles.tabText, activeTab === 'leaderboard' && styles.tabTextActive]}>
              Leaderboard
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'badges' && { backgroundColor: colors.primary }]}
            onPress={() => setActiveTab('badges')}
          >
            <ThemedText style={[styles.tabText, activeTab === 'badges' && styles.tabTextActive]}>
              Badges
            </ThemedText>
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Points Tab */}
          {activeTab === 'points' && (
            <Animated.View entering={FadeIn}>
              <View style={styles.section}>
                <ThemedText type="h2" style={styles.sectionTitle}>How to Earn Points</ThemedText>
                <View style={styles.pointsGuide}>
                  {Object.entries(POINTS_CONFIG).map(([key, value], idx) => {
                    if (typeof value === 'object') return null;
                    const icons: Record<string, string> = {
                      checkIn: 'calendar',
                      dailyCheckIn: 'today',
                      helpfulResponse: 'thumb-up',
                      firstResponse: 'chat',
                      postCreated: 'create',
                      replyGiven: 'forum',
                      meetingAttended: 'people',
                      badgeEarned: 'stars',
                    };
                    return (
                      <Animated.View key={key} entering={FadeInRight.delay(idx * 50)}>
                        <View style={[styles.pointsGuideItem, { backgroundColor: colors.card }]}>
                          <MaterialIcons name={icons[key] || 'star'} size={24} color={colors.primary} />
                          <View style={styles.pointsGuideContent}>
                            <ThemedText style={styles.pointsGuideName}>
                              {key.replace(/([A-Z])/g, ' $1').trim()}
                            </ThemedText>
                            <ThemedText style={styles.pointsGuideValue}>+{value} points</ThemedText>
                          </View>
                        </View>
                      </Animated.View>
                    );
                  })}
                </View>
              </View>

              <View style={styles.section}>
                <ThemedText type="h2" style={styles.sectionTitle}>Transaction History</ThemedText>
                {pointsHistory.length === 0 ? (
                  <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
                    <Ionicons name="receipt-outline" size={48} color={colors.icon} />
                    <ThemedText style={styles.emptyText}>No transactions yet</ThemedText>
                  </View>
                ) : (
                  pointsHistory.map((transaction, idx) => (
                    <Animated.View key={transaction.id} entering={FadeInDown.delay(idx * 30)}>
                      <View style={[styles.transactionItem, { backgroundColor: colors.card }]}>
                        <View style={[styles.transactionIcon, { backgroundColor: transaction.type === 'earned' ? colors.success + '20' : colors.danger + '20' }]}>
                          <Ionicons
                            name={transaction.type === 'earned' ? 'arrow-up' : 'arrow-down'}
                            size={20}
                            color={transaction.type === 'earned' ? colors.success : colors.danger}
                          />
                        </View>
                        <View style={styles.transactionContent}>
                          <ThemedText style={styles.transactionDesc}>{transaction.description}</ThemedText>
                          <ThemedText style={styles.transactionCategory}>{transaction.category}</ThemedText>
                          <ThemedText style={styles.transactionDate}>
                            {formatDistanceToNow(new Date(transaction.createdAt), { addSuffix: true })}
                          </ThemedText>
                        </View>
                        <ThemedText style={[styles.transactionAmount, { color: transaction.type === 'earned' ? colors.success : colors.danger }]}>
                          {transaction.type === 'earned' ? '+' : '-'}{transaction.amount}
                        </ThemedText>
                      </View>
                    </Animated.View>
                  ))
                )}
              </View>
            </Animated.View>
          )}

          {/* Leaderboard Tab */}
          {activeTab === 'leaderboard' && (
            <Animated.View entering={FadeIn}>
              {currentUserRank > 0 && (
                <View style={styles.section}>
                  <LinearGradient
                    colors={colors.gradients.primary as any}
                    style={styles.rankCard}
                  >
                    <ThemedText style={styles.rankLabel}>Your Rank</ThemedText>
                    <ThemedText style={styles.rankValue}>#{currentUserRank}</ThemedText>
                    <ThemedText style={styles.rankPoints}>{userPoints} points</ThemedText>
                  </LinearGradient>
                </View>
              )}

              <View style={styles.section}>
                <ThemedText type="h2" style={styles.sectionTitle}>Top Contributors</ThemedText>
                {leaderboard.map((user, idx) => (
                  <Animated.View key={user.id} entering={FadeInDown.delay(idx * 40)}>
                    <View style={[styles.leaderboardItem, { backgroundColor: colors.card }]}>
                      <View style={[styles.rankBadge, idx < 3 && styles.topRankBadge]}>
                        {idx < 3 ? (
                          <MaterialIcons
                            name="emoji-events"
                            size={24}
                            color={idx === 0 ? '#FFD700' : idx === 1 ? '#C0C0C0' : '#CD7F32'}
                          />
                        ) : (
                          <ThemedText style={styles.rankNumber}>{idx + 1}</ThemedText>
                        )}
                      </View>
                      <View style={styles.leaderboardContent}>
                        <ThemedText style={styles.leaderboardName}>{user.pseudonym}</ThemedText>
                        <ThemedText style={styles.leaderboardPoints}>{user.points} points</ThemedText>
                      </View>
                    </View>
                  </Animated.View>
                ))}
              </View>
            </Animated.View>
          )}

          {/* Badges Tab */}
          {activeTab === 'badges' && (
            <Animated.View entering={FadeIn}>
              <View style={styles.section}>
                <ThemedText type="h2" style={styles.sectionTitle}>All Badges</ThemedText>
                <View style={styles.badgesGrid}>
                  {BADGE_DEFINITIONS.map((badge, idx) => (
                    <Animated.View key={badge.id} entering={FadeInDown.delay(idx * 50)} style={styles.badgeCardWrapper}>
                      <View style={[styles.badgeCard, { backgroundColor: colors.card }]}>
                        <View style={[styles.badgeIconContainer, { backgroundColor: badge.color + '20' }]}>
                          <MaterialIcons name={badge.icon as any} size={32} color={badge.color} />
                        </View>
                        <ThemedText style={styles.badgeName}>{badge.name}</ThemedText>
                        <ThemedText style={styles.badgeDesc}>{badge.description}</ThemedText>
                        <View style={[styles.badgeCategory, { backgroundColor: colors.surface }]}>
                          <ThemedText style={styles.badgeCategoryText}>{badge.category}</ThemedText>
                        </View>
                      </View>
                    </Animated.View>
                  ))}
                </View>
              </View>
            </Animated.View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    backgroundColor: '#E2E8F0',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#FFF',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  section: {
    padding: Spacing.lg,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  pointsGuide: {
    gap: Spacing.sm,
  },
  pointsGuideItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    ...PlatformStyles.shadow,
  },
  pointsGuideContent: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  pointsGuideName: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  pointsGuideValue: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
    ...PlatformStyles.shadow,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  transactionContent: {
    flex: 1,
  },
  transactionDesc: {
    fontSize: 14,
    fontWeight: '600',
  },
  transactionCategory: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
    textTransform: 'capitalize',
  },
  transactionDate: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: 18,
    fontWeight: '800',
  },
  rankCard: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.xxl,
    alignItems: 'center',
    ...PlatformStyles.premiumShadow,
  },
  rankLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontWeight: '600',
  },
  rankValue: {
    color: '#FFF',
    fontSize: 48,
    fontWeight: '900',
    marginVertical: Spacing.xs,
  },
  rankPoints: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 16,
    fontWeight: '600',
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
    ...PlatformStyles.shadow,
  },
  rankBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
    backgroundColor: '#E2E8F0',
  },
  topRankBadge: {
    backgroundColor: 'transparent',
  },
  rankNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: '#64748B',
  },
  leaderboardContent: {
    flex: 1,
  },
  leaderboardName: {
    fontSize: 16,
    fontWeight: '700',
  },
  leaderboardPoints: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -Spacing.xs,
  },
  badgeCardWrapper: {
    width: '50%',
    padding: Spacing.xs,
  },
  badgeCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    ...PlatformStyles.shadow,
  },
  badgeIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  badgeName: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  badgeDesc: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  badgeCategory: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  badgeCategoryText: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    color: '#64748B',
  },
  emptyState: {
    padding: Spacing.xxl,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    ...PlatformStyles.shadow,
  },
  emptyText: {
    marginTop: Spacing.md,
    color: '#64748B',
  },
});
