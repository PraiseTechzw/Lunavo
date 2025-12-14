/**
 * Student Affairs Dashboard - Web-optimized analytics overview
 * All data is anonymized (no user IDs, only aggregated data)
 */

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { WebCard, WebContainer } from '@/components/web';
import { CATEGORIES } from '@/constants/categories';
import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Analytics, PostCategory } from '@/types';
import { getCursorStyle } from '@/utils/platform-styles';
import { useRoleGuard } from '@/hooks/use-auth-guard';
import { sanitizeAnalyticsData } from '@/lib/anonymization-utils';
import { getAnalytics, getEscalations, getPosts } from '@/lib/database';
import { MaterialIcons } from '@expo/vector-icons';
import { subDays } from 'date-fns';
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
const isTablet = width >= 768;

export default function StudentAffairsDashboardScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  
  // Role guard - only student-affairs and admin can access
  const { user, loading: authLoading } = useRoleGuard(['student-affairs', 'admin'], '/(tabs)');
  
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [categoryBreakdown, setCategoryBreakdown] = useState<Record<PostCategory, number>>({} as any);
  const [escalationStats, setEscalationStats] = useState({
    total: 0,
    resolved: 0,
    pending: 0,
    avgResponseTime: 0,
  });

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, timeRange]);

  const loadData = async () => {
    try {
      const [analyticsData, posts, escalations] = await Promise.all([
        getAnalytics(),
        getPosts(),
        getEscalations(),
      ]);

      // Calculate date range filter
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

      // Filter data by date range
      const filteredPosts = posts.filter((p) => new Date(p.createdAt) >= startDate);
      const filteredEscalations = escalations.filter((e) => new Date(e.detectedAt) >= startDate);

      // Calculate filtered analytics
      const filteredAnalytics = {
        ...analyticsData,
        totalPosts: filteredPosts.length,
        activeUsers: new Set(filteredPosts.map(p => p.authorId)).size,
      };
      setAnalytics(filteredAnalytics);

      // Calculate category breakdown (anonymized - no user IDs)
      const breakdown: Record<string, number> = {};
      filteredPosts.forEach((post) => {
        breakdown[post.category] = (breakdown[post.category] || 0) + 1;
      });
      setCategoryBreakdown(sanitizeAnalyticsData(breakdown) as any);

      // Calculate escalation stats (anonymized)
      const resolved = filteredEscalations.filter((e) => e.status === 'resolved');
      const pending = filteredEscalations.filter((e) => e.status === 'pending' || e.status === 'in-progress');
      
      // Calculate response times (anonymized - only time differences)
      let totalResponseTime = 0;
      let responseCount = 0;
      resolved.forEach((e) => {
        if (e.resolvedAt) {
          const timeDiff = new Date(e.resolvedAt).getTime() - new Date(e.detectedAt).getTime();
          totalResponseTime += timeDiff;
          responseCount++;
        }
      });

      setEscalationStats({
        total: filteredEscalations.length,
        resolved: resolved.length,
        pending: pending.length,
        avgResponseTime: responseCount > 0 ? Math.round(totalResponseTime / responseCount / (1000 * 60 * 60)) : 0,
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleExport = () => {
    if (Platform.OS === 'web') {
      // Web export functionality
      const data = {
        analytics,
        categoryBreakdown,
        escalationStats,
        exportedAt: new Date().toISOString(),
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `student-affairs-dashboard-${new Date().toISOString().split('T')[0]}.json`;
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

  const topCategories = Object.entries(categoryBreakdown)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

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
            Student Affairs Dashboard
          </ThemedText>
          <ThemedText type="body" style={[styles.pageSubtitle, { color: colors.icon }]}>
            Anonymized analytics and insights
          </ThemedText>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={handleExport}
            style={[styles.exportButton, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <MaterialIcons name="download" size={20} color={colors.primary} />
            <ThemedText type="body" style={[styles.exportText, { color: colors.primary }]}>
              Export Data
            </ThemedText>
          </TouchableOpacity>
        </View>
      </View>

      {/* Time Range Filter */}
      <WebCard style={styles.filterCard}>
        <View style={styles.filterHeader}>
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

      {/* Overview Cards Grid */}
      <View style={styles.overviewGrid}>
        <WebCard style={styles.statCard}>
          <View style={styles.statCardContent}>
            <View style={[styles.statIconContainer, { backgroundColor: colors.primary + '15' }]}>
              <MaterialIcons name="forum" size={28} color={colors.primary} />
            </View>
            <View style={styles.statInfo}>
              <ThemedText type="h1" style={[styles.statValue, { color: colors.text }]}>
                {analytics?.totalPosts || 0}
              </ThemedText>
              <ThemedText type="small" style={{ color: colors.icon }}>
                Total Posts
              </ThemedText>
            </View>
          </View>
        </WebCard>

        <WebCard style={styles.statCard}>
          <View style={styles.statCardContent}>
            <View style={[styles.statIconContainer, { backgroundColor: colors.secondary + '15' }]}>
              <MaterialIcons name="people" size={28} color={colors.secondary} />
            </View>
            <View style={styles.statInfo}>
              <ThemedText type="h1" style={[styles.statValue, { color: colors.text }]}>
                {analytics?.activeUsers || 0}
              </ThemedText>
              <ThemedText type="small" style={{ color: colors.icon }}>
                Active Users
              </ThemedText>
            </View>
          </View>
        </WebCard>

        <WebCard style={styles.statCard}>
          <View style={styles.statCardContent}>
            <View style={[styles.statIconContainer, { backgroundColor: '#F59E0B15' }]}>
              <MaterialIcons name="warning" size={28} color="#F59E0B" />
            </View>
            <View style={styles.statInfo}>
              <ThemedText type="h1" style={[styles.statValue, { color: colors.text }]}>
                {escalationStats.total}
              </ThemedText>
              <ThemedText type="small" style={{ color: colors.icon }}>
                Escalations
              </ThemedText>
            </View>
          </View>
        </WebCard>

        <WebCard style={styles.statCard}>
          <View style={styles.statCardContent}>
            <View style={[styles.statIconContainer, { backgroundColor: colors.success + '15' }]}>
              <MaterialIcons name="schedule" size={28} color={colors.success} />
            </View>
            <View style={styles.statInfo}>
              <ThemedText type="h1" style={[styles.statValue, { color: colors.text }]}>
                {escalationStats.avgResponseTime}h
              </ThemedText>
              <ThemedText type="small" style={{ color: colors.icon }}>
                Avg Response Time
              </ThemedText>
            </View>
          </View>
        </WebCard>
      </View>

      {/* Main Content Grid */}
      <View style={styles.contentGrid}>
        {/* Category Breakdown */}
        <WebCard style={styles.categoryCard}>
          <View style={styles.sectionHeader}>
            <View>
              <ThemedText type="h3" style={[styles.sectionTitle, { color: colors.text }]}>
                Top Categories
              </ThemedText>
              <ThemedText type="small" style={{ color: colors.icon, marginTop: Spacing.xs }}>
                Most discussed support topics
              </ThemedText>
            </View>
            <TouchableOpacity
              onPress={() => router.push('/student-affairs/analytics')}
              style={styles.viewAllButton}
            >
              <ThemedText type="small" style={{ color: colors.primary, fontWeight: '600' }}>
                View All
              </ThemedText>
              <MaterialIcons name="chevron-right" size={18} color={colors.primary} />
            </TouchableOpacity>
          </View>
          <View style={styles.categoryList}>
            {topCategories.length > 0 ? (
              topCategories.map(([category, count]) => {
                const categoryInfo = CATEGORIES[category as PostCategory];
                const percentage = analytics?.totalPosts 
                  ? ((count / analytics.totalPosts) * 100).toFixed(1) 
                  : '0';
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
              })
            ) : (
              <View style={styles.emptyState}>
                <MaterialIcons name="inbox" size={48} color={colors.icon} />
                <ThemedText type="body" style={{ color: colors.icon, marginTop: Spacing.md }}>
                  No category data available
                </ThemedText>
              </View>
            )}
          </View>
        </WebCard>

        {/* Escalation Overview */}
        <WebCard style={styles.escalationCard}>
          <View>
            <ThemedText type="h3" style={[styles.sectionTitle, { color: colors.text }]}>
              Escalation Overview
            </ThemedText>
            <ThemedText type="small" style={{ color: colors.icon, marginTop: Spacing.xs }}>
              Support response tracking
            </ThemedText>
          </View>
          <View style={styles.escalationStats}>
            <View style={styles.escalationStatItem}>
              <View style={[styles.escalationStatIcon, { backgroundColor: colors.success + '15' }]}>
                <MaterialIcons name="check-circle" size={24} color={colors.success} />
              </View>
              <View style={styles.escalationStatInfo}>
                <ThemedText type="h2" style={{ color: colors.success, fontWeight: '700' }}>
                  {escalationStats.resolved}
                </ThemedText>
                <ThemedText type="small" style={{ color: colors.icon }}>
                  Resolved
                </ThemedText>
              </View>
            </View>
            <View style={styles.escalationStatItem}>
              <View style={[styles.escalationStatIcon, { backgroundColor: '#F59E0B15' }]}>
                <MaterialIcons name="pending" size={24} color="#F59E0B" />
              </View>
              <View style={styles.escalationStatInfo}>
                <ThemedText type="h2" style={{ color: '#F59E0B', fontWeight: '700' }}>
                  {escalationStats.pending}
                </ThemedText>
                <ThemedText type="small" style={{ color: colors.icon }}>
                  Pending
                </ThemedText>
              </View>
            </View>
          </View>
        </WebCard>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <WebCard
          hoverable
          onPress={() => router.push('/student-affairs/analytics')}
          style={[styles.actionCard, { backgroundColor: colors.primary }]}
        >
          <MaterialIcons name="analytics" size={32} color="#FFFFFF" />
          <View style={styles.actionCardContent}>
            <ThemedText type="h3" style={{ color: '#FFFFFF', fontWeight: '700' }}>
              Detailed Analytics
            </ThemedText>
            <ThemedText type="small" style={{ color: 'rgba(255, 255, 255, 0.8)', marginTop: Spacing.xs }}>
              View comprehensive analytics and insights
            </ThemedText>
          </View>
          <MaterialIcons name="arrow-forward" size={24} color="#FFFFFF" />
        </WebCard>

        <WebCard
          hoverable
          onPress={() => router.push('/student-affairs/trends')}
          style={[styles.actionCard, { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }]}
        >
          <MaterialIcons name="trending-up" size={32} color={colors.primary} />
          <View style={styles.actionCardContent}>
            <ThemedText type="h3" style={{ color: colors.text, fontWeight: '700' }}>
              Trend Analysis
            </ThemedText>
            <ThemedText type="small" style={{ color: colors.icon, marginTop: Spacing.xs }}>
              Analyze patterns and trends over time
            </ThemedText>
          </View>
          <MaterialIcons name="arrow-forward" size={24} color={colors.primary} />
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
    marginBottom: Spacing.lg,
    ...(isWeb ? {
      marginTop: Spacing.lg,
    } : {}),
  },
  headerActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    alignItems: 'center',
  },
  filterCard: {
    marginBottom: Spacing.xl,
  },
  filterHeader: {
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
  overviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.lg,
    marginBottom: Spacing.xl,
    ...(isWeb ? {
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
    } : {}),
  },
  statCard: {
    flex: isWeb ? 0 : 1,
    minWidth: isWeb ? 'auto' : isTablet ? '22%' : '47%',
    ...(isWeb ? {
      minWidth: 0,
    } : {}),
  },
  statCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  statIconContainer: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statInfo: {
    flex: 1,
  },
  statValue: {
    fontWeight: '700',
    fontSize: isWeb ? 28 : 24,
    marginBottom: Spacing.xs,
  },
  contentGrid: {
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontWeight: '700',
    fontSize: isWeb ? 20 : 18,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    ...getCursorStyle(),
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
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xxl,
  },
  escalationStats: {
    gap: Spacing.lg,
    marginTop: Spacing.lg,
  },
  escalationStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  escalationStatIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  escalationStatInfo: {
    flex: 1,
  },
  quickActions: {
    gap: Spacing.lg,
    ...(isWeb ? {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
    } : {}),
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.xl,
    ...(isWeb ? {} : {
      marginBottom: Spacing.md,
    }),
  },
  actionCardContent: {
    flex: 1,
  },
});
