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
import { getPosts, getReports, getAnalytics } from '@/app/utils/storage';
import { createShadow, getCursorStyle, getContainerStyle } from '@/app/utils/platform-styles';
import { Post, Report, Analytics } from '@/app/types';
import { formatDistanceToNow } from 'date-fns';

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

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [posts, reports, analyticsData] = await Promise.all([
      getPosts(),
      getReports(),
      getAnalytics(),
    ]);
    
    setEscalatedPosts(
      posts
        .filter(p => p.escalationLevel !== 'none')
        .sort((a, b) => {
          const levelOrder = { critical: 5, high: 4, medium: 3, low: 2, none: 0 };
          return levelOrder[b.escalationLevel] - levelOrder[a.escalationLevel];
        })
        .slice(0, 5)
    );
    
    setPendingReports(
      reports
        .filter(r => r.status === 'pending')
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, 5)
    );
    
    setAnalytics(analyticsData);
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
          {/* Quick Stats */}
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: colors.card }, createShadow(2, '#000', 0.1)]}>
              <MaterialIcons name="forum" size={32} color={colors.primary} />
              <ThemedText type="h1" style={styles.statValue}>
                {analytics?.totalPosts || 0}
              </ThemedText>
              <ThemedText type="small" style={[styles.statLabel, { color: colors.icon }]}>
                Total Posts
              </ThemedText>
            </View>

            <View style={[styles.statCard, { backgroundColor: colors.card }, createShadow(2, '#000', 0.1)]}>
              <MaterialIcons name="warning" size={32} color={colors.danger} />
              <ThemedText type="h1" style={styles.statValue}>
                {analytics?.escalationCount || 0}
              </ThemedText>
              <ThemedText type="small" style={[styles.statLabel, { color: colors.icon }]}>
                Escalations
              </ThemedText>
            </View>

            <View style={[styles.statCard, { backgroundColor: colors.card }, createShadow(2, '#000', 0.1)]}>
              <MaterialIcons name="report" size={32} color={colors.warning} />
              <ThemedText type="h1" style={styles.statValue}>
                {pendingReports.length}
              </ThemedText>
              <ThemedText type="small" style={[styles.statLabel, { color: colors.icon }]}>
                Pending Reports
              </ThemedText>
            </View>

            <View style={[styles.statCard, { backgroundColor: colors.card }, createShadow(2, '#000', 0.1)]}>
              <MaterialIcons name="people" size={32} color={colors.success} />
              <ThemedText type="h1" style={styles.statValue}>
                {analytics?.activeUsers || 0}
              </ThemedText>
              <ThemedText type="small" style={[styles.statLabel, { color: colors.icon }]}>
                Active Users
              </ThemedText>
            </View>
          </View>

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
});


