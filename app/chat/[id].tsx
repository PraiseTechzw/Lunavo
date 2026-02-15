import { ThemedText } from "@/app/components/themed-text";
import { ThemedView } from "@/app/components/themed-view";
import {
  BorderRadius,
  Colors,
  PlatformStyles,
  Spacing,
} from "@/app/constants/theme";
import { useColorScheme } from "@/app/hooks/use-color-scheme";
import { SupportMessage, SupportSession } from "@/app/types";
import { createInputStyle, getCursorStyle } from "@/app/utils/platform-styles";
import {
  getCurrentUser,
  getSupportMessages,
  getSupportSessions,
  getUser,
  sendSupportMessage,
  updateSupportSession
} from "@/lib/database";
import {
  sendReaction,
  sendTyping,
  subscribeToMessages,
  subscribeToReactions,
  subscribeToTyping,
  unsubscribe,
} from "@/lib/realtime";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";


export default function ChatDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const bubbleMaxWidth = Math.min(
    Math.round(Dimensions.get("window").width * 0.78),
    420,
  );

  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList<SupportMessage>>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [supporterTyping, setSupporterTyping] = useState(false);
  const typingTimeoutRef = useRef<any>(null);
  const [reactions, setReactions] = useState<Record<string, string[]>>({});
  const [session, setSession] = useState<SupportSession | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [educator, setEducator] = useState<any | null>(null);
  const insets = useSafeAreaInsets();
  const [kbHeight, setKbHeight] = useState(0);
  const [kbVisible, setKbVisible] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const user = await getCurrentUser();
        setUserId(user?.id || null);
        setRole(user?.role || null);
        const initial = await getSupportMessages(id as string);
        setMessages(initial);
        const all = await getSupportSessions();
        const meta = (all || []).find((s) => s.id === (id as string)) || null;
        setSession(meta);
        if (meta?.educator_id) {
          const edu = await getUser(meta.educator_id);
          setEducator(edu || null);
        } else {
          setEducator(null);
        }
      } catch (error) {
        console.error("Error loading messages:", error);
      } finally {
        setLoading(false);
        scrollToEnd();
      }
    };
    init();

    const channel = subscribeToMessages(id as string, (msg) => {
      setMessages((prev) => [...prev, msg]);
      scrollToEnd();
    });
    const typingChannel = subscribeToTyping(id as string, () => {
      setSupporterTyping(true);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(
        () => setSupporterTyping(false),
        1500,
      );
    });
    const reactionsChannel = subscribeToReactions(
      id as string,
      ({ messageId, emoji }) => {
        setReactions((prev) => {
          const arr = prev[messageId] ? [...prev[messageId]] : [];
          arr.push(emoji);
          return { ...prev, [messageId]: arr };
        });
      },
    );
    return () => {
      unsubscribe(channel);
      unsubscribe(typingChannel);
      unsubscribe(reactionsChannel);
    };
  }, [id]);

  useEffect(() => {
    const showSub = Keyboard.addListener("keyboardDidShow", (e) => {
      setKbHeight(e.endCoordinates?.height || 0);
      setKbVisible(true);
      scrollToEnd();
    });
    const hideSub = Keyboard.addListener("keyboardDidHide", () => {
      setKbHeight(0);
      setKbVisible(false);
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const scrollToEnd = () => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 50);
  };

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || !userId) return;
    setSending(true);
    try {
      const optimistic: SupportMessage = {
        id: `temp-${Date.now()}`,
        session_id: id as string,
        sender_id: userId,
        content: trimmed,
        type: "text",
        is_read: false,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, optimistic]);
      const sent = await sendSupportMessage({
        session_id: optimistic.session_id,
        sender_id: optimistic.sender_id,
        content: optimistic.content,
        type: "text",
      });
      setMessages((prev) =>
        prev.filter((m) => m.id !== optimistic.id).concat(sent),
      );
      setInput("");
      scrollToEnd();
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setSending(false);
    }
  };

  const handleInputChange = (text: string) => {
    setInput(text);
    if (userId) {
      sendTyping(id as string, userId);
    }
  };

  const handlePickImage = async () => {
    if (!userId) return;
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.6,
      base64: true,
    });
    if (result.canceled || !result.assets?.length) return;
    const asset = result.assets[0];
    const uri = asset.uri;
    try {
      const base64 = asset.base64 || "";
      if (!base64) return;
      const mime =
        asset.type === "image" ? asset.mimeType || "image/jpeg" : "image/jpeg";
      const dataUri = `data:${mime};base64,${base64}`;
      const optimistic: SupportMessage = {
        id: `temp-${Date.now()}`,
        session_id: id as string,
        sender_id: userId,
        content: dataUri,
        type: "image",
        is_read: false,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, optimistic]);
      const sent = await sendSupportMessage({
        session_id: optimistic.session_id,
        sender_id: optimistic.sender_id,
        content: optimistic.content,
        type: "image",
      });
      setMessages((prev) =>
        prev.filter((m) => m.id !== optimistic.id).concat(sent),
      );
      scrollToEnd();
    } catch (e) {
      console.error("Error sending image:", e);
    }
  };

  const formatStamp = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };
  const priorityColor = (p?: string) =>
    p === "urgent" ? "#EF4444" : "#6366F1";
  const canUseSupportTools =
    role === "peer-educator" ||
    role === "peer-educator-executive" ||
    role === "counselor" ||
    role === "life-coach" ||
    role === "admin";
  const handleResolve = async () => {
    try {
      if (!id) return;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await updateSupportSession(id as string, {
        status: "resolved",
        resolved_at: new Date().toISOString(),
      });
      router.back();
    } catch (e) {
      console.error("Error resolving session:", e);
    }
  };
  const handleScheduleMeeting = () => {
    Haptics.selectionAsync();
    if (role === "peer-educator-executive" || role === "admin") {
      router.push("/executive/new-meeting" as any);
    } else {
      router.push("/peer-educator/meetings" as any);
    }
  };

  const renderItem = ({
    item,
    index,
  }: {
    item: SupportMessage;
    index: number;
  }) => {
    const isMine = item.sender_id === userId;
    const showIncomingLabel = !!item.sender_id && item.sender_id !== userId;
    const supporterLabel =
      educator?.role === "counselor"
        ? "Counselor"
        : educator?.role === "peer-educator" ||
          educator?.role === "peer-educator-executive"
          ? "Peer Educator"
          : educator?.role === "life-coach"
            ? "Life Coach"
            : "Supporter";
    const showDateDivider =
      index === 0 ||
      new Date(messages[index - 1].created_at).toDateString() !==
      new Date(item.created_at).toDateString();
    const isDelivered = !String(item.id).startsWith("temp-");
    const isRead = !!item.is_read;
    return (
      <View>
        {showDateDivider && (
          <View style={styles.dateDivider}>
            <ThemedText type="small" style={{ color: colors.icon }}>
              {new Date(item.created_at).toDateString()}
            </ThemedText>
          </View>
        )}
        <View
          style={[styles.messageRow, isMine ? styles.mineRow : styles.theirRow]}
        >
          {!isMine && showIncomingLabel && (
            <View style={styles.labelWrap}>
              <ThemedText style={styles.labelText}>{supporterLabel}</ThemedText>
            </View>
          )}
          <TouchableOpacity
            activeOpacity={0.9}
            onLongPress={() => {
              if (userId) {
                sendReaction(id as string, item.id, "❤️", userId);
              }
            }}
          >
            {isMine ? (
              <LinearGradient
                colors={[colors.primary, colors.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[
                  styles.bubble,
                  styles.mineBubble,
                  { maxWidth: bubbleMaxWidth },
                ]}
              >
                {item.type === "image" ? (
                  <Image
                    source={{ uri: item.content }}
                    style={{ width: 220, height: 160, borderRadius: 12 }}
                    contentFit="cover"
                  />
                ) : (
                  <ThemedText style={{ color: "#FFF" }}>
                    {item.content}
                  </ThemedText>
                )}
                {isMine && (
                  <View style={styles.ticks}>
                    {isRead ? (
                      <Ionicons
                        name="checkmark-done"
                        size={14}
                        color="#E0F2F1"
                      />
                    ) : isDelivered ? (
                      <Ionicons name="checkmark" size={14} color="#E0F2F1" />
                    ) : (
                      <ActivityIndicator size="small" color="#E0F2F1" />
                    )}
                  </View>
                )}
                {reactions[item.id]?.length ? (
                  <View style={styles.reactionBadge}>
                    <ThemedText style={{ color: "#FFF" }}>
                      {reactions[item.id].join(" ")}
                    </ThemedText>
                  </View>
                ) : null}
              </LinearGradient>
            ) : (
              <View
                style={[
                  {
                    maxWidth: bubbleMaxWidth,
                    paddingHorizontal: Spacing.md,
                    paddingVertical: Spacing.sm,
                    borderRadius: BorderRadius.lg,
                    borderWidth: 1,
                    marginHorizontal: Spacing.sm,
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                  },
                  PlatformStyles.shadow,
                ]}
              >
                {item.type === "image" ? (
                  <Image
                    source={{ uri: item.content }}
                    style={{ width: 220, height: 160, borderRadius: 12 }}
                    contentFit="cover"
                  />
                ) : (
                  <ThemedText style={{ color: colors.text }}>
                    {item.content}
                  </ThemedText>
                )}
                {reactions[item.id]?.length ? (
                  <View style={styles.reactionBadge}>
                    <ThemedText style={{ color: colors.text }}>
                      {reactions[item.id].join(" ")}
                    </ThemedText>
                  </View>
                ) : null}
              </View>
            )}
          </TouchableOpacity>
          {isMine && (
            <View style={styles.labelWrap}>
              <ThemedText style={styles.labelText}>You</ThemedText>
            </View>
          )}
        </View>
        <View
          style={[
            styles.timeRow,
            { justifyContent: isMine ? "flex-end" : "flex-start" },
          ]}
        >
          <ThemedText type="small" style={{ color: colors.icon }}>
            {formatStamp(item.created_at)}
          </ThemedText>
        </View>
      </View>
    );
  };

  const last = messages[messages.length - 1];
  const isOnline =
    !!last && Date.now() - new Date(last.created_at).getTime() < 2 * 60 * 1000;
  const counterpartName =
    role === "student"
      ? educator?.pseudonym || "Supporter"
      : session?.student_pseudonym || "Anonymous Chat";
  const secondaryLabel =
    (session?.category ? String(session.category).toUpperCase() : "PERSONAL") +
    ` • ${messages.length} MSGS`;

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.safeArea}>
      <ThemedView style={styles.container}>
        <View
          style={[
            styles.headerBar,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={styles.headerLeft}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={getCursorStyle()}
            >
              <Ionicons name="chevron-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <View
              style={[styles.headerAvatar, { backgroundColor: colors.primary }]}
            >
              <Ionicons name="person-outline" size={18} color="#FFF" />
            </View>
            <View style={styles.headerInfo}>
              <ThemedText style={styles.headerTitle}>
                {counterpartName}
              </ThemedText>
              <ThemedText type="small" style={{ opacity: 0.6 }}>
                {secondaryLabel}
              </ThemedText>
            </View>
          </View>
          <View style={styles.headerRight}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: isOnline ? "#10B981" : colors.icon },
              ]}
            />
            <ThemedText type="small" style={{ opacity: 0.6 }}>
              {isOnline ? "Online" : "Offline"}
            </ThemedText>
            {session?.priority && (
              <View
                style={[
                  styles.priorityChip,
                  { borderColor: priorityColor(session.priority) },
                ]}
              >
                <ThemedText
                  type="small"
                  style={{
                    color: priorityColor(session.priority),
                    fontWeight: "700",
                  }}
                >
                  {String(session.priority).toUpperCase()}
                </ThemedText>
              </View>
            )}
          </View>
        </View>

        {canUseSupportTools && (
          <View style={[styles.toolsRow, { backgroundColor: colors.surface }]}>
            <TouchableOpacity
              style={[styles.toolChip, { borderColor: colors.border }]}
              onPress={() => router.push("/(tabs)/resources" as any)}
            >
              <Ionicons name="book" size={16} color={colors.primary} />
              <ThemedText style={styles.toolChipText}>Resources</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toolChip, { borderColor: colors.border }]}
              onPress={() => router.push("/urgent-support" as any)}
            >
              <Ionicons name="shield-checkmark" size={16} color="#EF4444" />
              <ThemedText style={styles.toolChipText}>Urgent</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toolChip, { borderColor: colors.border }]}
              onPress={handleScheduleMeeting}
            >
              <Ionicons name="calendar" size={16} color="#F59E0B" />
              <ThemedText style={styles.toolChipText}>Meeting</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toolChip, { borderColor: colors.border }]}
              onPress={handleResolve}
            >
              <Ionicons name="checkmark-done" size={16} color="#10B981" />
              <ThemedText style={styles.toolChipText}>Resolve</ThemedText>
            </TouchableOpacity>
          </View>
        )}

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator />
          </View>
        ) : (
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ flex: 1 }}
            keyboardVerticalOffset={Platform.OS === "ios" ? insets.bottom : 0}
          >
            <FlatList
              ref={flatListRef}
              data={messages}
              renderItem={renderItem}
              keyExtractor={(m) => m.id}
              contentContainerStyle={[
                styles.messagesList,
                { paddingBottom: 120 },
              ]}
              onContentSizeChange={scrollToEnd}
              keyboardShouldPersistTaps="handled"
            />

            <View
              style={[
                styles.inputContainer,
                { backgroundColor: 'transparent' }, // Transparent to let background show
                {
                  marginBottom:
                    Platform.OS === "android" && kbVisible
                      ? Math.max(kbHeight - insets.bottom, 0)
                      : 0,
                },
              ]}
            >
              <View style={[styles.inputPill, { backgroundColor: colors.surface, borderColor: colors.border, paddingBottom: 0 }]}>
                <TouchableOpacity
                  onPress={handlePickImage}
                  style={styles.attachBtn}
                >
                  <Ionicons name="add-circle" size={32} color={colors.primary} />
                </TouchableOpacity>
                <TextInput
                  style={[
                    styles.input,
                    createInputStyle(),
                    { color: colors.text }
                  ]}
                  placeholder="Message..."
                  placeholderTextColor={colors.icon}
                  value={input}
                  onChangeText={handleInputChange}
                  onFocus={scrollToEnd}
                  returnKeyType="send"
                  onSubmitEditing={handleSend}
                  blurOnSubmit={false}
                  underlineColorAndroid="transparent"
                  multiline
                />
                <TouchableOpacity
                  style={[styles.sendBtn, { backgroundColor: sending || !input.trim() ? colors.surface : colors.primary }]}
                  onPress={handleSend}
                  disabled={sending || !input.trim()}
                  activeOpacity={0.8}
                >
                  {sending ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <Ionicons name="arrow-up" size={20} color={!input.trim() ? colors.icon : "#FFF"} />
                  )}
                </TouchableOpacity>
              </View>
            </View>
            {supporterTyping && (
              <View
                style={{
                  paddingHorizontal: Spacing.lg,
                  paddingVertical: Spacing.xs,
                  position: 'absolute',
                  bottom: 80,
                  left: 0,
                }}
              >
                <ThemedText type="small" style={{ color: colors.icon, fontStyle: 'italic' }}>
                  Typing...
                </ThemedText>
              </View>
            )}
          </KeyboardAvoidingView>
        )}
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  headerTitle: {
    fontWeight: "700",
    fontSize: 17,
    lineHeight: 22,
  },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  headerInfo: {
    marginLeft: 6,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  priorityChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  toolsRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 8,
    marginTop: 4,
  },
  toolChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: 999,
    marginRight: Spacing.sm,
    borderWidth: 2,
  },
  toolChipText: {
    fontWeight: "700",
    fontSize: 12,
  },
  loadingBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  messagesList: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xl,
    paddingTop: 10,
  },
  dateDivider: {
    alignSelf: "center",
    marginVertical: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.03)",
  },
  messageRow: {
    marginVertical: 2,
    paddingHorizontal: 4,
  },
  mineRow: {
    alignItems: "flex-end",
  },
  theirRow: {
    alignItems: "flex-start",
  },
  bubble: {
    maxWidth: "75%",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginHorizontal: 0,
  },
  mineBubble: {
    borderBottomRightRadius: 4,
    ...PlatformStyles.premiumShadow,
  },
  theirBubble: {
    borderBottomLeftRadius: 4,
  },
  ticks: {
    position: "absolute",
    right: 8,
    bottom: 6,
    flexDirection: "row",
    gap: 4,
  },
  reactionBadge: {
    position: "absolute",
    left: 8,
    bottom: -18,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  labelWrap: {
    marginLeft: 4,
    marginBottom: 2,
  },
  labelText: {
    fontSize: 11,
    opacity: 0.7,
  },
  timeRow: {
    marginBottom: 8,
    paddingHorizontal: 4,
    opacity: 0.5,
  },
  inputContainer: {
    padding: Spacing.md,
  },
  inputPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 30,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  attachBtn: {
    marginLeft: 4,
  },
  input: {
    flex: 1,
    maxHeight: 100,
    paddingHorizontal: 8,
    fontSize: 16,
    paddingVertical: 10,
  },
  sendBtn: {
    height: 36,
    width: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 4,
  },
});
