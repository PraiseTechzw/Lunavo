/**
 * Analytics Dashboard - For Student Affairs to identify trends
 */

import { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ThemedView } from '@/app/components/themed-view';
import { ThemedText } from '@/app/components/themed-text';
import { MaterialIcons } from '@expo/vector-icons';
import { useColorScheme } from '@/app/hooks/use-color-scheme';
import { Colors, Spacing, BorderRadius } from '@/app/constants/theme';
import { getAnalytics } from '@/app/utils/storage';
import { createShadow, getCursorStyle } from '@/app/utils/platform-styles';
import { Analytics as AnalyticsType, PostCategory } from '@/app/types';
import { CATEGORIES } from '@/app/constants/categories';

const { width } = Dimensions.get('window');

export default function AnalyticsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const [refreshing, setRefreshing] = useState(false);
  const [analytics, setAnalytics] = useState<AnalyticsType | null>(null);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    const data = await getAnalytics();
    setAnalytics(data);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAnalytics();
    setRefreshing(false);
  };

  const getCategoryName = (category: PostCategory) => {
    return CATEGORIES[category]?.name || category;
  };

  const getCategoryColor = (category: PostCategory) => {
    return CATEGORIES[category]?.color || colors.primary;
  };

  const postsByCategory = analytics?.postsByCategory || {};
  const totalPosts = analytics?.totalPosts || 1;
  const maxPosts = Math.max(...Object.values(postsByCategory), 1);

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ThemedView style={styles.container}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.background }]}>
          <TouchableOpacity onPress={() => router.back()} style={getCursorStyle()}>
            <MaterialIcons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <ThemedText type="h2" style={styles.headerTitle}>
            Analytics & Trends
          </ThemedText>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {/* Overview Stats */}
          <View style={styles.overviewSection}>
            <View style={[styles.overviewCard, { backgroundColor: colors.card }, createShadow(3, '#000', 0.1)]}>
              <MaterialIcons name="forum" size={48} color={colors.primary} />
              <ThemedText type="h1" style={styles.overviewValue}>
                {analytics?.totalPosts || 0}
              </ThemedText>
              <ThemedText type="body" style={[styles.overviewLabel, { color: colors.icon }]}>
                Total Posts
              </ThemedText>
            </View>

            <View style={[styles.overviewCard, { backgroundColor: colors.card }, createShadow(3, '#000', 0.1)]}>
              <MaterialIcons name="warning" size={48} color={colors.danger} />
              <ThemedText type="h1" style={styles.overviewValue}>
                {analytics?.escalationCount || 0}
              </ThemedText>
              <ThemedText type="body" style={[styles.overviewLabel, { color: colors.icon }]}>
                Escalations
              </ThemedText>
            </View>

            <View style={[styles.overviewCard, { backgroundColor: colors.card }, createShadow(3, '#000', 0.1)]}>
              <MaterialIcons name="people" size={48} color={colors.success} />
              <ThemedText type="h1" style={styles.overviewValue}>
                {analytics?.activeUsers || 0}
              </ThemedText>
              <ThemedText type="body" style={[styles.overviewLabel, { color: colors.icon }]}>
                Active Users
              </ThemedText>
            </View>

            <View style={[styles.overviewCard, { backgroundColor: colors.card }, createShadow(3, '#000', 0.1)]}>
              <MaterialIcons name="schedule" size={48} color={colors.warning} />
              <ThemedText type="h1" style={styles.overviewValue}>
                {analytics?.responseTime || 0}m
              </ThemedText>
              <ThemedText type="body" style={[styles.overviewLabel, { color: colors.icon }]}>
                Avg Response Time
              </ThemedText>
            </View>
          </View>

          {/* Posts by Category */}
          <View style={styles.section}>
            <ThemedText type="h3" style={styles.sectionTitle}>
              Posts by Category
            </ThemedText>
            <View style={[styles.categoryChart, { backgroundColor: colors.card }, createShadow(2, '#000', 0.1)]}>
              {Object.entries(postsByCategory).map(([category, count]) => {
                const percentage = (count / totalPosts) * 100;
                const barWidth = (count / maxPosts) * (width - Spacing.xl * 2 - Spacing.md * 4);
                return (
                  <View key={category} style={styles.categoryRow}>
                    <View style={styles.categoryInfo}>
                      <View style={[styles.categoryDot, { backgroundColor: getCategoryColor(category as PostCategory) }]} />
                      <ThemedText type="body" style={styles.categoryName}>
                        {getCategoryName(category as PostCategory)}
                      </ThemedText>
                    </View>
                    <View style={styles.barContainer}>
                      <View
                        style={[
                          styles.bar,
                          {
                            width: barWidth,
                            backgroundColor: getCategoryColor(category as PostCategory),
                          },
                        ]}
                      />
                    </View>
                    <View style={styles.categoryCount}>
                      <ThemedText type="body" style={styles.countText}>
                        {count}
                      </ThemedText>
                      <ThemedText type="small" style={[styles.percentageText, { color: colors.icon }]}>
                        {percentage.toFixed(1)}%
                      </ThemedText>
                    </View>
                  </View>
                );
              })}
              {Object.keys(postsByCategory).length === 0 && (
                <View style={styles.emptyState}>
                  <MaterialIcons name="bar-chart" size={48} color={colors.icon} />
                  <ThemedText type="body" style={[styles.emptyText, { color: colors.icon }]}>
                    No data available
                  </ThemedText>
                </View>
              )}
            </View>
          </View>

          {/* Common Issues */}
          <View style={styles.section}>
            <ThemedText type="h3" style={styles.sectionTitle}>
              Common Issues & Trends
            </ThemedText>
            <View style={[styles.issuesCard, { backgroundColor: colors.card }, createShadow(2, '#000', 0.1)]}>
              {analytics?.commonIssues && analytics.commonIssues.length > 0 ? (
                <View style={styles.issuesList}>
                  {analytics.commonIssues.slice(0, 10).map((issue, index) => (
                    <View key={index} style={styles.issueItem}>
                      <View style={[styles.issueRank, { backgroundColor: colors.primary + '20' }]}>
                        <ThemedText type="small" style={{ color: colors.primary, fontWeight: '700' }}>
                          #{index + 1}
                        </ThemedText>
                      </View>
                      <ThemedText type="body" style={styles.issueText}>
                        {issue.charAt(0).toUpperCase() + issue.slice(1)}
                      </ThemedText>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <MaterialIcons name="trending-up" size={48} color={colors.icon} />
                  <ThemedText type="body" style={[styles.emptyText, { color: colors.icon }]}>
                    No trending issues yet
                  </ThemedText>
                </View>
              )}
            </View>
          </View>

          {/* Insights */}
          <View style={styles.section}>
            <ThemedText type="h3" style={styles.sectionTitle}>
              Key Insights
            </ThemedText>
            <View style={[styles.insightsCard, { backgroundColor: colors.card }, createShadow(2, '#000', 0.1)]}>
              <View style={styles.insightItem}>
                <MaterialIcons name="insights" size={24} color={colors.primary} />
                <View style={styles.insightContent}>
                  <ThemedText type="body" style={styles.insightTitle}>
                    Top Concern Category
                  </ThemedText>
                  <ThemedText type="small" style={[styles.insightValue, { color: colors.icon }]}>
                    {Object.entries(postsByCategory).length > 0
                      ? getCategoryName(
                          Object.entries(postsByCategory).sort((a, b) => b[1] - a[1])[0][0] as PostCategory
                        )
                      : 'N/A'}
                  </ThemedText>
                </View>
              </View>

              <View style={styles.insightItem}>
                <MaterialIcons name="speed" size={24} color={colors.success} />
                <View style={styles.insightContent}>
                  <ThemedText type="body" style={styles.insightTitle}>
                    Community Response
                  </ThemedText>
                  <ThemedText type="small" style={[styles.insightValue, { color: colors.icon }]}>
                    {analytics?.responseTime
                      ? analytics.responseTime < 30
                        ? 'Very Fast'
                        : analytics.responseTime < 60
                        ? 'Fast'
                        : 'Average'
                      : 'N/A'}
                  </ThemedText>
                </View>
              </View>

              <View style={styles.insightItem}>
                <MaterialIcons name="priority-high" size={24} color={colors.danger} />
                <View style={styles.insightContent}>
                  <ThemedText type="body" style={styles.insightTitle}>
                    Escalation Rate
                  </ThemedText>
                  <ThemedText type="small" style={[styles.insightValue, { color: colors.icon }]}>
                    {analytics?.totalPosts
                      ? ((analytics.escalationCount / analytics.totalPosts) * 100).toFixed(1) + '%'
                      : '0%'}
                  </ThemedText>
                </View>
              </View>
            </View>
          </View>

          <View style={{ height: Spacing.xl }} />
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
  },
  overviewSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  overviewCard: {
    width: '48%',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  overviewValue: {
    fontSize: 36,
    fontWeight: '700',
    marginVertical: Spacing.xs,
  },
  overviewLabel: {
    fontSize: 14,
    textAlign: 'center',
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontWeight: '700',
    marginBottom: Spacing.md,
  },
  categoryChart: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 120,
    gap: Spacing.xs,
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '500',
  },
  barContainer: {
    flex: 1,
    height: 24,
    backgroundColor: '#F0F0F0',
    borderRadius: BorderRadius.sm,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    borderRadius: BorderRadius.sm,
  },
  categoryCount: {
    width: 60,
    alignItems: 'flex-end',
  },
  countText: {
    fontWeight: '700',
    fontSize: 14,
  },
  percentageText: {
    fontSize: 11,
  },
  issuesCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  issuesList: {
    gap: Spacing.sm,
  },
  issueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  issueRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  issueText: {
    flex: 1,
    fontSize: 14,
  },
  insightsCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.md,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontWeight: '600',
    marginBottom: 2,
  },
  insightValue: {
    fontSize: 13,
  },
  emptyState: {
    alignItems: 'center',
    padding: Spacing.xl,
  },
  emptyText: {
    marginTop: Spacing.md,
  },
});

