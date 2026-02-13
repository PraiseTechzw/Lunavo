import { ThemedText } from "@/app/components/themed-text";
import { ThemedView } from "@/app/components/themed-view";
import {
    BorderRadius,
    Colors,
    PlatformStyles,
    Spacing,
} from "@/app/constants/theme";
import { useColorScheme } from "@/app/hooks/use-color-scheme";
import { SupportMessage } from "@/app/types";
import { createInputStyle, getCursorStyle } from "@/app/utils/platform-styles";
import {
    getCurrentUser,
    getSupportMessages,
    sendSupportMessage,
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
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ChatDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];

  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList<SupportMessage>>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [supporterTyping, setSupporterTyping] = useState(false);
  const typingTimeoutRef = useRef<any>(null);
  const [reactions, setReactions] = useState<Record<string, string[]>>({});

  useEffect(() => {
    const init = async () => {
      try {
        const user = await getCurrentUser();
        setUserId(user?.id || null);
        const initial = await getSupportMessages(id as string);
        setMessages(initial);
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
      // Preview update removed to avoid RLS violations; list derives preview from last message
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
      base64: false,
    });
    if (result.canceled || !result.assets?.length) return;
    const asset = result.assets[0];
    const uri = asset.uri;
    try {
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
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

  const renderItem = ({
    item,
    index,
  }: {
    item: SupportMessage;
    index: number;
  }) => {
    const isMine = item.sender_id === userId;
    const showDateDivider =
      index === 0 ||
      new Date(messages[index - 1].created_at).toDateString() !==
        new Date(item.created_at).toDateString();
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
          {!isMine && (
            <View style={styles.labelWrap}>
              <ThemedText style={styles.labelText}>Supporter</ThemedText>
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
            <View
              style={[
                styles.bubble,
                {
                  backgroundColor: isMine ? colors.primary : colors.card,
                  borderColor: isMine ? colors.primary : colors.border,
                },
              ]}
            >
              {item.type === "image" ? (
                <Image
                  source={{ uri: item.content }}
                  style={{ width: 220, height: 160, borderRadius: 12 }}
                  contentFit="cover"
                />
              ) : (
                <ThemedText style={{ color: isMine ? "#FFF" : colors.text }}>
                  {item.content}
                </ThemedText>
              )}
              {reactions[item.id]?.length ? (
                <View style={styles.reactionBadge}>
                  <ThemedText style={{ color: isMine ? "#FFF" : colors.text }}>
                    {reactions[item.id].join(" ")}
                  </ThemedText>
                </View>
              ) : null}
            </View>
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

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <ThemedView style={styles.container}>
        <View style={[styles.header, { backgroundColor: colors.background }]}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={getCursorStyle()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <ThemedText type="h2" style={styles.headerTitle}>
            Anonymous Chat
          </ThemedText>
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator />
          </View>
        ) : (
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={{ flex: 1 }}
            keyboardVerticalOffset={80}
          >
            <FlatList
              ref={flatListRef}
              data={messages}
              renderItem={renderItem}
              keyExtractor={(m) => m.id}
              contentContainerStyle={styles.messagesList}
              onContentSizeChange={scrollToEnd}
            />

            <View
              style={[
                styles.inputRow,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <TouchableOpacity
                onPress={handlePickImage}
                style={[
                  styles.attachBtn,
                  { borderColor: colors.border, backgroundColor: colors.card },
                ]}
              >
                <Ionicons name="image-outline" size={18} color={colors.icon} />
              </TouchableOpacity>
              <TextInput
                style={[
                  styles.input,
                  createInputStyle(),
                  { color: colors.text },
                ]}
                placeholder="Type a message..."
                placeholderTextColor={colors.icon}
                value={input}
                onChangeText={handleInputChange}
              />
              <TouchableOpacity
                style={[styles.sendBtn, { backgroundColor: colors.primary }]}
                onPress={handleSend}
                disabled={sending}
                activeOpacity={0.8}
              >
                {sending ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Ionicons name="send" size={18} color="#FFF" />
                )}
              </TouchableOpacity>
            </View>
            {supporterTyping && (
              <View
                style={{
                  paddingHorizontal: Spacing.lg,
                  paddingVertical: Spacing.xs,
                }}
              >
                <ThemedText type="small" style={{ color: colors.icon }}>
                  Supporter is typing…
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
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  headerTitle: { fontWeight: "900" },
  labelWrap: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    marginHorizontal: 6,
  },
  labelText: {
    fontSize: 10,
    opacity: 0.6,
  },
  loadingBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  messagesList: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  messageRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: Spacing.sm,
  },
  mineRow: {
    justifyContent: "flex-end",
  },
  theirRow: {
    justifyContent: "flex-start",
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    ...PlatformStyles.premiumShadow,
  },
  bubble: {
    maxWidth: "70%",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginHorizontal: Spacing.sm,
  },
  reactionBadge: {
    position: "absolute",
    bottom: -10,
    right: -10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  timeRow: {
    paddingHorizontal: Spacing.lg,
    marginTop: 2,
  },
  dateDivider: {
    alignItems: "center",
    marginVertical: Spacing.sm,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    padding: Spacing.md,
    borderTopWidth: 1,
  },
  attachBtn: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    flex: 1,
    height: 44,
    borderRadius: BorderRadius.lg,
  },
  sendBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
  },
});
