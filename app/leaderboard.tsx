/**
 * Leaderboard Screen - Rankings and statistics
 */

import { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ThemedView } from '@/app/components/themed-view';
import { ThemedText } from '@/app/components/themed-text';
import { MaterialIcons } from '@expo/vector-icons';
import { useColorScheme } from '@/app/hooks/use-color-scheme';
import { Colors, Spacing, BorderRadius } from '@/app/constants/theme';
import { createShadow, getCursorStyle } from '@/app/utils/platform-styles';
import { supabase } from '@/lib/supabase';
import { getPosts, getReplies, getUserStreaks , getCurrentUser } from '@/lib/database';

import { useRoleGuard } from '@/hooks/use-auth-guard';

type LeaderboardCategory = 'helpful' | 'engaged' | 'streaks' | 'badges' | 'category-expert';
type TimeFilter = 'all-time' | 'monthly' | 'weekly';

interface LeaderboardEntry {
  userId: string;
  pseudonym: string;
  value: number;
  rank: number;
  category?: string;
}

export default function LeaderboardScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  
  const { user, loading: authLoading } = useRoleGuard(
    ['student', 'peer-educator', 'peer-educator-executive', 'moderator', 'counselor', 'life-coach', 'student-affairs', 'admin'],
    '/(tabs)'
  );
  
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<LeaderboardCategory>('helpful');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all-time');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);

  useEffect(() => {
    if (user) {
      loadLeaderboard();
    }
  }, [user, selectedCategory, timeFilter]);

  const loadLeaderboard = async () => {
    try {
      let entries: LeaderboardEntry[] = [];

      switch (selectedCategory) {
        case 'helpful':
          entries = await getHelpfulLeaderboard();
          break;
        case 'engaged':
          entries = await getEngagedLeaderboard();
          break;
        case 'streaks':
          entries = await getStreaksLeaderboard();
          break;
        case 'badges':
          entries = await getBadgesLeaderboard();
          break;
        case 'category-expert':
          entries = await getCategoryExpertLeaderboard();
          break;
      }

      // Apply time filter
      entries = applyTimeFilter(entries, timeFilter);

      // Sort and rank
      entries.sort((a, b) => b.value - a.value);
      entries = entries.map((entry, index) => ({
        ...entry,
        rank: index + 1,
      }));

      setLeaderboard(entries);

      // Find user's rank
      if (user) {
        const userEntry = entries.find((e) => e.userId === user.id);
        setUserRank(userEntry ? userEntry.rank : null);
      }
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    }
  };

  const getHelpfulLeaderboard = async (): Promise<LeaderboardEntry[]> => {
    const posts = await getPosts();
    const allReplies = await Promise.all(posts.map((p) => getReplies(p.id).catch(() => [])));
    const replies = allReplies.flat();

    // Count helpful responses per user
    const userCounts: Record<string, { count: number; pseudonym: string }> = {};
    replies.forEach((reply) => {
      if (reply.isHelpful > 0) {
        if (!userCounts[reply.authorId]) {
          userCounts[reply.authorId] = { count: 0, pseudonym: reply.authorPseudonym };
        }
        userCounts[reply.authorId].count += reply.isHelpful;
      }
    });

    return Object.entries(userCounts).map(([userId, data]) => ({
      userId,
      pseudonym: data.pseudonym,
      value: data.count,
      rank: 0,
    }));
  };

  const getEngagedLeaderboard = async (): Promise<LeaderboardEntry[]> => {
    const posts = await getPosts();
    const allReplies = await Promise.all(posts.map((p) => getReplies(p.id).catch(() => [])));
    const replies = allReplies.flat();

    // Count total activity (posts + replies)
    const userCounts: Record<string, { count: number; pseudonym: string }> = {};
    
    posts.forEach((post) => {
      if (!userCounts[post.authorId]) {
        userCounts[post.authorId] = { count: 0, pseudonym: post.authorPseudonym };
      }
      userCounts[post.authorId].count += 1;
    });

    replies.forEach((reply) => {
      if (!userCounts[reply.authorId]) {
        userCounts[reply.authorId] = { count: 0, pseudonym: reply.authorPseudonym };
      }
      userCounts[reply.authorId].count += 1;
    });

    return Object.entries(userCounts).map(([userId, data]) => ({
      userId,
      pseudonym: data.pseudonym,
      value: data.count,
      rank: 0,
    }));
  };

  const getStreaksLeaderboard = async (): Promise<LeaderboardEntry[]> => {
    const { data: users } = await supabase
      .from('users')
      .select('id, pseudonym');

    const entries: LeaderboardEntry[] = [];

    for (const user of users || []) {
      const streaks = await getUserStreaks(user.id);
      const maxStreak = Math.max(
        ...streaks.map((s) => s.longestStreak),
        0
      );
      if (maxStreak > 0) {
        entries.push({
          userId: user.id,
          pseudonym: user.pseudonym,
          value: maxStreak,
          rank: 0,
        });
      }
    }

    return entries;
  };

  const getBadgesLeaderboard = async (): Promise<LeaderboardEntry[]> => {
    const { data: userBadges } = await supabase
      .from('user_badges')
      .select('user_id, users!inner(pseudonym)');

    const userCounts: Record<string, { count: number; pseudonym: string }> = {};

    userBadges?.forEach((ub: any) => {
      const userId = ub.user_id;
      const pseudonym = ub.users?.pseudonym || 'Anonymous';
      if (!userCounts[userId]) {
        userCounts[userId] = { count: 0, pseudonym };
      }
      userCounts[userId].count += 1;
    });

    return Object.entries(userCounts).map(([userId, data]) => ({
      userId,
      pseudonym: data.pseudonym,
      value: data.count,
      rank: 0,
    }));
  };

  const getCategoryExpertLeaderboard = async (): Promise<LeaderboardEntry[]> => {
    const posts = await getPosts();
    const allReplies = await Promise.all(posts.map((p) => getReplies(p.id).catch(() => [])));
    const replies = allReplies.flat();

    // Count responses per category per user
    const userCategoryCounts: Record<string, Record<string, { count: number; pseudonym: string }>> = {};

    replies.forEach((reply) => {
      const post = posts.find((p) => p.id === reply.postId);
      if (!post) return;

      if (!userCategoryCounts[reply.authorId]) {
        userCategoryCounts[reply.authorId] = {};
      }
      if (!userCategoryCounts[reply.authorId][post.category]) {
        userCategoryCounts[reply.authorId][post.category] = {
          count: 0,
          pseudonym: reply.authorPseudonym,
        };
      }
      userCategoryCounts[reply.authorId][post.category].count += 1;
    });

    // Find max category count per user
    const entries: LeaderboardEntry[] = [];
    Object.entries(userCategoryCounts).forEach(([userId, categories]) => {
      const maxCategory = Object.entries(categories).reduce((max, [cat, data]) =>
        data.count > max.count ? { category: cat, ...data } : max,
        { category: '', count: 0, pseudonym: '' }
      );
      if (maxCategory.count >= 20) {
        entries.push({
          userId,
          pseudonym: maxCategory.pseudonym,
          value: maxCategory.count,
          rank: 0,
          category: maxCategory.category,
        });
      }
    });

    return entries;
  };

  const applyTimeFilter = (entries: LeaderboardEntry[], filter: TimeFilter): LeaderboardEntry[] => {
    // For now, return all entries. In production, filter by date
    return entries;
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadLeaderboard();
    setRefreshing(false);
  };

  const getCategoryLabel = (category: LeaderboardCategory) => {
    switch (category) {
      case 'helpful':
        return 'Most Helpful';
      case 'engaged':
        return 'Most Engaged';
      case 'streaks':
        return 'Longest Streaks';
      case 'badges':
        return 'Most Badges';
      case 'category-expert':
        return 'Category Experts';
    }
  };

  const getCategoryIcon = (category: LeaderboardCategory) => {
    switch (category) {
      case 'helpful':
        return 'thumb-up';
      case 'engaged':
        return 'forum';
      case 'streaks':
        return 'local-fire-department';
      case 'badges':
        return 'emoji-events';
      case 'category-expert':
        return 'school';
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return null;
  };

  if (authLoading) {
    return (
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <ThemedView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ThemedText>Loading...</ThemedText>
        </ThemedView>
      </SafeAreaView>
    );
  }

  const categories: LeaderboardCategory[] = ['helpful', 'engaged', 'streaks', 'badges', 'category-expert'];
  const timeFilters: TimeFilter[] = ['all-time', 'monthly', 'weekly'];

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ThemedView style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
          }
        >
          {/* Header */}
          <View style={[styles.header, { backgroundColor: colors.background }]}>
            <TouchableOpacity onPress={() => router.back()} style={getCursorStyle()}>
              <MaterialIcons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <ThemedText type="h2" style={styles.headerTitle}>
              Leaderboard
            </ThemedText>
            <View style={{ width: 24 }} />
          </View>

          {/* User Rank Card */}
          {userRank !== null && (
            <View style={[styles.rankCard, { backgroundColor: colors.primary + '20' }]}>
              <MaterialIcons name="emoji-events" size={32} color={colors.primary} />
              <View style={styles.rankInfo}>
                <ThemedText type="body" style={{ fontWeight: '600', color: colors.text }}>
                  Your Rank
                </ThemedText>
                <ThemedText type="h2" style={{ color: colors.primary, fontWeight: '700' }}>
                  #{userRank}
                </ThemedText>
              </View>
            </View>
          )}

          {/* Category Filters */}
          <View style={styles.filtersContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryChip,
                    {
                      backgroundColor: selectedCategory === category ? colors.primary : colors.surface,
                    },
                  ]}
                  onPress={() => setSelectedCategory(category)}
                >
                  <MaterialIcons
                    name={getCategoryIcon(category) as any}
                    size={18}
                    color={selectedCategory === category ? '#FFFFFF' : colors.text}
                  />
                  <ThemedText
                    type="small"
                    style={{
                      color: selectedCategory === category ? '#FFFFFF' : colors.text,
                      fontWeight: '600',
                      marginLeft: Spacing.xs,
                    }}
                  >
                    {getCategoryLabel(category)}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Time Filters */}
          <View style={styles.timeFiltersContainer}>
            {timeFilters.map((filter) => (
              <TouchableOpacity
                key={filter}
                style={[
                  styles.timeFilterChip,
                  {
                    backgroundColor: timeFilter === filter ? colors.primary : colors.surface,
                  },
                ]}
                onPress={() => setTimeFilter(filter)}
              >
                <ThemedText
                  type="small"
                  style={{
                    color: timeFilter === filter ? '#FFFFFF' : colors.text,
                    fontWeight: '600',
                  }}
                >
                  {filter === 'all-time' ? 'All Time' : filter.charAt(0).toUpperCase() + filter.slice(1)}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>

          {/* Leaderboard List */}
          <View style={styles.leaderboardSection}>
            {leaderboard.length === 0 ? (
              <View style={styles.emptyContainer}>
                <MaterialIcons name="leaderboard" size={64} color={colors.icon} />
                <ThemedText type="body" style={[styles.emptyText, { color: colors.icon }]}>
                  No rankings yet
                </ThemedText>
              </View>
            ) : (
              leaderboard.map((entry, index) => {
                const rankIcon = getRankIcon(entry.rank);
                const isCurrentUser = entry.userId === user?.id;

                return (
                  <View
                    key={entry.userId}
                    style={[
                      styles.leaderboardItem,
                      {
                        backgroundColor: isCurrentUser ? colors.primary + '10' : colors.card,
                        borderWidth: isCurrentUser ? 2 : 1,
                        borderColor: isCurrentUser ? colors.primary : colors.border,
                      },
                      createShadow(2, '#000', 0.1),
                    ]}
                  >
                    <View style={styles.rankColumn}>
                      {rankIcon ? (
                        <ThemedText type="h3">{rankIcon}</ThemedText>
                      ) : (
                        <View style={[styles.rankCircle, { backgroundColor: colors.surface }]}>
                          <ThemedText type="body" style={{ fontWeight: '700', color: colors.text }}>
                            {entry.rank}
                          </ThemedText>
                        </View>
                      )}
                    </View>
                    <View style={styles.userColumn}>
                      <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
                        <MaterialIcons name="person" size={20} color="#FFFFFF" />
                      </View>
                      <View style={styles.userInfo}>
                        <ThemedText type="body" style={{ fontWeight: '600', color: colors.text }}>
                          {entry.pseudonym}
                        </ThemedText>
                        {entry.category && (
                          <ThemedText type="small" style={{ color: colors.icon }}>
                            {entry.category}
                          </ThemedText>
                        )}
                      </View>
                    </View>
                    <View style={styles.valueColumn}>
                      <ThemedText type="h3" style={{ fontWeight: '700', color: colors.primary }}>
                        {entry.value}
                      </ThemedText>
                    </View>
                  </View>
                );
              })
            )}
          </View>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: 80,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  headerTitle: {
    fontWeight: '700',
    fontSize: 20,
  },
  rankCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  rankInfo: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  filtersContainer: {
    marginBottom: Spacing.md,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    marginRight: Spacing.sm,
  },
  timeFiltersContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  timeFilterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  leaderboardSection: {
    marginBottom: Spacing.lg,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  rankColumn: {
    width: 40,
    alignItems: 'center',
  },
  rankCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userColumn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: Spacing.md,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  userInfo: {
    flex: 1,
  },
  valueColumn: {
    alignItems: 'flex-end',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xxl,
    marginTop: Spacing.xxl,
  },
  emptyText: {
    marginTop: Spacing.md,
    textAlign: 'center',
  },
});


