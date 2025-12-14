/**
 * Detailed Analytics - Student Affairs
 * Web-optimized comprehensive analytics view
 * All data is anonymized (no user IDs, only aggregated data)
 */

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { WebCard, WebContainer } from '@/components/web';
import { CATEGORIES } from '@/constants/categories';
import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { EscalationLevel, PostCategory } from '@/types';
import { getCursorStyle } from '@/utils/platform-styles';
import { useRoleGuard } from '@/hooks/use-auth-guard';
import { getEscalations, getPosts, getReplies } from '@/lib/database';
import { MaterialIcons } from '@expo/vector-icons';
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

export default function DetailedAnalyticsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  
  const { user, loading: authLoading } = useRoleGuard(['student-affairs', 'admin'], '/(tabs)');
  
  const [refreshing, setRefreshing] = useState(false);
  const [postsByCategory, setPostsByCategory] = useState<Record<PostCategory, number>>({} as any);
  const [escalationTrends, setEscalationTrends] = useState<Record<EscalationLevel, number>>({} as any);
  const [responseTimes, setResponseTimes] = useState<number[]>([]);
  const [engagementMetrics, setEngagementMetrics] = useState({
    avgRepliesPerPost: 0,
    avgUpvotesPerPost: 0,
    totalReplies: 0,
  });
  const [peakUsage, setPeakUsage] = useState<Record<string, number>>({});

  useEffect(() => {
    if (user) {
      loadAnalytics();
    }
  }, [user]);

  const loadAnalytics = async () => {
    try {
      const [posts, escalations, allReplies] = await Promise.all([
        getPosts(),
        getEscalations(),
        getPosts().then(async (posts) => {
          const replies = await Promise.all(posts.map((p) => getReplies(p.id)));
          return replies.flat();
        }),
      ]);

      // Posts by category (anonymized)
      const categoryCounts: Record<string, number> = {};
      posts.forEach((post) => {
        categoryCounts[post.category] = (categoryCounts[post.category] || 0) + 1;
      });
      setPostsByCategory(categoryCounts as any);

      // Escalation trends (anonymized)
      const escalationCounts: Record<string, number> = {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        none: 0,
      };
      escalations.forEach((e) => {
        escalationCounts[e.escalationLevel] = (escalationCounts[e.escalationLevel] || 0) + 1;
      });
      setEscalationTrends(escalationCounts as any);

      // Response times (anonymized - no user IDs)
      const times: number[] = [];
      escalations
        .filter((e) => e.status === 'resolved' && e.resolvedAt)
        .forEach((e) => {
          const timeDiff = new Date(e.resolvedAt!).getTime() - new Date(e.detectedAt).getTime();
          times.push(Math.round(timeDiff / (1000 * 60 * 60))); // in hours
        });
      setResponseTimes(times);

      // Engagement metrics (anonymized)
      const totalReplies = allReplies.length;
      const totalUpvotes = posts.reduce((sum, p) => sum + p.upvotes, 0);
      setEngagementMetrics({
        avgRepliesPerPost: posts.length > 0 ? totalReplies / posts.length : 0,
        avgUpvotesPerPost: posts.length > 0 ? totalUpvotes / posts.length : 0,
        totalReplies,
      });

      // Peak usage times (anonymized - only hour of day)
      const hourCounts: Record<string, number> = {};
      posts.forEach((post) => {
        const hour = new Date(post.createdAt).getHours();
        const hourKey = `${hour}:00`;
        hourCounts[hourKey] = (hourCounts[hourKey] || 0) + 1;
      });
      setPeakUsage(hourCounts);
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAnalytics();
    setRefreshing(false);
  };

  const handleExport = () => {
    if (Platform.OS === 'web') {
      const data = {
        postsByCategory,
        escalationTrends,
        responseTimes: {
          average: avgResponseTime,
          count: responseTimes.length,
        },
        engagementMetrics,
        peakUsage,
        exportedAt: new Date().toISOString(),
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `detailed-analytics-${new Date().toISOString().split('T')[0]}.json`;
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

  const avgResponseTime = responseTimes.length > 0
    ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
    : 0;

  const peakHours = Object.entries(peakUsage)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const totalPosts = Object.values(postsByCategory).reduce((a, b) => a + b, 0);
  const maxPeakCount = peakHours.length > 0 ? Math.max(...peakHours.map((h) => h[1])) : 1;

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
            Detailed Analytics
          </ThemedText>
          <ThemedText type="body" style={[styles.pageSubtitle, { color: colors.icon }]}>
            Comprehensive insights and metrics
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

      {/* Main Grid */}
      <View style={styles.mainGrid}>
        {/* Posts by Category */}
        <WebCard style={styles.categoryCard}>
          <View style={styles.sectionHeader}>
            <View>
              <ThemedText type="h3" style={[styles.sectionTitle, { color: colors.text }]}>
                Posts by Category
              </ThemedText>
              <ThemedText type="small" style={{ color: colors.icon, marginTop: Spacing.xs }}>
                Distribution across support categories
              </ThemedText>
            </View>
          </View>
          <View style={styles.categoryList}>
            {Object.entries(postsByCategory)
              .sort((a, b) => b[1] - a[1])
              .map(([category, count]) => {
                const categoryInfo = CATEGORIES[category as PostCategory];
                const percentage = totalPosts > 0 ? ((count / totalPosts) * 100).toFixed(1) : '0';
                return (
                  <View key={category} style={styles.categoryRow}>
                    <View style={styles.categoryInfo}>
                      <View style={[styles.categoryDot, { backgroundColor: categoryInfo?.color || colors.primary }]} />
                      <View style={styles.categoryText}>
                        <ThemedText type="body" style={{ fontWeight: '600', color: colors.text }}>
                          {categoryInfo?.name || category}
                        </ThemedText>
                        <ThemedText type="small" style={{ color: colors.icon }}>
                          {count} posts • {percentage}%
                        </ThemedText>
                      </View>
                    </View>
                    <View style={styles.progressBar}>
                      <View
                        style={[
                          styles.progressFill,
                          {
                            width: `${percentage}%`,
                            backgroundColor: categoryInfo?.color || colors.primary,
                          },
                        ]}
                      />
                    </View>
                  </View>
                );
              })}
          </View>
        </WebCard>

        {/* Escalation Trends */}
        <WebCard style={styles.escalationCard}>
          <View>
            <ThemedText type="h3" style={[styles.sectionTitle, { color: colors.text }]}>
              Escalation Trends
            </ThemedText>
            <ThemedText type="small" style={{ color: colors.icon, marginTop: Spacing.xs }}>
              Escalation levels distribution
            </ThemedText>
          </View>
          <View style={styles.escalationList}>
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
                const totalEscalations = Object.values(escalationTrends)
                  .filter((_, idx) => Object.keys(escalationTrends)[idx] !== 'none')
                  .reduce((a, b) => a + b, 0);
                const percentage = totalEscalations > 0 ? ((count / totalEscalations) * 100).toFixed(1) : '0';
                return (
                  <View key={level} style={styles.escalationRow}>
                    <View style={styles.escalationInfo}>
                      <View
                        style={[
                          styles.levelIndicator,
                          { backgroundColor: levelColors[level] || colors.primary },
                        ]}
                      />
                      <View>
                        <ThemedText type="body" style={{ fontWeight: '600', color: colors.text }}>
                          {level.toUpperCase()}
                        </ThemedText>
                        <ThemedText type="small" style={{ color: colors.icon }}>
                          {percentage}% of escalations
                        </ThemedText>
                      </View>
                    </View>
                    <ThemedText type="h2" style={{ color: colors.text, fontWeight: '700' }}>
                      {count}
                    </ThemedText>
                  </View>
                );
              })}
          </View>
        </WebCard>
      </View>

      {/* Metrics Grid */}
      <View style={styles.metricsGrid}>
        {/* Response Times */}
        <WebCard style={styles.metricCard}>
          <View style={styles.metricHeader}>
            <View style={[styles.metricIconContainer, { backgroundColor: colors.primary + '15' }]}>
              <MaterialIcons name="schedule" size={24} color={colors.primary} />
            </View>
            <View>
              <ThemedText type="h3" style={[styles.sectionTitle, { color: colors.text }]}>
                Response Times
              </ThemedText>
              <ThemedText type="small" style={{ color: colors.icon }}>
                Average resolution time
              </ThemedText>
            </View>
          </View>
          <View style={styles.metricContent}>
            <ThemedText type="h1" style={{ color: colors.primary, fontWeight: '700', fontSize: isWeb ? 36 : 28 }}>
              {avgResponseTime}h
            </ThemedText>
            <ThemedText type="small" style={{ color: colors.icon, marginTop: Spacing.xs }}>
              {responseTimes.length} resolved escalations
            </ThemedText>
          </View>
        </WebCard>

        {/* Engagement Metrics */}
        <WebCard style={styles.engagementCard}>
          <View>
            <ThemedText type="h3" style={[styles.sectionTitle, { color: colors.text }]}>
              Engagement Metrics
            </ThemedText>
            <ThemedText type="small" style={{ color: colors.icon, marginTop: Spacing.xs }}>
              Community interaction statistics
            </ThemedText>
          </View>
          <View style={styles.engagementGrid}>
            <View style={styles.engagementItem}>
              <MaterialIcons name="chat-bubble-outline" size={28} color={colors.primary} />
              <ThemedText type="h2" style={{ color: colors.text, fontWeight: '700', marginTop: Spacing.sm }}>
                {engagementMetrics.avgRepliesPerPost.toFixed(1)}
              </ThemedText>
              <ThemedText type="small" style={{ color: colors.icon }}>
                Avg Replies/Post
              </ThemedText>
            </View>
            <View style={styles.engagementItem}>
              <MaterialIcons name="thumb-up" size={28} color={colors.secondary} />
              <ThemedText type="h2" style={{ color: colors.text, fontWeight: '700', marginTop: Spacing.sm }}>
                {engagementMetrics.avgUpvotesPerPost.toFixed(1)}
              </ThemedText>
              <ThemedText type="small" style={{ color: colors.icon }}>
                Avg Upvotes/Post
              </ThemedText>
            </View>
            <View style={styles.engagementItem}>
              <MaterialIcons name="forum" size={28} color={colors.success} />
              <ThemedText type="h2" style={{ color: colors.text, fontWeight: '700', marginTop: Spacing.sm }}>
                {engagementMetrics.totalReplies}
              </ThemedText>
              <ThemedText type="small" style={{ color: colors.icon }}>
                Total Replies
              </ThemedText>
            </View>
          </View>
        </WebCard>
      </View>

      {/* Peak Usage Times */}
      <WebCard>
        <View>
          <ThemedText type="h3" style={[styles.sectionTitle, { color: colors.text }]}>
            Peak Usage Times
          </ThemedText>
          <ThemedText type="small" style={{ color: colors.icon, marginTop: Spacing.xs }}>
            Most active hours of the day
          </ThemedText>
        </View>
        <View style={styles.peakList}>
          {peakHours.length > 0 ? (
            peakHours.map(([hour, count]) => (
              <View key={hour} style={styles.peakRow}>
                <ThemedText type="body" style={{ fontWeight: '600', color: colors.text, minWidth: 80 }}>
                  {hour}
                </ThemedText>
                <View style={styles.peakBar}>
                  <View
                    style={[
                      styles.peakFill,
                      {
                        width: `${(count / maxPeakCount) * 100}%`,
                        backgroundColor: colors.primary,
                      },
                    ]}
                  />
                </View>
                <ThemedText type="body" style={{ color: colors.text, marginLeft: Spacing.md, minWidth: 50, textAlign: 'right' }}>
                  {count}
                </ThemedText>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <MaterialIcons name="schedule" size={48} color={colors.icon} />
              <ThemedText type="body" style={{ color: colors.icon, marginTop: Spacing.md }}>
                No usage data available
              </ThemedText>
            </View>
          )}
        </View>
      </WebCard>
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
  mainGrid: {
    ...(isWeb ? {
      display: 'grid',
      gridTemplateColumns: '2fr 1fr',
      gap: Spacing.xl,
      marginBottom: Spacing.xl,
    } : {
      gap: Spacing.lg,
      marginBottom: Spacing.lg,
    }),
  },
  categoryCard: {
    ...(isWeb ? {} : {
      marginBottom: Spacing.lg,
    }),
  },
  escalationCard: {
    ...(isWeb ? {} : {
      marginBottom: Spacing.lg,
    }),
  },
  sectionHeader: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontWeight: '700',
    fontSize: isWeb ? 20 : 18,
  },
  categoryList: {
    gap: Spacing.md,
  },
  categoryRow: {
    gap: Spacing.sm,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  categoryText: {
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
    transition: 'width 0.3s ease',
  },
  escalationList: {
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  escalationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  escalationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  levelIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  metricsGrid: {
    ...(isWeb ? {
      display: 'grid',
      gridTemplateColumns: '1fr 2fr',
      gap: Spacing.xl,
      marginBottom: Spacing.xl,
    } : {
      gap: Spacing.lg,
      marginBottom: Spacing.lg,
    }),
  },
  metricCard: {
    ...(isWeb ? {} : {
      marginBottom: Spacing.lg,
    }),
  },
  engagementCard: {
    ...(isWeb ? {} : {
      marginBottom: Spacing.lg,
    }),
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  metricIconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  metricContent: {
    alignItems: 'center',
  },
  engagementGrid: {
    flexDirection: 'row',
    gap: Spacing.lg,
    marginTop: Spacing.lg,
    ...(isWeb ? {} : {
      flexWrap: 'wrap',
    }),
  },
  engagementItem: {
    flex: 1,
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: '#F5F5F5',
    borderRadius: BorderRadius.md,
    minWidth: 120,
  },
  peakList: {
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  peakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  peakBar: {
    flex: 1,
    height: 32,
    backgroundColor: '#E0E0E0',
    borderRadius: BorderRadius.sm,
    overflow: 'hidden',
  },
  peakFill: {
    height: '100%',
    borderRadius: BorderRadius.sm,
    transition: 'width 0.3s ease',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xxl,
  },
});
