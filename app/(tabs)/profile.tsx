/**
 * Profile Tab - Premium Version
 */

import { ThemedText } from '@/app/components/themed-text';
import { ThemedView } from '@/app/components/themed-view';
import { BorderRadius, Colors, PlatformStyles, Spacing } from '@/app/constants/theme';
import { useColorScheme } from '@/app/hooks/use-color-scheme';
import { getPseudonym } from '@/app/utils/storage';
import { getCurrentUser, getPosts, getUserBadges } from '@/lib/database';
import { getStreakInfo } from '@/lib/gamification';
import { getPointsHistory, getUserPoints, POINTS_CONFIG } from '@/lib/points-system';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeInRight } from 'react-native-reanimated';
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
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [pointsHistory, setPointsHistory] = useState<any[]>([]);
  const [level, setLevel] = useState(1);
  const [nextLevelPoints, setNextLevelPoints] = useState(100);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await getCurrentUser();
      if (!currentUser) return;
      setUser(currentUser);

      const savedPseudonym = await getPseudonym();
      setUserName(savedPseudonym ? savedPseudonym.split(/(?=[A-Z])/)[0] : currentUser.pseudonym || 'Student');

      if (currentUser.id) {
        const [userBadges, allPosts, points, checkIn, history] = await Promise.all([
          getUserBadges(currentUser.id),
          getPosts(),
          getUserPoints(currentUser.id),
          getStreakInfo(currentUser.id, 'check-in'),
          getPointsHistory(currentUser.id, 10),
        ]);

        // Calculate level (100 points per level)
        const calculatedLevel = Math.floor(points / 100) + 1;
        const pointsInCurrentLevel = points % 100;
        setLevel(calculatedLevel);
        setNextLevelPoints(100 - pointsInCurrentLevel);
        setPointsHistory(history);

        setBadges(userBadges.slice(0, 4));
        setBadgeCount(userBadges.length);

        const myPosts = allPosts.filter(p => p.authorId === currentUser.id);

        setStats({
          posts: myPosts.length,
          replies: 0, // Placeholder
          helpfulVotes: 0, // Placeholder
          points,
          checkInStreak: { current: checkIn.current, longest: checkIn.longest },
        });

        const activity = myPosts.slice(0, 3).map(post => ({
          type: 'post',
          id: post.id,
          title: post.title,
          date: post.createdAt,
        }));
        setRecentActivity(activity);
      }
    } catch (error) {
      console.error('Error loading profile data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ThemedView style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Hero Profile Section */}
          <Animated.View entering={FadeIn.duration(800)}>
            <LinearGradient
              colors={colors.gradients.primary as any}
              style={styles.profileHero}
            >
              <View style={styles.avatarCircle}>
                <ThemedText style={styles.avatarText}>{userName[0]?.toUpperCase()}</ThemedText>
              </View>
              <ThemedText type="h1" style={styles.heroName}>{user?.fullName || userName}</ThemedText>
              <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: Spacing.xl }}>
                <View style={[styles.roleBadge, { marginBottom: 0 }]}>
                  <ThemedText style={styles.roleText}>
                    {user?.role?.replace('-', ' ') || 'Student'}
                  </ThemedText>
                </View>
                {user?.studentNumber && (
                  <View style={[styles.roleBadge, { backgroundColor: 'rgba(0,0,0,0.2)', marginBottom: 0 }]}>
                    <ThemedText style={styles.roleText}>{user.studentNumber}</ThemedText>
                  </View>
                )}
              </View>

              <View style={styles.heroStatsRow}>
                <View style={styles.heroStatItem}>
                  <ThemedText style={styles.heroStatValue}>{stats.points}</ThemedText>
                  <ThemedText style={styles.heroStatLabel}>Points</ThemedText>
                </View>
                <View style={styles.heroStatDivider} />
                <View style={styles.heroStatItem}>
                  <ThemedText style={styles.heroStatValue}>{stats.checkInStreak.current}</ThemedText>
                  <ThemedText style={styles.heroStatLabel}>Streak</ThemedText>
                </View>
                <View style={styles.heroStatDivider} />
                <View style={styles.heroStatItem}>
                  <ThemedText style={styles.heroStatValue}>{badgeCount}</ThemedText>
                  <ThemedText style={styles.heroStatLabel}>Badges</ThemedText>
                </View>
              </View>

              <View style={styles.completionContainer}>
                <View style={styles.completionHeader}>
                  <ThemedText style={styles.completionLabel}>Profile Completion</ThemedText>
                  <ThemedText style={styles.completionValue}>{calculateCompletion()}%</ThemedText>
                </View>
                <View style={[styles.completionBar, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                  <View style={[styles.completionFill, { width: `${calculateCompletion()}%`, backgroundColor: '#FFF' }]} />
                </View>
              </View>
            </LinearGradient>
          </Animated.View>

          {/* Bio Section */}
          <Animated.View entering={FadeInDown.delay(100)} style={styles.section}>
            <View style={[styles.bioCard, { backgroundColor: colors.card }]}>
              <View style={styles.bioHeader}>
                <ThemedText type="h3">About Me</ThemedText>
                <TouchableOpacity onPress={() => router.push('/profile-settings')}>
                  <Ionicons name="create-outline" size={20} color={colors.primary} />
                </TouchableOpacity>
              </View>
              <ThemedText style={styles.bioText}>
                {user?.bio || "No bio added yet. Tell the community a bit about yourself to build connections."}
              </ThemedText>
              {user?.specialization && (
                <View style={styles.specializationBadge}>
                  <MaterialIcons name="verified" size={16} color={colors.primary} />
                  <ThemedText style={styles.specializationText}>{user.specialization}</ThemedText>
                </View>
              )}
            </View>
          </Animated.View>

          {/* Quick Stats Grid */}
          <View style={styles.section}>
            <ThemedText type="h2" style={styles.sectionTitle}>Identity & Academic</ThemedText>
            <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
              {renderInfoRow('Degree', user?.program || 'Not set', 'school-outline')}
              <View style={styles.infoDivider} />
              {renderInfoRow('Academic', user?.academicYear ? `Year ${user.academicYear}, Sem ${user.academicSemester}` : 'Not set', 'calendar-outline')}
              <View style={styles.infoDivider} />
              {renderInfoRow('Location', user?.location || 'Not specified', 'location-outline')}
              <View style={styles.infoDivider} />
              {renderInfoRow('Contact', user?.phone || user?.email || 'N/A', 'call-outline')}
              {user?.preferredContactMethod && (
                <>
                  <View style={styles.infoDivider} />
                  {renderInfoRow('Preference', user.preferredContactMethod, 'chatbox-ellipses-outline')}
                </>
              )}
            </View>

            {user?.interests && user.interests.length > 0 && (
              <View style={{ marginTop: 24 }}>
                <ThemedText type="h3" style={{ marginBottom: 12 }}>Interests</ThemedText>
                <View style={styles.interestsGrid}>
                  {user.interests.map((interest: string, i: number) => (
                    <View key={i} style={[styles.interestTag, { backgroundColor: colors.primary + '15' }]}>
                      <ThemedText style={[styles.interestText, { color: colors.primary }]}>{interest}</ThemedText>
                    </View>
                  ))}
                </View>
              </View>
            )}

            <View style={[styles.statsGrid, { marginTop: 24 }]}>
              <Animated.View entering={FadeInDown.delay(200)} style={styles.statCardWrapper}>
                <View style={[styles.statCard, { backgroundColor: colors.card }]}>
                  <Ionicons name="documents-outline" size={24} color={colors.primary} />
                  <ThemedText type="h3">{stats.posts}</ThemedText>
                  <ThemedText style={styles.statLabel}>Stories Shared</ThemedText>
                </View>
              </Animated.View>
              <Animated.View entering={FadeInDown.delay(300)} style={styles.statCardWrapper}>
                <View style={[styles.statCard, { backgroundColor: colors.card }]}>
                  <Ionicons name="heart-outline" size={24} color={colors.secondary} />
                  <ThemedText type="h3">{stats.helpfulVotes}</ThemedText>
                  <ThemedText style={styles.statLabel}>Lives Touched</ThemedText>
                </View>
              </Animated.View>
            </View>
          </View>

          {/* Badges Section */}
          {badgeCount > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <ThemedText type="h2">Achievements</ThemedText>
                <TouchableOpacity onPress={() => router.push('/badges')}>
                  <ThemedText style={{ color: colors.primary, fontWeight: '700' }}>View All</ThemedText>
                </TouchableOpacity>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.badgeScroll}>
                {badges.map((badge, idx) => (
                  <Animated.View key={badge.id} entering={FadeInRight.delay(400 + idx * 100)} style={[styles.badgeItem, { backgroundColor: colors.card }]}>
                    <MaterialIcons name={badge.icon || 'stars'} size={32} color={badge.color || colors.primary} />
                    <ThemedText style={styles.badgeName} numberOfLines={1}>{badge.name}</ThemedText>
                  </Animated.View>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Points Breakdown */}
          <View style={styles.section}>
            <ThemedText type="h2" style={styles.sectionTitle}>Points Breakdown</ThemedText>
            <View style={[styles.levelCard, { backgroundColor: colors.card }]}>
              <View style={styles.levelHeader}>
                <View>
                  <ThemedText type="h3">Level {level}</ThemedText>
                  <ThemedText style={styles.levelSubtext}>{nextLevelPoints} points to Level {level + 1}</ThemedText>
                </View>
                <View style={[styles.levelBadge, { backgroundColor: colors.primary + '20' }]}>
                  <MaterialIcons name="emoji-events" size={24} color={colors.primary} />
                </View>
              </View>
              <View style={styles.progressBarContainer}>
                <View style={[styles.progressBarFill, { width: `${((100 - nextLevelPoints) / 100) * 100}%`, backgroundColor: colors.primary }]} />
              </View>
            </View>

            <View style={styles.pointsGrid}>
              <View style={[styles.pointsCard, { backgroundColor: colors.card }]}>
                <Ionicons name="calendar-outline" size={20} color="#10B981" />
                <ThemedText style={styles.pointsValue}>+{POINTS_CONFIG.checkIn}</ThemedText>
                <ThemedText style={styles.pointsLabel}>Check-in</ThemedText>
              </View>
              <View style={[styles.pointsCard, { backgroundColor: colors.card }]}>
                <Ionicons name="heart-outline" size={20} color="#EF4444" />
                <ThemedText style={styles.pointsValue}>+{POINTS_CONFIG.helpfulResponse}</ThemedText>
                <ThemedText style={styles.pointsLabel}>Helpful</ThemedText>
              </View>
              <View style={[styles.pointsCard, { backgroundColor: colors.card }]}>
                <Ionicons name="chatbubble-outline" size={20} color="#3B82F6" />
                <ThemedText style={styles.pointsValue}>+{POINTS_CONFIG.replyGiven}</ThemedText>
                <ThemedText style={styles.pointsLabel}>Reply</ThemedText>
              </View>
              <View style={[styles.pointsCard, { backgroundColor: colors.card }]}>
                <Ionicons name="trophy-outline" size={20} color="#F59E0B" />
                <ThemedText style={styles.pointsValue}>+{POINTS_CONFIG.badgeEarned}</ThemedText>
                <ThemedText style={styles.pointsLabel}>Badge</ThemedText>
              </View>
            </View>
          </View>

          {/* Recent Points History */}
          {pointsHistory.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <ThemedText type="h2">Recent Points</ThemedText>
                <TouchableOpacity onPress={() => router.push('/rewards')}>
                  <ThemedText style={{ color: colors.primary, fontWeight: '700' }}>View All</ThemedText>
                </TouchableOpacity>
              </View>
              {pointsHistory.slice(0, 5).map((transaction, idx) => (
                <Animated.View key={transaction.id} entering={FadeInDown.delay(400 + idx * 50)}>
                  <View style={[styles.pointsHistoryItem, { backgroundColor: colors.card }]}>
                    <View style={[styles.pointsHistoryIcon, { backgroundColor: transaction.type === 'earned' ? colors.success + '20' : colors.danger + '20' }]}>
                      <Ionicons
                        name={transaction.type === 'earned' ? 'arrow-up' : 'arrow-down'}
                        size={16}
                        color={transaction.type === 'earned' ? colors.success : colors.danger}
                      />
                    </View>
                    <View style={styles.pointsHistoryContent}>
                      <ThemedText style={styles.pointsHistoryDesc}>{transaction.description}</ThemedText>
                      <ThemedText style={styles.pointsHistoryDate}>
                        {formatDistanceToNow(new Date(transaction.createdAt), { addSuffix: true })}
                      </ThemedText>
                    </View>
                    <ThemedText style={[styles.pointsHistoryAmount, { color: transaction.type === 'earned' ? colors.success : colors.danger }]}>
                      {transaction.type === 'earned' ? '+' : '-'}{transaction.amount}
                    </ThemedText>
                  </View>
                </Animated.View>
              ))}
            </View>
          )}

          {/* Activity Section */}
          {recentActivity.length > 0 && (
            <View style={styles.section}>
              <ThemedText type="h2" style={styles.sectionTitle}>Recent Activity</ThemedText>
              {recentActivity.map((act, idx) => (
                <Animated.View key={act.id} entering={FadeInDown.delay(600 + idx * 100)}>
                  <TouchableOpacity
                    style={[styles.activityItem, { backgroundColor: colors.card }]}
                    onPress={() => act.type === 'post' && router.push(`/post/${act.id}` as any)}
                  >
                    <View style={[styles.actIcon, { backgroundColor: colors.primary + '20' }]}>
                      <Ionicons name="rocket-outline" size={20} color={colors.primary} />
                    </View>
                    <View style={styles.actContent}>
                      <ThemedText style={styles.actTitle}>{act.title}</ThemedText>
                      <ThemedText style={styles.actDate}>
                        {formatDistanceToNow(new Date(act.date), { addSuffix: true })}
                      </ThemedText>
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </View>
          )}

          {/* Quick Access Menu */}
          <View style={styles.section}>
            <ThemedText type="h2" style={styles.sectionTitle}>Settings & Help</ThemedText>
            <TouchableOpacity style={[styles.menuItem, { backgroundColor: colors.card }]} onPress={() => router.push('/profile-settings')}>
              <Ionicons name="settings-outline" size={22} color={colors.primary} />
              <ThemedText style={styles.menuText}>Account Settings</ThemedText>
              <Ionicons name="chevron-forward" size={18} color={colors.icon} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.menuItem, { backgroundColor: colors.card }]} onPress={() => router.push('/accessibility-settings')}>
              <Ionicons name="accessibility-outline" size={22} color={colors.primary} />
              <ThemedText style={styles.menuText}>Accessibility</ThemedText>
              <Ionicons name="chevron-forward" size={18} color={colors.icon} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.menuItem, { backgroundColor: colors.card }]} onPress={() => router.push('/help')}>
              <Ionicons name="help-buoy-outline" size={22} color={colors.primary} />
              <ThemedText style={styles.menuText}>Support Center</ThemedText>
              <Ionicons name="chevron-forward" size={18} color={colors.icon} />
            </TouchableOpacity>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </ThemedView>
    </SafeAreaView>
  );

  function renderInfoRow(label: string, value: string, icon: any) {
    return (
      <View style={styles.infoRow}>
        <View style={[styles.infoIcon, { backgroundColor: colors.primary + '10' }]}>
          <Ionicons name={icon} size={20} color={colors.primary} />
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <ThemedText style={styles.infoLabel}>{label}</ThemedText>
          <ThemedText style={styles.infoValue}>{value}</ThemedText>
        </View>
      </View>
    );
  }

  function calculateCompletion() {
    if (!user) return 0;
    const fields = [
      user.fullName, user.phone, user.bio, user.program,
      user.academicYear, user.academicSemester, user.location,
      user.emergencyContactName, user.emergencyContactPhone,
      user.studentNumber, user.preferredContactMethod
    ];
    const filled = fields.filter(f => f && f !== '').length;
    return Math.round((filled / fields.length) * 100);
  }
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  profileHero: {
    padding: Spacing.xl,
    paddingTop: Spacing.xxl,
    borderBottomLeftRadius: BorderRadius.xxl,
    borderBottomRightRadius: BorderRadius.xxl,
    alignItems: 'center',
    ...PlatformStyles.premiumShadow,
  },
  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  avatarText: {
    color: '#FFF',
    fontSize: 40,
    fontWeight: '800',
  },
  heroName: {
    color: '#FFF',
    fontSize: 28,
    marginBottom: Spacing.xs,
  },
  roleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginBottom: Spacing.xl,
  },
  roleText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  heroStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'space-evenly',
  },
  heroStatItem: {
    alignItems: 'center',
  },
  heroStatValue: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '800',
  },
  heroStatLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
  },
  heroStatDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  completionContainer: {
    width: '100%',
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing.md,
  },
  completionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  completionLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    fontWeight: '600',
  },
  completionValue: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
  },
  completionBar: {
    height: 6,
    borderRadius: 3,
    width: '100%',
    overflow: 'hidden',
  },
  completionFill: {
    height: '100%',
    borderRadius: 3,
  },
  section: {
    padding: Spacing.lg,
    paddingTop: Spacing.xl,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    marginHorizontal: -Spacing.xs,
  },
  statCardWrapper: {
    flex: 1,
    padding: Spacing.xs,
  },
  statCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.xxl,
    alignItems: 'center',
    gap: Spacing.xs,
    ...PlatformStyles.shadow,
  },
  statLabel: {
    color: '#64748B',
    fontSize: 12,
    textAlign: 'center',
  },
  badgeScroll: {
    gap: Spacing.md,
  },
  badgeItem: {
    width: 100,
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    gap: Spacing.xs,
    ...PlatformStyles.shadow,
  },
  badgeName: {
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.sm,
    ...PlatformStyles.shadow,
  },
  actIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  actContent: {
    flex: 1,
  },
  actTitle: {
    fontWeight: '600',
    fontSize: 14,
  },
  actDate: {
    fontSize: 12,
    color: '#64748B',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.sm,
    ...PlatformStyles.shadow,
  },
  menuText: {
    flex: 1,
    marginLeft: Spacing.md,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    padding: Spacing.xl,
    marginTop: Spacing.lg,
  },
  footerTitle: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 2,
    color: '#CBD5E1',
    marginBottom: Spacing.xs,
  },
  footerText: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 18,
  },
  levelCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.md,
    ...PlatformStyles.shadow,
  },
  levelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  levelSubtext: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  levelBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  pointsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -Spacing.xs,
  },
  pointsCard: {
    width: '48%',
    margin: '1%',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    gap: Spacing.xs,
    ...PlatformStyles.shadow,
  },
  pointsValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  pointsLabel: {
    fontSize: 11,
    color: '#64748B',
  },
  pointsHistoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
    ...PlatformStyles.shadow,
  },
  pointsHistoryIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  pointsHistoryContent: {
    flex: 1,
  },
  pointsHistoryDesc: {
    fontSize: 13,
    fontWeight: '600',
  },
  pointsHistoryDate: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  pointsHistoryAmount: {
    fontSize: 16,
    fontWeight: '800',
  },
  bioCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.xxl,
    ...PlatformStyles.shadow,
  },
  bioHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  bioText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#64748B',
  },
  specializationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  specializationText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563EB',
  },
  infoCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.xxl,
    ...PlatformStyles.shadow,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 11,
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
  },
  infoDivider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.05)',
    marginHorizontal: 12,
  },
  interestsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  interestTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  interestText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
