/**
 * Admin Dashboard - For Student Affairs and Moderators
 */

import { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Platform,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ThemedView } from '@/app/components/themed-view';
import { ThemedText } from '@/app/components/themed-text';
import { MaterialIcons } from '@expo/vector-icons';
import { useColorScheme } from '@/app/hooks/use-color-scheme';
import { Colors, Spacing, BorderRadius } from '@/app/constants/theme';
import { getPosts, getReports, getAnalytics, getUsers, getEscalations } from '@/lib/database';
import { createShadow, getCursorStyle, getContainerStyle } from '@/app/utils/platform-styles';
import { Post, Report, Analytics } from '@/app/types';
import { formatDistanceToNow } from 'date-fns';
import { subscribeToPosts, subscribeToEscalations } from '@/lib/realtime';
import { useRoleGuard } from '@/hooks/use-auth-guard';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';
const isTablet = width >= 768;

export default function AdminDashboardScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  
  // Role guard - only admins can access
  const { user, loading } = useRoleGuard(['admin'], '/(tabs)');
  
  if (loading) {
    return (
      <ThemedView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ThemedText>Loading...</ThemedText>
      </ThemedView>
    );
  }
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

  useEffect(() => {
    loadData();
    setupRealtimeSubscriptions();
    checkSystemHealth();
    
    // Refresh data every 30 seconds
    const interval = setInterval(() => {
      loadData();
      checkSystemHealth();
    }, 30000);

    return () => {
      clearInterval(interval);
    };
  }, []);

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
          title: `Escalation: ${escalation.level}`,
          date: escalation.createdAt,
        });
      });
      activity.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setRecentActivity(activity.slice(0, 10));
    } catch (error) {
      console.error('Error loading admin data:', error);
    }
  };

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

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ThemedView style={[styles.container, isWeb && getContainerStyle()]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.background }]}>
          <TouchableOpacity onPress={() => router.back()} style={getCursorStyle()}>
            <MaterialIcons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <ThemedText type="h2" style={styles.headerTitle}>
            Admin Dashboard
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
          {/* System Health */}
          <View style={[styles.healthCard, { backgroundColor: colors.card }, createShadow(2, '#000', 0.1)]}>
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
          </View>

          {/* Quick Stats */}
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: colors.card }, createShadow(2, '#000', 0.1)]}>
              <MaterialIcons name="forum" size={32} color={colors.primary} />
              <ThemedText type="h1" style={styles.statValue}>
                {stats.totalPosts}
              </ThemedText>
              <ThemedText type="small" style={[styles.statLabel, { color: colors.icon }]}>
                Total Posts
              </ThemedText>
            </View>

            <View style={[styles.statCard, { backgroundColor: colors.card }, createShadow(2, '#000', 0.1)]}>
              <MaterialIcons name="warning" size={32} color={colors.danger} />
              <ThemedText type="h1" style={styles.statValue}>
                {stats.totalEscalations}
              </ThemedText>
              <ThemedText type="small" style={[styles.statLabel, { color: colors.icon }]}>
                Escalations
              </ThemedText>
            </View>

            <View style={[styles.statCard, { backgroundColor: colors.card }, createShadow(2, '#000', 0.1)]}>
              <MaterialIcons name="report" size={32} color={colors.warning} />
              <ThemedText type="h1" style={styles.statValue}>
                {stats.pendingReports}
              </ThemedText>
              <ThemedText type="small" style={[styles.statLabel, { color: colors.icon }]}>
                Pending Reports
              </ThemedText>
            </View>

            <View style={[styles.statCard, { backgroundColor: colors.card }, createShadow(2, '#000', 0.1)]}>
              <MaterialIcons name="people" size={32} color={colors.success} />
              <ThemedText type="h1" style={styles.statValue}>
                {stats.activeUsers}
              </ThemedText>
              <ThemedText type="small" style={[styles.statLabel, { color: colors.icon }]}>
                Active Users (30d)
              </ThemedText>
            </View>
          </View>

          {/* Recent Activity */}
          {recentActivity.length > 0 && (
            <View style={styles.section}>
              <ThemedText type="h3" style={styles.sectionTitle}>
                Recent Activity
              </ThemedText>
              {recentActivity.slice(0, 5).map((activity) => (
                <View
                  key={`${activity.type}-${activity.id}`}
                  style={[styles.activityItem, { backgroundColor: colors.card }, createShadow(1, '#000', 0.05)]}
                >
                  <MaterialIcons
                    name={activity.type === 'post' ? 'forum' : 'priority-high'}
                    size={20}
                    color={activity.type === 'post' ? colors.primary : colors.danger}
                  />
                  <View style={styles.activityContent}>
                    <ThemedText type="body" style={{ fontWeight: '500' }}>
                      {activity.title}
                    </ThemedText>
                    <ThemedText type="small" style={{ color: colors.icon, marginTop: Spacing.xs }}>
                      {formatDistanceToNow(new Date(activity.date), { addSuffix: true })}
                    </ThemedText>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Escalated Posts */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <ThemedText type="h3" style={styles.sectionTitle}>
                Escalated Posts
              </ThemedText>
              <TouchableOpacity
                onPress={() => router.push('/admin/escalations')}
                style={getCursorStyle()}
              >
                <ThemedText type="body" style={[styles.viewAll, { color: colors.primary }]}>
                  View All
                </ThemedText>
              </TouchableOpacity>
            </View>

            {escalatedPosts.length === 0 ? (
              <View style={[styles.emptyCard, { backgroundColor: colors.card }]}>
                <MaterialIcons name="check-circle" size={48} color={colors.success} />
                <ThemedText type="body" style={[styles.emptyText, { color: colors.icon }]}>
                  No escalated posts
                </ThemedText>
              </View>
            ) : (
              escalatedPosts.map((post) => (
                <TouchableOpacity
                  key={post.id}
                  style={[
                    styles.postCard,
                    { backgroundColor: colors.card },
                    createShadow(2, '#000', 0.1),
                  ]}
                  onPress={() => router.push(`/post/${post.id}`)}
                  activeOpacity={0.7}
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
                  <ThemedText type="body" style={styles.postTitle} numberOfLines={2}>
                    {post.title}
                  </ThemedText>
                  <ThemedText type="small" style={[styles.postReason, { color: colors.icon }]}>
                    {post.escalationReason}
                  </ThemedText>
                </TouchableOpacity>
              ))
            )}
          </View>

          {/* Pending Reports */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <ThemedText type="h3" style={styles.sectionTitle}>
                Pending Reports
              </ThemedText>
              <TouchableOpacity
                onPress={() => router.push('/admin/reports')}
                style={getCursorStyle()}
              >
                <ThemedText type="body" style={[styles.viewAll, { color: colors.primary }]}>
                  View All
                </ThemedText>
              </TouchableOpacity>
            </View>

            {pendingReports.length === 0 ? (
              <View style={[styles.emptyCard, { backgroundColor: colors.card }]}>
                <MaterialIcons name="check-circle" size={48} color={colors.success} />
                <ThemedText type="body" style={[styles.emptyText, { color: colors.icon }]}>
                  No pending reports
                </ThemedText>
              </View>
            ) : (
              pendingReports.map((report) => (
                <TouchableOpacity
                  key={report.id}
                  style={[
                    styles.reportCard,
                    { backgroundColor: colors.card },
                    createShadow(2, '#000', 0.1),
                  ]}
                  onPress={() => router.push(`/admin/reports/${report.id}`)}
                  activeOpacity={0.7}
                >
                  <View style={styles.reportHeader}>
                    <MaterialIcons name="report-problem" size={20} color={colors.warning} />
                    <ThemedText type="body" style={styles.reportType}>
                      {report.targetType.toUpperCase()}
                    </ThemedText>
                  </View>
                  <ThemedText type="body" style={styles.reportReason}>
                    {report.reason}
                  </ThemedText>
                  <ThemedText type="small" style={[styles.reportTime, { color: colors.icon }]}>
                    {formatDistanceToNow(report.createdAt, { addSuffix: true })}
                  </ThemedText>
                </TouchableOpacity>
              ))
            )}
          </View>

          {/* Quick Actions */}
          <View style={styles.section}>
            <ThemedText type="h3" style={styles.sectionTitle}>
              Quick Actions
            </ThemedText>
            <View style={styles.actionsGrid}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.card }, createShadow(2, '#000', 0.1)]}
                onPress={() => router.push('/admin/analytics')}
                activeOpacity={0.7}
              >
                <MaterialIcons name="analytics" size={32} color={colors.primary} />
                <ThemedText type="body" style={styles.actionLabel}>
                  Analytics
                </ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.card }, createShadow(2, '#000', 0.1)]}
                onPress={() => router.push('/admin/moderation')}
                activeOpacity={0.7}
              >
                <MaterialIcons name="security" size={32} color={colors.warning} />
                <ThemedText type="body" style={styles.actionLabel}>
                  Moderation
                </ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.card }, createShadow(2, '#000', 0.1)]}
                onPress={() => router.push('/admin/escalations')}
                activeOpacity={0.7}
              >
                <MaterialIcons name="priority-high" size={32} color={colors.danger} />
                <ThemedText type="body" style={styles.actionLabel}>
                  Escalations
                </ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.card }, createShadow(2, '#000', 0.1)]}
                onPress={() => router.push('/admin/users')}
                activeOpacity={0.7}
              >
                <MaterialIcons name="people" size={32} color={colors.success} />
                <ThemedText type="body" style={styles.actionLabel}>
                  Users
                </ThemedText>
              </TouchableOpacity>
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
    ...(isWeb && {
      maxWidth: 1400,
      marginHorizontal: 'auto',
      width: '100%',
    }),
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  statCard: {
    width: '48%',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700',
    marginVertical: Spacing.xs,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontWeight: '700',
  },
  viewAll: {
    fontWeight: '600',
  },
  emptyCard: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  emptyText: {
    marginTop: Spacing.md,
  },
  postCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  escalationBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  postTitle: {
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  postReason: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  reportCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  reportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  reportType: {
    fontWeight: '700',
    fontSize: 12,
  },
  reportReason: {
    marginBottom: Spacing.xs,
  },
  reportTime: {
    fontSize: 12,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  actionButton: {
    width: '48%',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  actionLabel: {
    fontWeight: '600',
    textAlign: 'center',
  },
  healthCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  healthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  healthTitle: {
    fontWeight: '700',
  },
  healthStats: {
    flexDirection: 'row',
    gap: Spacing.lg,
  },
  healthStat: {
    flex: 1,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  activityContent: {
    flex: 1,
    marginLeft: Spacing.md,
  },
});


