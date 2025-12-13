/**
 * Trend Analysis - Student Affairs
 * Time-series charts and seasonal patterns
 * All data is anonymized
 */

import { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ThemedView } from '@/app/components/themed-view';
import { ThemedText } from '@/app/components/themed-text';
import { MaterialIcons } from '@expo/vector-icons';
import { useColorScheme } from '@/app/hooks/use-color-scheme';
import { Colors, Spacing, BorderRadius } from '@/app/constants/theme';
import { createShadow, getCursorStyle } from '@/app/utils/platform-styles';
import { getPosts, getEscalations } from '@/lib/database';
import { PostCategory, EscalationLevel } from '@/app/types';
import { CATEGORIES } from '@/app/constants/categories';
import { useRoleGuard } from '@/hooks/use-auth-guard';
import { format, subDays, startOfDay, parseISO } from 'date-fns';

export default function TrendsAnalysisScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  
  const { user, loading: authLoading } = useRoleGuard(['student-affairs', 'admin'], '/(tabs)');
  
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [categoryTrends, setCategoryTrends] = useState<Record<string, Record<string, number>>>({});
  const [escalationTrends, setEscalationTrends] = useState<Record<string, number>>({});
  const [dailyPosts, setDailyPosts] = useState<Record<string, number>>({});
  const [seasonalPatterns, setSeasonalPatterns] = useState<Record<string, number>>({});

  useEffect(() => {
    if (user) {
      loadTrends();
    }
  }, [user, timeRange]);

  const loadTrends = async () => {
    try {
      const [posts, escalations] = await Promise.all([
        getPosts(),
        getEscalations(),
      ]);

      // Calculate date range
      const now = new Date();
      let startDate: Date;
      switch (timeRange) {
        case '7d':
          startDate = subDays(now, 7);
          break;
        case '30d':
          startDate = subDays(now, 30);
          break;
        case '90d':
          startDate = subDays(now, 90);
          break;
        default:
          startDate = new Date(0);
      }

      // Filter posts by date range
      const filteredPosts = posts.filter((p) => new Date(p.createdAt) >= startDate);
      const filteredEscalations = escalations.filter(
        (e) => new Date(e.detectedAt) >= startDate
      );

      // Daily posts trend (anonymized - only dates)
      const daily: Record<string, number> = {};
      filteredPosts.forEach((post) => {
        const dateKey = format(new Date(post.createdAt), 'yyyy-MM-dd');
        daily[dateKey] = (daily[dateKey] || 0) + 1;
      });
      setDailyPosts(daily);

      // Category trends over time (anonymized)
      const categoryTrendsData: Record<string, Record<string, number>> = {};
      filteredPosts.forEach((post) => {
        const dateKey = format(new Date(post.createdAt), 'yyyy-MM-dd');
        if (!categoryTrendsData[post.category]) {
          categoryTrendsData[post.category] = {};
        }
        categoryTrendsData[post.category][dateKey] =
          (categoryTrendsData[post.category][dateKey] || 0) + 1;
      });
      setCategoryTrends(categoryTrendsData);

      // Escalation trends (anonymized)
      const escalationTrendsData: Record<string, number> = {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
      };
      filteredEscalations.forEach((e) => {
        escalationTrendsData[e.escalationLevel] =
          (escalationTrendsData[e.escalationLevel] || 0) + 1;
      });
      setEscalationTrends(escalationTrendsData);

      // Seasonal patterns (anonymized - only month)
      const seasonal: Record<string, number> = {};
      filteredPosts.forEach((post) => {
        const monthKey = format(new Date(post.createdAt), 'MMMM');
        seasonal[monthKey] = (seasonal[monthKey] || 0) + 1;
      });
      setSeasonalPatterns(seasonal);
    } catch (error) {
      console.error('Error loading trends:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadTrends();
    setRefreshing(false);
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

  const dailyPostsArray = Object.entries(dailyPosts)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-14); // Last 14 days

  const maxDailyPosts = Math.max(...dailyPostsArray.map((d) => d[1]), 1);

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
              Trend Analysis
            </ThemedText>
            <View style={{ width: 24 }} />
          </View>

          {/* Time Range Selector */}
          <View style={styles.timeRangeContainer}>
            {(['7d', '30d', '90d', 'all'] as const).map((range) => (
              <TouchableOpacity
                key={range}
                style={[
                  styles.timeRangeButton,
                  {
                    backgroundColor: timeRange === range ? colors.primary : colors.surface,
                  },
                ]}
                onPress={() => setTimeRange(range)}
              >
                <ThemedText
                  type="small"
                  style={{
                    color: timeRange === range ? '#FFFFFF' : colors.text,
                    fontWeight: '600',
                  }}
                >
                  {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : range === '90d' ? '90 Days' : 'All Time'}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>

          {/* Daily Posts Trend */}
          <View style={[styles.section, { backgroundColor: colors.card }, createShadow(2, '#000', 0.1)]}>
            <ThemedText type="h3" style={styles.sectionTitle}>
              Daily Posts Trend
            </ThemedText>
            <View style={styles.chartContainer}>
              {dailyPostsArray.map(([date, count]) => {
                const dateObj = parseISO(date);
                const dayLabel = format(dateObj, 'MMM dd');
                return (
                  <View key={date} style={styles.barChartItem}>
                    <View style={styles.barContainer}>
                      <View
                        style={[
                          styles.bar,
                          {
                            height: `${(count / maxDailyPosts) * 100}%`,
                            backgroundColor: colors.primary,
                            minHeight: count > 0 ? 4 : 0,
                          },
                        ]}
                      />
                    </View>
                    <ThemedText type="small" style={{ color: colors.icon, fontSize: 10 }}>
                      {dayLabel}
                    </ThemedText>
                    <ThemedText type="small" style={{ color: colors.text, fontWeight: '600', fontSize: 10 }}>
                      {count}
                    </ThemedText>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Category Trends */}
          <View style={[styles.section, { backgroundColor: colors.card }, createShadow(2, '#000', 0.1)]}>
            <ThemedText type="h3" style={styles.sectionTitle}>
              Category Trends Over Time
            </ThemedText>
            {Object.entries(categoryTrends)
              .slice(0, 5)
              .map(([category, trends]) => {
                const categoryInfo = CATEGORIES.find((c) => c.id === category);
                const total = Object.values(trends).reduce((a, b) => a + b, 0);
                const trendEntries = Object.entries(trends).sort((a, b) => a[0].localeCompare(b[0])).slice(-7);
                const maxInCategory = Math.max(...trendEntries.map((t) => t[1]), 1);
                return (
                  <View key={category} style={styles.categoryTrendItem}>
                    <View style={styles.categoryTrendHeader}>
                      <ThemedText type="body" style={{ fontWeight: '600', color: colors.text }}>
                        {categoryInfo?.name || category}
                      </ThemedText>
                      <ThemedText type="small" style={{ color: colors.icon }}>
                        {total} posts
                      </ThemedText>
                    </View>
                    <View style={styles.miniChart}>
                      {trendEntries.map(([date, count]) => (
                        <View
                          key={date}
                          style={[
                            styles.miniBar,
                            {
                              height: `${(count / maxInCategory) * 100}%`,
                              backgroundColor: categoryInfo?.color || colors.primary,
                              minHeight: count > 0 ? 2 : 0,
                            },
                          ]}
                        />
                      ))}
                    </View>
                  </View>
                );
              })}
          </View>

          {/* Escalation Trends */}
          <View style={[styles.section, { backgroundColor: colors.card }, createShadow(2, '#000', 0.1)]}>
            <ThemedText type="h3" style={styles.sectionTitle}>
              Escalation Trends
            </ThemedText>
            {Object.entries(escalationTrends)
              .filter(([level]) => level !== 'none')
              .map(([level, count]) => {
                const levelColors: Record<string, string> = {
                  critical: '#EF4444',
                  high: '#F59E0B',
                  medium: '#3B82F6',
                  low: '#10B981',
                };
                const total = Object.values(escalationTrends).reduce((a, b) => a + b, 0);
                return (
                  <View key={level} style={styles.escalationTrendRow}>
                    <View style={styles.escalationTrendInfo}>
                      <View
                        style={[
                          styles.levelDot,
                          { backgroundColor: levelColors[level] || colors.primary },
                        ]}
                      />
                      <ThemedText type="body" style={{ fontWeight: '600', color: colors.text, marginLeft: Spacing.sm }}>
                        {level.toUpperCase()}
                      </ThemedText>
                    </View>
                    <View style={styles.trendBar}>
                      <View
                        style={[
                          styles.trendFill,
                          {
                            width: `${total > 0 ? (count / total) * 100 : 0}%`,
                            backgroundColor: levelColors[level] || colors.primary,
                          },
                        ]}
                      />
                    </View>
                    <ThemedText type="body" style={{ color: colors.text, marginLeft: Spacing.sm, minWidth: 40 }}>
                      {count}
                    </ThemedText>
                  </View>
                );
              })}
          </View>

          {/* Seasonal Patterns */}
          <View style={[styles.section, { backgroundColor: colors.card }, createShadow(2, '#000', 0.1)]}>
            <ThemedText type="h3" style={styles.sectionTitle}>
              Seasonal Patterns
            </ThemedText>
            <View style={styles.seasonalContainer}>
              {Object.entries(seasonalPatterns)
                .sort((a, b) => {
                  const monthOrder = [
                    'January', 'February', 'March', 'April', 'May', 'June',
                    'July', 'August', 'September', 'October', 'November', 'December'
                  ];
                  return monthOrder.indexOf(a[0]) - monthOrder.indexOf(b[0]);
                })
                .map(([month, count]) => {
                  const maxSeasonal = Math.max(...Object.values(seasonalPatterns), 1);
                  return (
                    <View key={month} style={styles.seasonalRow}>
                      <ThemedText type="body" style={{ fontWeight: '600', color: colors.text, minWidth: 100 }}>
                        {month}
                      </ThemedText>
                      <View style={styles.seasonalBar}>
                        <View
                          style={[
                            styles.seasonalFill,
                            {
                              width: `${(count / maxSeasonal) * 100}%`,
                              backgroundColor: colors.primary,
                            },
                          ]}
                        />
                      </View>
                      <ThemedText type="body" style={{ color: colors.text, marginLeft: Spacing.sm, minWidth: 40 }}>
                        {count}
                      </ThemedText>
                    </View>
                  );
                })}
            </View>
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
  timeRangeContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
  },
  timeRangeButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  section: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontWeight: '700',
    marginBottom: Spacing.md,
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 200,
    marginTop: Spacing.md,
  },
  barChartItem: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  barContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  bar: {
    width: '80%',
    borderRadius: BorderRadius.sm,
  },
  categoryTrendItem: {
    marginBottom: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  categoryTrendHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  miniChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 40,
    gap: 2,
  },
  miniBar: {
    flex: 1,
    borderRadius: 2,
  },
  escalationTrendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  escalationTrendInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 100,
  },
  levelDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  trendBar: {
    flex: 1,
    height: 24,
    backgroundColor: '#E0E0E0',
    borderRadius: BorderRadius.sm,
    overflow: 'hidden',
    marginHorizontal: Spacing.sm,
  },
  trendFill: {
    height: '100%',
    borderRadius: BorderRadius.sm,
  },
  seasonalContainer: {
    gap: Spacing.md,
  },
  seasonalRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seasonalBar: {
    flex: 1,
    height: 24,
    backgroundColor: '#E0E0E0',
    borderRadius: BorderRadius.sm,
    overflow: 'hidden',
    marginHorizontal: Spacing.sm,
  },
  seasonalFill: {
    height: '100%',
    borderRadius: BorderRadius.sm,
  },
});

