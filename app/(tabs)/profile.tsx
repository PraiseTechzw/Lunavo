/**
 * Profile Tab - Navigates to Profile Settings
 */

import { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ThemedView } from '@/app/components/themed-view';
import { ThemedText } from '@/app/components/themed-text';
import { getPseudonym } from '@/app/utils/storage';
import { useColorScheme } from '@/app/hooks/use-color-scheme';
import { Colors, Spacing, BorderRadius } from '@/app/constants/theme';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { getCursorStyle, createShadow } from '@/app/utils/platform-styles';
import { getUserBadges, getCurrentUser, getPosts, getReplies } from '@/lib/database';
import { getStreakInfo } from '@/lib/gamification';
import { getUserPoints } from '@/lib/points-system';
import { StreakDisplay } from '@/app/components/streak-display';
import { formatDistanceToNow } from 'date-fns';

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
    checkInStreak: 0,
    helpingStreak: 0,
    engagementStreak: 0,
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await getCurrentUser();
      if (!currentUser) return;

      setUser(currentUser);
      const savedPseudonym = await getPseudonym();
      if (savedPseudonym) {
        setUserName(savedPseudonym.split(/(?=[A-Z])/)[0] || 'Student');
      } else {
        setUserName(currentUser.pseudonym || 'Student');
      }

      // Load badges
      const userBadges = await getUserBadges(currentUser.id);
      setBadges(userBadges.slice(0, 6)); // Show first 6 badges
      setBadgeCount(userBadges.length);

      // Load stats
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
        checkInStreak: checkInStreak.current,
        helpingStreak: helpingStreak.current,
        engagementStreak: engagementStreak.current,
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
    } catch (error) {
      console.error('Error loading profile data:', error);
    }
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safeAreaTop}>
      <ThemedView style={styles.container}>
        <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={[styles.avatar, { backgroundColor: '#FFA500' }]}>
            <ThemedText type="h2" style={{ color: '#FFFFFF' }}>
              {userName[0]?.toUpperCase() || 'A'}
            </ThemedText>
          </View>
          <ThemedText type="h2" style={styles.userName}>
            {userName}
          </ThemedText>
          <ThemedText type="caption" style={styles.userRole}>
            {user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1).replace('-', ' ') : 'Student'} at Chinhoyi University of Technology
          </ThemedText>
          
          {/* Points Balance */}
          <View style={[styles.pointsCard, { backgroundColor: colors.primary + '10' }]}>
            <MaterialIcons name="stars" size={20} color={colors.primary} />
            <ThemedText type="body" style={{ color: colors.primary, fontWeight: '700', marginLeft: Spacing.xs }}>
              {stats.points} Points
            </ThemedText>
          </View>
        </View>

        {/* Streaks */}
        {(stats.checkInStreak > 0 || stats.helpingStreak > 0 || stats.engagementStreak > 0) && (
          <View style={styles.streaksSection}>
            {stats.checkInStreak > 0 && (
              <StreakDisplay streakCount={stats.checkInStreak} streakType="Check-in" />
            )}
            {stats.helpingStreak > 0 && (
              <StreakDisplay streakCount={stats.helpingStreak} streakType="Helping" />
            )}
            {stats.engagementStreak > 0 && (
              <StreakDisplay streakCount={stats.engagementStreak} streakType="Engagement" />
            )}
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
            <MaterialIcons name="reply" size={24} color={colors.accent} />
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
          <View style={styles.badgesSection}>
            <View style={styles.sectionHeader}>
              <ThemedText type="h3" style={styles.sectionTitle}>
                My Badges
              </ThemedText>
              <TouchableOpacity onPress={() => router.push('/badges')}>
                <ThemedText type="body" style={{ color: colors.primary }}>
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
          <View style={styles.activitySection}>
            <ThemedText type="h3" style={styles.sectionTitle}>
              Recent Activity
            </ThemedText>
            {recentActivity.map((activity) => (
              <View
                key={`${activity.type}-${activity.id}`}
                style={[styles.activityItem, { backgroundColor: colors.card }, createShadow(1, '#000', 0.05)]}
              >
                <MaterialIcons
                  name={activity.type === 'post' ? 'forum' : 'reply'}
                  size={20}
                  color={activity.type === 'post' ? colors.primary : colors.accent}
                />
                <View style={styles.activityContent}>
                  <ThemedText type="body" style={{ color: colors.text, fontWeight: '500' }}>
                    {activity.title}
                  </ThemedText>
                  <ThemedText type="small" style={{ color: colors.icon, marginTop: Spacing.xs }}>
                    {formatDistanceToNow(new Date(activity.date), { addSuffix: true })}
                  </ThemedText>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.actionsSection}>
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
        <View style={styles.aboutSection}>
          <ThemedText type="h3" style={styles.sectionTitle}>
            About Lunavo
          </ThemedText>
          <ThemedText type="body" style={styles.aboutText}>
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
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  userName: {
    marginBottom: Spacing.xs,
    fontWeight: '700',
  },
  userRole: {
    opacity: 0.7,
  },
  actionsSection: {
    marginBottom: Spacing.xl,
    gap: Spacing.md,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.md,
  },
  actionText: {
    flex: 1,
    fontWeight: '500',
  },
  aboutSection: {
    marginTop: Spacing.md,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
    fontWeight: '600',
  },
  aboutText: {
    opacity: 0.8,
    lineHeight: 22,
  },
  pointsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.md,
  },
  streaksSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
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
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  badgesSection: {
    marginBottom: Spacing.lg,
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
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  activityContent: {
    flex: 1,
    marginLeft: Spacing.md,
  },
});
