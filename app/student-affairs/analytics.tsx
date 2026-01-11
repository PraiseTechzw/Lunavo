/**
 * Detailed Analytics - Student Affairs
 * All data is anonymized (no user IDs, only pseudonyms)
 */

import { ThemedText } from '@/app/components/themed-text';
import { ThemedView } from '@/app/components/themed-view';
import { CATEGORIES } from '@/app/constants/categories';
import { BorderRadius, Colors, Spacing } from '@/app/constants/theme';
import { useColorScheme } from '@/app/hooks/use-color-scheme';
import { EscalationLevel, PostCategory } from '@/app/types';
import { createShadow } from '@/app/utils/platform-styles';
import { useRoleGuard } from '@/hooks/use-auth-guard';
import { getEscalations, getPosts, getReplies } from '@/lib/database';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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

  if (authLoading) {
    return (
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <ThemedView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ThemedText>Loading...</ThemedText>
        </ThemedView>
      </SafeAreaView>
    );
  }

  const avgResponseTime = responseTimes.length > 0
    ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
    : 0;

  const peakHours = Object.entries(peakUsage)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />
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
            <TouchableOpacity
              onPress={() => router.back()}
              style={[styles.backBtn, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}
            >
              <Ionicons name="chevron-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <ThemedText type="h2" style={styles.headerTitle}>
              Detailed Analytics
            </ThemedText>
            <View style={{ width: 24 }} />
          </View>

          {/* Posts by Category */}
          <View style={[styles.section, { backgroundColor: colors.card }, createShadow(2, '#000', 0.1)]}>
            <ThemedText type="h3" style={styles.sectionTitle}>
              Posts by Category
            </ThemedText>
            {Object.entries(postsByCategory)
              .sort((a, b) => b[1] - a[1])
              .map(([category, count]) => {
                const categoryInfo = CATEGORIES[category as keyof typeof CATEGORIES];
                const total = Object.values(postsByCategory).reduce((a, b) => a + b, 0);
                const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : 0;
                return (
                  <View key={category} style={styles.categoryRow}>
                    <View style={styles.categoryInfo}>
                      <ThemedText type="body" style={{ fontWeight: '600', color: colors.text }}>
                        {categoryInfo?.name || category}
                      </ThemedText>
                      <ThemedText type="small" style={{ color: colors.icon }}>
                        {count} posts ({percentage}%)
                      </ThemedText>
                    </View>
                    <View style={styles.progressBar}>
                      <View
                        style={[
                          styles.progressFill,
                          {
                            width: `${total > 0 ? (count / total) * 100 : 0}%`,
                            backgroundColor: categoryInfo?.color || colors.primary,
                          },
                        ]}
                      />
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
                return (
                  <View key={level} style={styles.escalationRow}>
                    <View style={styles.escalationInfo}>
                      <View
                        style={[
                          styles.levelIndicator,
                          { backgroundColor: levelColors[level] || colors.primary },
                        ]}
                      />
                      <ThemedText type="body" style={{ fontWeight: '600', color: colors.text, marginLeft: Spacing.sm }}>
                        {level.toUpperCase()}
                      </ThemedText>
                    </View>
                    <ThemedText type="h3" style={{ color: colors.text }}>
                      {count}
                    </ThemedText>
                  </View>
                );
              })}
          </View>

          {/* Response Times */}
          <View style={[styles.section, { backgroundColor: colors.card }, createShadow(2, '#000', 0.1)]}>
            <ThemedText type="h3" style={styles.sectionTitle}>
              Response Times
            </ThemedText>
            <View style={styles.metricRow}>
              <View style={styles.metric}>
                <ThemedText type="h2" style={{ color: colors.primary }}>
                  {avgResponseTime}h
                </ThemedText>
                <ThemedText type="small" style={{ color: colors.icon }}>
                  Average Response Time
                </ThemedText>
              </View>
              <View style={styles.metric}>
                <ThemedText type="h2" style={{ color: colors.text }}>
                  {responseTimes.length}
                </ThemedText>
                <ThemedText type="small" style={{ color: colors.icon }}>
                  Resolved Escalations
                </ThemedText>
              </View>
            </View>
          </View>

          {/* Engagement Metrics */}
          <View style={[styles.section, { backgroundColor: colors.card }, createShadow(2, '#000', 0.1)]}>
            <ThemedText type="h3" style={styles.sectionTitle}>
              Engagement Metrics
            </ThemedText>
            <View style={styles.metricsGrid}>
              <View style={styles.metricCard}>
                <MaterialIcons name="chat-bubble-outline" size={32} color={colors.primary} />
                <ThemedText type="h2" style={{ color: colors.text, marginTop: Spacing.sm }}>
                  {engagementMetrics.avgRepliesPerPost.toFixed(1)}
                </ThemedText>
                <ThemedText type="small" style={{ color: colors.icon }}>
                  Avg Replies/Post
                </ThemedText>
              </View>
              <View style={styles.metricCard}>
                <MaterialIcons name="thumb-up" size={32} color={colors.primary} />
                <ThemedText type="h2" style={{ color: colors.text, marginTop: Spacing.sm }}>
                  {engagementMetrics.avgUpvotesPerPost.toFixed(1)}
                </ThemedText>
                <ThemedText type="small" style={{ color: colors.icon }}>
                  Avg Upvotes/Post
                </ThemedText>
              </View>
              <View style={styles.metricCard}>
                <MaterialIcons name="forum" size={32} color={colors.primary} />
                <ThemedText type="h2" style={{ color: colors.text, marginTop: Spacing.sm }}>
                  {engagementMetrics.totalReplies}
                </ThemedText>
                <ThemedText type="small" style={{ color: colors.icon }}>
                  Total Replies
                </ThemedText>
              </View>
            </View>
          </View>

          {/* Peak Usage Times */}
          <View style={[styles.section, { backgroundColor: colors.card }, createShadow(2, '#000', 0.1)]}>
            <ThemedText type="h3" style={styles.sectionTitle}>
              Peak Usage Times
            </ThemedText>
            {peakHours.map(([hour, count]) => (
              <View key={hour} style={styles.peakRow}>
                <ThemedText type="body" style={{ fontWeight: '600', color: colors.text, minWidth: 60 }}>
                  {hour}
                </ThemedText>
                <View style={styles.peakBar}>
                  <View
                    style={[
                      styles.peakFill,
                      {
                        width: `${(count / Math.max(...peakHours.map((h) => h[1]))) * 100}%`,
                        backgroundColor: colors.primary,
                      },
                    ]}
                  />
                </View>
                <ThemedText type="body" style={{ color: colors.text, marginLeft: Spacing.sm, minWidth: 40 }}>
                  {count}
                </ThemedText>
              </View>
            ))}
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
    flex: 1,
    textAlign: 'center',
    marginRight: 44,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
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
  categoryRow: {
    marginBottom: Spacing.md,
  },
  categoryInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
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
  escalationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  escalationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  levelIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  metricRow: {
    flexDirection: 'row',
    gap: Spacing.lg,
    marginTop: Spacing.md,
  },
  metric: {
    flex: 1,
    alignItems: 'center',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  metricCard: {
    flex: 1,
    minWidth: '30%',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: '#F5F5F5',
    borderRadius: BorderRadius.md,
  },
  peakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  peakBar: {
    flex: 1,
    height: 24,
    backgroundColor: '#E0E0E0',
    borderRadius: BorderRadius.sm,
    overflow: 'hidden',
    marginHorizontal: Spacing.sm,
  },
  peakFill: {
    height: '100%',
    borderRadius: BorderRadius.sm,
  },
});


