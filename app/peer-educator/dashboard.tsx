/**
 * Premium Peer Educator Dashboard
 * Enhanced with animations, glassmorphism, and haptic feedback
 */

import { ThemedText } from '@/app/components/themed-text';
import { ThemedView } from '@/app/components/themed-view';
import { BorderRadius, Colors, PlatformStyles, Spacing } from '@/app/constants/theme';
import { useColorScheme } from '@/app/hooks/use-color-scheme';
import { Meeting, Post } from '@/app/types';
import { useRoleGuard } from '@/hooks/use-auth-guard';
import { getMeetings, getPosts, getReplies } from '@/lib/database';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { format, formatDistanceToNow } from 'date-fns';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function PeerEducatorDashboardScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const { user, loading: authLoading } = useRoleGuard(
    ['peer-educator', 'peer-educator-executive', 'admin'],
    '/(tabs)'
  );

  const [refreshing, setRefreshing] = useState(false);
  const [postsNeedingSupport, setPostsNeedingSupport] = useState<Post[]>([]);
  const [upcomingMeetings, setUpcomingMeetings] = useState<Meeting[]>([]);
  const [stats, setStats] = useState({
    totalResponses: 0,
    helpfulResponses: 0,
    activeThreads: 0,
    hoursLogged: 12, // Placeholder
  });

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const loadData = async () => {
    try {
      const [allPosts, meetings] = await Promise.all([getPosts(), getMeetings()]);

      // Get all replies
      const allReplies = (await Promise.all(allPosts.map((p) => getReplies(p.id)))).flat();

      // Filter posts needing support
      const postsNeedingHelp = allPosts
        .filter((post) => {
          const replies = allReplies.filter((r) => r.postId === post.id);
          return replies.length === 0 || (replies.length < 2 && post.escalationLevel === 'none');
        })
        .slice(0, 5);

      setPostsNeedingSupport(postsNeedingHelp);

      // Upcoming meetings
      const upcoming = meetings
        .filter((m) => new Date(m.scheduledDate) >= new Date())
        .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime())
        .slice(0, 3);
      setUpcomingMeetings(upcoming);

      // Stats
      const myReplies = allReplies.filter((r) => r.authorId === user?.id);
      const helpfulCount = myReplies.filter((r) => r.isHelpful > 0).length;
      const activeThreads = new Set(myReplies.map((r) => r.postId)).size;

      setStats({
        totalResponses: myReplies.length,
        helpfulResponses: helpfulCount,
        activeThreads,
        hoursLogged: 12,
      });
    } catch (error) {
      console.error('Error loading dashboard:', error);
    }
  };

  const handleRefresh = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  if (authLoading) {
    return (
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <ThemedView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </ThemedView>
      </SafeAreaView>
    );
  }

  const quickActions = [
    { id: 'queue', icon: 'account-multiple-plus-outline', label: 'Queue', route: '/peer-educator/queue', color: '#EF4444' },
    { id: 'respond', icon: 'message-reply-text', label: 'Posts', route: '/peer-educator/posts', color: '#6366F1' },
    { id: 'log', icon: 'clipboard-check-outline', label: 'Log Hours', route: '/peer-educator/activity-log', color: '#10B981' },
    { id: 'meetings', icon: 'calendar-clock', label: 'Meetings', route: '/peer-educator/meetings', color: '#F59E0B' },
  ];

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ThemedView style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />}
        >
          {/* Hero Header */}
          <Animated.View entering={FadeInDown.duration(600)}>
            <LinearGradient
              colors={['#6366F1', '#8B5CF6', '#A855F7']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroCard}
            >
              <View style={styles.heroPattern1} />
              <View style={styles.heroPattern2} />
              <MaterialCommunityIcons name="shield-account" size={100} color="rgba(255,255,255,0.08)" style={styles.heroBgIcon} />

              <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                <MaterialCommunityIcons name="arrow-left" size={24} color="#FFF" />
              </TouchableOpacity>

              <View style={styles.heroContent}>
                <View style={styles.roleBadge}>
                  <MaterialCommunityIcons name="hand-heart" size={14} color="#FFF" />
                  <ThemedText style={styles.roleBadgeText}>Peer Educator</ThemedText>
                </View>
                <ThemedText style={styles.heroTitle}>Welcome back, {user?.pseudonym?.split(/(?=[A-Z])/)[0] || 'Educator'}!</ThemedText>
                <ThemedText style={styles.heroSubtitle}>You're making a difference today.</ThemedText>
              </View>
            </LinearGradient>
          </Animated.View>

          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            {[
              { icon: 'message-text-outline', value: stats.totalResponses, label: 'Responses', color: '#6366F1' },
              { icon: 'thumb-up-outline', value: stats.helpfulResponses, label: 'Helpful', color: '#10B981' },
              { icon: 'forum-outline', value: stats.activeThreads, label: 'Threads', color: '#F59E0B' },
              { icon: 'clock-outline', value: `${stats.hoursLogged}h`, label: 'Logged', color: '#EC4899' },
            ].map((stat, idx) => (
              <Animated.View key={stat.label} entering={FadeInDown.delay(200 + idx * 100)} style={styles.statCard}>
                <View style={[styles.statIconBox, { backgroundColor: stat.color + '15' }]}>
                  <MaterialCommunityIcons name={stat.icon as any} size={24} color={stat.color} />
                </View>
                <ThemedText style={styles.statValue}>{stat.value}</ThemedText>
                <ThemedText style={[styles.statLabel, { color: colors.icon }]}>{stat.label}</ThemedText>
              </Animated.View>
            ))}
          </View>

          {/* Quick Actions */}
          <Animated.View entering={FadeInDown.delay(500)}>
            <ThemedText type="h3" style={styles.sectionTitle}>Quick Actions</ThemedText>
            <View style={styles.actionsGrid}>
              {quickActions.map((action, idx) => (
                <TouchableOpacity
                  key={action.id}
                  style={[styles.actionCard, { backgroundColor: colors.card }, PlatformStyles.premiumShadow]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push(action.route as any);
                  }}
                  activeOpacity={0.8}
                >
                  <LinearGradient colors={[action.color, action.color + 'CC']} style={styles.actionIconBox}>
                    <MaterialCommunityIcons name={action.icon as any} size={24} color="#FFF" />
                  </LinearGradient>
                  <ThemedText style={styles.actionLabel}>{action.label}</ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>

          {/* Posts Needing Support */}
          <Animated.View entering={FadeInDown.delay(600)} style={[styles.section, { backgroundColor: colors.card }]}>
            <View style={styles.sectionHeader}>
              <ThemedText type="h3">Posts Awaiting Support</ThemedText>
              <TouchableOpacity onPress={() => router.push('/peer-educator/posts')}>
                <ThemedText style={{ color: colors.primary, fontWeight: '600' }}>See All</ThemedText>
              </TouchableOpacity>
            </View>

            {postsNeedingSupport.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="check-circle-outline" size={48} color={colors.success} />
                <ThemedText style={{ color: colors.icon, marginTop: 12 }}>All caught up! Great work. 🎉</ThemedText>
              </View>
            ) : (
              postsNeedingSupport.map((post, idx) => (
                <Animated.View key={post.id} entering={FadeInRight.delay(idx * 80)}>
                  <TouchableOpacity
                    style={[styles.postItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    onPress={() => {
                      Haptics.selectionAsync();
                      router.push(`/post/${post.id}`);
                    }}
                  >
                    <View style={styles.postInfo}>
                      <ThemedText style={styles.postTitle} numberOfLines={1}>{post.title}</ThemedText>
                      <ThemedText style={[styles.postMeta, { color: colors.icon }]}>
                        {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                      </ThemedText>
                    </View>
                    <MaterialCommunityIcons name="chevron-right" size={20} color={colors.icon} />
                  </TouchableOpacity>
                </Animated.View>
              ))
            )}
          </Animated.View>

          {/* Upcoming Meetings */}
          <Animated.View entering={FadeInDown.delay(700)} style={[styles.section, { backgroundColor: colors.card }]}>
            <View style={styles.sectionHeader}>
              <ThemedText type="h3">Upcoming Meetings</ThemedText>
              <TouchableOpacity onPress={() => router.push('/peer-educator/meetings')}>
                <ThemedText style={{ color: colors.primary, fontWeight: '600' }}>See All</ThemedText>
              </TouchableOpacity>
            </View>

            {upcomingMeetings.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="calendar-blank-outline" size={48} color={colors.icon} />
                <ThemedText style={{ color: colors.icon, marginTop: 12 }}>No upcoming meetings.</ThemedText>
              </View>
            ) : (
              upcomingMeetings.map((meeting, idx) => (
                <TouchableOpacity
                  key={meeting.id}
                  style={[styles.meetingItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    router.push(`/meetings/${meeting.id}`);
                  }}
                >
                  <View style={[styles.meetingDateBox, { backgroundColor: colors.primary + '15' }]}>
                    <ThemedText style={[styles.meetingDay, { color: colors.primary }]}>
                      {format(new Date(meeting.scheduledDate), 'dd')}
                    </ThemedText>
                    <ThemedText style={[styles.meetingMonth, { color: colors.primary }]}>
                      {format(new Date(meeting.scheduledDate), 'MMM')}
                    </ThemedText>
                  </View>
                  <View style={styles.meetingInfo}>
                    <ThemedText style={styles.meetingTitle}>{meeting.title}</ThemedText>
                    <ThemedText style={[styles.meetingTime, { color: colors.icon }]}>
                      {format(new Date(meeting.scheduledDate), 'HH:mm')} • {meeting.location || 'Online'}
                    </ThemedText>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={20} color={colors.icon} />
                </TouchableOpacity>
              ))
            )}
          </Animated.View>

          <View style={{ height: 100 }} />
        </ScrollView>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { padding: Spacing.lg },
  heroCard: {
    borderRadius: BorderRadius.xxl,
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
    overflow: 'hidden',
    minHeight: 180,
  },
  heroPattern1: { position: 'absolute', top: -40, right: -40, width: 150, height: 150, borderRadius: 75, backgroundColor: 'rgba(255,255,255,0.05)' },
  heroPattern2: { position: 'absolute', bottom: -60, left: -30, width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.05)' },
  heroBgIcon: { position: 'absolute', right: -10, bottom: -20, transform: [{ rotate: '-15deg' }] },
  backBtn: { position: 'absolute', top: 16, left: 16, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.2)', justifyContent: 'center', alignItems: 'center' },
  heroContent: { marginTop: 40 },
  roleBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, gap: 6, marginBottom: 12 },
  roleBadgeText: { color: '#FFF', fontWeight: '700', fontSize: 12 },
  heroTitle: { color: '#FFF', fontSize: 24, fontWeight: '800', marginBottom: 4 },
  heroSubtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 14 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: Spacing.xl },
  statCard: { width: '47%', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: BorderRadius.lg, padding: Spacing.md, alignItems: 'center', gap: 8 },
  statIconBox: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: '800' },
  statLabel: { fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  sectionTitle: { marginBottom: Spacing.md, fontWeight: '700' },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: Spacing.xl },
  actionCard: { width: '47%', padding: Spacing.lg, borderRadius: BorderRadius.xl, alignItems: 'center', gap: 10 },
  actionIconBox: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  actionLabel: { fontWeight: '600', fontSize: 14 },
  section: { borderRadius: BorderRadius.xl, padding: Spacing.lg, marginBottom: Spacing.lg },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  emptyState: { alignItems: 'center', paddingVertical: Spacing.xl },
  postItem: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, borderRadius: BorderRadius.lg, borderWidth: 1, marginBottom: Spacing.sm },
  postInfo: { flex: 1 },
  postTitle: { fontWeight: '600', marginBottom: 4 },
  postMeta: { fontSize: 12 },
  meetingItem: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, borderRadius: BorderRadius.lg, borderWidth: 1, marginBottom: Spacing.sm, gap: 12 },
  meetingDateBox: { width: 50, height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  meetingDay: { fontSize: 18, fontWeight: '800' },
  meetingMonth: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase' },
  meetingInfo: { flex: 1 },
  meetingTitle: { fontWeight: '600', marginBottom: 2 },
  meetingTime: { fontSize: 12 },
});
