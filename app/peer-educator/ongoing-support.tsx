import { ThemedText } from "@/app/components/themed-text";
import { ThemedView } from "@/app/components/themed-view";
import { BorderRadius, Colors, PlatformStyles, Spacing } from "@/app/constants/theme";
import { useColorScheme } from "@/app/hooks/use-color-scheme";
import { SupportSession } from "@/app/types";
import { useRoleGuard } from "@/hooks/use-auth-guard";
import { getCurrentUser, getLastSupportMessage, getSupportSessions } from "@/lib/database";
import { subscribeToSupportSessions, unsubscribe } from "@/lib/realtime";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

export default function OngoingSupportScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];

  const { user, loading: authLoading } = useRoleGuard(
    ["peer-educator", "peer-educator-executive", "admin"],
    "/(tabs)",
  );

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sessions, setSessions] = useState<SupportSession[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "urgent" | "normal">("all");
  const [lastMessages, setLastMessages] = useState<Record<string, string>>({});

  const loadSessions = useCallback(async () => {
    try {
      const currentUser = await getCurrentUser();
      if (!currentUser) return;
      const active = await getSupportSessions("active");
      const mine = active.filter((s) => s.educator_id === currentUser.id);
      setSessions(mine);
      const previews: Record<string, string> = {};
      await Promise.all(
        mine.map(async (s) => {
          const last = await getLastSupportMessage(s.id).catch(() => null);
          if (last) previews[s.id] = last.content;
        }),
      );
      setLastMessages(previews);
    } catch (e) {
      console.error("Failed to load active sessions:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (user) loadSessions();
  }, [user, loadSessions]);

  useEffect(() => {
    const channel = subscribeToSupportSessions(() => {
      loadSessions();
    });
    return () => unsubscribe(channel);
  }, [loadSessions]);

  const filtered = useMemo(() => {
    return sessions.filter((s) => {
      const matchesFilter =
        filter === "all" ? true : s.priority === filter;
      const display =
        s.student_pseudonym?.toLowerCase().includes(search.toLowerCase()) ||
        (lastMessages[s.id] || "").toLowerCase().includes(search.toLowerCase()) ||
        (s.category || "").toLowerCase().includes(search.toLowerCase());
      return matchesFilter && display;
    });
  }, [sessions, search, filter, lastMessages]);

  const priorityColor = (p?: string) =>
    p === "urgent" ? "#EF4444" : "#6366F1";

  const handleRefresh = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    await loadSessions();
  };

  if (authLoading || loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.background }}>
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <View>
            <ThemedText style={styles.title}>Ongoing Support</ThemedText>
            <ThemedText style={[styles.subtitle, { color: colors.icon }]}>
              Active, anonymous sessions assigned to you
            </ThemedText>
          </View>
          <TouchableOpacity
            style={[styles.newBtn, { backgroundColor: colors.card }]}
            onPress={() => router.push("/mentorship")}
          >
            <MaterialCommunityIcons name="account-plus" size={22} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <View style={[styles.searchBox, { backgroundColor: colors.card }]}>
            <MaterialCommunityIcons name="magnify" size={20} color={colors.icon} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search by name, category, message"
              placeholderTextColor={colors.icon}
              style={{ flex: 1, paddingHorizontal: 8 }}
            />
          </View>
          <View style={styles.filterRow}>
            {[
              { id: "all", label: "All" },
              { id: "urgent", label: "Urgent" },
              { id: "normal", label: "Normal" },
            ].map((opt) => (
              <TouchableOpacity
                key={opt.id}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor:
                      filter === (opt.id as any)
                        ? colors.primary + "20"
                        : colors.card,
                    borderColor:
                      filter === (opt.id as any)
                        ? colors.primary + "50"
                        : colors.border || "transparent",
                  },
                ]}
                onPress={() => setFilter(opt.id as any)}
              >
                <ThemedText
                  style={{
                    color:
                      filter === (opt.id as any) ? colors.primary : colors.text,
                    fontWeight: "700",
                  }}
                >
                  {opt.label}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Active Sessions */}
        <ScrollView
          contentContainerStyle={{ paddingBottom: Spacing.xl }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {filtered.length === 0 ? (
            <View style={[styles.empty, { backgroundColor: colors.card }]}>
              <MaterialCommunityIcons name="chat-alert" size={22} color={colors.icon} />
              <ThemedText style={{ color: colors.icon, fontWeight: "600" }}>
                No active sessions
              </ThemedText>
            </View>
          ) : (
            filtered.map((s, i) => (
              <Animated.View key={s.id} entering={FadeInDown.delay(i * 80)}>
                <TouchableOpacity
                  style={[styles.sessionCard, { backgroundColor: colors.card }]}
                  onPress={() => router.push(`/chat/${s.id}`)}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={[priorityColor(s.priority) + "20", priorityColor(s.priority) + "08"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.priorityStrip}
                  />
                  <View style={styles.sessionMain}>
                    <View style={styles.nameRow}>
                      <ThemedText style={styles.nameText}>{s.student_pseudonym}</ThemedText>
                      <View style={[styles.pBadge, { backgroundColor: priorityColor(s.priority) + "15" }]}>
                        <ThemedText style={[styles.pText, { color: priorityColor(s.priority) }]}>{s.priority}</ThemedText>
                      </View>
                    </View>
                    <ThemedText numberOfLines={1} style={[styles.previewText, { color: colors.icon }]}>
                      {lastMessages[s.id] || s.preview || "No messages yet"}
                    </ThemedText>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={20} color={colors.icon} />
                </TouchableOpacity>
              </Animated.View>
            ))
          )}
        </ScrollView>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.md,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
  },
  subtitle: {
    fontSize: 13,
    opacity: 0.7,
  },
  newBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    ...PlatformStyles.shadow,
  },
  controls: {
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    ...PlatformStyles.shadow,
  },
  filterRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  empty: {
    height: 120,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    ...PlatformStyles.shadow,
  },
  sessionCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
    ...PlatformStyles.shadow,
  },
  priorityStrip: {
    width: 6,
    height: "100%",
    borderRadius: 6,
  },
  sessionMain: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: 4,
  },
  nameText: {
    fontWeight: "700",
    fontSize: 15,
  },
  previewText: {
    fontSize: 12,
  },
  pBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  pText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "capitalize",
  },
});
