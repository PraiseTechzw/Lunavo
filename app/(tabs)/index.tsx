/**
 * Home Dashboard Screen - Enhanced Version
 */

import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ThemedView } from '@/app/components/themed-view';
import { ThemedText } from '@/app/components/themed-text';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useColorScheme } from '@/app/hooks/use-color-scheme';
import { Colors, Spacing, BorderRadius } from '@/app/constants/theme';
import { 
  getPseudonym, 
  getPosts, 
  getCheckInStreak, 
  hasCheckedInToday,
  getCheckIns 
} from '@/app/utils/storage';
import { getCursorStyle, createShadow } from '@/app/utils/platform-styles';

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
    await Promise.all([
      loadUserInfo(),
      loadStats(),
    ]);
  };

  const loadUserInfo = async () => {
    const pseudonym = await getPseudonym();
    if (pseudonym) {
      setUserName(pseudonym.split(/(?=[A-Z])/)[0] || 'Student');
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

        {/* Bottom Spacing */}
        <View style={{ height: Spacing.xl }} />
      </ScrollView>

      {/* Floating Help Button */}
      <TouchableOpacity
        style={[
          styles.fab,
          { backgroundColor: '#136dec' },
          createShadow(8, '#136dec', 0.3),
        ]}
        onPress={() => Alert.alert('Need Help?', 'How can we assist you?')}
        activeOpacity={0.8}
      >
        <MaterialIcons name="help-outline" size={20} color="#FFFFFF" />
        <ThemedText type="body" style={{ color: '#FFFFFF', fontWeight: '500', marginLeft: Spacing.xs }}>
          Need Help?
        </ThemedText>
      </TouchableOpacity>
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
    paddingHorizontal: Spacing.md,
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
    width: 48,
    height: 48,
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
  },
  dateText: {
    marginTop: 2,
    fontSize: 13,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  statCard: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    minHeight: 100,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  statValue: {
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    textAlign: 'center',
  },
  quoteCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: Colors.light.primary,
  },
  quoteIcon: {
    marginBottom: Spacing.xs,
  },
  quoteText: {
    fontStyle: 'italic',
    lineHeight: 22,
  },
  tipCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
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
  },
  tipIndicators: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
  },
  tipDot: {
    borderRadius: 4,
  },
  tipContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  tipIconContainer: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipTextContainer: {
    flex: 1,
  },
  tipHeading: {
    fontWeight: '600',
    marginBottom: 4,
  },
  tipDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  urgentCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
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
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    alignSelf: 'flex-start',
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
    fontSize: 24,
    marginTop: Spacing.lg,
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
    minHeight: 48,
    gap: Spacing.sm,
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
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    minHeight: 150,
    justifyContent: 'space-between',
  },
  supportCardContent: {
    marginTop: 'auto',
    gap: 4,
  },
  resourceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
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
  fab: {
    position: 'absolute',
    bottom: 96,
    right: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    height: 56,
    justifyContent: 'center',
  },
});
