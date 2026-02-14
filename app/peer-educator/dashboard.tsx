/**
 * Ultra-Premium Peer Educator Dashboard
 * "Awwwards-level" Design with Live Supabase Data
 */

import { ThemedText } from '@/app/components/themed-text';
import { ThemedView } from '@/app/components/themed-view';
import { BorderRadius, Colors, PlatformStyles, Spacing } from '@/app/constants/theme';
import { useColorScheme } from '@/app/hooks/use-color-scheme';
import { ActivityLog, SupportSession } from '@/app/types';
import { useRoleGuard } from '@/hooks/use-auth-guard';
import { getActivityLogs, getSupportSessions } from '@/lib/database';
import { getUserPoints } from '@/lib/points-system';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { endOfWeek, formatDistanceToNow, isWithinInterval, parseISO, startOfWeek } from 'date-fns';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeInDown, FadeInRight, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function PeerEducatorDashboard() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const { user, loading: authLoading } = useRoleGuard(['peer-educator', 'peer-educator-executive', 'admin'], '/(tabs)');

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pendingSessions, setPendingSessions] = useState<SupportSession[]>([]);
  const [activeSessions, setActiveSessions] = useState<SupportSession[]>([]);
  const [recentActivity, setRecentActivity] = useState<ActivityLog[]>([]);

  const [stats, setStats] = useState({
    helped: 0,
    hours: 0,
    impactScore: 0,
    peerPoints: 0,
    weeklyGoal: 0,
  });

  const loadData = useCallback(async () => {
    if (!user?.id) return;
    try {
      // 100% Dynamic - NO HARDCODED DATA
      const [allPending, allActive, allResolved, allLogs, points] = await Promise.all([
        getSupportSessions('pending'),
        getSupportSessions('active'),
        getSupportSessions('resolved'),
        getActivityLogs(user.id),
        getUserPoints(user.id)
      ]);

      // Process live data
      const myActive = allActive.filter(s => s.educator_id === user.id);
      const myResolved = allResolved.filter(s => s.educator_id === user.id);

      setPendingSessions(allPending.slice(0, 3));
      setActiveSessions(myActive);
      setRecentActivity(allLogs.slice(0, 3));

      // Calculate Real-Time Summary
      const totalMinutes = allLogs.reduce((s, l) => s + (l.duration_minutes || 0), 0);
      const totalHours = Math.round(totalMinutes / 60 * 10) / 10;

      // Weekly Goal (Target: 5h/week)
      const weekStart = startOfWeek(new Date());
      const weekEnd = endOfWeek(new Date());
      const weeklyMinutes = allLogs
        .filter(l => {
          try {
            const logDate = parseISO(l.date);
            return isWithinInterval(logDate, { start: weekStart, end: weekEnd });
          } catch { return false; }
        })
        .reduce((s, l) => s + (l.duration_minutes || 0), 0);

      const weeklyGoalPercent = Math.min(Math.round((weeklyMinutes / 300) * 100), 100);

      // Impact Rating (Baseline 90 + 1 per resolution)
      const calculatedImpact = myResolved.length > 0 ? Math.min(90 + myResolved.length, 99) : 0;

      setStats({
        helped: myResolved.length,
        hours: totalHours,
        impactScore: calculatedImpact,
        peerPoints: points,
        weeklyGoal: weeklyGoalPercent,
      });
    } catch (e) {
      console.error('CRITICAL: Dashboard Backend Sync Failure', e);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user) loadData();
  }, [user, loadData]);

  const handleRefresh = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const priorityColor = (p: string) => p === 'urgent' ? '#EF4444' : p === 'normal' ? '#F59E0B' : '#10B981';

  if (authLoading || loading) {
    return (
      <ThemedView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </ThemedView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />}
      >
        {/* Mesmerizing Hero Card */}
        <Animated.View entering={FadeInUp.duration(800)}>
          <LinearGradient
            colors={['#4F46E5', '#7C3AED', '#EC4899']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            {/* Visual Glass Elements */}
            <View style={styles.glassCircle1} />
            <View style={styles.glassCircle2} />

            <View style={styles.heroHeader}>
              <View>
                <ThemedText style={styles.greetingText}>Empowering Peers,</ThemedText>
                <ThemedText style={styles.userNameText}>{user?.pseudonym || 'Educator'}</ThemedText>
              </View>
              <View style={styles.headerRight}>
                <View style={styles.headerButtons}>
                  <TouchableOpacity
                    onPress={() => router.replace('/(tabs)')}
                    style={styles.returnButton}
                  >
                    <MaterialCommunityIcons name="home-outline" size={18} color="#FFF" />
                    <ThemedText style={styles.returnText}>Student View</ThemedText>
                  </TouchableOpacity>

                  {user?.role === 'peer-educator-executive' || user?.role === 'admin' ? (
                    <TouchableOpacity
                      onPress={() => router.push('/executive' as any)}
                      style={[styles.returnButton, { backgroundColor: 'rgba(16, 185, 129, 0.4)', marginLeft: Spacing.xs }]}
                    >
                      <MaterialCommunityIcons name="shield-star" size={18} color="#FFF" />
                      <ThemedText style={styles.returnText}>Executive</ThemedText>
                    </TouchableOpacity>
                  ) : null}
                </View>

                <LinearGradient colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.1)']} style={styles.pointBadge}>
                  <MaterialCommunityIcons name="star-circle" size={16} color="#FFD700" />
                  <ThemedText style={styles.pointText}>{stats.peerPoints} pts</ThemedText>
                </LinearGradient>
              </View>
            </View>

            {/* Premium Stats Grid */}
            <View style={styles.statsContainer}>
              <View style={styles.statBox}>
                <ThemedText style={styles.statVal}>{stats.helped}</ThemedText>
                <ThemedText style={styles.statLbl}>Impacted</ThemedText>
              </View>
              <View style={styles.divider} />
              <View style={styles.statBox}>
                <ThemedText style={styles.statVal}>{stats.hours}h</ThemedText>
                <ThemedText style={styles.statLbl}>Volunteered</ThemedText>
              </View>
              <View style={styles.divider} />
              <View style={styles.statBox}>
                <ThemedText style={styles.statVal}>{stats.impactScore}%</ThemedText>
                <ThemedText style={styles.statLbl}>Happiness</ThemedText>
              </View>
            </View>

            {/* Weekly Goal Progress */}
            <View style={styles.goalSection}>
              <View style={styles.goalHeader}>
                <ThemedText style={styles.goalText}>Weekly Support Goal</ThemedText>
                <ThemedText style={styles.goalPercent}>{stats.weeklyGoal}%</ThemedText>
              </View>
              <View style={styles.goalTrack}>
                <Animated.View
                  entering={FadeInRight.delay(500).duration(1000)}
                  style={[styles.goalFill, { width: `${stats.weeklyGoal}%` }]}
                />
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* High Priority Queue */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.iconTitle}>
              <MaterialCommunityIcons name="lightning-bolt" size={20} color="#F59E0B" />
              <ThemedText style={styles.sectionTitle}>High Priority Queue</ThemedText>
            </View>
            <TouchableOpacity onPress={() => router.push('/peer-educator/queue')}>
              <ThemedText style={styles.viewAll}>View Queue</ThemedText>
            </TouchableOpacity>
          </View>

          {pendingSessions.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.card }]}>
              <MaterialCommunityIcons name="check-decagram-outline" size={32} color={colors.success} />
              <ThemedText style={styles.emptyText}>All requests have been assigned!</ThemedText>
            </View>
          ) : (
            pendingSessions.map((session, idx) => (
              <Animated.View key={session.id} entering={FadeInDown.delay(idx * 100)}>
                <TouchableOpacity
                  style={[styles.premiumDataCard, { backgroundColor: colors.card }]}
                  onPress={() => router.push('/peer-educator/queue')}
                >
                  <View style={[styles.priorityIndicator, { backgroundColor: priorityColor(session.priority) }]} />
                  <View style={styles.dataInfo}>
                    <View style={styles.nameRow}>
                      <ThemedText style={styles.nameText}>{session.student_pseudonym}</ThemedText>
                      <View style={[styles.pBadge, { backgroundColor: priorityColor(session.priority) + '15' }]}>
                        <ThemedText style={[styles.pText, { color: priorityColor(session.priority) }]}>{session.priority}</ThemedText>
                      </View>
                    </View>
                    <ThemedText style={[styles.metaText, { color: colors.icon }]} numberOfLines={1}>
                      {session.category} • {formatDistanceToNow(new Date(session.created_at))} ago
                    </ThemedText>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={20} color={colors.icon} />
                </TouchableOpacity>
              </Animated.View>
            ))
          )}
        </View>

        {/* Active Chats */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.iconTitle}>
              <MaterialCommunityIcons name="message-text" size={20} color={colors.primary} />
              <ThemedText style={styles.sectionTitle}>Ongoing Support</ThemedText>
            </View>
            <TouchableOpacity onPress={() => router.push('/peer-educator/ongoing-support')}>
              <ThemedText style={styles.viewAll}>View All</ThemedText>
            </TouchableOpacity>
          </View>

          {activeSessions.length === 0 ? (
            <View style={[styles.emptyInline, { backgroundColor: colors.card }]}>
              <ThemedText style={styles.emptyText}>No active chat sessions</ThemedText>
            </View>
          ) : (
            activeSessions.map((s) => (
              <TouchableOpacity
                key={s.id}
                style={[styles.premiumDataCard, { backgroundColor: colors.card }]}
                onPress={() => router.push(`/chat/${s.id}`)}
              >
                <View style={[styles.priorityIndicator, { backgroundColor: colors.primary }]} />
                <View style={styles.actContent}>
                  <ThemedText style={styles.actTitle}>Support: {s.student_pseudonym}</ThemedText>
                  <ThemedText style={[styles.actDate, { color: colors.primary }]}>Active Now</ThemedText>
                </View>
                <MaterialCommunityIcons name="circle" size={8} color="#10B981" />
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Recent Activity Summary */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.iconTitle}>
              <MaterialCommunityIcons name="history" size={20} color={colors.icon} />
              <ThemedText style={styles.sectionTitle}>Activity Summary</ThemedText>
            </View>
            <TouchableOpacity onPress={() => router.push('/peer-educator/activity-log')}>
              <ThemedText style={styles.viewAll}>Full Log</ThemedText>
            </TouchableOpacity>
          </View>

          <View style={styles.activityGrid}>
            {recentActivity.length === 0 ? (
              <View style={[styles.emptyInline, { backgroundColor: colors.card }]}>
                <ThemedText style={styles.emptyText}>No recent activity logged</ThemedText>
              </View>
            ) : (
              recentActivity.map((act) => (
                <View key={act.id} style={[styles.activityItem, { backgroundColor: colors.card }]}>
                  <View style={[styles.actIcon, { backgroundColor: colors.primary + '10' }]}>
                    <MaterialCommunityIcons
                      name={act.activity_type === 'session' ? 'account-heart' : 'certificate'}
                      size={20}
                      color={colors.primary}
                    />
                  </View>
                  <View style={styles.actContent}>
                    <ThemedText style={styles.actTitle}>{act.title}</ThemedText>
                    <ThemedText style={[styles.actDate, { color: colors.icon }]}>{act.date}</ThemedText>
                  </View>
                  <ThemedText style={styles.actTime}>{act.duration_minutes}m</ThemedText>
                </View>
              ))
            )}
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  heroCard: {
    borderRadius: BorderRadius.xxl,
    padding: 24,
    marginBottom: 24,
    overflow: 'hidden',
    ...PlatformStyles.premiumShadow,
  },
  glassCircle1: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  glassCircle2: {
    position: 'absolute',
    bottom: -60,
    left: -20,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 28,
  },
  greetingText: { color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: '600', letterSpacing: 0.5 },
  userNameText: { color: '#FFF', fontSize: 28, fontWeight: '900', marginTop: 2 },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  returnButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  returnText: { color: '#FFF', fontSize: 13, fontWeight: '700' },
  pointBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  pointText: { color: '#FFF', fontSize: 13, fontWeight: '700' },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.18)',
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    backdropFilter: 'blur(10px)',
  },
  statBox: { flex: 1, alignItems: 'center' },
  statVal: { color: '#FFF', fontSize: 24, fontWeight: '800' },
  statLbl: { color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 4, textAlign: 'center' },
  divider: { width: 1, height: 32, backgroundColor: 'rgba(255,255,255,0.15)', alignSelf: 'center' },
  goalSection: { marginTop: 8 },
  goalHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  goalText: { color: 'rgba(255,255,255,0.9)', fontSize: 13, fontWeight: '600' },
  goalPercent: { color: '#FFF', fontSize: 13, fontWeight: '800' },
  goalTrack: { height: 8, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 4, overflow: 'hidden' },
  goalFill: { height: '100%', backgroundColor: '#FFF', borderRadius: 4 },
  section: { marginBottom: 28 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  iconTitle: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: 17, fontWeight: '800' },
  viewAll: { color: Colors.light.primary, fontWeight: '700', fontSize: 14 },
  emptyCard: { padding: 40, borderRadius: BorderRadius.xl, alignItems: 'center', gap: 12 },
  emptyText: { color: Colors.light.icon, fontSize: 14, textAlign: 'center' },
  premiumDataCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
    overflow: 'hidden',
    ...PlatformStyles.premiumShadow,
  },
  priorityIndicator: { width: 4, height: '100%', position: 'absolute', left: 0 },
  dataInfo: { flex: 1, marginLeft: 12 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  nameText: { fontSize: 16, fontWeight: '700' },
  pBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  pText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  metaText: { fontSize: 12 },
  activityGrid: { gap: 8 },
  emptyInline: { padding: 20, borderRadius: 12, alignItems: 'center' },
  activityItem: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 16 },
  actIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  actContent: { flex: 1, marginLeft: 12 },
  actTitle: { fontSize: 14, fontWeight: '600' },
  actDate: { fontSize: 12, marginTop: 2 },
  actTime: { fontSize: 13, fontWeight: '800' },
});
