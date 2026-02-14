/**
 * Home Dashboard Screen - Enhanced Premium Version with Crafted Icons
 */

import { DrawerHeader } from "@/app/components/navigation/drawer-header";
import { DrawerMenu } from "@/app/components/navigation/drawer-menu";
import { ThemedText } from "@/app/components/themed-text";
import { ThemedView } from "@/app/components/themed-view";
import {
  BorderRadius,
  Colors,
  PlatformStyles,
  Spacing
} from "@/app/constants/theme";
import { useColorScheme } from "@/app/hooks/use-color-scheme";
import { Announcement, UserRole } from "@/app/types";
import { getCheckInStreak, getPosts, getPseudonym } from "@/app/utils/storage";
import { getAnnouncements, getCurrentUser } from "@/lib/database";
import {
  MaterialCommunityIcons,
  MaterialIcons
} from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View
} from "react-native";
import Animated, { FadeInDown, FadeInRight } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

// Extended Motivational quotes
const motivationalQuotes = [
  "You're stronger than you think. Keep going!",
  "Every small step forward is progress. Celebrate it!",
  "Your mental health matters. Take care of yourself.",
  "It's okay not to be okay. You're not alone.",
  "Tomorrow is a fresh start. You've got this!",
  "Self-care isn't selfish. It's essential.",
  "You're doing better than you think. Keep going!",
  "Breathe. You have got this.",
  "One day at a time.",
  "You are enough, just as you are.",
];

