/**
 * Home Dashboard Screen - Enhanced Premium Version
 */

import { DrawerHeader } from '@/app/components/navigation/drawer-header';
import { DrawerMenu } from '@/app/components/navigation/drawer-menu';
import { ThemedText } from '@/app/components/themed-text';
import { ThemedView } from '@/app/components/themed-view';
import { BorderRadius, Colors, PlatformStyles, Spacing } from '@/app/constants/theme';
import { useColorScheme } from '@/app/hooks/use-color-scheme';
import { UserRole } from '@/app/types';
import { createShadow } from '@/app/utils/platform-styles';
import {
  getCheckInStreak,
  getPosts,
  getPseudonym,
  hasCheckedInToday
} from '@/app/utils/storage';
import { getCurrentUser } from '@/lib/database';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  Dimensions,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native';
import Animated, {
  FadeInDown,
  FadeInRight
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

// Motivational quotes
const motivationalQuotes = [
  "You're stronger than you think. Keep going!",
  "Every small step forward is progress. Celebrate it!",
  "Your mental health matters. Take care of yourself.",
  "It's okay not to be okay. You're not alone.",
  "Tomorrow is a fresh start. You've got this!",
  "Self-care isn't selfish. It's essential.",
  "You're doing better than you think. Keep going!",
];

export default function HomeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const [userName, setUserName] = useState('Student');
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [checkInStreak, setCheckInStreak] = useState(0);
  const [hasCheckedIn, setHasCheckedIn] = useState(false);
  const [postCount, setPostCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [currentQuote] = useState(motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)]);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [user, setUser] = useState<any>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);

  useEffect(() => {
    loadUserData();
  }, [userRole]);

  const loadUserData = async () => {
    await Promise.all([
      loadUserInfo(),
      loadStats(),
    ]);
  };

  const loadUserInfo = async () => {
    try {
      const currentUser = await getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        setUserRole(currentUser.role as UserRole);
        const savedPseudonym = await getPseudonym();
        if (savedPseudonym) {
          setUserName(savedPseudonym.split(/(?=[A-Z])/)[0] || 'Student');
        } else {
          setUserName(currentUser.pseudonym || 'Student');
        }
      } else {
        const pseudonym = await getPseudonym();
        if (pseudonym) {
          setUserName(pseudonym.split(/(?=[A-Z])/)[0] || 'Student');
        }
      }
    } catch (error) {
      console.error('Error loading user info:', error);
      const pseudonym = await getPseudonym();
      if (pseudonym) {
        setUserName(pseudonym.split(/(?=[A-Z])/)[0] || 'Student');
      }
    }
  };

  const loadStats = async () => {
    const [streak, checkedIn, posts] = await Promise.all([
      getCheckInStreak(),
      hasCheckedInToday(),
      getPosts(),
    ]);
    setCheckInStreak(streak);
    setHasCheckedIn(checkedIn);
    setPostCount(posts.length);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadUserData();
    setRefreshing(false);
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const moods = [
    { id: 'happy', iconName: 'sentiment-very-satisfied', label: 'Happy', color: '#FBBF24' },
    { id: 'calm', iconName: 'sentiment-satisfied', label: 'Calm', color: colors.success },
    { id: 'okay', iconName: 'sentiment-neutral', label: 'Okay', color: colors.warning },
    { id: 'sad', iconName: 'sentiment-dissatisfied', label: 'Sad', color: colors.info },
    { id: 'anxious', iconName: 'sentiment-very-dissatisfied', label: 'Anxious', color: colors.secondary },
  ];

  return (
    <SafeAreaView edges={['top']} style={styles.safeAreaTop}>
      <ThemedView style={styles.container}>
        <DrawerHeader
          title={`${getGreeting()}, ${userName}`}
          onMenuPress={() => setDrawerVisible(true)}
          rightAction={{
            icon: 'notifications',
            onPress: () => router.push('/notifications'),
          }}
        />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
        >
          {/* Welcome Dashboard Card */}
          <Animated.View entering={FadeInDown.duration(800)}>
            <LinearGradient
              colors={colors.gradients.primary as any}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroCard}
            >
              <View style={styles.heroContent}>
                <ThemedText type="h1" style={styles.heroTitle}>Mission: Wellness</ThemedText>
                <ThemedText style={styles.heroSubtitle}>{currentQuote}</ThemedText>

                <View style={styles.statsRow}>
                  <View style={styles.heroStat}>
                    <ThemedText style={styles.statNumber}>{checkInStreak}</ThemedText>
                    <ThemedText style={styles.statLabel}>Day Streak</ThemedText>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.heroStat}>
                    <ThemedText style={styles.statNumber}>{postCount}</ThemedText>
                    <ThemedText style={styles.statLabel}>Peer Posts</ThemedText>
                  </View>
                </View>
              </View>
              <View style={styles.heroIconCircle}>
                <Ionicons name="sparkles" size={40} color="rgba(255,255,255,0.4)" />
              </View>
            </LinearGradient>
          </Animated.View>

          {/* Urgent Support Quick Access */}
          <Animated.View entering={FadeInDown.delay(200).duration(800)}>
            <TouchableOpacity
              style={[styles.glassCard, { backgroundColor: colors.danger + '10', borderColor: colors.danger + '30' }]}
              onPress={() => router.push('/urgent-support')}
              activeOpacity={0.8}
            >
              <View style={[styles.cardIconBox, { backgroundColor: colors.danger + '20' }]}>
                <MaterialIcons name="sos" size={28} color={colors.danger} />
              </View>
              <View style={styles.cardInfo}>
                <ThemedText type="h3" style={{ color: colors.danger }}>Crisis Support</ThemedText>
                <ThemedText type="small" style={{ color: colors.icon }}>Immediate help is available 24/7.</ThemedText>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.danger} />
            </TouchableOpacity>
          </Animated.View>

          {/* Mood Check-in Section */}
          <View style={styles.sectionHeader}>
            <ThemedText type="h2">How are you feeling?</ThemedText>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.moodScroll}
          >
            {moods.map((mood, index) => (
              <Animated.View key={mood.id} entering={FadeInRight.delay(400 + index * 100)}>
                <TouchableOpacity
                  style={[
                    styles.moodItem,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                    selectedMood === mood.id && { borderColor: mood.color, backgroundColor: mood.color + '10', borderWidth: 2 }
                  ]}
                  onPress={() => {
                    setSelectedMood(mood.id);
                    router.push('/check-in');
                  }}
                  activeOpacity={0.7}
                >
                  <MaterialIcons name={mood.iconName as any} size={32} color={mood.color} />
                  <ThemedText style={[styles.moodLabel, { color: mood.color }]}>{mood.label}</ThemedText>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </ScrollView>

          {/* Main Action Grid */}
          <View style={styles.gridContainer}>
            <Animated.View entering={FadeInDown.delay(600)} style={styles.gridItem}>
              <TouchableOpacity
                style={[styles.actionCard, { backgroundColor: colors.card }]}
                onPress={() => router.push('/(tabs)/forum')}
              >
                <LinearGradient
                  colors={['#818CF8', '#4F46E5']}
                  style={styles.actionIcon}
                >
                  <Ionicons name="people" size={24} color="#FFF" />
                </LinearGradient>
                <ThemedText type="h3">Forum</ThemedText>
                <ThemedText type="small" style={styles.actionDesc}>PEACE Community</ThemedText>
              </TouchableOpacity>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(700)} style={styles.gridItem}>
              <TouchableOpacity
                style={[styles.actionCard, { backgroundColor: colors.card }]}
                onPress={() => router.push('/(tabs)/chat')}
              >
                <LinearGradient
                  colors={['#F472B6', '#DB2777']}
                  style={styles.actionIcon}
                >
                  <Ionicons name="chatbubbles" size={24} color="#FFF" />
                </LinearGradient>
                <ThemedText type="h3">Chat</ThemedText>
                <ThemedText type="small" style={styles.actionDesc}>Anonymous Talk</ThemedText>
              </TouchableOpacity>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(800)} style={styles.gridItem}>
              <TouchableOpacity
                style={[styles.actionCard, { backgroundColor: colors.card }]}
                onPress={() => router.push('/(tabs)/resources')}
              >
                <LinearGradient
                  colors={['#34D399', '#059669']}
                  style={styles.actionIcon}
                >
                  <Ionicons name="library" size={24} color="#FFF" />
                </LinearGradient>
                <ThemedText type="h3">Vault</ThemedText>
                <ThemedText type="small" style={styles.actionDesc}>Wellness Library</ThemedText>
              </TouchableOpacity>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(900)} style={styles.gridItem}>
              <TouchableOpacity
                style={[styles.actionCard, { backgroundColor: colors.card }]}
                onPress={() => router.push('/book-counsellor')}
              >
                <LinearGradient
                  colors={['#FBBF24', '#D97706']}
                  style={styles.actionIcon}
                >
                  <Ionicons name="calendar" size={24} color="#FFF" />
                </LinearGradient>
                <ThemedText type="h3">Help</ThemedText>
                <ThemedText type="small" style={styles.actionDesc}>Seek Council</ThemedText>
              </TouchableOpacity>
            </Animated.View>
          </View>

          {/* Peer Educator Special Access */}
          {(userRole === 'peer-educator' || userRole === 'peer-educator-executive' || userRole === 'moderator') && (
            <Animated.View entering={FadeInDown.delay(1000)}>
              <TouchableOpacity
                style={[styles.mentorCard, { backgroundColor: colors.primary }]}
                onPress={() => router.push('/peer-educator/dashboard' as any)}
              >
                <View style={styles.mentorInfo}>
                  <ThemedText type="h3" style={{ color: '#FFF' }}>Educator Dashboard</ThemedText>
                  <ThemedText style={{ color: 'rgba(255,255,255,0.8)' }}>Manage support and responses</ThemedText>
                </View>
                <View style={styles.mentorBadge}>
                  <Ionicons name="shield-checkmark" size={24} color={colors.primary} />
                </View>
              </TouchableOpacity>
            </Animated.View>
          )}

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Global Action Button */}
        <Animated.View
          entering={FadeInDown.delay(1200)}
          style={[styles.fabContainer, createShadow(10, colors.primary, 0.4)]}
        >
          <TouchableOpacity
            style={[styles.fab, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/create-post')}
            activeOpacity={0.9}
          >
            <Ionicons name="add" size={28} color="#FFF" />
            <ThemedText style={styles.fabText}>Start Community Post</ThemedText>
          </TouchableOpacity>
        </Animated.View>

        <DrawerMenu
          visible={drawerVisible}
          onClose={() => setDrawerVisible(false)}
          role={userRole || undefined}
        />
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
    padding: Spacing.lg,
  },
  heroCard: {
    borderRadius: BorderRadius.xxl,
    padding: Spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xl,
    overflow: 'hidden',
  },
  heroContent: {
    flex: 1,
    zIndex: 2,
  },
  heroTitle: {
    color: '#FFF',
    fontSize: 28,
    marginBottom: Spacing.xs,
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    fontStyle: 'italic',
    marginBottom: Spacing.xl,
    lineHeight: 20,
  },
  heroIconCircle: {
    position: 'absolute',
    right: -20,
    top: -20,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  heroStat: {
    alignItems: 'flex-start',
  },
  statNumber: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: '800',
  },
  statLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  glassCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    marginBottom: Spacing.xl,
  },
  cardIconBox: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  cardInfo: {
    flex: 1,
  },
  sectionHeader: {
    marginBottom: Spacing.md,
  },
  moodScroll: {
    paddingBottom: Spacing.lg,
    gap: Spacing.md,
  },
  moodItem: {
    width: 80,
    height: 100,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  moodLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -Spacing.xs,
    marginTop: Spacing.md,
  },
  gridItem: {
    width: '50%',
    padding: Spacing.xs,
  },
  actionCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.xxl,
    alignItems: 'flex-start',
    gap: Spacing.xs,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    ...PlatformStyles.shadow,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  actionDesc: {
    color: '#64748B',
    fontSize: 12,
  },
  mentorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.xxl,
    marginTop: Spacing.lg,
    gap: Spacing.md,
  },
  mentorInfo: {
    flex: 1,
  },
  mentorBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fabContainer: {
    position: 'absolute',
    bottom: 30,
    left: Spacing.lg,
    right: Spacing.lg,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  fab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 60,
    gap: Spacing.sm,
  },
  fabText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 16,
  },
});

