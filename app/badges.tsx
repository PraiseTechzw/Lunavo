/**
 * Badges Screen - View all badges and earned badges
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
import { BADGE_DEFINITIONS, getBadgeProgress, checkAllBadges } from '@/lib/gamification';
import { getUserBadges } from '@/lib/database';
import { getCurrentUser } from '@/lib/database';
import { useRoleGuard } from '@/hooks/use-auth-guard';

export default function BadgesScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  
  const { user, loading: authLoading } = useRoleGuard(
    ['student', 'peer-educator', 'peer-educator-executive', 'moderator', 'counselor', 'life-coach', 'student-affairs', 'admin'],
    '/(tabs)'
  );
  
  const [refreshing, setRefreshing] = useState(false);
  const [earnedBadgeIds, setEarnedBadgeIds] = useState<Set<string>>(new Set());
  const [badgeProgress, setBadgeProgress] = useState<Record<string, { current: number; target: number; percentage: number }>>({});
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'check-in' | 'helping' | 'engagement' | 'achievement'>('all');

  useEffect(() => {
    if (user) {
      loadBadges();
    }
  }, [user]);

  const loadBadges = async () => {
    try {
      // Get user's earned badges
      const userBadges = await getUserBadges(user!.id);
      const earnedIds = new Set(userBadges.map((ub: any) => ub.badge_id || ub.badge?.id));
      setEarnedBadgeIds(earnedIds);

      // Get progress for all badges
      const progressMap: Record<string, { current: number; target: number; percentage: number }> = {};
      for (const badge of BADGE_DEFINITIONS) {
        const progress = await getBadgeProgress(user!.id, badge.id);
        progressMap[badge.id] = progress;
      }
      setBadgeProgress(progressMap);

      // Check for newly eligible badges
      await checkAllBadges(user!.id);
    } catch (error) {
      console.error('Error loading badges:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadBadges();
    setRefreshing(false);
  };

  const getCategoryBadges = () => {
    if (selectedCategory === 'all') {
      return BADGE_DEFINITIONS;
    }
    return BADGE_DEFINITIONS.filter((b) => b.category === selectedCategory);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'check-in':
        return '#10B981';
      case 'helping':
        return '#F59E0B';
      case 'engagement':
        return '#3B82F6';
      case 'achievement':
        return '#8B5CF6';
      default:
        return colors.primary;
    }
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

  const earnedCount = earnedBadgeIds.size;
  const totalCount = BADGE_DEFINITIONS.length;
  const categories: Array<'all' | 'check-in' | 'helping' | 'engagement' | 'achievement'> = [
    'all',
    'check-in',
    'helping',
    'engagement',
    'achievement',
  ];

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
              Badges
            </ThemedText>
            <View style={{ width: 24 }} />
          </View>

          {/* Progress Card */}
          <View style={[styles.progressCard, { backgroundColor: colors.card }, createShadow(2, '#000', 0.1)]}>
            <View style={styles.progressHeader}>
              <MaterialIcons name="emoji-events" size={32} color={colors.primary} />
              <View style={styles.progressInfo}>
                <ThemedText type="h3" style={{ color: colors.text }}>
                  Badge Collection
                </ThemedText>
                <ThemedText type="body" style={{ color: colors.icon }}>
                  {earnedCount} of {totalCount} badges earned
                </ThemedText>
              </View>
            </View>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${(earnedCount / totalCount) * 100}%`,
                    backgroundColor: colors.primary,
                  },
                ]}
              />
            </View>
          </View>

          {/* Category Filters */}
          <View style={styles.filtersContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.filterChip,
                    {
                      backgroundColor: selectedCategory === category ? colors.primary : colors.surface,
                    },
                  ]}
                  onPress={() => setSelectedCategory(category)}
                >
                  <ThemedText
                    type="small"
                    style={{
                      color: selectedCategory === category ? '#FFFFFF' : colors.text,
                      fontWeight: '600',
                    }}
                  >
                    {category === 'all' ? 'All' : category.charAt(0).toUpperCase() + category.slice(1).replace('-', ' ')}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Badges List */}
          <View style={styles.badgesSection}>
            {getCategoryBadges().map((badge) => {
              const isEarned = earnedBadgeIds.has(badge.id);
              const progress = badgeProgress[badge.id] || { current: 0, target: 0, percentage: 0 };

              return (
                <View
                  key={badge.id}
                  style={[
                    styles.badgeCard,
                    {
                      backgroundColor: colors.card,
                      borderWidth: isEarned ? 2 : 1,
                      borderColor: isEarned ? badge.color : colors.border,
                      opacity: isEarned ? 1 : 0.7,
                    },
                    createShadow(2, '#000', 0.1),
                  ]}
                >
                  <View style={styles.badgeHeader}>
                    <View
                      style={[
                        styles.badgeIcon,
                        {
                          backgroundColor: badge.color + (isEarned ? '20' : '10'),
                        },
                      ]}
                    >
                      <MaterialIcons
                        name={badge.icon as any}
                        size={32}
                        color={isEarned ? badge.color : colors.icon}
                      />
                      {isEarned && (
                        <View style={[styles.earnedBadge, { backgroundColor: badge.color }]}>
                          <MaterialIcons name="check" size={16} color="#FFFFFF" />
                        </View>
                      )}
                    </View>
                    <View style={styles.badgeInfo}>
                      <View style={styles.badgeTitleRow}>
                        <ThemedText type="body" style={{ fontWeight: '600', color: colors.text }}>
                          {badge.name}
                        </ThemedText>
                        {isEarned && (
                          <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(badge.category) + '20' }]}>
                            <ThemedText type="small" style={{ color: getCategoryColor(badge.category), fontSize: 10 }}>
                              {badge.category}
                            </ThemedText>
                          </View>
                        )}
                      </View>
                      <ThemedText type="small" style={{ color: colors.icon, marginTop: Spacing.xs }}>
                        {badge.description}
                      </ThemedText>
                    </View>
                  </View>

                  {!isEarned && (
                    <View style={styles.progressContainer}>
                      <View style={styles.progressInfoRow}>
                        <ThemedText type="small" style={{ color: colors.icon }}>
                          {badge.criteria.description}
                        </ThemedText>
                        <ThemedText type="small" style={{ color: colors.text, fontWeight: '600' }}>
                          {progress.current} / {progress.target}
                        </ThemedText>
                      </View>
                      <View style={styles.progressBar}>
                        <View
                          style={[
                            styles.progressFill,
                            {
                              width: `${progress.percentage}%`,
                              backgroundColor: badge.color,
                            },
                          ]}
                        />
                      </View>
                    </View>
                  )}

                  {isEarned && (
                    <View style={styles.earnedContainer}>
                      <MaterialIcons name="check-circle" size={20} color={badge.color} />
                      <ThemedText type="small" style={{ color: badge.color, marginLeft: Spacing.xs, fontWeight: '600' }}>
                        Earned!
                      </ThemedText>
                    </View>
                  )}
                </View>
              );
            })}
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
  progressCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  progressInfo: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: BorderRadius.full,
  },
  filtersContainer: {
    marginBottom: Spacing.lg,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    marginRight: Spacing.sm,
  },
  badgesSection: {
    marginBottom: Spacing.lg,
  },
  badgeCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  badgeHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  badgeIcon: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
    position: 'relative',
  },
  earnedBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  badgeInfo: {
    flex: 1,
  },
  badgeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  categoryBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  progressContainer: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  progressInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  earnedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
});

