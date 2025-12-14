/**
 * Trend Analysis - Student Affairs
 * Web-optimized time-series charts and seasonal patterns
 * All data is anonymized
 */

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { WebCard, WebContainer } from '@/components/web';
import { CATEGORIES } from '@/constants/categories';
import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { PostCategory } from '@/types';
import { getCursorStyle } from '@/utils/platform-styles';
import { useRoleGuard } from '@/hooks/use-auth-guard';
import { getEscalations, getPosts } from '@/lib/database';
import { MaterialIcons } from '@expo/vector-icons';
import { format, parseISO, subDays } from 'date-fns';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  Dimensions,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

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

  const handleExport = () => {
    if (Platform.OS === 'web') {
      const data = {
        timeRange,
        dailyPosts,
        categoryTrends,
        escalationTrends,
        seasonalPatterns,
        exportedAt: new Date().toISOString(),
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `trend-analysis-${timeRange}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else {
      Alert.alert('Export', 'Export functionality available on web.');
    }
  };

  if (authLoading) {
    return (
      <ThemedView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ThemedText>Loading...</ThemedText>
      </ThemedView>
    );
  }

  const dailyPostsArray = Object.entries(dailyPosts)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-14); // Last 14 days

  const maxDailyPosts = Math.max(...dailyPostsArray.map((d) => d[1]), 1);
  const totalEscalations = Object.values(escalationTrends).reduce((a, b) => a + b, 0);
  const maxSeasonal = Math.max(...Object.values(seasonalPatterns), 1);

  const content = (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
      }
    >
      {/* Page Header */}
      <View style={styles.pageHeader}>
        <View>
          <ThemedText type="h1" style={[styles.pageTitle, { color: colors.text }]}>
            Trend Analysis
          </ThemedText>
          <ThemedText type="body" style={[styles.pageSubtitle, { color: colors.icon }]}>
            Time-series analysis and seasonal patterns
          </ThemedText>
        </View>
        <TouchableOpacity
          onPress={handleExport}
          style={[styles.exportButton, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <MaterialIcons name="download" size={20} color={colors.primary} />
          <ThemedText type="body" style={[styles.exportText, { color: colors.primary }]}>
            Export
          </ThemedText>
        </TouchableOpacity>
      </View>

      {/* Time Range Selector */}
      <WebCard style={styles.timeRangeCard}>
        <View style={styles.timeRangeHeader}>
          <ThemedText type="body" style={{ fontWeight: '600', color: colors.text }}>
            Time Range
          </ThemedText>
        </View>
        <View style={styles.timeRangeContainer}>
          {(['7d', '30d', '90d', 'all'] as const).map((range) => (
            <TouchableOpacity
              key={range}
              style={[
                styles.timeRangeButton,
                {
                  backgroundColor: timeRange === range ? colors.primary : colors.surface,
                  borderColor: timeRange === range ? colors.primary : colors.border,
                },
              ]}
              onPress={() => setTimeRange(range)}
            >
              <ThemedText
                type="body"
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
      </WebCard>

      {/* Daily Posts Trend */}
      <WebCard style={styles.chartCard}>
        <View>
          <ThemedText type="h3" style={[styles.sectionTitle, { color: colors.text }]}>
            Daily Posts Trend
          </ThemedText>
          <ThemedText type="small" style={{ color: colors.icon, marginTop: Spacing.xs }}>
            Last 14 days of activity
          </ThemedText>
        </View>
        <View style={styles.chartContainer}>
          {dailyPostsArray.length > 0 ? (
            dailyPostsArray.map(([date, count]) => {
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
                  <ThemedText type="small" style={{ color: colors.icon, fontSize: 11, marginTop: Spacing.xs }}>
                    {dayLabel}
                  </ThemedText>
                  <ThemedText type="small" style={{ color: colors.text, fontWeight: '600', fontSize: 11 }}>
                    {count}
                  </ThemedText>
                </View>
              );
            })
          ) : (
            <View style={styles.emptyState}>
              <MaterialIcons name="bar-chart" size={48} color={colors.icon} />
              <ThemedText type="body" style={{ color: colors.icon, marginTop: Spacing.md }}>
                No data available for selected time range
              </ThemedText>
            </View>
          )}
        </View>
      </WebCard>

      {/* Category Trends */}
      <WebCard style={styles.categoryTrendsCard}>
        <View>
          <ThemedText type="h3" style={[styles.sectionTitle, { color: colors.text }]}>
            Category Trends Over Time
          </ThemedText>
          <ThemedText type="small" style={{ color: colors.icon, marginTop: Spacing.xs }}>
            Last 7 days by category
          </ThemedText>
        </View>
        <View style={styles.categoryTrendsList}>
          {Object.entries(categoryTrends)
            .slice(0, 5)
            .map(([category, trends]) => {
              const categoryInfo = CATEGORIES[category as PostCategory];
              const total = Object.values(trends).reduce((a, b) => a + b, 0);
              const trendEntries = Object.entries(trends).sort((a, b) => a[0].localeCompare(b[0])).slice(-7);
              const maxInCategory = Math.max(...trendEntries.map((t) => t[1]), 1);
              return (
                <View key={category} style={styles.categoryTrendItem}>
                  <View style={styles.categoryTrendHeader}>
                    <View style={styles.categoryTrendInfo}>
                      <View style={[styles.categoryDot, { backgroundColor: categoryInfo?.color || colors.primary }]} />
                      <View>
                        <ThemedText type="body" style={{ fontWeight: '600', color: colors.text }}>
                          {categoryInfo?.name || category}
                        </ThemedText>
                        <ThemedText type="small" style={{ color: colors.icon }}>
                          {total} posts total
                        </ThemedText>
                      </View>
                    </View>
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
      </WebCard>

      {/* Bottom Grid */}
      <View style={styles.bottomGrid}>
        {/* Escalation Trends */}
        <WebCard style={styles.escalationCard}>
          <View>
            <ThemedText type="h3" style={[styles.sectionTitle, { color: colors.text }]}>
              Escalation Trends
            </ThemedText>
            <ThemedText type="small" style={{ color: colors.icon, marginTop: Spacing.xs }}>
              Distribution by severity level
            </ThemedText>
          </View>
          <View style={styles.escalationTrendsList}>
            {Object.entries(escalationTrends)
              .filter(([level]) => level !== 'none')
              .sort((a, b) => {
                const order = { critical: 0, high: 1, medium: 2, low: 3 };
                return (order[a[0] as keyof typeof order] ?? 99) - (order[b[0] as keyof typeof order] ?? 99);
              })
              .map(([level, count]) => {
                const levelColors: Record<string, string> = {
                  critical: '#EF4444',
                  high: '#F59E0B',
                  medium: '#3B82F6',
                  low: '#10B981',
                };
                const percentage = totalEscalations > 0 ? ((count / totalEscalations) * 100).toFixed(1) : '0';
                return (
                  <View key={level} style={styles.escalationTrendRow}>
                    <View style={styles.escalationTrendInfo}>
                      <View
                        style={[
                          styles.levelDot,
                          { backgroundColor: levelColors[level] || colors.primary },
                        ]}
                      />
                      <View>
                        <ThemedText type="body" style={{ fontWeight: '600', color: colors.text }}>
                          {level.toUpperCase()}
                        </ThemedText>
                        <ThemedText type="small" style={{ color: colors.icon }}>
                          {percentage}%
                        </ThemedText>
                      </View>
                    </View>
                    <View style={styles.trendBar}>
                      <View
                        style={[
                          styles.trendFill,
                          {
                            width: `${percentage}%`,
                            backgroundColor: levelColors[level] || colors.primary,
                          },
                        ]}
                      />
                    </View>
                    <ThemedText type="h3" style={{ color: colors.text, fontWeight: '700', minWidth: 50, textAlign: 'right' }}>
                      {count}
                    </ThemedText>
                  </View>
                );
              })}
          </View>
        </WebCard>

        {/* Seasonal Patterns */}
        <WebCard style={styles.seasonalCard}>
          <View>
            <ThemedText type="h3" style={[styles.sectionTitle, { color: colors.text }]}>
              Seasonal Patterns
            </ThemedText>
            <ThemedText type="small" style={{ color: colors.icon, marginTop: Spacing.xs }}>
              Monthly activity distribution
            </ThemedText>
          </View>
          <View style={styles.seasonalList}>
            {Object.entries(seasonalPatterns)
              .sort((a, b) => {
                const monthOrder = [
                  'January', 'February', 'March', 'April', 'May', 'June',
                  'July', 'August', 'September', 'October', 'November', 'December'
                ];
                return monthOrder.indexOf(a[0]) - monthOrder.indexOf(b[0]);
              })
              .map(([month, count]) => (
                <View key={month} style={styles.seasonalRow}>
                  <ThemedText type="body" style={{ fontWeight: '600', color: colors.text, minWidth: 120 }}>
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
                  <ThemedText type="body" style={{ color: colors.text, marginLeft: Spacing.md, minWidth: 50, textAlign: 'right' }}>
                    {count}
                  </ThemedText>
                </View>
              ))}
          </View>
        </WebCard>
      </View>
    </ScrollView>
  );

  // Web layout with container
  if (isWeb) {
    return (
      <ThemedView style={styles.container}>
        <WebContainer maxWidth={1600} padding={32}>
          {content}
        </WebContainer>
      </ThemedView>
    );
  }

  // Mobile layout
  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ThemedView style={styles.container}>
        {content}
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
    backgroundColor: 'transparent',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: isWeb ? 0 : Spacing.md,
    paddingBottom: isWeb ? Spacing.xxl : 80,
  },
  pageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.xl,
    ...(isWeb ? {
      marginTop: Spacing.lg,
    } : {}),
  },
  pageTitle: {
    fontWeight: '700',
    fontSize: isWeb ? 32 : 24,
    marginBottom: Spacing.xs,
  },
  pageSubtitle: {
    fontSize: isWeb ? 16 : 14,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.sm,
    ...getCursorStyle(),
  },
  exportText: {
    fontWeight: '600',
    fontSize: 14,
  },
  timeRangeCard: {
    marginBottom: Spacing.xl,
  },
  timeRangeHeader: {
    marginBottom: Spacing.md,
  },
  timeRangeContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
    flexWrap: 'wrap',
  },
  timeRangeButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    ...getCursorStyle(),
  },
  chartCard: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontWeight: '700',
    fontSize: isWeb ? 20 : 18,
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: isWeb ? 300 : 200,
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing.sm,
  },
  barChartItem: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.xs,
    maxWidth: 60,
  },
  barContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
    minHeight: 200,
  },
  bar: {
    width: '80%',
    borderRadius: BorderRadius.sm,
    transition: 'height 0.3s ease',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xxl,
    height: 200,
  },
  categoryTrendsCard: {
    marginBottom: Spacing.xl,
  },
  categoryTrendsList: {
    gap: Spacing.lg,
    marginTop: Spacing.lg,
  },
  categoryTrendItem: {
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  categoryTrendHeader: {
    marginBottom: Spacing.md,
  },
  categoryTrendInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  miniChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 60,
    gap: 4,
    paddingHorizontal: Spacing.xs,
  },
  miniBar: {
    flex: 1,
    borderRadius: 2,
    transition: 'height 0.3s ease',
  },
  bottomGrid: {
    ...(isWeb ? {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: Spacing.xl,
    } : {
      gap: Spacing.lg,
    }),
  },
  escalationCard: {
    ...(isWeb ? {} : {
      marginBottom: Spacing.lg,
    }),
  },
  seasonalCard: {
    ...(isWeb ? {} : {
      marginBottom: Spacing.lg,
    }),
  },
  escalationTrendsList: {
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  escalationTrendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  escalationTrendInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    minWidth: 120,
  },
  levelDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  trendBar: {
    flex: 1,
    height: 32,
    backgroundColor: '#E0E0E0',
    borderRadius: BorderRadius.sm,
    overflow: 'hidden',
  },
  trendFill: {
    height: '100%',
    borderRadius: BorderRadius.sm,
    transition: 'width 0.3s ease',
  },
  seasonalList: {
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  seasonalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  seasonalBar: {
    flex: 1,
    height: 32,
    backgroundColor: '#E0E0E0',
    borderRadius: BorderRadius.sm,
    overflow: 'hidden',
  },
  seasonalFill: {
    height: '100%',
    borderRadius: BorderRadius.sm,
    transition: 'width 0.3s ease',
  },
});
