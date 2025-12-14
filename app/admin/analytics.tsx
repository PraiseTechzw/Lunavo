/**
 * Analytics Dashboard - For Student Affairs to identify trends
 */

import { ThemedText } from '@/app/components/themed-text';
import { ThemedView } from '@/app/components/themed-view';
import { WebCard, WebContainer } from '@/app/components/web';
import { CATEGORIES } from '@/app/constants/categories';
import { BorderRadius, Colors, Spacing } from '@/app/constants/theme';
import { useColorScheme } from '@/app/hooks/use-color-scheme';
import { Analytics as AnalyticsType, PostCategory } from '@/app/types';
import { getCursorStyle } from '@/app/utils/platform-styles';
import { useRoleGuard } from '@/hooks/use-auth-guard';
import { getEscalations, getPosts, getUsers } from '@/lib/database';
import { MaterialIcons } from '@expo/vector-icons';
import { endOfDay, format, startOfDay, subDays } from 'date-fns';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  Dimensions,
  Platform,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

export default function AnalyticsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  
  // Role guard - only admins can access
  const { user, loading } = useRoleGuard(['admin'], '/(tabs)');
  
  const [refreshing, setRefreshing] = useState(false);
  const [analytics, setAnalytics] = useState<AnalyticsType | null>(null);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'all' | 'custom'>('30d');
  const [customStartDate, setCustomStartDate] = useState<Date>(subDays(new Date(), 30));
  const [customEndDate, setCustomEndDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // Early return for loading
  if (loading) {
    return (
      <ThemedView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ThemedText>Loading...</ThemedText>
      </ThemedView>
    );
  }

  useEffect(() => {
    loadAnalytics();
  }, [dateRange, customStartDate, customEndDate]);

  const getDateRangeDates = () => {
    const now = new Date();
    let start: Date;
    let end: Date = endOfDay(now);

    switch (dateRange) {
      case '7d':
        start = startOfDay(subDays(now, 7));
        break;
      case '30d':
        start = startOfDay(subDays(now, 30));
        break;
      case '90d':
        start = startOfDay(subDays(now, 90));
        break;
      case 'custom':
        start = startOfDay(customStartDate);
        end = endOfDay(customEndDate);
        break;
      default: // 'all'
        start = new Date(0);
        end = endOfDay(now);
    }

    return { start, end };
  };

  const loadAnalytics = async () => {
    try {
      const { start, end } = getDateRangeDates();
      const [posts, escalations, users] = await Promise.all([
        getPosts(),
        getEscalations(),
        getUsers(),
      ]);

      // Filter by date range
      const filteredPosts = posts.filter(p => {
        const postDate = new Date(p.createdAt);
        return postDate >= start && postDate <= end;
      });

      const filteredEscalations = escalations.filter(e => {
        const escDate = new Date(e.detectedAt);
        return escDate >= start && escDate <= end;
      });

      // Calculate analytics
      const postsByCategory: Record<string, number> = {};
      filteredPosts.forEach(post => {
        postsByCategory[post.category] = (postsByCategory[post.category] || 0) + 1;
      });

      const activeUsers = users.filter(u => {
        const lastActive = u.lastActive ? new Date(u.lastActive) : new Date(0);
        return lastActive >= start;
      }).length;

      const analyticsData: AnalyticsType = {
        totalPosts: filteredPosts.length,
        escalationCount: filteredEscalations.length,
        activeUsers,
        postsByCategory,
        responseTime: 0, // Calculate from replies if needed
        commonIssues: [], // Add empty array for commonIssues
      };

      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
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

  const handleExport = async () => {
    try {
      if (!analytics) {
        Alert.alert('Error', 'No data to export');
        return;
      }

      // Generate CSV content
      const csvRows: string[] = [];
      csvRows.push('Analytics Report');
      csvRows.push(`Date Range: ${dateRange === 'custom' ? `${format(customStartDate, 'yyyy-MM-dd')} to ${format(customEndDate, 'yyyy-MM-dd')}` : dateRange}`);
      csvRows.push(`Generated: ${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}`);
      csvRows.push('');
      csvRows.push('Metric,Value');
      csvRows.push(`Total Posts,${analytics.totalPosts}`);
      csvRows.push(`Escalations,${analytics.escalationCount}`);
      csvRows.push(`Active Users,${analytics.activeUsers}`);
      csvRows.push('');
      csvRows.push('Posts by Category');
      Object.entries(analytics.postsByCategory).forEach(([category, count]) => {
        csvRows.push(`${getCategoryName(category as PostCategory)},${count}`);
      });

      const csvContent = csvRows.join('\n');

      // Share the CSV content
      try {
        await Share.share({
          message: csvContent,
          title: `Analytics Report - ${format(new Date(), 'yyyy-MM-dd')}`,
        });
      } catch (error) {
        // Fallback: show content in alert
        Alert.alert(
          'Analytics Report',
          csvContent.substring(0, 500) + (csvContent.length > 500 ? '...' : ''),
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error exporting analytics:', error);
      Alert.alert('Error', 'Failed to export analytics');
    }
  };

  const postsByCategory = analytics?.postsByCategory || {};
  const totalPosts = analytics?.totalPosts || 1;
  const maxPosts = Math.max(...Object.values(postsByCategory).map(v => typeof v === 'number' ? v : 0), 1);

  const content = (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Page Header - Web optimized */}
      {isWeb && (
        <View style={styles.pageHeader}>
          <View style={styles.pageHeaderTop}>
            <View>
              <ThemedText type="h1" style={[styles.pageTitle, { color: colors.text }]}>
                Analytics & Trends
              </ThemedText>
              <ThemedText type="body" style={[styles.pageSubtitle, { color: colors.icon }]}>
                Comprehensive system analytics and insights
              </ThemedText>
            </View>
            <TouchableOpacity
              onPress={handleExport}
              style={[styles.exportButtonHeader, { backgroundColor: colors.primary }]}
            >
              <MaterialIcons name="download" size={20} color="#FFFFFF" />
              <ThemedText type="body" style={{ color: '#FFFFFF', marginLeft: Spacing.sm, fontWeight: '600' }}>
                Export CSV
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Date Range Filter */}
      <WebCard style={styles.dateRangeCard}>
        <ThemedText type="h3" style={[styles.sectionTitle, { color: colors.text }]}>
          Date Range
        </ThemedText>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateRangeScroll}>
          {(['7d', '30d', '90d', 'all', 'custom'] as const).map((range) => (
            <TouchableOpacity
              key={range}
              style={[
                styles.dateRangeChip,
                {
                  backgroundColor: dateRange === range ? colors.primary : colors.surface,
                  borderColor: dateRange === range ? colors.primary : colors.border,
                },
              ]}
              onPress={() => {
                setDateRange(range);
                if (range === 'custom') {
                  setShowDatePicker(true);
                }
              }}
            >
              <ThemedText
                type="small"
                style={{
                  color: dateRange === range ? '#FFFFFF' : colors.text,
                  fontWeight: '600',
                }}
              >
                {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : range === '90d' ? '90 Days' : range === 'all' ? 'All Time' : 'Custom'}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </ScrollView>
        {dateRange === 'custom' && (
          <View style={styles.customDateInfo}>
            <ThemedText type="small" style={{ color: colors.icon }}>
              {format(customStartDate, 'MMM dd, yyyy')} - {format(customEndDate, 'MMM dd, yyyy')}
            </ThemedText>
          </View>
        )}
      </WebCard>

      {/* Export Button - Mobile only */}
      {!isWeb && (
        <TouchableOpacity
          style={[styles.exportButton, { backgroundColor: colors.primary }]}
          onPress={handleExport}
        >
          <MaterialIcons name="file-download" size={20} color="#FFFFFF" />
          <ThemedText type="body" style={{ color: '#FFFFFF', marginLeft: Spacing.sm, fontWeight: '600' }}>
            Export Report (CSV)
          </ThemedText>
        </TouchableOpacity>
      )}

      {/* Overview Stats */}
      <View style={styles.overviewSection}>
        <WebCard style={styles.overviewCard}>
          <View style={styles.overviewCardContent}>
            <View style={[styles.overviewIconContainer, { backgroundColor: colors.primary + '15' }]}>
              <MaterialIcons name="forum" size={32} color={colors.primary} />
            </View>
            <View style={styles.overviewInfo}>
              <ThemedText type="h1" style={[styles.overviewValue, { color: colors.text }]}>
                {analytics?.totalPosts || 0}
              </ThemedText>
              <ThemedText type="body" style={{ color: colors.icon }}>
                Total Posts
              </ThemedText>
            </View>
          </View>
        </WebCard>

        <WebCard style={styles.overviewCard}>
          <View style={styles.overviewCardContent}>
            <View style={[styles.overviewIconContainer, { backgroundColor: colors.danger + '15' }]}>
              <MaterialIcons name="warning" size={32} color={colors.danger} />
            </View>
            <View style={styles.overviewInfo}>
              <ThemedText type="h1" style={[styles.overviewValue, { color: colors.text }]}>
                {analytics?.escalationCount || 0}
              </ThemedText>
              <ThemedText type="body" style={{ color: colors.icon }}>
                Escalations
              </ThemedText>
            </View>
          </View>
        </WebCard>

        <WebCard style={styles.overviewCard}>
          <View style={styles.overviewCardContent}>
            <View style={[styles.overviewIconContainer, { backgroundColor: colors.success + '15' }]}>
              <MaterialIcons name="people" size={32} color={colors.success} />
            </View>
            <View style={styles.overviewInfo}>
              <ThemedText type="h1" style={[styles.overviewValue, { color: colors.text }]}>
                {analytics?.activeUsers || 0}
              </ThemedText>
              <ThemedText type="body" style={{ color: colors.icon }}>
                Active Users
              </ThemedText>
            </View>
          </View>
        </WebCard>

        <WebCard style={styles.overviewCard}>
          <View style={styles.overviewCardContent}>
            <View style={[styles.overviewIconContainer, { backgroundColor: colors.warning + '15' }]}>
              <MaterialIcons name="schedule" size={32} color={colors.warning} />
            </View>
            <View style={styles.overviewInfo}>
              <ThemedText type="h1" style={[styles.overviewValue, { color: colors.text }]}>
                {analytics?.responseTime || 0}m
              </ThemedText>
              <ThemedText type="body" style={{ color: colors.icon }}>
                Avg Response Time
              </ThemedText>
            </View>
          </View>
        </WebCard>
      </View>

      {/* Posts by Category */}
      <WebCard style={styles.section}>
        <ThemedText type="h3" style={[styles.sectionTitle, { color: colors.text }]}>
          Posts by Category
        </ThemedText>
        <View style={styles.categoryChart}>
              {Object.entries(postsByCategory).map(([category, count]) => {
                const countNum = typeof count === 'number' ? count : 0;
                const percentage = (countNum / totalPosts) * 100;
                const barWidth = (countNum / maxPosts) * (width - Spacing.xl * 2 - Spacing.md * 4);
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
                        {countNum}
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
      </WebCard>

      {/* Common Issues */}
      <WebCard style={styles.section}>
        <ThemedText type="h3" style={[styles.sectionTitle, { color: colors.text }]}>
          Common Issues & Trends
        </ThemedText>
        <View style={styles.issuesCard}>
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
                        {issue && issue.length > 0 ? issue.charAt(0).toUpperCase() + issue.slice(1) : 'Unknown Issue'}
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
      </WebCard>

      {/* Insights */}
      <WebCard style={styles.section}>
        <ThemedText type="h3" style={[styles.sectionTitle, { color: colors.text }]}>
          Key Insights
        </ThemedText>
        <View style={styles.insightsCard}>
              <View style={styles.insightItem}>
                <MaterialIcons name="insights" size={24} color={colors.primary} />
                <View style={styles.insightContent}>
                  <ThemedText type="body" style={styles.insightTitle}>
                    Top Concern Category
                  </ThemedText>
                  <ThemedText type="small" style={[styles.insightValue, { color: colors.icon }]}>
                    {Object.entries(postsByCategory).length > 0
                      ? getCategoryName(
                          Object.entries(postsByCategory).sort((a, b) => {
                            const aVal = typeof a[1] === 'number' ? a[1] : 0;
                            const bVal = typeof b[1] === 'number' ? b[1] : 0;
                            return bVal - aVal;
                          })[0][0] as PostCategory
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
      </WebCard>

      <View style={{ height: Spacing.xl }} />
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
        {/* Mobile Header */}
        <View style={[styles.header, { backgroundColor: colors.background }]}>
          <TouchableOpacity 
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/admin/dashboard' as any);
              }
            }} 
            style={getCursorStyle()}
          >
            <MaterialIcons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <ThemedText type="h2" style={styles.headerTitle}>
            Analytics & Trends
          </ThemedText>
          <TouchableOpacity onPress={handleExport} style={getCursorStyle()}>
            <MaterialIcons name="download" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>
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
    ...(isWeb ? {
      height: '100%',
      overflow: 'hidden',
    } : {}),
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
  pageHeader: {
    marginBottom: Spacing.xl,
    marginTop: Spacing.lg,
  },
  pageHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.lg,
  },
  pageTitle: {
    fontWeight: '700',
    fontSize: isWeb ? 32 : 24,
    marginBottom: Spacing.xs,
  },
  pageSubtitle: {
    fontSize: isWeb ? 16 : 14,
  },
  exportButtonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    ...getCursorStyle(),
  },
  scrollView: {
    flex: 1,
    ...(isWeb ? {
      height: '100%',
      overflowY: 'auto' as any,
    } : {}),
  },
  scrollContent: {
    padding: isWeb ? 0 : Spacing.md,
    paddingBottom: isWeb ? Spacing.xxl : 80,
    ...(isWeb ? {
      minHeight: '100%',
    } : {}),
  },
  dateRangeCard: {
    marginBottom: Spacing.lg,
  },
  dateRangeSection: {
    marginBottom: Spacing.lg,
  },
  dateRangeScroll: {
    marginTop: Spacing.sm,
  },
  dateRangeChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    marginRight: Spacing.sm,
    borderWidth: 1,
    ...getCursorStyle(),
  },
  customDateInfo: {
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  overviewSection: {
    ...(isWeb ? {
      display: 'grid' as any,
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' as any,
      gap: Spacing.lg,
    } : {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.md,
    }),
    marginBottom: Spacing.xl,
  } as any,
  overviewCard: {
    ...(isWeb ? {} : {
      width: '48%',
    }),
  },
  overviewCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  overviewIconContainer: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overviewInfo: {
    flex: 1,
  },
  overviewValue: {
    fontSize: isWeb ? 32 : 28,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontWeight: '700',
    fontSize: isWeb ? 20 : 18,
    marginBottom: Spacing.lg,
  },
  categoryChart: {
    padding: Spacing.md,
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

