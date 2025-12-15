/**
 * Executive Dashboard - For peer educator executives
 * System-level supervisors - No student identities visible
 */

import { DrawerHeader } from '@/components/navigation/drawer-header';
import { DrawerMenu } from '@/components/navigation/drawer-menu';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import { useRoleGuard } from '@/hooks/use-auth-guard';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getMeetings, getPosts, getReplies } from '@/lib/database';
import { supabase } from '@/lib/supabase';
import { PostCategory } from '@/types';
import { createShadow, getCursorStyle } from '@/utils/platform-styles';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { usePathname, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
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
const isMobile = Platform.OS !== 'web';

interface SystemMetrics {
  // Platform Oversight
  activeCases: number;
  pendingCases: number;
  respondedCases: number;
  escalatedCases: number;
  
  // Categories breakdown (numbers only, no identities)
  categoryBreakdown: Record<PostCategory, number>;
  
  // Response SLA status
  onTimeResponses: number;
  lateResponses: number;
  averageResponseTime: number; // in hours
  
  // Escalation count
  escalationCount: number;
  
  // Daily/Weekly posts
  dailyPosts: number;
  weeklyPosts: number;
}

export default function ExecutiveDashboardScreen() {
  const router = useRouter();
  const pathname = usePathname(); // Moved to top - must be called before any conditional returns
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  
  const { user, loading: authLoading } = useRoleGuard(
    ['peer-educator-executive', 'admin'],
    '/(tabs)'
  );
  
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalMembers: 0,
    activeMembers: 0,
    upcomingMeetings: 0,
    totalResponses: 0,
  });
  
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics>({
    activeCases: 0,
    pendingCases: 0,
    respondedCases: 0,
    escalatedCases: 0,
    categoryBreakdown: {} as Record<PostCategory, number>,
    onTimeResponses: 0,
    lateResponses: 0,
    averageResponseTime: 0,
    escalationCount: 0,
    dailyPosts: 0,
    weeklyPosts: 0,
  });

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [meetings, posts] = await Promise.all([
        getMeetings(),
        getPosts(),
      ]);

      // Get all replies
      const allReplies = await Promise.all(posts.map((p) => 
        getReplies(p.id).catch(() => [])
      ));
      const replies = allReplies.flat();

      // Get peer educators from Supabase
      const { data: members } = await supabase
        .from('users')
        .select('id, last_active')
        .in('role', ['peer-educator', 'peer-educator-executive']);

      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const activeMembers = members?.filter((m: any) => 
        new Date(m.last_active) >= thirtyDaysAgo
      ).length || 0;

      const upcomingMeetings = meetings.filter((m) => 
        new Date(m.scheduledDate) >= now
      ).length;

      // Calculate system metrics (NO STUDENT IDENTITIES)
      const activeCases = posts.filter(p => p.status === 'active').length;
      const pendingCases = posts.filter(p => p.status === 'active' && p.replies.length === 0).length;
      const respondedCases = posts.filter(p => p.replies.length > 0).length;
      const escalatedCases = posts.filter(p => p.escalationLevel !== 'none').length;
      
      // Category breakdown (numbers only)
      const categoryBreakdown: Record<string, number> = {};
      posts.forEach(post => {
        categoryBreakdown[post.category] = (categoryBreakdown[post.category] || 0) + 1;
      });
      
      // Response SLA tracking (24 hour SLA)
      const SLA_HOURS = 24;
      let totalResponseTime = 0;
      let responseCount = 0;
      let onTime = 0;
      let late = 0;
      
      posts.forEach(post => {
        if (post.replies.length > 0) {
          const firstReply = post.replies[0];
          const postTime = new Date(post.createdAt).getTime();
          const replyTime = new Date(firstReply.createdAt).getTime();
          const hoursDiff = (replyTime - postTime) / (1000 * 60 * 60);
          
          totalResponseTime += hoursDiff;
          responseCount++;
          
          if (hoursDiff <= SLA_HOURS) {
            onTime++;
          } else {
            late++;
          }
        }
      });
      
      const averageResponseTime = responseCount > 0 ? totalResponseTime / responseCount : 0;
      
      // Daily/Weekly posts
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const dailyPosts = posts.filter(p => new Date(p.createdAt) >= oneDayAgo).length;
      const weeklyPosts = posts.filter(p => new Date(p.createdAt) >= oneWeekAgo).length;

      setStats({
        totalMembers: members?.length || 0,
        activeMembers,
        upcomingMeetings,
        totalResponses: replies.length,
      });
      
      setSystemMetrics({
        activeCases,
        pendingCases,
        respondedCases,
        escalatedCases,
        categoryBreakdown: categoryBreakdown as Record<PostCategory, number>,
        onTimeResponses: onTime,
        lateResponses: late,
        averageResponseTime,
        escalationCount: escalatedCases,
        dailyPosts,
        weeklyPosts,
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  if (authLoading || loading) {
    return (
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <ThemedView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <ThemedText style={{ marginTop: Spacing.md, color: colors.icon }}>Loading...</ThemedText>
        </ThemedView>
      </SafeAreaView>
    );
  }

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      'academic': 'Academic',
      'mental-health': 'Mental Health',
      'relationships': 'Relationships',
      'crisis': 'Crisis',
      'substance-abuse': 'Substance Abuse',
      'general': 'General',
    };
    return labels[category] || category;
  };

  const getSLAStatus = () => {
    const total = systemMetrics.onTimeResponses + systemMetrics.lateResponses;
    if (total === 0) return { status: 'none', color: colors.icon, text: 'No data' };
    const percentage = (systemMetrics.onTimeResponses / total) * 100;
    if (percentage >= 90) return { status: 'good', color: colors.success, text: 'Excellent' };
    if (percentage >= 75) return { status: 'fair', color: '#FFA500', text: 'Good' };
    return { status: 'poor', color: colors.danger, text: 'Needs Attention' };
  };

  const slaStatus = getSLAStatus();

  return (
    <SafeAreaView edges={isMobile ? ['top'] : []} style={styles.safeArea}>
      <ThemedView style={styles.container}>
        {/* Mobile Header */}
        {isMobile && (
          <DrawerHeader
            title="Executive Dashboard"
            onMenuPress={() => setDrawerVisible(true)}
            rightAction={{
              icon: 'refresh',
              onPress: handleRefresh,
            }}
          />
        )}

        {/* Web Header */}
        {isWeb && (
          <View style={[styles.webHeader, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
            <View style={styles.webHeaderContent}>
              <View>
                <ThemedText type="h1" style={[styles.webHeaderTitle, { color: colors.text }]}>
                  Executive Dashboard
                </ThemedText>
                <ThemedText type="body" style={{ color: colors.icon, marginTop: 4 }}>
                  System-Level Oversight & Platform Management
                </ThemedText>
              </View>
              <TouchableOpacity
                onPress={handleRefresh}
                style={[styles.refreshButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                {...getCursorStyle()}
              >
                <MaterialIcons name="refresh" size={20} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            isWeb && styles.webScrollContent
          ]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
          }
        >

          {/* Platform Oversight - System Activity */}
          <View style={[styles.section, { backgroundColor: colors.card }, createShadow(2, '#000', 0.1)]}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="dashboard" size={24} color={colors.primary} />
              <ThemedText type="h3" style={[styles.sectionTitle, { marginLeft: Spacing.sm }]}>
                Platform Oversight
              </ThemedText>
            </View>
            <ThemedText type="small" style={{ color: colors.icon, marginBottom: Spacing.md }}>
              Real-time system activity (numbers only, no identities)
            </ThemedText>
            
            <View style={styles.metricsGrid}>
              <View style={[styles.metricCard, { backgroundColor: colors.surface }]}>
                <MaterialIcons name="assignment" size={24} color={colors.primary} />
                <ThemedText type="h2" style={styles.metricValue}>
                  {systemMetrics.activeCases}
                </ThemedText>
                <ThemedText type="small" style={{ color: colors.icon }}>
                  Active Cases
                </ThemedText>
              </View>
              
              <View style={[styles.metricCard, { backgroundColor: colors.surface }]}>
                <MaterialIcons name="schedule" size={24} color="#FFA500" />
                <ThemedText type="h2" style={styles.metricValue}>
                  {systemMetrics.pendingCases}
                </ThemedText>
                <ThemedText type="small" style={{ color: colors.icon }}>
                  Pending Response
                </ThemedText>
              </View>
              
              <View style={[styles.metricCard, { backgroundColor: colors.surface }]}>
                <MaterialIcons name="check-circle" size={24} color={colors.success} />
                <ThemedText type="h2" style={styles.metricValue}>
                  {systemMetrics.respondedCases}
                </ThemedText>
                <ThemedText type="small" style={{ color: colors.icon }}>
                  Responded
                </ThemedText>
              </View>
              
              <View style={[styles.metricCard, { backgroundColor: colors.surface }]}>
                <MaterialIcons name="warning" size={24} color={colors.danger} />
                <ThemedText type="h2" style={styles.metricValue}>
                  {systemMetrics.escalatedCases}
                </ThemedText>
                <ThemedText type="small" style={{ color: colors.icon }}>
                  Escalated
                </ThemedText>
              </View>
            </View>
          </View>

          {/* Categories Breakdown */}
          <View style={[styles.section, { backgroundColor: colors.card }, createShadow(3, '#000', 0.08)]}>
            <View style={styles.sectionHeader}>
              <LinearGradient
                colors={[colors.primary + '20', colors.primary + '10']}
                style={styles.sectionIconContainer}
              >
                <MaterialIcons name="category" size={28} color={colors.primary} />
              </LinearGradient>
              <View style={{ flex: 1, marginLeft: Spacing.md }}>
                <ThemedText type="h3" style={[styles.sectionTitle, { color: colors.text }]}>
                  Issues by Category
                </ThemedText>
                <ThemedText type="small" style={{ color: colors.icon, marginTop: 2 }}>
                  Distribution of cases across categories
                </ThemedText>
              </View>
            </View>
            <View style={styles.categoryList}>
              {Object.entries(systemMetrics.categoryBreakdown).map(([category, count]) => (
                <View 
                  key={category} 
                  style={[styles.categoryItem, { backgroundColor: colors.surface }, createShadow(1, '#000', 0.05)]}
                >
                  <View style={styles.categoryItemContent}>
                    <ThemedText type="body" style={{ fontWeight: '600', color: colors.text, flex: 1 }}>
                      {getCategoryLabel(category)}
                    </ThemedText>
                    <View style={[styles.categoryBadge, { backgroundColor: colors.primary + '20' }]}>
                      <ThemedText type="h3" style={{ color: colors.primary, fontWeight: '700' }}>
                        {count}
                      </ThemedText>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Response SLA Status */}
          <View style={[styles.section, { backgroundColor: colors.card }, createShadow(2, '#000', 0.1)]}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="timer" size={24} color={colors.primary} />
              <ThemedText type="h3" style={[styles.sectionTitle, { marginLeft: Spacing.sm }]}>
                Response SLA Status
              </ThemedText>
            </View>
            <View style={styles.slaContainer}>
              <View style={styles.slaStats}>
                <View style={styles.slaStatItem}>
                  <MaterialIcons name="check-circle" size={20} color={colors.success} />
                  <ThemedText type="body" style={{ color: colors.text, marginLeft: Spacing.xs }}>
                    On Time: {systemMetrics.onTimeResponses}
                  </ThemedText>
                </View>
                <View style={styles.slaStatItem}>
                  <MaterialIcons name="error" size={20} color={colors.danger} />
                  <ThemedText type="body" style={{ color: colors.text, marginLeft: Spacing.xs }}>
                    Late: {systemMetrics.lateResponses}
                  </ThemedText>
                </View>
              </View>
              <View style={[styles.slaBadge, { backgroundColor: slaStatus.color + '20' }]}>
                <ThemedText type="body" style={{ color: slaStatus.color, fontWeight: '700' }}>
                  {slaStatus.text}
                </ThemedText>
              </View>
              <ThemedText type="small" style={{ color: colors.icon, marginTop: Spacing.sm }}>
                Avg Response Time: {systemMetrics.averageResponseTime.toFixed(1)} hours
              </ThemedText>
            </View>
          </View>

          {/* Daily/Weekly Posts */}
          <View style={[styles.section, { backgroundColor: colors.card }, createShadow(3, '#000', 0.08)]}>
            <View style={styles.sectionHeader}>
              <LinearGradient
                colors={[colors.primary + '20', colors.primary + '10']}
                style={styles.sectionIconContainer}
              >
                <MaterialIcons name="trending-up" size={28} color={colors.primary} />
              </LinearGradient>
              <View style={{ flex: 1, marginLeft: Spacing.md }}>
                <ThemedText type="h3" style={[styles.sectionTitle, { color: colors.text }]}>
                  Post Activity
                </ThemedText>
                <ThemedText type="small" style={{ color: colors.icon, marginTop: 2 }}>
                  Recent platform engagement
                </ThemedText>
              </View>
            </View>
            <View style={styles.metricsGrid}>
              <View style={[styles.metricCard, { backgroundColor: colors.surface }, createShadow(2, colors.primary, 0.1)]}>
                <LinearGradient
                  colors={[colors.primary + '15', colors.primary + '05']}
                  style={styles.metricIconContainer}
                >
                  <MaterialIcons name="today" size={28} color={colors.primary} />
                </LinearGradient>
                <ThemedText type="h1" style={[styles.metricValue, { color: colors.text }]}>
                  {systemMetrics.dailyPosts}
                </ThemedText>
                <ThemedText type="small" style={{ color: colors.icon, fontWeight: '600' }}>
                  Today
                </ThemedText>
              </View>
              <View style={[styles.metricCard, { backgroundColor: colors.surface }, createShadow(2, colors.primary, 0.1)]}>
                <LinearGradient
                  colors={[colors.primary + '15', colors.primary + '05']}
                  style={styles.metricIconContainer}
                >
                  <MaterialIcons name="date-range" size={28} color={colors.primary} />
                </LinearGradient>
                <ThemedText type="h1" style={[styles.metricValue, { color: colors.text }]}>
                  {systemMetrics.weeklyPosts}
                </ThemedText>
                <ThemedText type="small" style={{ color: colors.icon, fontWeight: '600' }}>
                  This Week
                </ThemedText>
              </View>
            </View>
          </View>

          {/* Executive Actions */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <LinearGradient
                colors={[colors.primary + '20', colors.primary + '10']}
                style={styles.sectionIconContainer}
              >
                <MaterialIcons name="admin-panel-settings" size={28} color={colors.primary} />
              </LinearGradient>
              <View style={{ flex: 1, marginLeft: Spacing.md }}>
                <ThemedText type="h3" style={[styles.sectionTitle, { color: colors.text }]}>
                  Executive Actions
                </ThemedText>
                <ThemedText type="small" style={{ color: colors.icon, marginTop: 2 }}>
                  System management and oversight tools
                </ThemedText>
              </View>
            </View>
            <View style={styles.actionsGrid}>
              <TouchableOpacity
                style={[styles.actionCard, { backgroundColor: colors.card }, createShadow(3, colors.danger, 0.15)]}
                onPress={() => router.push('/peer-educator/executive/flag-review')}
                activeOpacity={0.8}
                {...getCursorStyle()}
              >
                <LinearGradient
                  colors={[colors.danger + '20', colors.danger + '10']}
                  style={styles.actionIconContainer}
                >
                  <MaterialIcons name="flag" size={36} color={colors.danger} />
                </LinearGradient>
                <ThemedText type="body" style={{ fontWeight: '700', color: colors.text, marginTop: Spacing.md }}>
                  Flag Review Panel
                </ThemedText>
                <ThemedText type="small" style={{ color: colors.icon, marginTop: Spacing.xs, textAlign: 'center', lineHeight: 18 }}>
                  Review flagged interactions and moderate content
                </ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionCard, { backgroundColor: colors.card }, createShadow(3, colors.primary, 0.15)]}
                onPress={() => router.push('/peer-educator/executive/peer-activity')}
                activeOpacity={0.8}
                {...getCursorStyle()}
              >
                <LinearGradient
                  colors={[colors.primary + '20', colors.primary + '10']}
                  style={styles.actionIconContainer}
                >
                  <MaterialIcons name="people" size={36} color={colors.primary} />
                </LinearGradient>
                <ThemedText type="body" style={{ fontWeight: '700', color: colors.text, marginTop: Spacing.md }}>
                  Peer Activity Panel
                </ThemedText>
                <ThemedText type="small" style={{ color: colors.icon, marginTop: Spacing.xs, textAlign: 'center', lineHeight: 18 }}>
                  Monitor peer educator performance and activity
                </ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionCard, { backgroundColor: colors.card }, createShadow(3, colors.primary, 0.15)]}
                onPress={() => router.push('/peer-educator/executive/content-approval')}
                activeOpacity={0.8}
                {...getCursorStyle()}
              >
                <LinearGradient
                  colors={[colors.primary + '20', colors.primary + '10']}
                  style={styles.actionIconContainer}
                >
                  <MaterialIcons name="approval" size={36} color={colors.primary} />
                </LinearGradient>
                <ThemedText type="body" style={{ fontWeight: '700', color: colors.text, marginTop: Spacing.md }}>
                  Content Approval
                </ThemedText>
                <ThemedText type="small" style={{ color: colors.icon, marginTop: Spacing.xs, textAlign: 'center', lineHeight: 18 }}>
                  Review and approve educational content
                </ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionCard, { backgroundColor: colors.card }, createShadow(3, colors.primary, 0.15)]}
                onPress={() => router.push('/peer-educator/executive/reports')}
                activeOpacity={0.8}
                {...getCursorStyle()}
              >
                <LinearGradient
                  colors={[colors.primary + '20', colors.primary + '10']}
                  style={styles.actionIconContainer}
                >
                  <MaterialIcons name="description" size={36} color={colors.primary} />
                </LinearGradient>
                <ThemedText type="body" style={{ fontWeight: '700', color: colors.text, marginTop: Spacing.md }}>
                  Reports Module
                </ThemedText>
                <ThemedText type="small" style={{ color: colors.icon, marginTop: Spacing.xs, textAlign: 'center', lineHeight: 18 }}>
                  Monthly anonymized summaries & PDF exports
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>

          {/* Additional Quick Actions */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <LinearGradient
                colors={[colors.primary + '20', colors.primary + '10']}
                style={styles.sectionIconContainer}
              >
                <MaterialIcons name="build" size={28} color={colors.primary} />
              </LinearGradient>
              <View style={{ flex: 1, marginLeft: Spacing.md }}>
                <ThemedText type="h3" style={[styles.sectionTitle, { color: colors.text }]}>
                  Additional Tools
                </ThemedText>
                <ThemedText type="small" style={{ color: colors.icon, marginTop: 2 }}>
                  Management and analytics tools
                </ThemedText>
              </View>
            </View>
            <View style={styles.quickActions}>
              <TouchableOpacity
                style={[styles.actionCard, { backgroundColor: colors.card }, createShadow(3, colors.primary, 0.15)]}
                onPress={() => router.push('/peer-educator/executive/members')}
                activeOpacity={0.8}
                {...getCursorStyle()}
              >
                <LinearGradient
                  colors={[colors.primary + '20', colors.primary + '10']}
                  style={styles.actionIconContainer}
                >
                  <MaterialIcons name="people" size={36} color={colors.primary} />
                </LinearGradient>
                <ThemedText type="body" style={{ fontWeight: '700', color: colors.text, marginTop: Spacing.md }}>
                  Member Management
                </ThemedText>
                <ThemedText type="small" style={{ color: colors.icon, marginTop: Spacing.xs, textAlign: 'center', lineHeight: 18 }}>
                  View and manage peer educators
                </ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionCard, { backgroundColor: colors.card }, createShadow(3, colors.primary, 0.15)]}
                onPress={() => router.push('/peer-educator/executive/analytics')}
                activeOpacity={0.8}
                {...getCursorStyle()}
              >
                <LinearGradient
                  colors={[colors.primary + '20', colors.primary + '10']}
                  style={styles.actionIconContainer}
                >
                  <MaterialIcons name="analytics" size={36} color={colors.primary} />
                </LinearGradient>
                <ThemedText type="body" style={{ fontWeight: '700', color: colors.text, marginTop: Spacing.md }}>
                  Club Analytics
                </ThemedText>
                <ThemedText type="small" style={{ color: colors.icon, marginTop: Spacing.xs, textAlign: 'center', lineHeight: 18 }}>
                  View club statistics and insights
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        {/* Drawer Menu - Mobile Only */}
        {isMobile && (
          <DrawerMenu
            visible={drawerVisible}
            onClose={() => setDrawerVisible(false)}
            role={user?.role || undefined}
          />
        )}
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
    paddingBottom: isMobile ? 80 : Spacing.xl,
  },
  webScrollContent: {
    padding: Spacing.xl,
    maxWidth: 1400,
    alignSelf: 'center',
    width: '100%',
  },
  webHeader: {
    padding: Spacing.xl,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
    ...(isWeb ? {
      position: 'sticky' as any,
      top: 70,
      zIndex: 10,
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(10px)',
    } : {}),
  },
  webHeaderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    maxWidth: 1400,
    alignSelf: 'center',
    width: '100%',
  },
  webHeaderTitle: {
    fontWeight: '700',
    fontSize: 32,
    letterSpacing: -0.5,
  },
  refreshButton: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    ...(isWeb ? {
      transition: 'all 0.2s ease',
    } : {}),
  },
  section: {
    marginBottom: Spacing.xl,
    padding: Spacing.xl,
    borderRadius: BorderRadius.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
  },
  sectionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontWeight: '700',
    fontSize: 20,
    letterSpacing: -0.3,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.lg,
  },
  metricCard: {
    flex: 1,
    minWidth: isWeb ? '22%' : '47%',
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    ...(isWeb ? {
      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    } : {}),
  },
  metricIconContainer: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  metricValue: {
    fontWeight: '700',
    marginVertical: Spacing.sm,
    fontSize: 32,
    letterSpacing: -0.5,
  },
  categoryList: {
    gap: Spacing.md,
  },
  categoryItem: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  categoryItemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  categoryBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    minWidth: 48,
    alignItems: 'center',
  },
  slaContainer: {
    gap: Spacing.lg,
  },
  slaStats: {
    flexDirection: 'row',
    gap: Spacing.lg,
    marginBottom: Spacing.md,
  },
  slaStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  slaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
  },
  slaInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.sm,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.lg,
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.lg,
  },
  actionCard: {
    flex: 1,
    minWidth: isWeb ? '30%' : '47%',
    padding: Spacing.xl,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    ...(isWeb ? {
      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    } : {}),
  },
  actionIconContainer: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
});


