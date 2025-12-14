/**
 * Peer Educator Profile - Expertise, stats, badges, availability
 */

import { ThemedText } from '@/app/components/themed-text';
import { ThemedView } from '@/app/components/themed-view';
import { CATEGORIES } from '@/app/constants/categories';
import { BorderRadius, Colors, Spacing } from '@/app/constants/theme';
import { useColorScheme } from '@/app/hooks/use-color-scheme';
import { PostCategory } from '@/app/types';
import { createShadow, getCursorStyle } from '@/app/utils/platform-styles';
import { useRoleGuard } from '@/hooks/use-auth-guard';
import { getCurrentUser, getPosts, getReplies, getUser } from '@/lib/database';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Switch,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function PeerEducatorProfileScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  
  const { user, loading: authLoading } = useRoleGuard(
    ['peer-educator', 'peer-educator-executive', 'admin'],
    '/(tabs)'
  );
  
  const [stats, setStats] = useState({
    totalResponses: 0,
    helpfulResponses: 0,
    activeThreads: 0,
    responseRate: 0,
  });
  const [expertiseAreas, setExpertiseAreas] = useState<PostCategory[]>([]);
  const [badges, setBadges] = useState<any[]>([]);
  const [isAvailable, setIsAvailable] = useState(true);

  useEffect(() => {
    if (user) {
      loadProfileData();
    }
  }, [user]);

  const loadProfileData = async () => {
    try {
      const [allPosts, allReplies] = await Promise.all([
        getPosts(),
        getPosts().then(async (posts) => {
          const replies = await Promise.all(posts.map((p) => getReplies(p.id)));
          return replies.flat();
        }),
      ]);

      // Get my responses
      const myReplies = allReplies.filter((r) => r.authorId === user?.id);
      const helpfulCount = myReplies.filter((r) => r.isHelpful > 0).length;
      const activeThreads = new Set(myReplies.map((r) => r.postId)).size;

      // Calculate response rate (responses per week)
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const recentResponses = myReplies.filter(
        (r) => new Date(r.createdAt) >= oneWeekAgo
      ).length;

      setStats({
        totalResponses: myReplies.length,
        helpfulResponses: helpfulCount,
        activeThreads,
        responseRate: recentResponses,
      });

      // Get expertise areas from profile data
      const userData = await getUser(user.id);
      const expertise = userData?.profile_data?.expertiseAreas || [];
      setExpertiseAreas(expertise);

      // Get availability status
      setIsAvailable(userData?.profile_data?.isAvailable !== false);

      // TODO: Load badges from database
      setBadges([]);
    } catch (error) {
      console.error('Error loading profile data:', error);
    }
  };

  const handleToggleAvailability = async (value: boolean) => {
    setIsAvailable(value);
    // TODO: Update availability in database
    try {
      const currentUser = await getCurrentUser();
      if (currentUser) {
        // Update profile_data with availability
        // This would require an updateUser function
      }
    } catch (error) {
      console.error('Error updating availability:', error);
    }
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
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={[styles.header, { backgroundColor: colors.background }]}>
            <TouchableOpacity onPress={() => router.back()} style={getCursorStyle()}>
              <MaterialIcons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <ThemedText type="h2" style={styles.headerTitle}>
              My Profile
            </ThemedText>
            <View style={{ width: 24 }} />
          </View>

          {/* Profile Info */}
          <View style={[styles.section, { backgroundColor: colors.card }, createShadow(2, '#000', 0.1)]}>
            <View style={styles.profileHeader}>
              <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
                <MaterialIcons name="person" size={48} color="#FFFFFF" />
              </View>
              <View style={styles.profileInfo}>
                <ThemedText type="h2" style={styles.pseudonym}>
                  {user?.pseudonym || 'Peer Educator'}
                </ThemedText>
                <ThemedText type="body" style={{ color: colors.icon }}>
                  {user?.role === 'peer-educator-executive' ? 'Peer Educator Executive' : 'Peer Educator'}
                </ThemedText>
              </View>
            </View>

            {/* Availability Toggle */}
            <View style={styles.availabilityContainer}>
              <View style={styles.availabilityInfo}>
                <MaterialIcons
                  name={isAvailable ? 'check-circle' : 'cancel'}
                  size={24}
                  color={isAvailable ? colors.success : colors.icon}
                />
                <View style={styles.availabilityText}>
                  <ThemedText type="body" style={{ fontWeight: '600', color: colors.text }}>
                    {isAvailable ? 'Available' : 'Unavailable'}
                  </ThemedText>
                  <ThemedText type="small" style={{ color: colors.icon }}>
                    {isAvailable ? 'Ready to help students' : 'Currently unavailable'}
                  </ThemedText>
                </View>
              </View>
              <Switch
                value={isAvailable}
                onValueChange={handleToggleAvailability}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>

          {/* Statistics */}
          <View style={[styles.section, { backgroundColor: colors.card }, createShadow(2, '#000', 0.1)]}>
            <ThemedText type="h3" style={styles.sectionTitle}>
              Response Statistics
            </ThemedText>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <ThemedText type="h2" style={{ color: colors.primary }}>
                  {stats.totalResponses}
                </ThemedText>
                <ThemedText type="small" style={{ color: colors.icon }}>
                  Total Responses
                </ThemedText>
              </View>
              <View style={styles.statItem}>
                <ThemedText type="h2" style={{ color: colors.success }}>
                  {stats.helpfulResponses}
                </ThemedText>
                <ThemedText type="small" style={{ color: colors.icon }}>
                  Helpful Responses
                </ThemedText>
              </View>
              <View style={styles.statItem}>
                <ThemedText type="h2" style={{ color: colors.primary }}>
                  {stats.activeThreads}
                </ThemedText>
                <ThemedText type="small" style={{ color: colors.icon }}>
                  Active Threads
                </ThemedText>
              </View>
              <View style={styles.statItem}>
                <ThemedText type="h2" style={{ color: colors.primary }}>
                  {stats.responseRate}
                </ThemedText>
                <ThemedText type="small" style={{ color: colors.icon }}>
                  This Week
                </ThemedText>
              </View>
            </View>
          </View>

          {/* Expertise Areas */}
          <View style={[styles.section, { backgroundColor: colors.card }, createShadow(2, '#000', 0.1)]}>
            <ThemedText type="h3" style={styles.sectionTitle}>
              Expertise Areas
            </ThemedText>
            {expertiseAreas.length === 0 ? (
              <ThemedText type="body" style={{ color: colors.icon, fontStyle: 'italic' }}>
                No expertise areas set. Contact an administrator to add your expertise areas.
              </ThemedText>
            ) : (
              <View style={styles.expertiseGrid}>
                {expertiseAreas.map((category) => {
                  const categoryInfo = CATEGORIES[category as PostCategory];
                  return (
                    <View
                      key={category}
                      style={[
                        styles.expertiseChip,
                        { backgroundColor: (categoryInfo?.color || colors.primary) + '20' },
                      ]}
                    >
                      <ThemedText
                        type="small"
                        style={{ color: categoryInfo?.color || colors.primary, fontWeight: '600' }}
                      >
                        {categoryInfo?.name || category}
                      </ThemedText>
                    </View>
                  );
                })}
              </View>
            )}
          </View>

          {/* Badges */}
          <View style={[styles.section, { backgroundColor: colors.card }, createShadow(2, '#000', 0.1)]}>
            <ThemedText type="h3" style={styles.sectionTitle}>
              Badges Earned
            </ThemedText>
            {badges.length === 0 ? (
              <ThemedText type="body" style={{ color: colors.icon, fontStyle: 'italic' }}>
                No badges earned yet. Keep helping students to earn badges!
              </ThemedText>
            ) : (
              <View style={styles.badgesGrid}>
                {badges.map((badge) => (
                  <View key={badge.id} style={styles.badgeItem}>
                    <MaterialIcons name={badge.icon} size={32} color={badge.color} />
                    <ThemedText type="small" style={{ color: colors.text, marginTop: Spacing.xs }}>
                      {badge.name}
                    </ThemedText>
                  </View>
                ))}
              </View>
            )}
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
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  profileInfo: {
    flex: 1,
  },
  pseudonym: {
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  availabilityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  availabilityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  availabilityText: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  sectionTitle: {
    fontWeight: '700',
    marginBottom: Spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  statItem: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: '#F5F5F5',
    borderRadius: BorderRadius.md,
  },
  expertiseGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  expertiseChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  badgeItem: {
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: '#F5F5F5',
    borderRadius: BorderRadius.md,
    minWidth: 80,
  },
});


