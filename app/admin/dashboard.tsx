/**
 * Admin Dashboard - For Student Affairs and Moderators
 */

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { WebCard, WebContainer } from '@/components/web';
import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Analytics, Post, Report } from '@/types';
import { getCursorStyle } from '@/utils/platform-styles';
import { useRoleGuard } from '@/hooks/use-auth-guard';
import { getAnalytics, getEscalations, getPosts, getReports, getUsers } from '@/lib/database';
import { subscribeToEscalations, subscribeToPosts } from '@/lib/realtime';
import { MaterialIcons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Dimensions,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';
const isTablet = width >= 768;

export default function AdminDashboardScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  
  // Role guard - only admins can access
  const { user, loading } = useRoleGuard(['admin'], '/(tabs)');
  
  // All hooks must be called before any conditional returns
  const [refreshing, setRefreshing] = useState(false);
  const [escalatedPosts, setEscalatedPosts] = useState<Post[]>([]);
  const [pendingReports, setPendingReports] = useState<Report[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [systemHealth, setSystemHealth] = useState({
    status: 'healthy' as 'healthy' | 'warning' | 'critical',
    uptime: 0,
    responseTime: 0,
    activeConnections: 0,
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalPosts: 0,
    totalUsers: 0,
    totalEscalations: 0,
    pendingReports: 0,
    activeUsers: 0,
  });
  
  // Define functions before useEffect (they'll be hoisted, but this is clearer)
  const setupRealtimeSubscriptions = () => {
    // Subscribe to new posts
    const postsChannel = subscribeToPosts((post) => {
      if (post.escalationLevel !== 'none') {
        loadData(); // Reload when new escalation occurs
      }
    });

    // Subscribe to escalations
    const escalationsChannel = subscribeToEscalations(() => {
      loadData(); // Reload when escalation updates
    });

    return () => {
      postsChannel.unsubscribe();
      escalationsChannel.unsubscribe();
    };
  };

  const checkSystemHealth = async () => {
    try {
      const startTime = Date.now();
      // Simulate health check by fetching a simple query
      await getPosts();
      const responseTime = Date.now() - startTime;

      // Calculate system health status
      let status: 'healthy' | 'warning' | 'critical' = 'healthy';
      if (responseTime > 2000) {
        status = 'critical';
      } else if (responseTime > 1000) {
        status = 'warning';
      }

      setSystemHealth({
        status,
        uptime: Date.now(), // In a real app, this would be actual uptime
        responseTime,
        activeConnections: 0, // Would be actual connection count
      });
    } catch (error) {
      setSystemHealth({
        status: 'critical',
        uptime: 0,
        responseTime: 0,
        activeConnections: 0,
      });
    }
  };

  const loadData = async () => {
    try {
      const [posts, reports, analyticsData, users, escalations] = await Promise.all([
        getPosts(),
        getReports(),
        getAnalytics(),
        getUsers(),
        getEscalations(),
      ]);
      
      // Calculate stats
      const activeUsers = users.filter(u => {
        const lastActive = u.lastActive ? new Date(u.lastActive) : new Date(0);
        const daysSinceActive = (Date.now() - lastActive.getTime()) / (1000 * 60 * 60 * 24);
        return daysSinceActive <= 30;
      }).length;

      setStats({
        totalPosts: posts.length,
        totalUsers: users.length,
        totalEscalations: escalations.length,
        pendingReports: reports.filter(r => r.status === 'pending').length,
        activeUsers,
      });
      
      setEscalatedPosts(
        posts
          .filter(p => p.escalationLevel !== 'none')
          .sort((a, b) => {
            const levelOrder: Record<string, number> = { critical: 5, high: 4, medium: 3, low: 2, none: 0 };
            return (levelOrder[b.escalationLevel] || 0) - (levelOrder[a.escalationLevel] || 0);
          })
          .slice(0, 5)
      );
      
      setPendingReports(
        reports
          .filter(r => r.status === 'pending')
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 5)
      );
      
      setAnalytics(analyticsData);

      // Load recent activity
      const activity: any[] = [];
      posts.slice(0, 10).forEach(post => {
        activity.push({
          type: 'post',
          id: post.id,
          title: post.title,
          date: post.createdAt,
          user: post.authorPseudonym,
        });
      });
      escalations.slice(0, 10).forEach(escalation => {
        activity.push({
          type: 'escalation',
          id: escalation.id,
          title: `Escalation: ${escalation.escalationLevel || 'unknown'}`,
          date: escalation.detectedAt || new Date(),
        });
      });
      activity.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setRecentActivity(activity.slice(0, 10));
    } catch (error) {
      console.error('Error loading admin data:', error);
    }
  };

  // All hooks must be called before any conditional returns
  useEffect(() => {
    // Only run effects when not loading and user is available
    if (loading || !user) return;
    
    loadData();
    const unsubscribeRealtime = setupRealtimeSubscriptions();
    checkSystemHealth();
    
    // Refresh data every 30 seconds
    const interval = setInterval(() => {
      loadData();
      checkSystemHealth();
    }, 30000);

    return () => {
      clearInterval(interval);
      if (unsubscribeRealtime) {
        unsubscribeRealtime();
      }
    };
  }, [loading, user]);
  
  // Early return AFTER all hooks
  if (loading) {
    return (
      <ThemedView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ThemedText>Loading...</ThemedText>
      </ThemedView>
    );
  }

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getEscalationColor = (level: string) => {
    switch (level) {
      case 'critical': return '#F44336';
      case 'high': return '#FF9800';
      case 'medium': return '#FFC107';
      case 'low': return '#2196F3';
      default: return colors.icon;
    }
  };

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
          <ThemedText type="h1" style={[styles.pageTitle, { color: colors.text }]}>
            Admin Dashboard
          </ThemedText>
          <ThemedText type="body" style={[styles.pageSubtitle, { color: colors.icon }]}>
            System overview and management
          </ThemedText>
        </View>
      )}

      {/* System Health */}
      <WebCard style={styles.healthCard}>
        <View style={styles.healthHeader}>
          <MaterialIcons 
            name={systemHealth.status === 'healthy' ? 'check-circle' : systemHealth.status === 'warning' ? 'warning' : 'error'} 
            size={24} 
            color={
              systemHealth.status === 'healthy' ? colors.success : 
              systemHealth.status === 'warning' ? colors.warning : 
              colors.danger
            } 
          />
          <ThemedText type="h3" style={styles.healthTitle}>
            System Health: {systemHealth.status.toUpperCase()}
          </ThemedText>
        </View>
        <View style={styles.healthStats}>
          <View style={styles.healthStat}>
            <ThemedText type="small" style={{ color: colors.icon }}>Response Time</ThemedText>
            <ThemedText type="body" style={{ fontWeight: '600' }}>
              {systemHealth.responseTime}ms
            </ThemedText>
          </View>
          <View style={styles.healthStat}>
            <ThemedText type="small" style={{ color: colors.icon }}>Active Connections</ThemedText>
            <ThemedText type="body" style={{ fontWeight: '600' }}>
              {systemHealth.activeConnections}
            </ThemedText>
          </View>
        </View>
      </WebCard>

      {/* Quick Stats */}
      <View style={styles.statsGrid}>
        <WebCard style={styles.statCard}>
          <View style={styles.statCardContent}>
            <View style={[styles.statIconContainer, { backgroundColor: colors.primary + '15' }]}>
              <MaterialIcons name="forum" size={28} color={colors.primary} />
            </View>
            <View style={styles.statInfo}>
              <ThemedText type="h1" style={[styles.statValue, { color: colors.text }]}>
                {stats.totalPosts}
              </ThemedText>
              <ThemedText type="small" style={{ color: colors.icon }}>
                Total Posts
              </ThemedText>
            </View>
          </View>
        </WebCard>

        <WebCard style={styles.statCard}>
          <View style={styles.statCardContent}>
            <View style={[styles.statIconContainer, { backgroundColor: colors.danger + '15' }]}>
              <MaterialIcons name="warning" size={28} color={colors.danger} />
            </View>
            <View style={styles.statInfo}>
              <ThemedText type="h1" style={[styles.statValue, { color: colors.text }]}>
                {stats.totalEscalations}
              </ThemedText>
              <ThemedText type="small" style={{ color: colors.icon }}>
                Escalations
              </ThemedText>
            </View>
          </View>
        </WebCard>

        <WebCard style={styles.statCard}>
          <View style={styles.statCardContent}>
            <View style={[styles.statIconContainer, { backgroundColor: colors.warning + '15' }]}>
              <MaterialIcons name="report" size={28} color={colors.warning} />
            </View>
            <View style={styles.statInfo}>
              <ThemedText type="h1" style={[styles.statValue, { color: colors.text }]}>
                {stats.pendingReports}
              </ThemedText>
              <ThemedText type="small" style={{ color: colors.icon }}>
                Pending Reports
              </ThemedText>
            </View>
          </View>
        </WebCard>

        <WebCard style={styles.statCard}>
          <View style={styles.statCardContent}>
            <View style={[styles.statIconContainer, { backgroundColor: colors.success + '15' }]}>
              <MaterialIcons name="people" size={28} color={colors.success} />
            </View>
            <View style={styles.statInfo}>
              <ThemedText type="h1" style={[styles.statValue, { color: colors.text }]}>
                {stats.activeUsers}
              </ThemedText>
              <ThemedText type="small" style={{ color: colors.icon }}>
                Active Users (30d)
              </ThemedText>
            </View>
          </View>
        </WebCard>
      </View>

      {/* Recent Activity */}
      {recentActivity.length > 0 && (
        <WebCard style={styles.section}>
          <ThemedText type="h3" style={[styles.sectionTitle, { color: colors.text }]}>
            Recent Activity
          </ThemedText>
          <View style={styles.activityList}>
            {recentActivity.slice(0, 5).map((activity) => (
              <WebCard
                key={`${activity.type}-${activity.id}`}
                hoverable
                style={styles.activityItem}
              >
                <View style={[styles.activityIconContainer, { backgroundColor: (activity.type === 'post' ? colors.primary : colors.danger) + '15' }]}>
                  <MaterialIcons
                    name={activity.type === 'post' ? 'forum' : 'priority-high'}
                    size={20}
                    color={activity.type === 'post' ? colors.primary : colors.danger}
                  />
                </View>
                <View style={styles.activityContent}>
                  <ThemedText type="body" style={[styles.activityTitle, { color: colors.text }]}>
                    {activity.title}
                  </ThemedText>
                  <ThemedText type="small" style={{ color: colors.icon, marginTop: Spacing.xs }}>
                    {formatDistanceToNow(new Date(activity.date), { addSuffix: true })}
                  </ThemedText>
                </View>
              </WebCard>
            ))}
          </View>
        </WebCard>
      )}

      {/* Escalated Posts */}
      <WebCard style={styles.section}>
        <View style={styles.sectionHeader}>
          <ThemedText type="h3" style={[styles.sectionTitle, { color: colors.text }]}>
            Escalated Posts
          </ThemedText>
          <TouchableOpacity
            onPress={() => router.push('/admin/escalations')}
            style={getCursorStyle()}
          >
            <ThemedText type="body" style={[styles.viewAll, { color: colors.primary }]}>
              View All →
            </ThemedText>
          </TouchableOpacity>
        </View>

        {escalatedPosts.length === 0 ? (
          <View style={styles.emptyCard}>
            <MaterialIcons name="check-circle" size={48} color={colors.success} />
            <ThemedText type="body" style={[styles.emptyText, { color: colors.icon }]}>
              No escalated posts
            </ThemedText>
          </View>
        ) : (
          <View style={styles.postsList}>
            {escalatedPosts.map((post) => (
              <WebCard
                key={post.id}
                hoverable
                onPress={() => router.push(`/post/${post.id}`)}
                style={styles.postCard}
              >
                <View style={styles.postHeader}>
                  <View style={[
                    styles.escalationBadge,
                    { backgroundColor: getEscalationColor(post.escalationLevel) + '20' }
                  ]}>
                    <ThemedText type="small" style={{ color: getEscalationColor(post.escalationLevel), fontWeight: '700' }}>
                      {post.escalationLevel.toUpperCase()}
                    </ThemedText>
                  </View>
                  <ThemedText type="small" style={{ color: colors.icon }}>
                    {formatDistanceToNow(post.createdAt, { addSuffix: true })}
                  </ThemedText>
                </View>
                <ThemedText type="body" style={[styles.postTitle, { color: colors.text }]} numberOfLines={2}>
                  {post.title}
                </ThemedText>
                {post.escalationReason && (
                  <ThemedText type="small" style={[styles.postReason, { color: colors.icon }]}>
                    {post.escalationReason}
                  </ThemedText>
                )}
              </WebCard>
            ))}
          </View>
        )}
      </WebCard>

      {/* Pending Reports */}
      <WebCard style={styles.section}>
        <View style={styles.sectionHeader}>
          <ThemedText type="h3" style={[styles.sectionTitle, { color: colors.text }]}>
            Pending Reports
          </ThemedText>
          <TouchableOpacity
            onPress={() => router.push('/admin/reports')}
            style={getCursorStyle()}
          >
            <ThemedText type="body" style={[styles.viewAll, { color: colors.primary }]}>
              View All →
            </ThemedText>
          </TouchableOpacity>
        </View>

        {pendingReports.length === 0 ? (
          <View style={styles.emptyCard}>
            <MaterialIcons name="check-circle" size={48} color={colors.success} />
            <ThemedText type="body" style={[styles.emptyText, { color: colors.icon }]}>
              No pending reports
            </ThemedText>
          </View>
        ) : (
          <View style={styles.reportsList}>
            {pendingReports.map((report) => (
              <WebCard
                key={report.id}
                hoverable
                onPress={() => router.push(`/admin/reports`)}
                style={styles.reportCard}
              >
                <View style={styles.reportHeader}>
                  <View style={[styles.reportIconContainer, { backgroundColor: colors.warning + '15' }]}>
                    <MaterialIcons name="report-problem" size={20} color={colors.warning} />
                  </View>
                  <ThemedText type="body" style={[styles.reportType, { color: colors.text }]}>
                    {report.targetType.toUpperCase()}
                  </ThemedText>
                </View>
                <ThemedText type="body" style={[styles.reportReason, { color: colors.text }]}>
                  {report.reason}
                </ThemedText>
                <ThemedText type="small" style={{ color: colors.icon, marginTop: Spacing.xs }}>
                  {formatDistanceToNow(report.createdAt, { addSuffix: true })}
                </ThemedText>
              </WebCard>
            ))}
          </View>
        )}
      </WebCard>

      {/* Quick Actions */}
      <WebCard style={styles.section}>
        <ThemedText type="h3" style={[styles.sectionTitle, { color: colors.text }]}>
          Quick Actions
        </ThemedText>
        <View style={styles.actionsGrid}>
          <WebCard
            hoverable
            onPress={() => router.push('/admin/analytics')}
            style={styles.actionButton}
          >
            <View style={[styles.actionIconContainer, { backgroundColor: colors.primary + '15' }]}>
              <MaterialIcons name="analytics" size={28} color={colors.primary} />
            </View>
            <ThemedText type="body" style={[styles.actionLabel, { color: colors.text }]}>
              Analytics
            </ThemedText>
          </WebCard>

          <WebCard
            hoverable
            onPress={() => router.push('/admin/moderation')}
            style={styles.actionButton}
          >
            <View style={[styles.actionIconContainer, { backgroundColor: colors.warning + '15' }]}>
              <MaterialIcons name="security" size={28} color={colors.warning} />
            </View>
            <ThemedText type="body" style={[styles.actionLabel, { color: colors.text }]}>
              Moderation
            </ThemedText>
          </WebCard>

          <WebCard
            hoverable
            onPress={() => router.push('/admin/escalations')}
            style={styles.actionButton}
          >
            <View style={[styles.actionIconContainer, { backgroundColor: colors.danger + '15' }]}>
              <MaterialIcons name="priority-high" size={28} color={colors.danger} />
            </View>
            <ThemedText type="body" style={[styles.actionLabel, { color: colors.text }]}>
              Escalations
            </ThemedText>
          </WebCard>

          <WebCard
            hoverable
            onPress={() => router.push('/admin/users')}
            style={styles.actionButton}
          >
            <View style={[styles.actionIconContainer, { backgroundColor: colors.success + '15' }]}>
              <MaterialIcons name="people" size={28} color={colors.success} />
            </View>
            <ThemedText type="body" style={[styles.actionLabel, { color: colors.text }]}>
              Users
            </ThemedText>
          </WebCard>
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
                router.replace('/(tabs)' as any);
              }
            }} 
            style={getCursorStyle()}
          >
            <MaterialIcons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <ThemedText type="h2" style={styles.headerTitle}>
            Admin Dashboard
          </ThemedText>
          <View style={{ width: 24 }} />
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
  pageTitle: {
    fontWeight: '700',
    fontSize: isWeb ? 32 : 24,
    marginBottom: Spacing.xs,
  },
  pageSubtitle: {
    fontSize: isWeb ? 16 : 14,
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
  healthCard: {
    marginBottom: Spacing.lg,
  },
  healthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  healthTitle: {
    fontWeight: '600',
  },
  healthStats: {
    flexDirection: 'row',
    gap: Spacing.lg,
  },
  healthStat: {
    flex: 1,
  },
  statsGrid: {
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
  statCard: {
    ...(isWeb ? {} : {
      width: '48%',
    }),
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
    fontSize: isWeb ? 28 : 24,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontWeight: '700',
    fontSize: isWeb ? 20 : 18,
  },
  viewAll: {
    fontWeight: '600',
  },
  activityList: {
    gap: Spacing.md,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.md,
  },
  activityIconContainer: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontWeight: '500',
  },
  emptyCard: {
    padding: Spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    marginTop: Spacing.md,
  },
  postsList: {
    gap: Spacing.md,
  },
  postCard: {
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  escalationBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  postTitle: {
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  postReason: {
    marginTop: Spacing.xs,
  },
  reportsList: {
    gap: Spacing.md,
  },
  reportCard: {
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  reportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  reportIconContainer: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reportType: {
    fontWeight: '600',
  },
  reportReason: {
    fontWeight: '500',
  },
  actionsGrid: {
    ...(isWeb ? {
      display: 'grid' as any,
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' as any,
      gap: Spacing.lg,
    } : {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.md,
    }),
  } as any,
  actionButton: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    gap: Spacing.md,
    ...(isWeb ? {} : {
      width: '48%',
    }),
  },
  actionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionLabel: {
    fontWeight: '600',
    textAlign: 'center',
  },
});


