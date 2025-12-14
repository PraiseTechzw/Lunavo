/**
 * Peer Educator Dashboard - For trained peer volunteers
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
import { getPosts, getReplies, getMeetings, getCurrentUser } from '@/lib/database';
import { Post, Reply, Meeting } from '@/types';
import { formatDistanceToNow, format } from 'date-fns';
import { useRoleGuard } from '@/hooks/use-auth-guard';
import { PostCard } from '@/components/post-card';

export default function PeerEducatorDashboardScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  
  // Role guard - only peer educators can access
  const { user, loading: authLoading } = useRoleGuard(
    ['peer-educator', 'peer-educator-executive', 'admin'],
    '/(tabs)'
  );
  
  const [refreshing, setRefreshing] = useState(false);
  const [postsNeedingSupport, setPostsNeedingSupport] = useState<Post[]>([]);
  const [myResponses, setMyResponses] = useState<Reply[]>([]);
  const [upcomingMeetings, setUpcomingMeetings] = useState<Meeting[]>([]);
  const [stats, setStats] = useState({
    totalResponses: 0,
    helpfulResponses: 0,
    activeThreads: 0,
  });

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      const [allPosts, allReplies, meetings] = await Promise.all([
        getPosts(),
        getPosts().then(async (posts) => {
          const replies = await Promise.all(posts.map((p) => getReplies(p.id)));
          return replies.flat();
        }),
        getMeetings(),
      ]);

      // Filter posts needing support (no replies or few replies)
      const postsNeedingHelp = allPosts
        .filter((post) => {
          const replies = allReplies.filter((r) => r.postId === post.id);
          return replies.length === 0 || (replies.length < 2 && post.escalationLevel === 'none');
        })
        .slice(0, 5);

      setPostsNeedingSupport(postsNeedingHelp);

      // Get my responses
      const myReplies = allReplies.filter((r) => r.authorId === user?.id);
      setMyResponses(myReplies.slice(0, 5));

      // Get upcoming meetings
      const upcoming = meetings
        .filter((m) => new Date(m.scheduledDate) >= new Date())
        .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime())
        .slice(0, 3);

      setUpcomingMeetings(upcoming);

      // Calculate stats
      const helpfulCount = myReplies.filter((r) => r.isHelpful > 0).length;
      const activeThreads = new Set(myReplies.map((r) => r.postId)).size;

      setStats({
        totalResponses: myReplies.length,
        helpfulResponses: helpfulCount,
        activeThreads,
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
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
              Peer Educator Dashboard
            </ThemedText>
            <TouchableOpacity
              onPress={() => router.push('/peer-educator/profile')}
              style={getCursorStyle()}
            >
              <MaterialIcons name="person" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Stats Cards */}
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: colors.card }, createShadow(2, '#000', 0.1)]}>
              <MaterialIcons name="chat-bubble-outline" size={32} color={colors.primary} />
              <ThemedText type="h2" style={styles.statValue}>
                {stats.totalResponses}
              </ThemedText>
              <ThemedText type="small" style={{ color: colors.icon }}>
                Total Responses
              </ThemedText>
            </View>

            <View style={[styles.statCard, { backgroundColor: colors.card }, createShadow(2, '#000', 0.1)]}>
              <MaterialIcons name="thumb-up" size={32} color={colors.success} />
              <ThemedText type="h2" style={styles.statValue}>
                {stats.helpfulResponses}
              </ThemedText>
              <ThemedText type="small" style={{ color: colors.icon }}>
                Helpful Responses
              </ThemedText>
            </View>

            <View style={[styles.statCard, { backgroundColor: colors.card }, createShadow(2, '#000', 0.1)]}>
              <MaterialIcons name="forum" size={32} color={colors.primary} />
              <ThemedText type="h2" style={styles.statValue}>
                {stats.activeThreads}
              </ThemedText>
              <ThemedText type="small" style={{ color: colors.icon }}>
                Active Threads
              </ThemedText>
            </View>
          </View>

          {/* Posts Needing Support */}
          <View style={[styles.section, { backgroundColor: colors.card }, createShadow(2, '#000', 0.1)]}>
            <View style={styles.sectionHeader}>
              <ThemedText type="h3" style={styles.sectionTitle}>
                Posts Needing Support
              </ThemedText>
              <TouchableOpacity
                onPress={() => router.push('/peer-educator/posts')}
                style={getCursorStyle()}
              >
                <ThemedText type="small" style={{ color: colors.primary }}>
                  View All
                </ThemedText>
              </TouchableOpacity>
            </View>
            {postsNeedingSupport.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialIcons name="check-circle" size={48} color={colors.success} />
                <ThemedText type="body" style={[styles.emptyText, { color: colors.icon }]}>
                  All posts have received support!
                </ThemedText>
              </View>
            ) : (
              postsNeedingSupport.map((post) => (
                <TouchableOpacity
                  key={post.id}
                  style={styles.postItem}
                  onPress={() => router.push(`/post/${post.id}`)}
                >
                  <ThemedText type="body" style={{ fontWeight: '600', color: colors.text }} numberOfLines={1}>
                    {post.title}
                  </ThemedText>
                  <ThemedText type="small" style={{ color: colors.icon, marginTop: Spacing.xs }}>
                    {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                  </ThemedText>
                </TouchableOpacity>
              ))
            )}
          </View>

          {/* Upcoming Meetings */}
          <View style={[styles.section, { backgroundColor: colors.card }, createShadow(2, '#000', 0.1)]}>
            <View style={styles.sectionHeader}>
              <ThemedText type="h3" style={styles.sectionTitle}>
                Upcoming Meetings
              </ThemedText>
              <TouchableOpacity
                onPress={() => router.push('/peer-educator/meetings')}
                style={getCursorStyle()}
              >
                <ThemedText type="small" style={{ color: colors.primary }}>
                  View All
                </ThemedText>
              </TouchableOpacity>
            </View>
            {upcomingMeetings.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialIcons name="event" size={48} color={colors.icon} />
                <ThemedText type="body" style={[styles.emptyText, { color: colors.icon }]}>
                  No upcoming meetings
                </ThemedText>
              </View>
            ) : (
              upcomingMeetings.map((meeting) => (
                <TouchableOpacity
                  key={meeting.id}
                  style={styles.meetingItem}
                  onPress={() => router.push(`/meetings/${meeting.id}`)}
                >
                  <View style={styles.meetingInfo}>
                    <MaterialIcons name="event" size={24} color={colors.primary} />
                    <View style={styles.meetingDetails}>
                      <ThemedText type="body" style={{ fontWeight: '600', color: colors.text }}>
                        {meeting.title}
                      </ThemedText>
                      <ThemedText type="small" style={{ color: colors.icon }}>
                        {format(new Date(meeting.scheduledDate), 'EEE, MMM dd, yyyy • HH:mm')}
                      </ThemedText>
                    </View>
                  </View>
                  <MaterialIcons name="chevron-right" size={24} color={colors.icon} />
                </TouchableOpacity>
              ))
            )}
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.primary }]}
              onPress={() => router.push('/peer-educator/posts')}
            >
              <MaterialIcons name="forum" size={24} color="#FFFFFF" />
              <ThemedText type="body" style={{ color: '#FFFFFF', fontWeight: '600', marginLeft: Spacing.sm }}>
                Respond to Posts
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }]}
              onPress={() => router.push('/peer-educator/meetings')}
            >
              <MaterialIcons name="event" size={24} color={colors.text} />
              <ThemedText type="body" style={{ color: colors.text, fontWeight: '600', marginLeft: Spacing.sm }}>
                View Meetings
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
    minWidth: '30%',
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
  postItem: {
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: '#F5F5F5',
  },
  meetingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: '#F5F5F5',
  },
  meetingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  meetingDetails: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    padding: Spacing.xl,
  },
  emptyText: {
    marginTop: Spacing.md,
    textAlign: 'center',
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


