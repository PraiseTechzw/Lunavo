/**
 * Club Analytics - Executive view of club statistics
 */

import { ThemedText } from '@/app/components/themed-text';
import { ThemedView } from '@/app/components/themed-view';
import { BorderRadius, Colors, Spacing } from '@/app/constants/theme';
import { useColorScheme } from '@/app/hooks/use-color-scheme';
import { createShadow, getCursorStyle } from '@/app/utils/platform-styles';
import { useRoleGuard } from '@/hooks/use-auth-guard';
import { getMeetingAttendance, getMeetings, getPosts, getReplies } from '@/lib/database';
import { supabase } from '@/lib/supabase';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ClubAnalyticsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const { user, loading: authLoading } = useRoleGuard(
    ['peer-educator-executive', 'admin'],
    '/peer-educator/dashboard'
  );

  const [refreshing, setRefreshing] = useState(false);
  const [analytics, setAnalytics] = useState({
    totalMembers: 0,
    activeMembers: 0,
    totalResponses: 0,
    helpfulResponses: 0,
    meetingAttendance: 0,
    averageAttendance: 0,
    trainingCompletion: 0,
  });

  useEffect(() => {
    if (user) {
      loadAnalytics();
    }
  }, [user]);

  const loadAnalytics = async () => {
    try {
      // Get all peer educators
      const { data: members } = await supabase
        .from('users')
        .select('id, last_active')
        .in('role', ['peer-educator', 'peer-educator-executive']);

      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const activeMembers = members?.filter((m: any) =>
        new Date(m.last_active) >= thirtyDaysAgo
      ).length || 0;

      // Get responses
      const posts = await getPosts();
      const allReplies = await Promise.all(posts.map((p) => getReplies(p.id).catch(() => [])));
      const replies = allReplies.flat();
      const helpfulCount = replies.filter((r) => r.isHelpful > 0).length;

      // Get meeting attendance
      const meetings = await getMeetings();
      const pastMeetings = meetings.filter((m) => new Date(m.scheduledDate) < now);
      let totalAttendance = 0;
      let meetingCount = 0;

      for (const meeting of pastMeetings) {
        const attendance = await getMeetingAttendance(meeting.id);
        const attendedCount = attendance.filter((a) => a.attended).length;
        totalAttendance += attendedCount;
        meetingCount++;
      }

      const averageAttendance = meetingCount > 0 ? totalAttendance / meetingCount : 0;

      setAnalytics({
        totalMembers: members?.length || 0,
        activeMembers,
        totalResponses: replies.length,
        helpfulResponses: helpfulCount,
        meetingAttendance: totalAttendance,
        averageAttendance: Math.round(averageAttendance),
        trainingCompletion: 0, // TODO: Calculate from training data
      });
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
              Club Analytics
            </ThemedText>
            <View style={{ width: 24 }} />
          </View>

          {/* Member Engagement */}
          <View style={[styles.section, { backgroundColor: colors.card }, createShadow(2, '#000', 0.1)]}>
            <ThemedText type="h3" style={styles.sectionTitle}>
              Member Engagement
            </ThemedText>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <MaterialIcons name="people" size={32} color={colors.primary} />
                <ThemedText type="h2" style={styles.statValue}>
                  {analytics.totalMembers}
                </ThemedText>
                <ThemedText type="small" style={{ color: colors.icon }}>
                  Total Members
                </ThemedText>
              </View>
              <View style={styles.statItem}>
                <MaterialIcons name="person" size={32} color={colors.success} />
                <ThemedText type="h2" style={styles.statValue}>
                  {analytics.activeMembers}
                </ThemedText>
                <ThemedText type="small" style={{ color: colors.icon }}>
                  Active (30 days)
                </ThemedText>
              </View>
            </View>
          </View>

          {/* Response Statistics */}
          <View style={[styles.section, { backgroundColor: colors.card }, createShadow(2, '#000', 0.1)]}>
            <ThemedText type="h3" style={styles.sectionTitle}>
              Response Statistics
            </ThemedText>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <MaterialIcons name="chat-bubble-outline" size={32} color={colors.primary} />
                <ThemedText type="h2" style={styles.statValue}>
                  {analytics.totalResponses}
                </ThemedText>
                <ThemedText type="small" style={{ color: colors.icon }}>
                  Total Responses
                </ThemedText>
              </View>
              <View style={styles.statItem}>
                <MaterialIcons name="thumb-up" size={32} color={colors.success} />
                <ThemedText type="h2" style={styles.statValue}>
                  {analytics.helpfulResponses}
                </ThemedText>
                <ThemedText type="small" style={{ color: colors.icon }}>
                  Helpful Responses
                </ThemedText>
              </View>
            </View>
            {analytics.totalResponses > 0 && (
              <View style={styles.progressContainer}>
                <ThemedText type="small" style={{ color: colors.icon, marginBottom: Spacing.xs }}>
                  Helpful Rate: {Math.round((analytics.helpfulResponses / analytics.totalResponses) * 100)}%
                </ThemedText>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${(analytics.helpfulResponses / analytics.totalResponses) * 100}%`,
                        backgroundColor: colors.success,
                      },
                    ]}
                  />
                </View>
              </View>
            )}
          </View>

          {/* Meeting Attendance */}
          <View style={[styles.section, { backgroundColor: colors.card }, createShadow(2, '#000', 0.1)]}>
            <ThemedText type="h3" style={styles.sectionTitle}>
              Meeting Attendance
            </ThemedText>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <MaterialIcons name="event" size={32} color={colors.primary} />
                <ThemedText type="h2" style={styles.statValue}>
                  {analytics.meetingAttendance}
                </ThemedText>
                <ThemedText type="small" style={{ color: colors.icon }}>
                  Total Attendance
                </ThemedText>
              </View>
              <View style={styles.statItem}>
                <MaterialIcons name="trending-up" size={32} color={colors.primary} />
                <ThemedText type="h2" style={styles.statValue}>
                  {analytics.averageAttendance}
                </ThemedText>
                <ThemedText type="small" style={{ color: colors.icon }}>
                  Avg per Meeting
                </ThemedText>
              </View>
            </View>
          </View>

          {/* Training Completion */}
          <View style={[styles.section, { backgroundColor: colors.card }, createShadow(2, '#000', 0.1)]}>
            <ThemedText type="h3" style={styles.sectionTitle}>
              Training Completion
            </ThemedText>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <MaterialIcons name="school" size={32} color={colors.primary} />
                <ThemedText type="h2" style={styles.statValue}>
                  {analytics.trainingCompletion}%
                </ThemedText>
                <ThemedText type="small" style={{ color: colors.icon }}>
                  Completion Rate
                </ThemedText>
              </View>
            </View>
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
  section: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontWeight: '700',
    marginBottom: Spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: '#F5F5F5',
    borderRadius: BorderRadius.md,
  },
  statValue: {
    fontWeight: '700',
    marginVertical: Spacing.sm,
  },
  progressContainer: {
    marginTop: Spacing.md,
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
});


