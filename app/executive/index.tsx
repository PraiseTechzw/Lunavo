/**
 * Peer Educator Executive Dashboard - "Command Center"
 * Advanced controls for team management, meetings, and global resources.
 * Standalone suite at /executive
 */

import { ThemedText } from "@/app/components/themed-text";
import { ThemedView } from "@/app/components/themed-view";
import {
  Colors,
  PlatformStyles,
  Spacing
} from "@/app/constants/theme";
import { useColorScheme } from "@/app/hooks/use-color-scheme";
import { Resource, User } from "@/app/types";
import { useRoleGuard } from "@/hooks/use-auth-guard";
import { getNetworkStats, getPEUsers, getResources } from "@/lib/database";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

export default function PEExecutiveDashboard() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];

  // Role Guard: Only Executives and Admins
  const { user, loading: authLoading } = useRoleGuard(
    ["peer-educator-executive", "admin"],
    "/peer-educator/dashboard",
  );

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [peTeam, setPeTeam] = useState<User[]>([]);
  const [globalResources, setGlobalResources] = useState<Resource[]>([]);
  const [networkStats, setNetworkStats] = useState({
    totalSessions: 0,
    totalHours: 0,
    activeSessions: 0,
    totalPEs: 0,
  });

  const loadData = useCallback(async () => {
    try {
      const [team, stats, resources] = await Promise.all([
        getPEUsers(),
        getNetworkStats(),
        getResources(),
      ]);
      setPeTeam(team);
      setNetworkStats(stats);
      setGlobalResources(resources.slice(0, 5));
    } catch (e) {
      console.error("Executive Dashboard Load Failure:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) loadData();
  }, [user, loadData]);

  const handleRefresh = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  if (authLoading || loading) {
    return (
      <ThemedView
        style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </ThemedView>
    );
  }

  const StatCard = ({ title, value, icon, color, onPress, index }: any) => (
    <Animated.View entering={FadeInDown.delay(100 + index * 100)}>
      <Pressable
        style={({ pressed }) => [
          styles.statCard,
          {
            backgroundColor: colors.card,
            transform: [{ scale: pressed ? 0.98 : 1 }],
          },
          PlatformStyles.premiumShadow,
        ]}
        onPress={() => {
          Haptics.selectionAsync();
          onPress && onPress();
        }}
      >
        <LinearGradient
          colors={[color + "30", color + "10"]}
          style={styles.statIconContainer}
        >
          <MaterialCommunityIcons name={icon} size={24} color={color} />
        </LinearGradient>
        <View style={styles.statInfo}>
          <ThemedText style={styles.statValue}>{value}</ThemedText>
          <ThemedText style={styles.statLabel}>{title}</ThemedText>
        </View>
        {title === "Active Sessions" && value > 0 && (
          <View style={styles.liveIndicator}>
            <View style={[styles.pulseCircle, { backgroundColor: color }]} />
          </View>
        )}
      </Pressable>
    </Animated.View>
  );

  return (
    <SafeAreaView
      edges={["top"]}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Futuristic Header */}
        <Animated.View entering={FadeInDown} style={styles.header}>
          <View>
            <ThemedText style={styles.headerSubtitle}>COMMAND CENTER</ThemedText>
            <ThemedText style={styles.headerTitle}>Executive Console</ThemedText>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={[styles.premiumIconButton, { backgroundColor: colors.surface }]}
              onPress={() => router.replace("/peer-educator/dashboard")}
            >
              <MaterialCommunityIcons name="view-dashboard-outline" size={24} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.premiumIconButton, { backgroundColor: colors.primary }]}
              onPress={() => router.push("/(tabs)")}
            >
              <MaterialCommunityIcons name="home-variant" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Impact Overview Section */}
        <View style={styles.sectionHeader}>
          <ThemedText style={styles.sectionTitle}>Network Impact</ThemedText>
          <ThemedText style={styles.liveTag}>LIVE UPDATES</ThemedText>
        </View>

        <View style={styles.statsGrid}>
          <StatCard
            index={0}
            title="Active Sessions"
            value={networkStats.activeSessions}
            icon="record-circle-outline"
            color="#EF4444"
            onPress={() => router.push("/peer-educator/ongoing-support")}
          />
          <StatCard
            index={1}
            title="Total Impact"
            value={networkStats.totalSessions}
            icon="heart-pulse"
            color="#EC4899"
            onPress={() => router.push("/executive/analytics")}
          />
          <StatCard
            index={2}
            title="Network Size"
            value={networkStats.totalPEs}
            icon="account-group"
            color="#3B82F6"
            onPress={() => router.push("/executive/members")}
          />
          <StatCard
            index={3}
            title="Service Hours"
            value={Math.round(networkStats.totalHours)}
            icon="clock-check"
            color="#10B981"
            onPress={() => router.push("/executive/events")}
          />
        </View>

        {/* Administration Actions */}
        <ThemedText style={styles.sectionTitle}>Management Suite</ThemedText>
        <View style={styles.actionGrid}>
          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.mainActionCard, { backgroundColor: colors.card }]}
            onPress={() => router.push("/executive/new-resource")}
          >
            <LinearGradient colors={["#6366F1", "#4F46E5"]} style={styles.actionIconBg}>
              <MaterialCommunityIcons name="plus-box" size={32} color="#FFF" />
            </LinearGradient>
            <View style={styles.actionMeta}>
              <ThemedText style={styles.actionLabel}>Resources</ThemedText>
              <ThemedText style={styles.actionDesc}>Publish library content</ThemedText>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.mainActionCard, { backgroundColor: colors.card }]}
            onPress={() => router.push("/executive/new-meeting")}
          >
            <LinearGradient colors={["#F59E0B", "#D97706"]} style={styles.actionIconBg}>
              <MaterialCommunityIcons name="calendar-multiselect" size={32} color="#FFF" />
            </LinearGradient>
            <View style={styles.actionMeta}>
              <ThemedText style={styles.actionLabel}>Meetings</ThemedText>
              <ThemedText style={styles.actionDesc}>Orchestrate PE team</ThemedText>
            </View>
          </TouchableOpacity>
        </View>

        {/* Quick Nav Grid */}
        <View style={styles.quickNavGrid}>
          {[
            { label: "Members", icon: "account-star", color: "#3B82F6", route: "/executive/members" },
            { label: "Events", icon: "calendar-star", color: "#10B981", route: "/executive/events" },
            { label: "Analytics", icon: "chart-arc", color: "#A855F7", route: "/executive/analytics" },
            { label: "News", icon: "bullhorn-variant", color: "#EC4899", route: "/executive/announcements" },
            { label: "Gallery", icon: "image-multiple", color: "#6366F1", route: "/gallery" },
            { label: "Support", icon: "lifebuoy", color: "#F59E0B", route: "/peer-educator/queue" },
          ].map((item, idx) => (
            <TouchableOpacity
              key={idx}
              activeOpacity={0.7}
              style={[styles.navChip, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => router.push(item.route as any)}
            >
              <MaterialCommunityIcons name={item.icon as any} size={22} color={item.color} />
              <ThemedText style={styles.navChipLabel}>{item.label}</ThemedText>
            </TouchableOpacity>
          ))}
        </View>

        {/* Team Activity Section */}
        <View style={styles.sectionHeader}>
          <ThemedText style={styles.sectionTitle}>Force Overview</ThemedText>
          <TouchableOpacity onPress={() => router.push("/executive/members")}>
            <ThemedText style={{ color: colors.primary, fontWeight: "700" }}>Manage Team</ThemedText>
          </TouchableOpacity>
        </View>

        <View style={[styles.teamGlass, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {peTeam.length === 0 ? (
            <View style={styles.emptyTeam}>
              <ThemedText style={{ opacity: 0.5 }}>No educators found in network</ThemedText>
            </View>
          ) : peTeam.slice(0, 4).map((pe, index) => (
            <TouchableOpacity
              key={pe.id}
              style={[
                styles.peListItem,
                index !== peTeam.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border + "50" },
              ]}
              onPress={() => router.push(`/executive/member/${pe.id}` as any)}
            >
              <View style={[styles.peAvatarContainer, { backgroundColor: colors.primary + "10" }]}>
                <ThemedText style={[styles.peInitial, { color: colors.primary }]}>
                  {pe.pseudonym?.charAt(0)}
                </ThemedText>
                <View style={styles.onlineDot} />
              </View>
              <View style={styles.peMeta}>
                <ThemedText style={styles.peName}>{pe.pseudonym}</ThemedText>
                <ThemedText style={styles.peType}>
                  {pe.role === "peer-educator-executive" ? "Executive Leader" : "Peer Educator"}
                </ThemedText>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color={colors.icon} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Footer Space */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Role Navigation Bar (Floating Command Bar) */}
      <View style={styles.commandBarContainer}>
        <LinearGradient
          colors={colorScheme === 'dark' ? ['rgba(30, 41, 59, 0.95)', 'rgba(15, 23, 42, 0.95)'] : ['rgba(255, 255, 255, 0.95)', 'rgba(248, 250, 252, 0.95)']}
          style={[styles.commandBar, PlatformStyles.premiumShadow]}
        >
          <TouchableOpacity onPress={() => router.replace('/(tabs)')} style={styles.commandItem}>
            <MaterialCommunityIcons name="account" size={22} color={colors.icon} />
            <ThemedText style={styles.commandLabel}>Student</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.replace('/peer-educator/dashboard')} style={styles.commandItem}>
            <MaterialCommunityIcons name="view-dashboard" size={22} color={colors.icon} />
            <ThemedText style={styles.commandLabel}>Educator</ThemedText>
          </TouchableOpacity>
          <View style={styles.commandItemActive}>
            <LinearGradient colors={['#6366F1', '#8B5CF6']} style={styles.activeGradient}>
              <MaterialCommunityIcons name="shield-crown" size={24} color="#FFF" />
            </LinearGradient>
            <ThemedText style={[styles.commandLabel, { color: colors.primary, fontWeight: '800' }]}>Executive</ThemedText>
          </View>
        </LinearGradient>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.lg,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xl,
    marginTop: Spacing.sm,
  },
  headerSubtitle: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 2,
    opacity: 0.5,
    color: Colors.light.primary,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  headerActions: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  premiumIconButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    ...PlatformStyles.shadow,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: -0.2,
  },
  liveTag: {
    fontSize: 10,
    fontWeight: "800",
    color: "#EF4444",
    backgroundColor: "#EF444415",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  statCard: {
    width: (width - Spacing.lg * 2 - Spacing.md) / 2,
    padding: Spacing.md,
    borderRadius: 24,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    height: 90,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  statInfo: {
    flex: 1,
  },
  statValue: {
    fontSize: 22,
    fontWeight: "900",
  },
  statLabel: {
    fontSize: 11,
    opacity: 0.5,
    fontWeight: "700",
  },
  liveIndicator: {
    position: "absolute",
    top: 12,
    right: 12,
  },
  pulseCircle: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  actionGrid: {
    gap: Spacing.md,
    marginBottom: Spacing.xl,
    marginTop: Spacing.sm,
  },
  mainActionCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: 24,
    gap: Spacing.lg,
    ...PlatformStyles.premiumShadow,
  },
  actionIconBg: {
    width: 64,
    height: 64,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  actionMeta: {
    flex: 1,
  },
  actionLabel: {
    fontSize: 18,
    fontWeight: "800",
  },
  actionDesc: {
    fontSize: 13,
    opacity: 0.5,
    marginTop: 2,
  },
  quickNavGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  navChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    gap: 10,
    borderWidth: 1,
    minWidth: (width - Spacing.lg * 2 - Spacing.sm * 2) / 3,
  },
  navChipLabel: {
    fontSize: 12,
    fontWeight: "800",
  },
  teamGlass: {
    borderRadius: 28,
    borderWidth: 1,
    overflow: "hidden",
    marginTop: Spacing.sm,
  },
  peListItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    gap: Spacing.md,
  },
  peAvatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  peInitial: {
    fontSize: 18,
    fontWeight: "900",
  },
  onlineDot: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  peMeta: {
    flex: 1,
  },
  peName: {
    fontSize: 16,
    fontWeight: "700",
  },
  peType: {
    fontSize: 12,
    opacity: 0.5,
    marginTop: 1,
  },
  emptyTeam: {
    padding: 40,
    alignItems: 'center',
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
