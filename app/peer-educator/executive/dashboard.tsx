/**
 * Executive Dashboard - For peer educator executives
 */

import { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { MaterialIcons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { createShadow, getCursorStyle } from '@/utils/platform-styles';
import { getMeetings, getPosts, getReplies, getCurrentUser } from '@/lib/database';
import { useRoleGuard } from '@/hooks/use-auth-guard';

export default function ExecutiveDashboardScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  
  const { user, loading: authLoading } = useRoleGuard(
    ['peer-educator-executive', 'admin'],
    '/(tabs)'
  );
  
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalMembers: 0,
    activeMembers: 0,
    upcomingMeetings: 0,
    totalResponses: 0,
  });

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    try {
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
      const { supabase } = await import('@/lib/supabase');
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

      setStats({
        totalMembers: members?.length || 0,
        activeMembers,
        upcomingMeetings,
        totalResponses: replies.length,
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
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
            <TouchableOpacity onPress={() => router.back()} style={getCursorStyle()}>
              <MaterialIcons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <ThemedText type="h2" style={styles.headerTitle}>
              Executive Dashboard
            </ThemedText>
            <View style={{ width: 24 }} />
          </View>

          {/* Stats Cards */}
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: colors.card }, createShadow(2, '#000', 0.1)]}>
              <MaterialIcons name="people" size={32} color={colors.primary} />
              <ThemedText type="h2" style={styles.statValue}>
                {stats.totalMembers}
              </ThemedText>
              <ThemedText type="small" style={{ color: colors.icon }}>
                Total Members
              </ThemedText>
            </View>

            <View style={[styles.statCard, { backgroundColor: colors.card }, createShadow(2, '#000', 0.1)]}>
              <MaterialIcons name="person-check" size={32} color={colors.success} />
              <ThemedText type="h2" style={styles.statValue}>
                {stats.activeMembers}
              </ThemedText>
              <ThemedText type="small" style={{ color: colors.icon }}>
                Active Members
              </ThemedText>
            </View>

            <View style={[styles.statCard, { backgroundColor: colors.card }, createShadow(2, '#000', 0.1)]}>
              <MaterialIcons name="event" size={32} color={colors.primary} />
              <ThemedText type="h2" style={styles.statValue}>
                {stats.upcomingMeetings}
              </ThemedText>
              <ThemedText type="small" style={{ color: colors.icon }}>
                Upcoming Meetings
              </ThemedText>
            </View>

            <View style={[styles.statCard, { backgroundColor: colors.card }, createShadow(2, '#000', 0.1)]}>
              <MaterialIcons name="chat-bubble-outline" size={32} color={colors.primary} />
              <ThemedText type="h2" style={styles.statValue}>
                {stats.totalResponses}
              </ThemedText>
              <ThemedText type="small" style={{ color: colors.icon }}>
                Total Responses
              </ThemedText>
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={[styles.actionCard, { backgroundColor: colors.card }, createShadow(2, '#000', 0.1)]}
              onPress={() => router.push('/peer-educator/executive/members')}
            >
              <MaterialIcons name="people" size={32} color={colors.primary} />
              <ThemedText type="body" style={{ fontWeight: '600', color: colors.text, marginTop: Spacing.sm }}>
                Member Management
              </ThemedText>
              <ThemedText type="small" style={{ color: colors.icon, marginTop: Spacing.xs }}>
                View and manage peer educators
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionCard, { backgroundColor: colors.card }, createShadow(2, '#000', 0.1)]}
              onPress={() => router.push('/peer-educator/executive/meetings')}
            >
              <MaterialIcons name="event" size={32} color={colors.primary} />
              <ThemedText type="body" style={{ fontWeight: '600', color: colors.text, marginTop: Spacing.sm }}>
                Meeting Management
              </ThemedText>
              <ThemedText type="small" style={{ color: colors.icon, marginTop: Spacing.xs }}>
                Create and manage meetings
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionCard, { backgroundColor: colors.card }, createShadow(2, '#000', 0.1)]}
              onPress={() => router.push('/peer-educator/executive/announcements')}
            >
              <MaterialIcons name="campaign" size={32} color={colors.primary} />
              <ThemedText type="body" style={{ fontWeight: '600', color: colors.text, marginTop: Spacing.sm }}>
                Announcements
              </ThemedText>
              <ThemedText type="small" style={{ color: colors.icon, marginTop: Spacing.xs }}>
                Create and manage announcements
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionCard, { backgroundColor: colors.card }, createShadow(2, '#000', 0.1)]}
              onPress={() => router.push('/peer-educator/executive/analytics')}
            >
              <MaterialIcons name="analytics" size={32} color={colors.primary} />
              <ThemedText type="body" style={{ fontWeight: '600', color: colors.text, marginTop: Spacing.sm }}>
                Club Analytics
              </ThemedText>
              <ThemedText type="small" style={{ color: colors.icon, marginTop: Spacing.xs }}>
                View club statistics and insights
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
  headerTitle: {
    fontWeight: '700',
    fontSize: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  statCard: {
    flex: 1,
    minWidth: '47%',
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  statValue: {
    fontWeight: '700',
    marginVertical: Spacing.sm,
  },
  quickActions: {
    gap: Spacing.md,
  },
  actionCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
});


