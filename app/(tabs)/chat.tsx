/**
 * Chat List Screen - Premium Version
 */

import { ThemedText } from "@/app/components/themed-text";
import { ThemedView } from "@/app/components/themed-view";
import {
    BorderRadius,
    Colors,
    PlatformStyles,
    Spacing,
} from "@/app/constants/theme";
import { useColorScheme } from "@/app/hooks/use-color-scheme";
import {
    getCurrentUser,
    getLastSupportMessage,
    getUser,
    getUserSupportSessions,
} from "@/lib/database";
import {
    RealtimeChannel,
    subscribeToMessages,
    subscribeToSupportSessions,
    unsubscribe,
} from "@/lib/realtime";
import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    ScrollView,
    StatusBar,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

interface Chat {
  id: string;
  name: string;
  lastMessage: string;
  time: Date;
  unread: number;
  isOnline?: boolean;
  lastMessageType?: "text" | "image" | "voice" | "system";
  avatar?: string;
  accentColor?: string;
}

export default function ChatListScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "unread" | "online">(
    "all",
  );
  const [messageChannels, setMessageChannels] = useState<
    Record<string, RealtimeChannel>
  >({});

  useEffect(() => {
    fetchChats();

    const channel = subscribeToSupportSessions(() => {
      fetchChats(); // Refresh when any session changes (e.g. preview update)
    });

    return () => {
      unsubscribe(channel);
      Object.values(messageChannels).forEach(unsubscribe);
    };
  }, []);

  const fetchChats = async () => {
    try {
      const user = await getCurrentUser();
      if (!user) return;

      const sessions = await getUserSupportSessions(user.id);

      const mappedChats: Chat[] = await Promise.all(
        sessions.map(async (session) => {
          let displayName = "Anonymous Peer";
          if (session.educator_id) {
            const educator = await getUser(session.educator_id);
            if (educator) displayName = educator.pseudonym;
          }

          const lastMsg = await getLastSupportMessage(session.id);

          return {
            id: session.id,
            name: displayName,
            lastMessage:
              lastMsg?.content || session.preview || "No messages yet",
            time: lastMsg
              ? new Date(lastMsg.created_at)
              : new Date(session.created_at),
            unread: 0, // TODO: Implement unread count
            isOnline: lastMsg
              ? Date.now() - new Date(lastMsg.created_at).getTime() <
                2 * 60 * 1000
              : false,
            lastMessageType: "text",
            accentColor: session.priority === "urgent" ? "#EF4444" : "#6366F1",
          };
        }),
      );

      setChats(mappedChats);
      const channels: Record<string, RealtimeChannel> = {};
      mappedChats.forEach((chat) => {
        if (!messageChannels[chat.id]) {
          const ch = subscribeToMessages(chat.id, (msg) => {
            setChats((prev) =>
              prev.map((c) => {
                if (c.id !== chat.id) return c;
                const isIncoming = msg.sender_id && msg.sender_id !== user?.id;
                const newTime = new Date(msg.created_at);
                return {
                  ...c,
                  lastMessage: msg.content,
                  time: newTime,
                  unread: isIncoming ? c.unread + 1 : c.unread,
                  isOnline: Date.now() - newTime.getTime() < 2 * 60 * 1000,
                };
              }),
            );
          });
          channels[chat.id] = ch;
        }
      });
      if (Object.keys(channels).length > 0) {
        setMessageChannels((prev) => ({ ...prev, ...channels }));
      }
    } catch (error) {
      console.error("Error fetching chats:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filteredChats = chats.filter((chat) => {
    const matchesSearch =
      chat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chat.lastMessage.toLowerCase().includes(searchQuery.toLowerCase());

    if (activeFilter === "unread") return matchesSearch && chat.unread > 0;
    if (activeFilter === "online") return matchesSearch && chat.isOnline;
    return matchesSearch;
  });

  const formatTime = (date: Date): string => {
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    if (diffInHours < 24) return format(date, "h:mm a");
    if (diffInHours < 48) return "Yesterday";
    return format(date, "MMM d");
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    fetchChats();
  };

  const renderChatItem = ({ item, index }: { item: Chat; index: number }) => (
    <Animated.View entering={FadeInDown.delay(index * 100).duration(600)}>
      <TouchableOpacity
        style={[styles.chatCard, { backgroundColor: colors.card }]}
        onPress={() => {
          setChats((prev) =>
            prev.map((c) => (c.id === item.id ? { ...c, unread: 0 } : c)),
          );
          router.push(`/chat/${item.id}`);
        }}
        activeOpacity={0.8}
      >
        <View style={styles.avatarWrapper}>
          <LinearGradient
            colors={[
              item.accentColor || colors.primary,
              (item.accentColor || colors.primary) + "80",
            ]}
            style={styles.avatarGradient}
          >
            <Ionicons name="person-outline" size={24} color="#FFF" />
          </LinearGradient>
          {item.isOnline && (
            <View
              style={[styles.onlineStatus, { backgroundColor: colors.success }]}
            />
          )}
        </View>

        <View style={styles.chatInfo}>
          <View style={styles.chatRow}>
            <ThemedText
              type="h3"
              style={[
                styles.chatName,
                item.unread > 0 && { color: colors.primary },
              ]}
            >
              {item.name}
            </ThemedText>
            <ThemedText style={[styles.chatTime, { color: colors.icon }]}>
              {formatTime(item.time)}
            </ThemedText>
          </View>

          <View style={styles.chatRow}>
            <ThemedText
              style={[
                styles.lastMsg,
                { color: item.unread > 0 ? colors.text : colors.icon },
                item.unread > 0 && { fontWeight: "600" },
              ]}
              numberOfLines={1}
            >
              {item.lastMessageType === "image" ? "📎 Media" : item.lastMessage}
            </ThemedText>
            {item.unread > 0 && (
              <LinearGradient
                colors={[colors.primary, colors.secondary]}
                style={styles.unreadBadge}
              >
                <ThemedText style={styles.unreadText}>{item.unread}</ThemedText>
              </LinearGradient>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <StatusBar
        barStyle={colorScheme === "dark" ? "light-content" : "dark-content"}
      />
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <ThemedText type="h1">Messages</ThemedText>
          <TouchableOpacity
            style={styles.headerAction}
            onPress={() => router.push("/mentorship")}
          >
            <Ionicons name="create-outline" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.searchBox}>
          <View
            style={[
              styles.searchBar,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Ionicons name="search" size={20} color={colors.icon} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search conversations..."
              placeholderTextColor={colors.icon}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        <View style={styles.filterSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterContent}
          >
            {[
              { id: "all", label: "All", icon: "chatbubbles" },
              { id: "unread", label: "Unread", icon: "notifications" },
              { id: "online", label: "Online", icon: "radio-button-on" },
            ].map((filter) => (
              <TouchableOpacity
                key={filter.id}
                onPress={() => {
                  setActiveFilter(filter.id as any);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                  activeFilter === filter.id && {
                    backgroundColor: colors.primary,
                    borderColor: colors.primary,
                  },
                ]}
              >
                <Ionicons
                  name={filter.icon as any}
                  size={16}
                  color={activeFilter === filter.id ? "#FFF" : colors.icon}
                  style={{ marginRight: 6 }}
                />
                <ThemedText
                  style={[
                    styles.filterChipText,
                    { color: colors.text },
                    activeFilter === filter.id && { color: "#FFF" },
                  ]}
                >
                  {filter.label}
                </ThemedText>
                {filter.id === "unread" && chats.some((c) => c.unread > 0) && (
                  <View style={styles.miniBadge} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <FlatList
          data={filteredChats}
          renderItem={renderChatItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listPadding}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            loading ? (
              <View style={styles.emptyContent}>
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            ) : (
              <View style={styles.emptyContent}>
                <Ionicons
                  name="chatbubbles-outline"
                  size={80}
                  color={colors.icon + "40"}
                />
                <ThemedText type="h2" style={{ marginTop: Spacing.md }}>
                  Silence is key.
                </ThemedText>
                <ThemedText style={{ color: colors.icon, textAlign: "center" }}>
                  Your private conversations will appear here.
                </ThemedText>
              </View>
            )
          }
        />
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
  header: {
    padding: Spacing.lg,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerAction: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  searchBox: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    height: 50,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    marginLeft: Spacing.sm,
    fontSize: 16,
  },
  listPadding: {
    padding: Spacing.lg,
    paddingBottom: 40,
  },
  chatCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.xxl,
    marginBottom: Spacing.md,
    ...PlatformStyles.shadow,
  },
  avatarWrapper: {
    position: "relative",
    marginRight: Spacing.md,
  },
  avatarGradient: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.xl,
    justifyContent: "center",
    alignItems: "center",
  },
  onlineStatus: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: "#FFF",
  },
  chatInfo: {
    flex: 1,
    justifyContent: "center",
  },
  chatRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 2,
  },
  chatName: {
    fontSize: 18,
  },
  chatTime: {
    fontSize: 12,
  },
  lastMsg: {
    fontSize: 14,
    flex: 1,
    marginRight: Spacing.md,
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
  },
  unreadText: {
    color: "#FFF",
    fontSize: 10,
    fontWeight: "800",
  },
  emptyContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 100,
  },
  filterSection: {
    marginBottom: Spacing.md,
  },
  filterContent: {
    paddingHorizontal: Spacing.lg,
    gap: 10,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: "700",
  },
  miniBadge: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#FF4B4B",
    marginLeft: 4,
  },
});
