/**
 * Club Analytics - Executive view of club statistics
 */

import { DrawerHeader } from '@/components/navigation/drawer-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import { useRoleGuard } from '@/hooks/use-auth-guard';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getMeetingAttendance, getMeetings, getPosts, getReplies } from '@/lib/database';
import { supabase } from '@/lib/supabase';
import { createShadow } from '@/utils/platform-styles';
import { MaterialIcons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Dimensions,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';
const isMobile = Platform.OS !== 'web';

export default function ClubAnalyticsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  
  const { user, loading: authLoading } = useRoleGuard(
    ['peer-educator-executive', 'admin'],
    '/(tabs)'
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

  const pathname = usePathname();

  if (authLoading) {
    return (
      <SafeAreaView edges={isMobile ? ['top'] : []} style={{ flex: 1 }}>
        <ThemedView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ThemedText>Loading...</ThemedText>
        </ThemedView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={isMobile ? ['top'] : []} style={styles.safeArea}>
      <ThemedView style={styles.container}>
        {/* Mobile Header */}
        {isMobile && (
          <DrawerHeader
            title="Club Analytics"
            onMenuPress={() => setDrawerVisible(true)}
          />
        )}

        {/* Web Header */}
        {isWeb && (
          <View style={[styles.webHeader, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
            <View style={styles.webHeaderContent}>
              <View>
                <ThemedText type="h1" style={[styles.webHeaderTitle, { color: colors.text }]}>
                  Club Analytics
                </ThemedText>
                <ThemedText type="body" style={{ color: colors.icon, marginTop: 4 }}>
                  View club statistics and engagement metrics
                </ThemedText>
              </View>
            </View>
          </View>
        )}

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, isWeb && styles.webScrollContent]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
          }
        >

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
                <MaterialIcons name="person-check" size={32} color={colors.success} />
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
    paddingBottom: isMobile ? 80 : Spacing.xl,
  },
  webScrollContent: {
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


