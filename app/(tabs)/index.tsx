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
  Spacing,
} from "@/app/constants/theme";
import { useColorScheme } from "@/app/hooks/use-color-scheme";
import { Announcement, UserRole } from "@/app/types";
import { createShadow } from "@/app/utils/platform-styles";
import { getCheckInStreak, getPosts, getPseudonym } from "@/app/utils/storage";
import { getAnnouncements, getCurrentUser } from "@/lib/database";
import {
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
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
  View,
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
                  <View
                    style={{
                      flexDirection: "row",
                      gap: 12,
                      alignItems: "flex-start",
                    }}
                  >
                    <View
                      style={{
                        backgroundColor: "rgba(255,255,255,0.2)",
                        padding: 8,
                        borderRadius: 12,
                      }}
                    >
                      <MaterialCommunityIcons
                        name="alert-decagram"
                        size={24}
                        color="#FFF"
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <ThemedText
                        style={{
                          color: "#FFF",
                          fontWeight: "800",
                          fontSize: 16,
                          marginBottom: 4,
                        }}
                      >
                        {alert.title}
                      </ThemedText>
                      <ThemedText
                        style={{
                          color: "rgba(255,255,255,0.9)",
                          fontSize: 13,
                          lineHeight: 18,
                        }}
                      >
                        {alert.content}
                      </ThemedText>
                      {alert.actionLink && (
                        <TouchableOpacity
                          style={{
                            marginTop: 12,
                            backgroundColor: "#FFF",
                            alignSelf: "flex-start",
                            paddingHorizontal: 16,
                            paddingVertical: 8,
                            borderRadius: 20,
                          }}
                        >
                          <ThemedText
                            style={{
                              color: colors.danger,
                              fontWeight: "700",
                              fontSize: 12,
                            }}
                          >
                            {alert.actionLabel || "View Details"}
                          </ThemedText>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                </LinearGradient>
              </Animated.View>
            ))}

          {/* Featured/Spotlight Announcements */}
          {announcements.filter(
            (a) => a.type === "spotlight" && a.priority !== "critical",
          ).length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginBottom: 20 }}
            >
              {announcements
                .filter(
                  (a) => a.type === "spotlight" && a.priority !== "critical",
                )
                .map((spotlight, index) => (
                  <TouchableOpacity
                    key={spotlight.id}
                    style={[
                      styles.spotlightCard,
                      { backgroundColor: colors.card, marginRight: 16 },
                      PlatformStyles.premiumShadow,
                    ]}
                    activeOpacity={0.9}
                  >
                    {spotlight.imageUrl ? (
                      <View
                        style={{
                          height: 120,
                          backgroundColor: "#EEE",
                          borderRadius: 16,
                          marginBottom: 12,
                          overflow: "hidden",
                        }}
                      >
                        {/* Image would go here, using a placeholder for now if no Image component */}
                        <View
                          style={{
                            flex: 1,
                            justifyContent: "center",
                            alignItems: "center",
                            backgroundColor: colors.primary,
                          }}
                        >
                          <MaterialIcons name="image" size={40} color="#FFF" />
                        </View>
                      </View>
                    ) : (
                      <LinearGradient
                        colors={[colors.primary, "#4338CA"]}
                        style={{
                          height: 80,
                          borderRadius: 16,
                          marginBottom: 12,
                          justifyContent: "center",
                          alignItems: "center",
                        }}
                      >
                        <MaterialCommunityIcons
                          name="bullhorn"
                          size={32}
                          color="#FFF"
                        />
                      </LinearGradient>
                    )}
                    <View style={{ paddingHorizontal: 4 }}>
                      <View
                        style={{
                          flexDirection: "row",
                          justifyContent: "space-between",
                          marginBottom: 4,
                        }}
                      >
                        <ThemedText
                          style={{
                            color: colors.primary,
                            fontSize: 10,
                            fontWeight: "700",
                            textTransform: "uppercase",
                          }}
                        >
                          {spotlight.type}
                        </ThemedText>
                        {spotlight.priority === "high" && (
                          <View
                            style={{
                              backgroundColor: colors.warning + "20",
                              paddingHorizontal: 6,
                              borderRadius: 4,
                            }}
                          >
                            <ThemedText
                              style={{
                                color: colors.warning,
                                fontSize: 10,
                                fontWeight: "700",
                              }}
                            >
                              HIGH
                            </ThemedText>
                          </View>
                        )}
                      </View>
                      <ThemedText
                        style={{
                          fontWeight: "700",
                          fontSize: 16,
                          marginBottom: 4,
                        }}
                        numberOfLines={1}
                      >
                        {spotlight.title}
                      </ThemedText>
                      <ThemedText
                        style={{ fontSize: 12, color: colors.icon }}
                        numberOfLines={2}
                      >
                        {spotlight.content}
                      </ThemedText>
                    </View>
                  </TouchableOpacity>
                ))}
            </ScrollView>
          )}

          {/* Updates & Events Marquee (if any general ones exist) */}
          {announcements.some(
            (a) => a.type === "general" || a.type === "event",
          ) && (
            <View style={{ marginBottom: 20 }}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 12,
                  paddingHorizontal: 4,
                }}
              >
                <MaterialCommunityIcons
                  name="newspaper-variant-outline"
                  size={20}
                  color={colors.text}
                  style={{ marginRight: 8 }}
                />
                <ThemedText
                  type="body"
                  style={{ fontWeight: "600", fontSize: 16 }}
                >
                  Latest Updates
                </ThemedText>
              </View>
              {announcements
                .filter(
                  (a) =>
                    (a.type === "general" || a.type === "event") &&
                    a.priority !== "critical",
                )
                .slice(0, 3)
                .map((news) => (
                  <View
                    key={news.id}
                    style={{
                      backgroundColor: colors.card,
                      padding: 16,
                      borderRadius: 16,
                      marginBottom: 10,
                      flexDirection: "row",
                      alignItems: "center",
                      borderWidth: 1,
                      borderColor: "rgba(0,0,0,0.03)",
                    }}
                  >
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor:
                          news.type === "event" ? "#ECFDF5" : "#EFF6FF",
                        justifyContent: "center",
                        alignItems: "center",
                        marginRight: 12,
                      }}
                    >
                      <MaterialCommunityIcons
                        name={
                          news.type === "event"
                            ? "calendar-star"
                            : "information-variant"
                        }
                        size={20}
                        color={news.type === "event" ? "#059669" : "#2563EB"}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <ThemedText
                        style={{ fontWeight: "600", marginBottom: 2 }}
                      >
                        {news.title}
                      </ThemedText>
                      <ThemedText
                        style={{ fontSize: 12, color: colors.icon }}
                        numberOfLines={1}
                      >
                        {news.content}
                      </ThemedText>
                    </View>
                    <MaterialIcons
                      name="chevron-right"
                      size={20}
                      color={colors.icon}
                    />
                  </View>
                ))}
            </View>
          )}

          {/* Welcome Dashboard Card - Premium Redesign */}
          <Animated.View entering={FadeInDown.duration(800)}>
            <LinearGradient
              colors={["#4F46E5", "#7C3AED", "#DB2777"]} // Indigo -> Purple -> Pink
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.heroCard, PlatformStyles.premiumShadow]}
            >
              {/* Unique 'Crafted' Background */}
              <View style={styles.patternCircle1} />
              <View style={styles.patternCircle2} />
              <MaterialCommunityIcons
                name="meditation"
                size={140}
                color="rgba(255,255,255,0.08)"
                style={styles.bgIcon}
              />

              <View style={styles.heroContent}>
                <View style={styles.badgeContainer}>
                  <MaterialCommunityIcons
                    name="target-variant"
                    size={16}
                    color="#FFF"
                  />
                  <ThemedText style={styles.badgeText}>
                    Daily Mission
                  </ThemedText>
                </View>

                <ThemedText type="h1" style={styles.heroTitle}>
                  Mission: Wellness
                </ThemedText>
                <ThemedText style={styles.heroSubtitle}>
                  &quot;{currentQuote}&quot;
                </ThemedText>

                <View style={styles.glassStatsContainer}>
                  <View style={styles.heroStat}>
                    <ThemedText style={styles.statNumber}>
                      {checkInStreak}
                    </ThemedText>
                    <ThemedText style={styles.statLabel}>
                      Day Streak 🔥
                    </ThemedText>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.heroStat}>
                    <ThemedText style={styles.statNumber}>
                      {postCount}
                    </ThemedText>
                    <ThemedText style={styles.statLabel}>
                      Community 🌍
                    </ThemedText>
                  </View>
                </View>
              </View>
            </LinearGradient>
          </Animated.View>

          {/* Urgent Support Quick Access */}
          <Animated.View entering={FadeInDown.delay(200).duration(800)}>
            <TouchableOpacity
              style={[
                styles.glassCard,
                {
                  backgroundColor: colors.danger + "10",
                  borderColor: colors.danger + "30",
                },
              ]}
              onPress={() => {
                Haptics.notificationAsync(
                  Haptics.NotificationFeedbackType.Warning,
                );
                router.push("/urgent-support");
              }}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.cardIconBox,
                  { backgroundColor: colors.danger + "20" },
                ]}
              >
                <MaterialCommunityIcons
                  name="alert-octagon"
                  size={28}
                  color={colors.danger}
                />
              </View>
              <View style={styles.cardInfo}>
                <ThemedText type="h3" style={{ color: colors.danger }}>
                  Crisis Support
                </ThemedText>
                <ThemedText type="small" style={{ color: colors.icon }}>
                  Immediate help is available 24/7.
                </ThemedText>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.danger}
              />
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
              <Animated.View
                key={mood.id}
                entering={FadeInRight.delay(400 + index * 100)}
              >
                <TouchableOpacity
                  style={[
                    styles.moodItem,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                    },
                    selectedMood === mood.id && {
                      borderColor: mood.color,
                      backgroundColor: mood.color + "10",
                      borderWidth: 2,
                    },
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    setSelectedMood(mood.id);
                    router.push("/check-in");
                  }}
                  activeOpacity={0.7}
                >
                  <MaterialIcons
                    name={mood.iconName as any}
                    size={32}
                    color={mood.color}
                  />
                  <ThemedText style={[styles.moodLabel, { color: mood.color }]}>
                    {mood.label}
                  </ThemedText>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </ScrollView>

          {/* Main Action Grid - Premium Crafted Icons */}
          <View style={styles.gridContainer}>
            <Animated.View
              entering={FadeInDown.delay(600)}
              style={styles.gridItem}
            >
              <TouchableOpacity
                style={[
                  styles.actionCard,
                  { backgroundColor: colors.card },
                  PlatformStyles.premiumShadow,
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push("/(tabs)/forum");
                }}
              >
                <LinearGradient
                  colors={["#818CF8", "#4F46E5"]}
                  style={styles.craftedIconBox}
                >
                  <MaterialCommunityIcons
                    name="account-group"
                    size={28}
                    color="#FFF"
                  />
                </LinearGradient>
                <ThemedText type="h3">Forum</ThemedText>
                <ThemedText type="small" style={styles.actionDesc}>
                  PEACE Community
                </ThemedText>
              </TouchableOpacity>
            </Animated.View>

            <Animated.View
              entering={FadeInDown.delay(700)}
              style={styles.gridItem}
            >
              <TouchableOpacity
                style={[
                  styles.actionCard,
                  { backgroundColor: colors.card },
                  PlatformStyles.premiumShadow,
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push("/(tabs)/chat");
                }}
              >
                <LinearGradient
                  colors={["#F472B6", "#DB2777"]}
                  style={styles.craftedIconBox}
                >
                  <MaterialCommunityIcons
                    name="forum-outline"
                    size={28}
                    color="#FFF"
                  />
                </LinearGradient>
                <ThemedText type="h3">Chat</ThemedText>
                <ThemedText type="small" style={styles.actionDesc}>
                  Anonymous Talk
                </ThemedText>
              </TouchableOpacity>
            </Animated.View>

            <Animated.View
              entering={FadeInDown.delay(800)}
              style={styles.gridItem}
            >
              <TouchableOpacity
                style={[
                  styles.actionCard,
                  { backgroundColor: colors.card },
                  PlatformStyles.premiumShadow,
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push("/(tabs)/resources");
                }}
              >
                <LinearGradient
                  colors={["#34D399", "#059669"]}
                  style={styles.craftedIconBox}
                >
                  <MaterialCommunityIcons
                    name="book-open-page-variant"
                    size={28}
                    color="#FFF"
                  />
                </LinearGradient>
                <ThemedText type="h3">Vault</ThemedText>
                <ThemedText type="small" style={styles.actionDesc}>
                  Wellness Library
                </ThemedText>
              </TouchableOpacity>
            </Animated.View>

            <Animated.View
              entering={FadeInDown.delay(900)}
              style={styles.gridItem}
            >
              <TouchableOpacity
                style={[
                  styles.actionCard,
                  { backgroundColor: colors.card },
                  PlatformStyles.premiumShadow,
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push("/book-counsellor");
                }}
              >
                <LinearGradient
                  colors={["#FBBF24", "#D97706"]}
                  style={styles.craftedIconBox}
                >
                  <MaterialCommunityIcons
                    name="hand-heart"
                    size={28}
                    color="#FFF"
                  />
                </LinearGradient>
                <ThemedText type="h3">Help</ThemedText>
                <ThemedText type="small" style={styles.actionDesc}>
                  Seek Council
                </ThemedText>
              </TouchableOpacity>
            </Animated.View>
          </View>

          {/* Peer Educator Special Access */}
          {(userRole === "peer-educator" ||
            userRole === "peer-educator-executive" ||
            userRole === "moderator") && (
            <Animated.View entering={FadeInDown.delay(1000)}>
              <TouchableOpacity
                style={[styles.mentorCard, { backgroundColor: colors.primary }]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  router.push("/peer-educator/dashboard" as any);
                }}
              >
                <View style={styles.mentorInfo}>
                  <ThemedText type="h3" style={{ color: "#FFF" }}>
                    Educator Dashboard
                  </ThemedText>
                  <ThemedText style={{ color: "rgba(255,255,255,0.8)" }}>
                    Manage support and responses
                  </ThemedText>
                </View>
                <View
                  style={[
                    styles.mentorBadge,
                    { backgroundColor: "rgba(255,255,255,0.2)" },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="shield-account"
                    size={28}
                    color="#FFF"
                  />
                </View>
              </TouchableOpacity>
            </Animated.View>
          )}

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Global Action Button - FAB */}
        <Animated.View
          entering={FadeInDown.delay(1200)}
          style={[styles.fabContainer, createShadow(10, colors.primary, 0.4)]}
        >
          <TouchableOpacity
            style={[styles.fab, { backgroundColor: colors.primary }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push("/create-post");
            }}
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
    marginBottom: Spacing.xl,
    overflow: "hidden",
    minHeight: 220, // Taller
  },
  heroContent: {
    flex: 1,
    zIndex: 2,
    justifyContent: "space-between",
  },
  // Decorative Patterns
  patternCircle1: {
    position: "absolute",
    top: -50,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  patternCircle2: {
    position: "absolute",
    bottom: -80,
    left: -20,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  bgIcon: {
    position: "absolute",
    right: -20,
    bottom: -20,
    zIndex: 1,
    transform: [{ rotate: "-15deg" }],
  },
  badgeContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    marginBottom: 16,
  },
  badgeText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 12,
    letterSpacing: 0.5,
  },
  heroTitle: {
    color: "#FFF",
    fontSize: 32,
    marginBottom: Spacing.xs,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 15,
    fontStyle: "italic",
    marginBottom: 24,
    lineHeight: 22,
    opacity: 0.8,
  },
  glassStatsContainer: {
    flexDirection: "row",
    backgroundColor: "rgba(0,0,0,0.15)",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    gap: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  heroStat: {
    alignItems: "flex-start",
  },
  statNumber: {
    color: "#FFF",
    fontSize: 24,
    fontWeight: "800",
  },
  statLabel: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: "rgba(255,255,255,0.2)",
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
});
