/**
 * Home Dashboard Screen - Enhanced Version
 */

import { ThemedText } from '@/app/components/themed-text';
import { ThemedView } from '@/app/components/themed-view';
import { BorderRadius, Colors, Spacing } from '@/app/constants/theme';
import { useColorScheme } from '@/app/hooks/use-color-scheme';
import { createShadow, getCursorStyle } from '@/app/utils/platform-styles';
import {
    getCheckInStreak,
    getPosts,
    getPseudonym,
    hasCheckedInToday
} from '@/app/utils/storage';
import { getCurrentUser, getReplies } from '@/lib/database';
import { getUserPoints } from '@/lib/points-system';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    RefreshControl,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';
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

// Quick tips
const quickTips = [
  { iconName: 'water-outline', title: 'Stay Hydrated', tip: 'Drink water regularly to keep your mind sharp' },
  { iconName: 'leaf-outline', title: 'Take Breaks', tip: 'Short breaks help improve focus and reduce stress' },
  { iconName: 'body-outline', title: 'Breathe Deeply', tip: 'Deep breathing can calm your nervous system' },
  { iconName: 'document-text-outline', title: 'Journal Your Thoughts', tip: 'Writing helps process emotions effectively' },
  { iconName: 'walk-outline', title: 'Move Your Body', tip: 'Even a short walk can boost your mood' },
  { iconName: 'moon-outline', title: 'Prioritize Sleep', tip: 'Quality sleep is crucial for mental health' },
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
  const [replyCount, setReplyCount] = useState(0);
  const [points, setPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentQuote] = useState(motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)]);
  const [currentTipIndex, setCurrentTipIndex] = useState(0);

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    // Rotate tips every 5 seconds
    const tipInterval = setInterval(() => {
      setCurrentTipIndex((prev) => (prev + 1) % quickTips.length);
    }, 5000);
    return () => clearInterval(tipInterval);
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadUserInfo(),
        loadStats(),
      ]);
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserInfo = async () => {
    try {
      // Load user from backend first
      const currentUser = await getCurrentUser();
      if (currentUser?.pseudonym) {
        const name = currentUser.pseudonym.split(/(?=[A-Z])/)[0] || 'Student';
        setUserName(name);
        // Cache pseudonym locally for faster access
        const { savePseudonym } = await import('@/app/utils/storage');
        await savePseudonym(currentUser.pseudonym);
      } else {
        // Fallback to cached pseudonym
        const pseudonym = await getPseudonym();
        if (pseudonym) {
          setUserName(pseudonym.split(/(?=[A-Z])/)[0] || 'Student');
        }
      }
    } catch (error) {
      console.error('Error loading user info:', error);
      // Fallback to cached pseudonym
      const pseudonym = await getPseudonym();
      if (pseudonym) {
        setUserName(pseudonym.split(/(?=[A-Z])/)[0] || 'Student');
      }
    }
  };

  const loadStats = async () => {
    try {
      const currentUser = await getCurrentUser();
      if (!currentUser) return;

      const [streak, checkedIn, allPosts, allReplies, userPoints] = await Promise.all([
        getCheckInStreak(),
        hasCheckedInToday(),
        getPosts(),
        Promise.all((await getPosts()).map(p => getReplies(p.id))).then(replies => replies.flat()),
        getUserPoints(currentUser.id),
      ]);

      // Filter to user's posts and replies
      const myPosts = allPosts.filter(p => p.authorId === currentUser.id);
      const myReplies = allReplies.filter(r => r.authorId === currentUser.id);

      setCheckInStreak(streak);
      setHasCheckedIn(checkedIn);
      setPostCount(myPosts.length);
      setReplyCount(myReplies.length);
      setPoints(userPoints);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
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

  const getFormattedDate = () => {
    const today = new Date();
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return today.toLocaleDateString('en-US', options);
  };

  const moods = [
    { id: 'happy', iconName: 'sentiment-very-satisfied', iconFamily: 'MaterialIcons', label: 'Happy', color: '#FBBF24' }, // sentiment_very_satisfied - yellow
    { id: 'calm', iconName: 'sentiment-satisfied', iconFamily: 'MaterialIcons', label: 'Calm', color: '#10B981' }, // sentiment_calm - green
    { id: 'okay', iconName: 'sentiment-neutral', iconFamily: 'MaterialIcons', label: 'Okay', color: '#F97316' }, // sentiment_neutral - orange
    { id: 'sad', iconName: 'sentiment-dissatisfied', iconFamily: 'MaterialIcons', label: 'Sad', color: '#3B82F6' }, // sentiment_sad - blue
    { id: 'anxious', iconName: 'sentiment-very-dissatisfied', iconFamily: 'MaterialIcons', label: 'Anxious', color: '#8B5CF6' }, // sentiment_stressed - purple
  ];

  const currentTip = quickTips[currentTipIndex];

  return (
    <SafeAreaView edges={['top']} style={styles.safeAreaTop}>
      <ThemedView style={styles.container}>
        {/* Fixed Header - Outside ScrollView */}
        <View style={[styles.header, { backgroundColor: colors.background }]}>
          <View style={styles.headerTop}>
            <View style={styles.headerLeft}>
              <View style={[styles.iconCircle, { backgroundColor: '#A2D2FF' + '20' }]}>
                <MaterialIcons name="support-agent" size={24} color="#A2D2FF" />
              </View>
              <View>
                <ThemedText type="h2" style={styles.greeting}>
                  {getGreeting()}, {userName}
                </ThemedText>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => router.push('/profile-settings')}
              style={[styles.iconButton, getCursorStyle()]}
            >
              <MaterialIcons name="settings" size={22} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <ThemedText type="body" style={{ marginTop: Spacing.md, color: colors.icon }}>
              Loading your dashboard...
            </ThemedText>
          </View>
        ) : (
          <>
        {/* User Stats Cards */}
        <View style={styles.statsContainer}>
          <TouchableOpacity
            style={[
              styles.statCard,
              { backgroundColor: colors.card },
              createShadow(2, '#000', 0.1),
            ]}
            onPress={() => router.push('/(tabs)/profile')}
            activeOpacity={0.7}
          >
            <View style={[styles.statIconContainer, { backgroundColor: '#A2D2FF' + '20' }]}>
              <MaterialIcons name="forum" size={20} color="#A2D2FF" />
            </View>
            <ThemedText type="h3" style={[styles.statValue, { color: colors.text }]}>
              {postCount}
            </ThemedText>
            <ThemedText type="small" style={[styles.statLabel, { color: colors.icon }]}>
              Posts
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.statCard,
              { backgroundColor: colors.card },
              createShadow(2, '#000', 0.1),
            ]}
            onPress={() => router.push('/(tabs)/profile')}
            activeOpacity={0.7}
          >
            <View style={[styles.statIconContainer, { backgroundColor: '#BDE0FE' + '20' }]}>
              <MaterialIcons name="comment" size={20} color="#BDE0FE" />
            </View>
            <ThemedText type="h3" style={[styles.statValue, { color: colors.text }]}>
              {replyCount}
            </ThemedText>
            <ThemedText type="small" style={[styles.statLabel, { color: colors.icon }]}>
              Replies
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.statCard,
              { backgroundColor: colors.card },
              createShadow(2, '#000', 0.1),
            ]}
            onPress={() => router.push('/rewards')}
            activeOpacity={0.7}
          >
            <View style={[styles.statIconContainer, { backgroundColor: '#FBBF24' + '20' }]}>
              <MaterialIcons name="stars" size={20} color="#FBBF24" />
            </View>
            <ThemedText type="h3" style={[styles.statValue, { color: colors.text }]}>
              {points}
            </ThemedText>
            <ThemedText type="small" style={[styles.statLabel, { color: colors.icon }]}>
              Points
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.statCard,
              { backgroundColor: colors.card },
              createShadow(2, '#000', 0.1),
            ]}
            onPress={() => router.push('/check-in')}
            activeOpacity={0.7}
          >
            <View style={[styles.statIconContainer, { backgroundColor: '#10B981' + '20' }]}>
              <MaterialIcons name="local-fire-department" size={20} color="#10B981" />
            </View>
            <ThemedText type="h3" style={[styles.statValue, { color: colors.text }]}>
              {checkInStreak}
            </ThemedText>
            <ThemedText type="small" style={[styles.statLabel, { color: colors.icon }]}>
              Day Streak
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* Urgent Support Card */}
        <View style={[
          styles.urgentCard,
          { backgroundColor: colors.card },
          createShadow(3, '#000', 0.08),
        ]}>
          <View style={styles.urgentContent}>
            <View style={styles.urgentLeft}>
              <ThemedText type="h3" style={[styles.urgentTitle, { color: colors.text }]}>
                Urgent Support
              </ThemedText>
              <ThemedText type="caption" style={[styles.urgentDescription, { color: colors.icon }]}>
                Access counsellors and crisis lines now.
              </ThemedText>
              <TouchableOpacity
                style={[styles.accessButton, { backgroundColor: colors.danger }]}
                onPress={() => router.push('/urgent-support')}
                activeOpacity={0.8}
              >
                <ThemedText type="body" style={{ color: '#FFFFFF', fontWeight: '600' }}>
                  Access Now
                </ThemedText>
              </TouchableOpacity>
            </View>
            <View style={styles.sosContainer}>
              <MaterialIcons name="sos" size={48} color={colors.danger} />
            </View>
          </View>
        </View>

        {/* Mood Check-in */}
        <View style={styles.section}>
          <ThemedText type="h2" style={[styles.moodSectionTitle, { marginBottom: Spacing.md }]}>
            How are you feeling today?
          </ThemedText>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.moodContainer}
          >
            {moods.map((mood) => (
              <TouchableOpacity
                key={mood.id}
                style={[
                  styles.moodChip,
                  {
                    backgroundColor: mood.color + '15', // 15% opacity background
                    borderColor: mood.color,
                    borderWidth: 2,
                  },
                  createShadow(2, mood.color, 0.2),
                ]}
                onPress={() => {
                  setSelectedMood(mood.id);
                  router.push('/check-in');
                }}
                activeOpacity={0.7}
              >
                {mood.iconFamily === 'MaterialIcons' ? (
                  <MaterialIcons name={mood.iconName as any} size={24} color={mood.color} />
                ) : (
                  <Ionicons name={mood.iconName as any} size={24} color={mood.color} />
                )}
                <ThemedText type="small" style={[styles.moodChipLabel, { color: mood.color, fontWeight: '600' }]}>
                  {mood.label}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Support Modalities */}
        <View style={styles.cardRow}>
          <TouchableOpacity
            style={[
              styles.supportCard,
              { backgroundColor: colors.card },
              createShadow(1, '#000', 0.05),
            ]}
            onPress={() => router.push('/(tabs)/forum')}
            activeOpacity={0.8}
          >
              <MaterialIcons name="forum" size={32} color="#A2D2FF" />
            <View style={styles.supportCardContent}>
              <ThemedText type="body" style={styles.cardTitle}>
                Peer Support Forum
              </ThemedText>
              <ThemedText type="small" style={[styles.cardDescription, { color: colors.icon }]}>
                Connect with the community
              </ThemedText>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.supportCard,
              { backgroundColor: colors.card },
              createShadow(1, '#000', 0.05),
            ]}
            onPress={() => router.push('/(tabs)/chat')}
            activeOpacity={0.8}
          >
            <MaterialIcons name="chat" size={32} color="#BDE0FE" />
            <View style={styles.supportCardContent}>
              <ThemedText type="body" style={styles.cardTitle}>
                Anonymous Chat
              </ThemedText>
              <ThemedText type="small" style={[styles.cardDescription, { color: colors.icon }]}>
                Talk one-on-one with a peer
              </ThemedText>
            </View>
          </TouchableOpacity>
        </View>

        {/* Resources Card */}
        <TouchableOpacity
          style={[
            styles.resourceCard,
            { backgroundColor: colors.card },
            createShadow(1, '#000', 0.05),
          ]}
          onPress={() => router.push('/(tabs)/resources')}
          activeOpacity={0.8}
        >
          <MaterialIcons name="book" size={32} color="#CDB4DB" />
          <View style={styles.resourceContent}>
            <ThemedText type="body" style={styles.cardTitle}>
              Explore Resources
            </ThemedText>
            <ThemedText type="small" style={[styles.cardDescription, { color: colors.icon }]}>
              Find mental health and academic tips.
            </ThemedText>
          </View>
          <MaterialIcons name="arrow-forward-ios" size={20} color={colors.icon} />
        </TouchableOpacity>

        {/* Motivational Quote Card */}
        <View style={[
          styles.quoteCard,
          { backgroundColor: colors.card },
          createShadow(2, '#000', 0.08),
        ]}>
          <View style={styles.quoteHeader}>
            <MaterialIcons name="format-quote" size={24} color={colors.primary} />
            <ThemedText type="small" style={[styles.quoteLabel, { color: colors.icon }]}>
              Daily Inspiration
            </ThemedText>
          </View>
          <ThemedText type="body" style={[styles.quoteText, { color: colors.text }]}>
            "{currentQuote}"
          </ThemedText>
        </View>

        {/* Quick Tip Card */}
        <View style={[
          styles.tipCard,
          { backgroundColor: colors.card },
          createShadow(2, '#000', 0.08),
        ]}>
          <View style={styles.tipHeader}>
            <View style={styles.tipTitleContainer}>
              <MaterialIcons name="lightbulb-outline" size={20} color="#FBBF24" />
              <ThemedText type="body" style={[styles.tipTitle, { color: colors.text, marginLeft: Spacing.xs }]}>
                Wellness Tip
              </ThemedText>
            </View>
            <View style={styles.tipIndicators}>
              {quickTips.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.tipDot,
                    {
                      width: index === currentTipIndex ? 8 : 6,
                      height: 6,
                      backgroundColor: index === currentTipIndex ? colors.primary : colors.icon + '40',
                    },
                  ]}
                />
              ))}
            </View>
          </View>
          <View style={styles.tipContent}>
            <View style={[styles.tipIconContainer, { backgroundColor: currentTip.iconName === 'water-outline' ? '#3B82F6' + '20' : currentTip.iconName === 'leaf-outline' ? '#10B981' + '20' : currentTip.iconName === 'body-outline' ? '#8B5CF6' + '20' : currentTip.iconName === 'document-text-outline' ? '#F97316' + '20' : currentTip.iconName === 'walk-outline' ? '#EC4899' + '20' : '#6366F1' + '20' }]}>
              <Ionicons name={currentTip.iconName as any} size={28} color={currentTip.iconName === 'water-outline' ? '#3B82F6' : currentTip.iconName === 'leaf-outline' ? '#10B981' : currentTip.iconName === 'body-outline' ? '#8B5CF6' : currentTip.iconName === 'document-text-outline' ? '#F97316' : currentTip.iconName === 'walk-outline' ? '#EC4899' : '#6366F1'} />
            </View>
            <View style={styles.tipTextContainer}>
              <ThemedText type="body" style={[styles.tipHeading, { color: colors.text }]}>
                {currentTip.title}
              </ThemedText>
              <ThemedText type="small" style={[styles.tipDescription, { color: colors.icon }]}>
                {currentTip.tip}
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Bottom Spacing */}
        <View style={{ height: Spacing.xl }} />
        </>
        )}
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
    paddingTop: Spacing.sm,
    paddingBottom: 100,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
    zIndex: 10,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.xs,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.md,
  },
  greeting: {
    fontWeight: '700',
    fontSize: 22,
  },
  dateText: {
    marginTop: 2,
    fontSize: 13,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
    marginTop: Spacing.sm,
  },
  statCard: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    minHeight: 110,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  statIconContainer: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  statValue: {
    fontWeight: '700',
    marginBottom: 4,
    fontSize: 20,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
    minHeight: 200,
  },
  quoteCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.md,
    marginTop: Spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: '#A2D2FF',
  },
  quoteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: Spacing.xs,
  },
  quoteLabel: {
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  quoteText: {
    fontStyle: 'italic',
    lineHeight: 24,
    fontSize: 15,
  },
  tipCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.lg,
  },
  tipHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  tipTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tipTitle: {
    fontWeight: '600',
    fontSize: 16,
  },
  tipIndicators: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  tipDot: {
    borderRadius: 3,
  },
  tipContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  tipIconContainer: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipTextContainer: {
    flex: 1,
  },
  tipHeading: {
    fontWeight: '600',
    marginBottom: 6,
    fontSize: 16,
  },
  tipDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  urgentCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  urgentContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  urgentLeft: {
    flex: 2,
    marginRight: Spacing.md,
  },
  urgentTitle: {
    marginBottom: Spacing.xs,
    fontWeight: '700',
  },
  urgentDescription: {
    fontSize: 13,
    marginBottom: Spacing.md,
  },
  accessButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignSelf: 'flex-start',
    minWidth: 120,
    alignItems: 'center',
  },
  sosContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.md,
    flex: 1,
  },
  sosText: {
    fontSize: 48,
    fontWeight: '900',
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  moodSectionTitle: {
    fontWeight: '700',
    fontSize: 22,
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
  },
  moodContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
    paddingRight: Spacing.md,
    paddingLeft: 0,
  },
  moodChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    minHeight: 52,
    gap: Spacing.sm,
    minWidth: 100,
  },
  moodChipLabel: {
    fontWeight: '500',
    fontSize: 14,
  },
  cardRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  supportCard: {
    flex: 1,
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    minHeight: 160,
    justifyContent: 'space-between',
  },
  supportCardContent: {
    marginTop: 'auto',
    gap: 4,
  },
  resourceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    gap: Spacing.md,
    marginTop: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  resourceContent: {
    flex: 1,
  },
  cardTitle: {
    fontWeight: '700',
    marginBottom: 4,
    fontSize: 16,
  },
  cardDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  actionIconCircle: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
