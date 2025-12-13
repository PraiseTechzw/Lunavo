/**
 * Student Affairs Dashboard - Anonymized analytics overview
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
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ThemedView } from '@/app/components/themed-view';
import { ThemedText } from '@/app/components/themed-text';
import { MaterialIcons } from '@expo/vector-icons';
import { useColorScheme } from '@/app/hooks/use-color-scheme';
import { Colors, Spacing, BorderRadius } from '@/app/constants/theme';
import { createShadow, getCursorStyle, getContainerStyle } from '@/app/utils/platform-styles';
import { getAnalytics, getPosts, getEscalations } from '@/lib/database';
import { Analytics, PostCategory } from '@/app/types';
import { CATEGORIES } from '@/app/constants/categories';
import { useRoleGuard } from '@/hooks/use-auth-guard';

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
  }, [user]);

  const loadData = async () => {
    try {
      const [analyticsData, posts, escalations] = await Promise.all([
        getAnalytics(),
        getPosts(),
        getEscalations(),
      ]);

      setAnalytics(analyticsData);

      // Calculate category breakdown (anonymized)
      const breakdown: Record<string, number> = {};
      posts.forEach((post) => {
        breakdown[post.category] = (breakdown[post.category] || 0) + 1;
      });
      setCategoryBreakdown(breakdown as any);

      // Calculate escalation stats (anonymized)
      const resolved = escalations.filter((e) => e.status === 'resolved');
      const pending = escalations.filter((e) => e.status === 'pending' || e.status === 'in-progress');
      
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
        total: escalations.length,
        resolved: resolved.length,
        pending: pending.length,
        avgResponseTime: responseCount > 0 ? Math.round(totalResponseTime / responseCount / (1000 * 60 * 60)) : 0, // in hours
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
    // TODO: Implement PDF/CSV export
    Alert.alert('Export', 'Export functionality coming soon.');
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

  const topCategories = Object.entries(categoryBreakdown)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
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
            <View style={styles.headerLeft}>
              <TouchableOpacity onPress={() => router.back()} style={getCursorStyle()}>
                <MaterialIcons name="arrow-back" size={24} color={colors.text} />
              </TouchableOpacity>
              <ThemedText type="h2" style={styles.headerTitle}>
                Student Affairs Dashboard
              </ThemedText>
            </View>
            <TouchableOpacity onPress={handleExport} style={getCursorStyle()}>
              <MaterialIcons name="download" size={24} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {/* Overview Cards */}
          <View style={styles.overviewGrid}>
            <View style={[styles.statCard, { backgroundColor: colors.card }, createShadow(2, '#000', 0.1)]}>
              <MaterialIcons name="forum" size={32} color={colors.primary} />
              <ThemedText type="h1" style={styles.statValue}>
                {analytics?.totalPosts || 0}
              </ThemedText>
              <ThemedText type="small" style={{ color: colors.icon }}>
                Total Posts
              </ThemedText>
            </View>

            <View style={[styles.statCard, { backgroundColor: colors.card }, createShadow(2, '#000', 0.1)]}>
              <MaterialIcons name="people" size={32} color={colors.primary} />
              <ThemedText type="h1" style={styles.statValue}>
                {analytics?.activeUsers || 0}
              </ThemedText>
              <ThemedText type="small" style={{ color: colors.icon }}>
                Active Users
              </ThemedText>
            </View>

            <View style={[styles.statCard, { backgroundColor: colors.card }, createShadow(2, '#000', 0.1)]}>
              <MaterialIcons name="warning" size={32} color="#F59E0B" />
              <ThemedText type="h1" style={styles.statValue}>
                {escalationStats.total}
              </ThemedText>
              <ThemedText type="small" style={{ color: colors.icon }}>
                Escalations
              </ThemedText>
            </View>

            <View style={[styles.statCard, { backgroundColor: colors.card }, createShadow(2, '#000', 0.1)]}>
              <MaterialIcons name="schedule" size={32} color={colors.success} />
              <ThemedText type="h1" style={styles.statValue}>
                {escalationStats.avgResponseTime}h
              </ThemedText>
              <ThemedText type="small" style={{ color: colors.icon }}>
                Avg Response
              </ThemedText>
            </View>
          </View>

          {/* Category Breakdown */}
          <View style={[styles.section, { backgroundColor: colors.card }, createShadow(2, '#000', 0.1)]}>
            <View style={styles.sectionHeader}>
              <ThemedText type="h3" style={styles.sectionTitle}>
                Top Categories
              </ThemedText>
              <TouchableOpacity
                onPress={() => router.push('/student-affairs/analytics')}
                style={getCursorStyle()}
              >
                <ThemedText type="small" style={{ color: colors.primary }}>
                  View All
                </ThemedText>
              </TouchableOpacity>
            </View>
            {topCategories.map(([category, count]) => {
              const categoryInfo = CATEGORIES.find((c) => c.id === category);
              return (
                <View key={category} style={styles.categoryRow}>
                  <View style={styles.categoryInfo}>
                    <ThemedText type="body" style={{ fontWeight: '600', color: colors.text }}>
                      {categoryInfo?.name || category}
                    </ThemedText>
                    <ThemedText type="small" style={{ color: colors.icon }}>
                      {count} posts
                    </ThemedText>
                  </View>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${(count / (analytics?.totalPosts || 1)) * 100}%`,
                          backgroundColor: categoryInfo?.color || colors.primary,
                        },
                      ]}
                    />
                  </View>
                </View>
              );
            })}
          </View>

          {/* Escalation Stats */}
          <View style={[styles.section, { backgroundColor: colors.card }, createShadow(2, '#000', 0.1)]}>
            <ThemedText type="h3" style={styles.sectionTitle}>
              Escalation Overview
            </ThemedText>
            <View style={styles.escalationStats}>
              <View style={styles.escalationStat}>
                <ThemedText type="h2" style={{ color: colors.success }}>
                  {escalationStats.resolved}
                </ThemedText>
                <ThemedText type="small" style={{ color: colors.icon }}>
                  Resolved
                </ThemedText>
              </View>
              <View style={styles.escalationStat}>
                <ThemedText type="h2" style={{ color: '#F59E0B' }}>
                  {escalationStats.pending}
                </ThemedText>
                <ThemedText type="small" style={{ color: colors.icon }}>
                  Pending
                </ThemedText>
              </View>
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.primary }]}
              onPress={() => router.push('/student-affairs/analytics')}
            >
              <MaterialIcons name="analytics" size={24} color="#FFFFFF" />
              <ThemedText type="body" style={{ color: '#FFFFFF', fontWeight: '600', marginLeft: Spacing.sm }}>
                Detailed Analytics
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }]}
              onPress={() => router.push('/student-affairs/trends')}
            >
              <MaterialIcons name="trending-up" size={24} color={colors.text} />
              <ThemedText type="body" style={{ color: colors.text, fontWeight: '600', marginLeft: Spacing.sm }}>
                Trend Analysis
              </ThemedText>
            </TouchableOpacity>
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  headerTitle: {
    fontWeight: '700',
    fontSize: 20,
  },
  overviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  statCard: {
    flex: 1,
    minWidth: isTablet ? '22%' : '47%',
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  statValue: {
    fontWeight: '700',
    marginVertical: Spacing.sm,
  },
  section: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
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
  escalationStats: {
    flexDirection: 'row',
    gap: Spacing.xl,
    marginTop: Spacing.md,
  },
  escalationStat: {
    alignItems: 'center',
  },
  quickActions: {
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
});