export default function HomeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const [userName, setUserName] = useState("Student");
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [checkInStreak, setCheckInStreak] = useState(0);
  const [postCount, setPostCount] = useState(0);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [currentQuote, setCurrentQuote] = useState(motivationalQuotes[0]);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);

  const loadUserInfo = useCallback(async () => {
    try {
      const currentUser = await getCurrentUser();
      if (currentUser) {
        setUserRole(currentUser.role as UserRole);
        const savedPseudonym = await getPseudonym();
        if (savedPseudonym) {
          setUserName(savedPseudonym.split(/(?=[A-Z])/)[0] || "Student");
        } else {
          setUserName(currentUser.pseudonym || "Student");
        }
      } else {
        const pseudonym = await getPseudonym();
        if (pseudonym) {
          setUserName(pseudonym.split(/(?=[A-Z])/)[0] || "Student");
        }
      }
    } catch (error) {
      console.error("Error loading user info:", error);
      const pseudonym = await getPseudonym();
      if (pseudonym) {
        setUserName(pseudonym.split(/(?=[A-Z])/)[0] || "Student");
      }
    }
  }, []);

  const loadStats = useCallback(async () => {
    const [streak, posts, anns] = await Promise.all([
      getCheckInStreak(),
      getPosts(),
      getAnnouncements(),
    ]);
    setCheckInStreak(streak);
    setPostCount(posts.length);
    setAnnouncements(anns.filter((a) => a.isPublished));
  }, []);

  const loadUserData = useCallback(async () => {
    await Promise.all([loadUserInfo(), loadStats()]);
  }, [loadUserInfo, loadStats]);

  useEffect(() => {
    loadUserData();
    setCurrentQuote(
      motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)],
    );
  }, [userRole, loadUserData]);

  const onRefresh = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    await loadUserData();
    setCurrentQuote(
      motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)],
    );
    setRefreshing(false);
  }, [loadUserData]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const moods = [
    {
      id: "happy",
      iconName: "sentiment-very-satisfied",
      label: "Happy",
      color: "#FBBF24",
    },
    {
      id: "calm",
      iconName: "sentiment-satisfied",
      label: "Calm",
      color: colors.success,
    },
    {
      id: "okay",
      iconName: "sentiment-neutral",
      label: "Okay",
      color: colors.warning,
    },
    {
      id: "sad",
      iconName: "sentiment-dissatisfied",
      label: "Sad",
      color: colors.info,
    },
    {
      id: "anxious",
      iconName: "sentiment-very-dissatisfied",
      label: "Anxious",
      color: colors.secondary,
    },
  ];

  return (
    <SafeAreaView edges={["top"]} style={styles.safeAreaTop}>
      <ThemedView style={styles.container}>
        <DrawerHeader
          title={userName ? `${getGreeting()}, ${userName}` : getGreeting()}
          onMenuPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setDrawerVisible(true);
          }}
          rightAction={{
            icon: "notifications",
            onPress: () => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push("/notifications");
            },
          }}
        />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
        >
          {/* Critical Alerts Section */}
          {announcements
            .filter((a) => a.priority === "critical")
            .map((alert) => (
              <Animated.View
                entering={FadeInDown.duration(600)}
                key={alert.id}
                style={{ marginBottom: 20 }}
              >
                <LinearGradient
                  colors={[colors.danger, "#991B1B"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.alertCard, PlatformStyles.premiumShadow]}
                >
                  <View style={{ flexDirection: "row", gap: 12, alignItems: "flex-start" }}>
                    <View style={{ backgroundColor: "rgba(255,255,255,0.2)", padding: 8, borderRadius: 12 }}>
                      <MaterialCommunityIcons name="alert-decagram" size={24} color="#FFF" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <ThemedText style={{ color: "#FFF", fontWeight: "800", fontSize: 16, marginBottom: 4 }}>
                        {alert.title}
                      </ThemedText>
                      <ThemedText style={{ color: "rgba(255,255,255,0.9)", fontSize: 13, lineHeight: 18 }}>
                        {alert.content}
                      </ThemedText>
                    </View>
                  </View>
                </LinearGradient>
              </Animated.View>
            ))}

          {/* Premium Hero Section */}
          <Animated.View entering={FadeInDown.duration(800)}>
            <LinearGradient
              colors={colorScheme === 'dark' ? ['#4F46E5', '#7C3AED'] : ['#6366F1', '#8B5CF6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroCard}
            >
              <View style={styles.patternCircle1} />
              <View style={styles.patternCircle2} />

              <View style={styles.heroContent}>
                <View style={styles.badgeContainer}>
                  <MaterialCommunityIcons name="star-face" size={16} color="#FFF" />
                  <ThemedText style={styles.badgeText}>COMMUNITY MEMBER</ThemedText>
                </View>

                <ThemedText style={styles.heroTitle}>{getGreeting()},</ThemedText>
                <ThemedText style={styles.heroName}>{userName}</ThemedText>

                <ThemedText style={styles.heroQuote} numberOfLines={2}>
                  &quot;{currentQuote}&quot;
                </ThemedText>

                <View style={styles.glassStatsContainer}>
                  <View style={styles.heroStat}>
                    <ThemedText style={styles.statNumber}>{checkInStreak}</ThemedText>
                    <ThemedText style={styles.statLabel}>Day Streak</ThemedText>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.heroStat}>
                    <ThemedText style={styles.statNumber}>{postCount}</ThemedText>
                    <ThemedText style={styles.statLabel}>Contributions</ThemedText>
                  </View>
                </View>
              </View>

              <MaterialCommunityIcons name="creation" size={120} color="rgba(255,255,255,0.1)" style={styles.bgIcon} />
            </LinearGradient>
          </Animated.View>

          {/* Featured Announcements - Horizontal Glass Scroller */}
          {announcements.filter(a => a.priority !== 'critical').length > 0 && (
            <View style={{ marginBottom: Spacing.xl }}>
              <View style={styles.sectionHeader}>
                <ThemedText type="h3">Latest Updates</ThemedText>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: Spacing.md }}
              >
                {announcements.filter(a => a.priority !== 'critical').map((ann, idx) => (
                  <Animated.View
                    key={ann.id}
                    entering={FadeInRight.delay(200 + idx * 100)}
                    style={[
                      styles.annCard,
                      { backgroundColor: colorScheme === 'dark' ? 'rgba(30, 41, 59, 0.5)' : 'rgba(255, 255, 255, 0.8)' }
                    ]}
                  >
                    <View style={[styles.annTypeBadge, { backgroundColor: ann.priority === 'high' ? colors.warning : colors.primary }]}>
                      <MaterialCommunityIcons name="bullhorn-variant" size={14} color="#FFF" />
                    </View>
                    <ThemedText style={styles.annTitle} numberOfLines={1}>{ann.title}</ThemedText>
                    <ThemedText style={styles.annDesc} numberOfLines={2}>{ann.content}</ThemedText>
                  </Animated.View>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Safe Spaces Grid */}
          <View style={styles.sectionHeader}>
            <ThemedText type="h3">Safe Spaces</ThemedText>
            <ThemedText type="small" style={{ opacity: 0.6 }}>How would you like to engage today?</ThemedText>
          </View>

          <View style={styles.gridContainer}>
            <Animated.View entering={FadeInDown.delay(600)} style={styles.gridItem}>
              <TouchableOpacity
                style={[styles.actionCard, { backgroundColor: colors.card }, PlatformStyles.premiumShadow]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push("/(tabs)/forum");
                }}
              >
                <LinearGradient colors={["#818CF8", "#4F46E5"]} style={styles.craftedIconBox}>
                  <MaterialCommunityIcons name="account-group" size={28} color="#FFF" />
                </LinearGradient>
                <ThemedText type="h3" style={styles.cardTitle}>Forum</ThemedText>
                <ThemedText type="small" style={styles.actionDesc}>Talk with others</ThemedText>
              </TouchableOpacity>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(700)} style={styles.gridItem}>
              <TouchableOpacity
                style={[styles.actionCard, { backgroundColor: colors.card }, PlatformStyles.premiumShadow]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push("/(tabs)/resources");
                }}
              >
                <LinearGradient colors={["#34D399", "#10B981"]} style={styles.craftedIconBox}>
                  <MaterialCommunityIcons name="book-open" size={28} color="#FFF" />
                </LinearGradient>
                <ThemedText type="h3" style={styles.cardTitle}>Resources</ThemedText>
                <ThemedText type="small" style={styles.actionDesc}>Learn & grow</ThemedText>
              </TouchableOpacity>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(800)} style={styles.gridItem}>
              <TouchableOpacity
                style={[styles.actionCard, { backgroundColor: colors.card }, PlatformStyles.premiumShadow]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push("/(tabs)/support");
                }}
              >
                <LinearGradient colors={["#F472B6", "#DB2777"]} style={styles.craftedIconBox}>
                  <MaterialCommunityIcons name="chat-processing" size={28} color="#FFF" />
                </LinearGradient>
                <ThemedText type="h3" style={styles.cardTitle}>Support</ThemedText>
                <ThemedText type="small" style={styles.actionDesc}>Peer support</ThemedText>
              </TouchableOpacity>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(900)} style={styles.gridItem}>
              <TouchableOpacity
                style={[styles.actionCard, { backgroundColor: colors.card }, PlatformStyles.premiumShadow]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push("/book-counsellor");
                }}
              >
                <LinearGradient colors={["#FBBF24", "#D97706"]} style={styles.craftedIconBox}>
                  <MaterialCommunityIcons name="hand-heart" size={28} color="#FFF" />
                </LinearGradient>
                <ThemedText type="h3" style={styles.cardTitle}>Counseling</ThemedText>
                <ThemedText type="small" style={styles.actionDesc}>Get expert help</ThemedText>
              </TouchableOpacity>
            </Animated.View>
          </View>

          {/* Mood Check-in */}
          <View style={[styles.sectionHeader, { marginTop: Spacing.xl }]}>
            <ThemedText type="h3">Mood Check-in</ThemedText>
            <ThemedText type="small" style={{ opacity: 0.6 }}>Take a moment to center yourself</ThemedText>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.moodScroll}
          >
            {moods.map((mood) => (
              <TouchableOpacity
                key={mood.id}
                style={[
                  styles.moodItem,
                  {
                    backgroundColor: selectedMood === mood.id ? mood.color + '20' : colors.card,
                    borderColor: selectedMood === mood.id ? mood.color : colors.border,
                  },
                ]}
                onPress={() => {
                  Haptics.selectionAsync();
                  setSelectedMood(mood.id);
                  router.push(`/check-in-summary?mood=${mood.id}` as any);
                }}
              >
                <MaterialIcons
                  name={mood.iconName as any}
                  size={32}
                  color={selectedMood === mood.id ? mood.color : colors.icon}
                />
                <ThemedText
                  style={[
                    styles.moodLabel,
                    { color: selectedMood === mood.id ? mood.color : colors.text },
                  ]}
                >
                  {mood.label}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={{ height: 40 }} />
        </ScrollView>

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
    marginBottom: Spacing.xl,
    overflow: "hidden",
    minHeight: 240,
    elevation: 10,
  },
  heroContent: {
    flex: 1,
    zIndex: 2,
    justifyContent: "center",
  },
  heroTitle: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 18,
    fontWeight: "600",
  },
  heroName: {
    color: "#FFF",
    fontSize: 36,
    fontWeight: "900",
    letterSpacing: -1,
    marginBottom: Spacing.sm,
  },
  heroQuote: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 14,
    fontStyle: "italic",
    marginBottom: Spacing.xl,
    lineHeight: 20,
  },
  // Decorative Patterns
  patternCircle1: {
    position: "absolute",
    top: -50,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  patternCircle2: {
    position: "absolute",
    bottom: -80,
    left: -20,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  bgIcon: {
    position: "absolute",
    right: -30,
    bottom: -30,
    zIndex: 1,
    opacity: 0.5,
  },
  badgeContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
    marginBottom: 12,
  },
  badgeText: {
    color: "#FFF",
    fontWeight: "800",
    fontSize: 10,
    letterSpacing: 1,
  },
  glassStatsContainer: {
    flexDirection: "row",
    backgroundColor: "rgba(0,0,0,0.2)",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    justifyContent: 'space-around',
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  heroStat: {
    alignItems: "center",
  },
  statNumber: {
    color: "#FFF",
    fontSize: 28,
    fontWeight: "900",
  },
  statLabel: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  annCard: {
    width: 300,
    padding: Spacing.lg,
    borderRadius: BorderRadius.xxl,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    gap: Spacing.xs,
  },
  annTypeBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  annTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  annDesc: {
    fontSize: 13,
    opacity: 0.7,
    lineHeight: 18,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 4,
  },
  quickActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginTop: Spacing.md,
    marginBottom: Spacing.xl,
  },
  quickChip: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: BorderRadius.full,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  quickLabel: {
    fontWeight: "900",
    marginLeft: 8,
    letterSpacing: 0.3,
  },
  glassCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    marginBottom: Spacing.xl,
  },
  cardIconBox: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    justifyContent: "center",
    alignItems: "center",
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
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.xs,
  },
  moodLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -Spacing.xs,
    marginTop: Spacing.md,
  },
  gridItem: {
    width: "50%",
    padding: Spacing.xs,
  },
  actionCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.xxl,
    alignItems: "flex-start",
    gap: Spacing.xs,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },
  craftedIconBox: {
    width: 50,
    height: 50,
    borderRadius: BorderRadius.xl,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.sm,
    // Add shine effect logic in future or via view styles
  },
  actionDesc: {
    color: "#64748B",
    fontSize: 12,
  },
  mentorCard: {
    flexDirection: "row",
    alignItems: "center",
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
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  fabContainer: {
    position: "absolute",
    bottom: 30,
    left: Spacing.lg,
    right: Spacing.lg,
    borderRadius: BorderRadius.full,
    overflow: "hidden",
  },
  fab: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 60,
    gap: Spacing.sm,
  },
  fabText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 16,
  },
  alertCard: {
    borderRadius: 20,
    padding: 20,
  },
  spotlightCard: {
    width: 280,
    padding: 12,
    borderRadius: 24,
  },
  commandBarContainer: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
    zIndex: 100,
  },
  commandBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  commandItem: {
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 4,
  },
  commandItemActive: {
    alignItems: 'center',
    gap: 4,
  },
  activeGradient: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -20,
    elevation: 8,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  commandLabel: {
    fontSize: 10,
    fontWeight: '700',
  },
});
