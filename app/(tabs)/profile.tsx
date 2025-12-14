/**
 * Profile Tab - Navigates to Profile Settings
 */

import { StreakDisplay } from '@/components/streak-display';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getCurrentUser, getPosts, getReplies, getUserBadges } from '@/lib/database';
import { getStreakInfo } from '@/lib/gamification';
import { getUserPoints } from '@/lib/points-system';
import { createShadow } from '@/utils/platform-styles';
import { getPseudonym } from '@/utils/storage';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfileScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const [userName, setUserName] = useState('Alex');
  const [badges, setBadges] = useState<any[]>([]);
  const [badgeCount, setBadgeCount] = useState(0);
  const [stats, setStats] = useState({
    posts: 0,
    replies: 0,
    helpfulVotes: 0,
    points: 0,
    checkInStreak: { current: 0, longest: 0 },
    helpingStreak: { current: 0, longest: 0 },
    engagementStreak: { current: 0, longest: 0 },
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await getCurrentUser();
      if (!currentUser) return;

      setUser(currentUser);
      console.log('[Profile] User loaded:', { id: currentUser.id, role: currentUser.role });
      const savedPseudonym = await getPseudonym();
      if (savedPseudonym) {
        setUserName(savedPseudonym.split(/(?=[A-Z])/)[0] || 'Student');
      } else {
        setUserName(currentUser.pseudonym || 'Student');
      }

      // Load badges - only if user has a valid ID
      if (currentUser.id && currentUser.id.trim() !== '') {
        try {
      const userBadges = await getUserBadges(currentUser.id);
      setBadges(userBadges.slice(0, 6)); // Show first 6 badges
      setBadgeCount(userBadges.length);
        } catch (error) {
          console.error('Error loading badges:', error);
          setBadges([]);
          setBadgeCount(0);
        }
      } else {
        setBadges([]);
        setBadgeCount(0);
      }

      // Load stats - only if user has a valid ID
      if (currentUser.id && currentUser.id.trim() !== '') {
      const [allPosts, allReplies, points, checkInStreak, helpingStreak, engagementStreak] = await Promise.all([
        getPosts(),
        Promise.all((await getPosts()).map(p => getReplies(p.id))).then(replies => replies.flat()),
        getUserPoints(currentUser.id),
        getStreakInfo(currentUser.id, 'check-in'),
        getStreakInfo(currentUser.id, 'helping'),
        getStreakInfo(currentUser.id, 'engagement'),
      ]);

      const myPosts = allPosts.filter(p => p.authorId === currentUser.id);
      const myReplies = allReplies.filter(r => r.authorId === currentUser.id);
      const helpfulVotes = myReplies.reduce((sum, r) => sum + (r.isHelpful || 0), 0);

      setStats({
        posts: myPosts.length,
        replies: myReplies.length,
        helpfulVotes,
        points,
          checkInStreak: { current: checkInStreak.current, longest: checkInStreak.longest },
          helpingStreak: { current: helpingStreak.current, longest: helpingStreak.longest },
          engagementStreak: { current: engagementStreak.current, longest: engagementStreak.longest },
      });

      // Load recent activity
      const activity: any[] = [];
      myPosts.slice(0, 5).forEach(post => {
        activity.push({
          type: 'post',
          id: post.id,
          title: post.title,
          date: post.createdAt,
        });
      });
      myReplies.slice(0, 5).forEach(reply => {
        const post = allPosts.find(p => p.id === reply.postId);
        activity.push({
          type: 'reply',
          id: reply.id,
          title: post?.title || 'Post',
          date: reply.createdAt,
        });
      });
      activity.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setRecentActivity(activity.slice(0, 10));
      }
    } catch (error) {
      console.error('Error loading profile data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView edges={['top']} style={styles.safeAreaTop}>
        <ThemedView style={[styles.container, styles.loadingContainer]}>
          <ActivityIndicator size="large" color={colors.primary} />
        </ThemedView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={styles.safeAreaTop}>
      <ThemedView style={styles.container}>
        <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View style={[styles.profileHeader, { backgroundColor: colors.card }, createShadow(2, '#000', 0.1)]}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <ThemedText type="h2" style={{ color: '#FFFFFF', fontWeight: '700' }}>
              {userName[0]?.toUpperCase() || 'A'}
            </ThemedText>
          </View>
          <ThemedText type="h2" style={[styles.userName, { color: colors.text }]}>
            {userName}
          </ThemedText>
          <ThemedText type="caption" style={[styles.userRole, { color: colors.icon }]}>
            {user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1).replace('-', ' ') : 'Student'} at Chinhoyi University of Technology
          </ThemedText>
          
          {/* Points Balance */}
          <View style={[styles.pointsCard, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '30' }]}>
            <MaterialIcons name="stars" size={22} color={colors.primary} />
            <ThemedText type="body" style={{ color: colors.primary, fontWeight: '700', marginLeft: Spacing.xs, fontSize: 16 }}>
              {stats.points} Points
            </ThemedText>
          </View>
        </View>

        {/* Streaks */}
        {(stats.checkInStreak.current > 0 || stats.helpingStreak.current > 0 || stats.engagementStreak.current > 0) && (
          <View style={[styles.streaksSection, { backgroundColor: colors.card }, createShadow(2, '#000', 0.1)]}>
            <ThemedText type="h3" style={[styles.sectionTitle, { marginBottom: Spacing.md }]}>
              Active Streaks
            </ThemedText>
            <View style={styles.streaksContainer}>
              {stats.checkInStreak.current > 0 && (
                <View style={[styles.streakCard, { backgroundColor: colors.surface }]}>
                  <StreakDisplay current={stats.checkInStreak.current} longest={stats.checkInStreak.longest} type="check-in" />
                </View>
            )}
              {stats.helpingStreak.current > 0 && (
                <View style={[styles.streakCard, { backgroundColor: colors.surface }]}>
                  <StreakDisplay current={stats.helpingStreak.current} longest={stats.helpingStreak.longest} type="helping" />
                </View>
            )}
              {stats.engagementStreak.current > 0 && (
                <View style={[styles.streakCard, { backgroundColor: colors.surface }]}>
                  <StreakDisplay current={stats.engagementStreak.current} longest={stats.engagementStreak.longest} type="engagement" />
                </View>
            )}
            </View>
          </View>
        )}

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: colors.card }, createShadow(2, '#000', 0.1)]}>
            <MaterialIcons name="forum" size={24} color={colors.primary} />
            <ThemedText type="h3" style={{ color: colors.text, marginTop: Spacing.xs }}>
              {stats.posts}
            </ThemedText>
            <ThemedText type="small" style={{ color: colors.icon }}>
              Posts
            </ThemedText>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card }, createShadow(2, '#000', 0.1)]}>
            <MaterialIcons name="reply" size={24} color={colors.secondary} />
            <ThemedText type="h3" style={{ color: colors.text, marginTop: Spacing.xs }}>
              {stats.replies}
            </ThemedText>
            <ThemedText type="small" style={{ color: colors.icon }}>
              Replies
            </ThemedText>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card }, createShadow(2, '#000', 0.1)]}>
            <MaterialIcons name="thumb-up" size={24} color={colors.success} />
            <ThemedText type="h3" style={{ color: colors.text, marginTop: Spacing.xs }}>
              {stats.helpfulVotes}
            </ThemedText>
            <ThemedText type="small" style={{ color: colors.icon }}>
              Helpful
            </ThemedText>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card }, createShadow(2, '#000', 0.1)]}>
            <MaterialIcons name="emoji-events" size={24} color={colors.warning} />
            <ThemedText type="h3" style={{ color: colors.text, marginTop: Spacing.xs }}>
              {badgeCount}
            </ThemedText>
            <ThemedText type="small" style={{ color: colors.icon }}>
              Badges
            </ThemedText>
          </View>
        </View>

        {/* Badges Section */}
        {badgeCount > 0 && (
          <View style={[styles.badgesSection, { backgroundColor: colors.card }, createShadow(2, '#000', 0.1)]}>
            <View style={styles.sectionHeader}>
              <ThemedText type="h3" style={[styles.sectionTitle, { color: colors.text }]}>
                My Badges
              </ThemedText>
              <TouchableOpacity onPress={() => router.push('/badges')}>
                <ThemedText type="body" style={{ color: colors.primary, fontWeight: '600' }}>
                  View All
                </ThemedText>
              </TouchableOpacity>
            </View>
            <View style={styles.badgesGrid}>
              {badges.map((badge) => (
                <View
                  key={badge.id}
                  style={[
                    styles.badgeItem,
                    { backgroundColor: colors.surface },
                    createShadow(1, '#000', 0.05),
                  ]}
                >
                  <MaterialIcons name={badge.icon as any || 'star'} size={32} color={badge.color || colors.primary} />
                  <ThemedText type="small" style={{ color: colors.text, marginTop: Spacing.xs, textAlign: 'center' }}>
                    {badge.name}
                  </ThemedText>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Recent Activity */}
        {recentActivity.length > 0 && (
          <View style={[styles.activitySection, { backgroundColor: colors.card }, createShadow(2, '#000', 0.1)]}>
            <ThemedText type="h3" style={[styles.sectionTitle, { color: colors.text }]}>
              Recent Activity
            </ThemedText>
            {recentActivity.map((activity) => (
              <TouchableOpacity
                key={`${activity.type}-${activity.id}`}
                style={[styles.activityItem, { backgroundColor: colors.surface }, createShadow(1, '#000', 0.05)]}
                activeOpacity={0.7}
                onPress={() => {
                  if (activity.type === 'post') {
                    router.push(`/post/${activity.id}` as any);
                  }
                }}
              >
                <MaterialIcons
                  name={activity.type === 'post' ? 'forum' : 'reply'}
                  size={20}
                  color={activity.type === 'post' ? colors.primary : colors.secondary}
                />
                <View style={styles.activityContent}>
                  <ThemedText type="body" style={{ color: colors.text, fontWeight: '500' }}>
                    {activity.title}
                  </ThemedText>
                  <ThemedText type="small" style={{ color: colors.icon, marginTop: Spacing.xs }}>
                    {formatDistanceToNow(new Date(activity.date), { addSuffix: true })}
                  </ThemedText>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Quick Actions */}
        <View style={[styles.actionsSection, { backgroundColor: colors.card }, createShadow(2, '#000', 0.1)]}>
          <ThemedText type="h3" style={[styles.sectionTitle, { color: colors.text, marginBottom: Spacing.md }]}>
            Quick Actions
          </ThemedText>
          <TouchableOpacity
            style={[
              styles.actionCard,
              { backgroundColor: colors.card },
              createShadow(2, '#000', 0.1),
            ]}
            onPress={() => router.push('/profile-settings')}
            activeOpacity={0.7}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Profile Settings"
          >
            <Ionicons name="settings-outline" size={24} color={colors.primary} />
            <ThemedText type="body" style={styles.actionText}>
              Profile Settings
            </ThemedText>
            <Ionicons name="chevron-forward" size={20} color={colors.icon} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionCard,
              { backgroundColor: colors.card },
              createShadow(2, '#000', 0.1),
            ]}
            onPress={() => router.push('/accessibility-settings')}
            activeOpacity={0.7}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Accessibility Settings"
          >
            <MaterialIcons name="accessibility-new" size={24} color={colors.primary} />
            <ThemedText type="body" style={styles.actionText}>
              Accessibility
            </ThemedText>
            <Ionicons name="chevron-forward" size={20} color={colors.icon} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionCard,
              { backgroundColor: colors.card },
              createShadow(2, '#000', 0.1),
            ]}
            onPress={() => router.push('/check-in')}
            activeOpacity={0.7}
          >
            <Ionicons name="calendar-outline" size={24} color={colors.primary} />
            <ThemedText type="body" style={styles.actionText}>
              Daily Check-In
            </ThemedText>
            <Ionicons name="chevron-forward" size={20} color={colors.icon} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionCard,
              { backgroundColor: colors.card },
              createShadow(2, '#000', 0.1),
            ]}
            onPress={() => router.push('/book-counsellor')}
            activeOpacity={0.7}
          >
            <Ionicons name="medical-outline" size={24} color={colors.primary} />
            <ThemedText type="body" style={styles.actionText}>
              Book a Counsellor
            </ThemedText>
            <Ionicons name="chevron-forward" size={20} color={colors.icon} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionCard,
              { backgroundColor: colors.card },
              createShadow(2, '#000', 0.1),
            ]}
            onPress={() => router.push('/mentorship')}
            activeOpacity={0.7}
          >
            <Ionicons name="people-outline" size={24} color={colors.primary} />
            <ThemedText type="body" style={styles.actionText}>
              Peer Mentorship
            </ThemedText>
            <Ionicons name="chevron-forward" size={20} color={colors.icon} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionCard,
              { backgroundColor: colors.card },
              createShadow(2, '#000', 0.1),
            ]}
            onPress={() => router.push('/academic-help')}
            activeOpacity={0.7}
          >
            <Ionicons name="library-outline" size={24} color={colors.primary} />
            <ThemedText type="body" style={styles.actionText}>
              Academic Help Spaces
            </ThemedText>
            <Ionicons name="chevron-forward" size={20} color={colors.icon} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionCard,
              { backgroundColor: colors.card },
              createShadow(2, '#000', 0.1),
            ]}
            onPress={() => router.push('/volunteer/dashboard')}
            activeOpacity={0.7}
          >
            <Ionicons name="heart-outline" size={24} color={colors.primary} />
            <ThemedText type="body" style={styles.actionText}>
              Volunteer Dashboard
            </ThemedText>
            <Ionicons name="chevron-forward" size={20} color={colors.icon} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionCard,
              { backgroundColor: colors.card },
              createShadow(2, '#000', 0.1),
            ]}
            onPress={() => router.push('/badges')}
            activeOpacity={0.7}
          >
            <Ionicons name="trophy-outline" size={24} color={colors.primary} />
            <ThemedText type="body" style={styles.actionText}>
              My Badges
            </ThemedText>
            <Ionicons name="chevron-forward" size={20} color={colors.icon} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionCard,
              { backgroundColor: colors.card },
              createShadow(2, '#000', 0.1),
            ]}
            onPress={() => router.push('/leaderboard')}
            activeOpacity={0.7}
          >
            <Ionicons name="podium-outline" size={24} color={colors.primary} />
            <ThemedText type="body" style={styles.actionText}>
              Leaderboard
            </ThemedText>
            <Ionicons name="chevron-forward" size={20} color={colors.icon} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionCard,
              { backgroundColor: colors.card },
              createShadow(2, '#000', 0.1),
            ]}
            onPress={() => router.push('/rewards')}
            activeOpacity={0.7}
          >
            <Ionicons name="gift-outline" size={24} color={colors.primary} />
            <ThemedText type="body" style={styles.actionText}>
              Rewards
            </ThemedText>
            <Ionicons name="chevron-forward" size={20} color={colors.icon} />
          </TouchableOpacity>

          {/* Peer Educator Club - Show for all users */}
          <TouchableOpacity
            style={[
              styles.actionCard,
              { backgroundColor: colors.card },
              createShadow(2, '#000', 0.1),
            ]}
            onPress={() => {
              if (user?.role === 'peer-educator' || user?.role === 'peer-educator-executive' || user?.role === 'admin') {
                router.push('/peer-educator/club-info');
              } else {
                router.push('/join-peer-educator');
              }
            }}
            activeOpacity={0.7}
          >
            <Ionicons 
              name={user?.role === 'peer-educator' || user?.role === 'peer-educator-executive' || user?.role === 'admin' 
                ? "people" 
                : "people-outline"} 
              size={24} 
              color={colors.primary} 
            />
            <ThemedText type="body" style={styles.actionText}>
              {user?.role === 'peer-educator' || user?.role === 'peer-educator-executive' || user?.role === 'admin'
                ? 'Peer Educator Club'
                : 'Join Peer Educator Club'}
            </ThemedText>
            <Ionicons name="chevron-forward" size={20} color={colors.icon} />
          </TouchableOpacity>

          {user?.role === 'admin' && (
            <TouchableOpacity
              style={[
                styles.actionCard,
                { backgroundColor: colors.card },
                createShadow(2, '#000', 0.1),
              ]}
              onPress={() => router.push('/admin/dashboard')}
              activeOpacity={0.7}
            >
              <Ionicons name="shield-checkmark-outline" size={24} color={colors.primary} />
              <ThemedText type="body" style={styles.actionText}>
                Admin Dashboard
              </ThemedText>
              <Ionicons name="chevron-forward" size={20} color={colors.icon} />
            </TouchableOpacity>
          )}
        </View>

        {/* About Section */}
        <View style={[styles.aboutSection, { backgroundColor: colors.card }, createShadow(2, '#000', 0.1)]}>
          <ThemedText type="h3" style={[styles.sectionTitle, { color: colors.text }]}>
            About Lunavo
          </ThemedText>
          <ThemedText type="body" style={[styles.aboutText, { color: colors.text }]}>
            Lunavo is a safe, anonymous peer support and early intervention platform for Chinhoyi University of Technology (CUT) students. Share your
            concerns, seek guidance, and support others without fear of judgment.
          </ThemedText>
        </View>
      </ScrollView>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeAreaTop: {
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
    paddingBottom: Spacing.xxl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: Spacing.xl + Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.lg,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  userName: {
    marginBottom: Spacing.xs,
    fontWeight: '700',
    fontSize: 24,
  },
  userRole: {
    opacity: 0.7,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  actionsSection: {
    marginBottom: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    gap: Spacing.sm,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md + Spacing.xs,
    borderRadius: BorderRadius.lg,
    gap: Spacing.md,
    marginBottom: Spacing.xs,
  },
  actionText: {
    flex: 1,
    fontWeight: '500',
  },
  aboutSection: {
    marginTop: Spacing.md,
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
    fontWeight: '700',
    fontSize: 18,
  },
  aboutText: {
    opacity: 0.8,
    lineHeight: 24,
    fontSize: 15,
  },
  pointsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.md,
    borderWidth: 1,
  },
  streaksSection: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.lg,
  },
  streaksContainer: {
    gap: Spacing.md,
  },
  streakCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.xs,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  badgesSection: {
    marginBottom: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  badgeItem: {
    width: 80,
    alignItems: 'center',
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  activitySection: {
    marginBottom: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md + Spacing.xs,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
  },
  activityContent: {
    flex: 1,
    marginLeft: Spacing.md,
  },
});
