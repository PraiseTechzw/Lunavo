/**
 * Ultra-Premium Peer Educator Dashboard
 * "Awwwards-level" Design with Live Supabase Data
 */

import { ThemedText } from '@/app/components/themed-text';
import { ThemedView } from '@/app/components/themed-view';
import { BorderRadius, Colors, PlatformStyles } from '@/app/constants/theme';
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
  Dimensions,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeInDown, FadeInRight, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

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
      const [allPending, allActive, allResolved, allLogs, points] = await Promise.all([
        getSupportSessions('pending'),
        getSupportSessions('active'),
        getSupportSessions('resolved'),
        getActivityLogs(user.id),
        getUserPoints(user.id)
      ]);

      const myActive = allActive.filter(s => s.educator_id === user.id);
      const myResolved = allResolved.filter(s => s.educator_id === user.id);

      setPendingSessions(allPending.slice(0, 3));
      setActiveSessions(myActive);
      setRecentActivity(allLogs.slice(0, 3));

      const totalMinutes = allLogs.reduce((s, l) => s + (l.duration_minutes || 0), 0);
      const totalHours = Math.round(totalMinutes / 60 * 10) / 10;

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
      const calculatedImpact = myResolved.length > 0 ? Math.min(90 + myResolved.length, 99) : 0;

      setStats({
        helped: myResolved.length,
        hours: totalHours,
        impactScore: calculatedImpact,
        peerPoints: points,
        weeklyGoal: weeklyGoalPercent,
      });
    } catch (e) {
      console.error('Peer Dashboard Load Error:', e);
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
            <View style={styles.glassCircle1} />
            <View style={styles.glassCircle2} />

            <View style={styles.heroHeader}>
              <View>
                <ThemedText style={styles.greetingText}>EDUCATOR DASHBOARD</ThemedText>
                <ThemedText style={styles.userNameText}>{user?.pseudonym || 'Educator'}</ThemedText>
              </View>
              <View style={styles.headerRight}>
                <LinearGradient colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.1)']} style={styles.pointBadge}>
                  <MaterialCommunityIcons name="star-circle" size={16} color="#FFD700" />
                  <ThemedText style={styles.pointText}>{stats.peerPoints} pts</ThemedText>
                </LinearGradient>
              </View>
            </View>

            {/* Premium Stats Grid */}
            <View style={styles.statsContainer}>
              <View style={styles.statBox}>
                <ThemedText style={stats.helped > 0 ? styles.statVal : [styles.statVal, { opacity: 0.5 }]}>{stats.helped}</ThemedText>
                <ThemedText style={styles.statLbl}>Impacted</ThemedText>
              </View>
              <View style={styles.divider} />
              <View style={styles.statBox}>
                <ThemedText style={stats.hours > 0 ? styles.statVal : [styles.statVal, { opacity: 0.5 }]}>{stats.hours}h</ThemedText>
                <ThemedText style={styles.statLbl}>Volunteered</ThemedText>
              </View>
              <View style={styles.divider} />
              <View style={styles.statBox}>
                <ThemedText style={stats.impactScore > 0 ? styles.statVal : [styles.statVal, { opacity: 0.5 }]}>{stats.impactScore}%</ThemedText>
                <ThemedText style={styles.statLbl}>Happiness</ThemedText>
              </View>
            </View>

            {/* Weekly Goal Progress */}
            <View style={styles.goalSection}>
              <View style={styles.goalHeader}>
                <ThemedText style={styles.goalText}>Weekly Goal Progress</ThemedText>
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

        {/* Action Grid - Direct Access to Tools */}
        <View style={styles.toolGrid}>
          {[
            { label: 'Queue', icon: 'account-group', color: '#6366F1', route: '/peer-educator/queue' },
            { label: 'Chat', icon: 'message-text', color: '#10B981', route: '/peer-educator/ongoing-support' },
            { label: 'Meetings', icon: 'calendar-clock', color: '#F59E0B', route: '/meetings' },
            { label: 'Activity', icon: 'history', color: '#EC4899', route: '/peer-educator/activity-log' },
          ].map((tool, idx) => (
            <TouchableOpacity
              key={idx}
              activeOpacity={0.8}
              style={[styles.toolCard, { backgroundColor: colors.card }]}
              onPress={() => router.push(tool.route as any)}
            >
              <View style={[styles.toolIconBg, { backgroundColor: tool.color + '15' }]}>
                <MaterialCommunityIcons name={tool.icon as any} size={24} color={tool.color} />
              </View>
              <ThemedText style={styles.toolLabel}>{tool.label}</ThemedText>
            </TouchableOpacity>
          ))}
        </View>

        {/* High Priority Queue Alert */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.iconTitle}>
              <MaterialCommunityIcons name="lightning-bolt" size={20} color="#F59E0B" />
              <ThemedText style={styles.sectionTitle}>Priority Assistance</ThemedText>
            </View>
          </View>

          {pendingSessions.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.card }]}>
              <MaterialCommunityIcons name="check-decagram" size={32} color={colors.icon} />
              <ThemedText style={styles.emptyText}>Queue is currently empty. Great job!</ThemedText>
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

        {/* Ongoing Support Monitor */}
        {activeSessions.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.iconTitle}>
                <MaterialCommunityIcons name="sine-wave" size={20} color={colors.primary} />
                <ThemedText style={styles.sectionTitle}>Ongoing Support</ThemedText>
              </View>
            </View>

            {activeSessions.map((s) => (
              <TouchableOpacity
                key={s.id}
                style={[styles.premiumDataCard, { backgroundColor: colors.card }]}
                onPress={() => router.push(`/chat/${s.id}`)}
              >
                <View style={[styles.priorityIndicator, { backgroundColor: colors.primary }]} />
                <View style={styles.actContent}>
                  <ThemedText style={styles.actTitle}>Support: {s.student_pseudonym}</ThemedText>
                  <ThemedText style={[styles.actDate, { color: colors.primary }]}>SESSION ACTIVE</ThemedText>
                </View>
                <View style={styles.livePulse} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Footer Space */}
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Role Navigation Bar (Floating Command Bar) */}
      <View style={styles.commandBarContainer}>
        <LinearGradient
          colors={colorScheme === 'dark' ? ['rgba(30, 41, 59, 0.95)', 'rgba(15, 23, 42, 0.95)'] : ['rgba(255, 255, 255, 0.95)', 'rgba(248, 250, 252, 0.95)']}
          style={[styles.commandBar, PlatformStyles.premiumShadow]}
        >
          <TouchableOpacity onPress={() => router.replace('/(tabs)')} style={styles.commandItem}>
            <MaterialCommunityIcons name="account" size={22} color={colors.icon} />
            <ThemedText style={styles.commandLabel}>Student</ThemedText>
          </TouchableOpacity>
          <View style={styles.commandItemActive}>
            <LinearGradient colors={['#10B981', '#059669']} style={styles.activeGradient}>
              <MaterialCommunityIcons name="view-dashboard" size={24} color="#FFF" />
            </LinearGradient>
            <ThemedText style={[styles.commandLabel, { color: '#10B981', fontWeight: '800' }]}>Educator</ThemedText>
          </View>
          {user?.role === 'peer-educator-executive' || user?.role === 'admin' ? (
            <TouchableOpacity onPress={() => router.replace('/executive')} style={styles.commandItem}>
              <MaterialCommunityIcons name="shield-crown" size={22} color={colors.icon} />
              <ThemedText style={styles.commandLabel}>Executive</ThemedText>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={[styles.commandItem, { opacity: 0.3 }]} disabled>
              <MaterialCommunityIcons name="lock" size={22} color={colors.icon} />
              <ThemedText style={styles.commandLabel}>Locked</ThemedText>
            </TouchableOpacity>
          )}
        </LinearGradient>
      </View>
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
  greetingText: { color: 'rgba(255,255,255,0.8)', fontSize: 10, fontWeight: '900', letterSpacing: 2 },
  userNameText: { color: '#FFF', fontSize: 28, fontWeight: '900', marginTop: 2 },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pointBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  pointText: { color: '#FFF', fontSize: 13, fontWeight: '800' },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.18)',
    borderRadius: 28,
    paddingVertical: 20,
    marginBottom: 24,
  },
  statBox: { flex: 1, alignItems: 'center' },
  statVal: { color: '#FFF', fontSize: 24, fontWeight: '900' },
  statLbl: { color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: '700', marginTop: 4, textAlign: 'center' },
  divider: { width: 1, height: 32, backgroundColor: 'rgba(255,255,255,0.1)', alignSelf: 'center' },
  goalSection: { marginTop: 8 },
  goalHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  goalText: { color: 'rgba(255,255,255,0.9)', fontSize: 13, fontWeight: '700' },
  goalPercent: { color: '#FFF', fontSize: 13, fontWeight: '900' },
  goalTrack: { height: 8, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 4, overflow: 'hidden' },
  goalFill: { height: '100%', backgroundColor: '#FFF', borderRadius: 4 },
  toolGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 28,
  },
  toolCard: {
    width: (width - 40 - 12) / 2,
    padding: 16,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    ...PlatformStyles.premiumShadow,
  },
  toolIconBg: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toolLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  section: { marginBottom: 28 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  iconTitle: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: 17, fontWeight: '800' },
  emptyCard: { padding: 40, borderRadius: 28, alignItems: 'center', gap: 12 },
  emptyText: { color: Colors.light.icon, fontSize: 14, textAlign: 'center', fontWeight: '600' },
  premiumDataCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 24,
    marginBottom: 12,
    overflow: 'hidden',
    ...PlatformStyles.premiumShadow,
  },
  priorityIndicator: { width: 4, height: '100%', position: 'absolute', left: 0 },
  dataInfo: { flex: 1, marginLeft: 12 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  nameText: { fontSize: 16, fontWeight: '700' },
  pBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  pText: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
  metaText: { fontSize: 12, fontWeight: '500' },
  actContent: { flex: 1, marginLeft: 12 },
  actTitle: { fontSize: 15, fontWeight: '700' },
  actDate: { fontSize: 12, marginTop: 2, fontWeight: '800' },
  livePulse: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
  commandBarContainer: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
    zIndex: 100,
  },
  commandBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  commandItem: {
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 4,
  },
  commandItemActive: {
    alignItems: 'center',
    gap: 4,
  },
  activeGradient: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -20,
    elevation: 8,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  commandLabel: {
    fontSize: 10,
    fontWeight: '700',
  },
});
