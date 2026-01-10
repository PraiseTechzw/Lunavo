/**
 * Peer Educator Dashboard - Professional Mobile Design
 * Clean data-focused layout, no quick action cards
 */

import { ThemedText } from '@/app/components/themed-text';
import { BorderRadius, Colors, PlatformStyles, Spacing } from '@/app/constants/theme';
import { useColorScheme } from '@/app/hooks/use-color-scheme';
import { useRoleGuard } from '@/hooks/use-auth-guard';
import { supabase } from '@/lib/supabase';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Session {
  id: string;
  student_pseudonym: string;
  category: string;
  priority: string;
  created_at: string;
  status: string;
}

interface Activity {
  id: string;
  activity_type: string;
  title: string;
  duration_minutes: number;
  date: string;
}

export default function PeerEducatorDashboardScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { user, loading: authLoading } = useRoleGuard(['peer-educator', 'peer-educator-executive', 'admin'], '/(tabs)');

  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pendingSessions, setPendingSessions] = useState<Session[]>([]);
  const [mySessions, setMySessions] = useState<Session[]>([]);
  const [recentActivity, setRecentActivity] = useState<Activity[]>([]);
  const [stats, setStats] = useState({ helped: 0, hours: 0 });

  const loadData = useCallback(async () => {
    if (!user?.id) return;

    try {
      // Pending sessions
      const { data: pending } = await supabase
        .from('support_sessions')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(5);
      setPendingSessions(pending || []);

      // My active sessions
      const { data: active } = await supabase
        .from('support_sessions')
        .select('*')
        .eq('educator_id', user.id)
        .in('status', ['active', 'resolved'])
        .order('created_at', { ascending: false })
        .limit(3);
      setMySessions(active || []);

      // Recent activity
      const { data: activity } = await supabase
        .from('pe_activity_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(5);
      setRecentActivity(activity || []);

      // Stats
      const { count: helpedCount } = await supabase
        .from('support_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('educator_id', user.id)
        .eq('status', 'resolved');

      const { data: logs } = await supabase
        .from('pe_activity_logs')
        .select('duration_minutes')
        .eq('user_id', user.id);
      const totalHours = Math.round((logs?.reduce((s, l) => s + l.duration_minutes, 0) || 0) / 60 * 10) / 10;

      setStats({ helped: helpedCount || 0, hours: totalHours });
    } catch (e) {
      console.error('Dashboard load error:', e);
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
      <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />}
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(400)}>
          <LinearGradient colors={['#6366F1', '#8B5CF6']} style={styles.header}>
            <View>
              <ThemedText style={styles.greeting}>Good day, {user?.pseudonym?.split(/(?=[A-Z])/)[0] || 'Educator'}</ThemedText>
              <ThemedText style={styles.subGreeting}>Peer Educator Dashboard</ThemedText>
            </View>
            <View style={styles.headerStats}>
              <View style={styles.headerStat}>
                <ThemedText style={styles.headerStatNum}>{stats.helped}</ThemedText>
                <ThemedText style={styles.headerStatLabel}>Helped</ThemedText>
              </View>
              <View style={styles.headerStat}>
                <ThemedText style={styles.headerStatNum}>{stats.hours}h</ThemedText>
                <ThemedText style={styles.headerStatLabel}>Logged</ThemedText>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Pending Requests */}
        <Animated.View entering={FadeInDown.delay(100)}>
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>Pending Requests</ThemedText>
              <View style={[styles.countBadge, { backgroundColor: pendingSessions.length > 0 ? '#EF4444' : colors.success }]}>
                <ThemedText style={styles.countText}>{pendingSessions.length}</ThemedText>
              </View>
            </View>

            {pendingSessions.length === 0 ? (
              <View style={[styles.emptyCard, { backgroundColor: colors.card }]}>
                <MaterialCommunityIcons name="check-circle-outline" size={32} color={colors.success} />
                <ThemedText style={{ color: colors.icon, marginTop: 8 }}>No pending requests</ThemedText>
              </View>
            ) : (
              pendingSessions.map((session) => (
                <TouchableOpacity
                  key={session.id}
                  style={[styles.sessionCard, { backgroundColor: colors.card, borderLeftColor: priorityColor(session.priority) }]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    router.push('/peer-educator/queue');
                  }}
                >
                  <View style={styles.sessionInfo}>
                    <ThemedText style={[styles.sessionName, { color: colors.text }]}>{session.student_pseudonym}</ThemedText>
                    <ThemedText style={[styles.sessionMeta, { color: colors.icon }]}>
                      {session.category || 'General'} • {formatDistanceToNow(new Date(session.created_at), { addSuffix: true })}
                    </ThemedText>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={20} color={colors.icon} />
                </TouchableOpacity>
              ))
            )}
          </View>
        </Animated.View>

        {/* My Sessions */}
        <Animated.View entering={FadeInDown.delay(200)}>
          <View style={styles.section}>
            <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>My Sessions</ThemedText>

            {mySessions.length === 0 ? (
              <View style={[styles.emptyCard, { backgroundColor: colors.card }]}>
                <MaterialCommunityIcons name="message-off-outline" size={32} color={colors.icon} />
                <ThemedText style={{ color: colors.icon, marginTop: 8 }}>No active sessions</ThemedText>
              </View>
            ) : (
              mySessions.map((session) => (
                <View key={session.id} style={[styles.mySessionCard, { backgroundColor: colors.card }]}>
                  <View style={[styles.statusDot, { backgroundColor: session.status === 'active' ? colors.success : colors.icon }]} />
                  <View style={styles.sessionInfo}>
                    <ThemedText style={[styles.sessionName, { color: colors.text }]}>{session.student_pseudonym}</ThemedText>
                    <ThemedText style={[styles.sessionMeta, { color: colors.icon }]}>{session.status}</ThemedText>
                  </View>
                </View>
              ))
            )}
          </View>
        </Animated.View>

        {/* Recent Activity */}
        <Animated.View entering={FadeInDown.delay(300)}>
          <View style={styles.section}>
            <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>Recent Activity</ThemedText>

            {recentActivity.length === 0 ? (
              <View style={[styles.emptyCard, { backgroundColor: colors.card }]}>
                <MaterialCommunityIcons name="clipboard-text-off-outline" size={32} color={colors.icon} />
                <ThemedText style={{ color: colors.icon, marginTop: 8 }}>No activity logged yet</ThemedText>
              </View>
            ) : (
              recentActivity.map((act) => (
                <View key={act.id} style={[styles.activityCard, { backgroundColor: colors.card }]}>
                  <MaterialCommunityIcons
                    name={act.activity_type === 'session' ? 'message-text' : act.activity_type === 'training' ? 'school' : 'calendar'}
                    size={18}
                    color={colors.primary}
                  />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <ThemedText style={[styles.activityTitle, { color: colors.text }]}>{act.title}</ThemedText>
                    <ThemedText style={[styles.activityMeta, { color: colors.icon }]}>{act.date}</ThemedText>
                  </View>
                  <ThemedText style={[styles.activityDuration, { color: colors.primary }]}>{act.duration_minutes}m</ThemedText>
                </View>
              ))
            )}
          </View>
        </Animated.View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { padding: Spacing.md },
  header: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  greeting: { color: '#FFF', fontSize: 20, fontWeight: '700' },
  subGreeting: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 2 },
  headerStats: { flexDirection: 'row', gap: 16 },
  headerStat: { alignItems: 'center' },
  headerStatNum: { color: '#FFF', fontSize: 20, fontWeight: '800' },
  headerStatLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 10 },
  section: { marginBottom: Spacing.lg },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.sm },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  countBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  countText: { color: '#FFF', fontSize: 12, fontWeight: '700' },
  emptyCard: { padding: Spacing.xl, borderRadius: BorderRadius.lg, alignItems: 'center' },
  sessionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderLeftWidth: 3,
    marginBottom: Spacing.xs,
    ...PlatformStyles.premiumShadow,
  },
  sessionInfo: { flex: 1 },
  sessionName: { fontWeight: '600', fontSize: 14 },
  sessionMeta: { fontSize: 12, marginTop: 2 },
  mySessionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xs,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 10 },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xs,
  },
  activityTitle: { fontSize: 13, fontWeight: '500' },
  activityMeta: { fontSize: 11 },
  activityDuration: { fontSize: 12, fontWeight: '600' },
});
