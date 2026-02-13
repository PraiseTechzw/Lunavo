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
    updateSupportSession,
} from "@/lib/database";
import { subscribeToMessages, unsubscribe } from "@/lib/realtime";
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

  useEffect(() => {
    const init = async () => {
      try {
        const user = await getCurrentUser();
        setUserId(user?.id || null);
        const initial = await getSupportMessages(id as string);
        setMessages(initial);
        // Mark session as active upon opening
        await updateSupportSession(id as string, { status: "active" });
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
    return () => {
      unsubscribe(channel);
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
      const msg: Omit<SupportMessage, "id" | "created_at" | "is_read"> = {
        session_id: id as string,
        sender_id: userId,
        content: trimmed,
        type: "text",
      };
      const sent = await sendSupportMessage(msg);
      setMessages((prev) => [...prev, sent]);
      setInput("");
      scrollToEnd();
      // Update session preview
      await updateSupportSession(id as string, { preview: trimmed });
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setSending(false);
    }
  };

  const renderItem = ({ item }: { item: SupportMessage }) => {
    const isMine = item.sender_id === userId;
    return (
      <View
        style={[styles.messageRow, isMine ? styles.mineRow : styles.theirRow]}
      >
        {!isMine && (
          <View style={styles.labelWrap}>
            <ThemedText style={styles.labelText}>Supporter</ThemedText>
          </View>
        )}
        <View
          style={[
            styles.bubble,
            {
              backgroundColor: isMine ? colors.primary : colors.card,
              borderColor: isMine ? colors.primary : colors.border,
            },
          ]}
        >
          <ThemedText style={{ color: isMine ? "#FFF" : colors.text }}>
            {item.content}
          </ThemedText>
        </View>
        {isMine && (
          <View style={styles.labelWrap}>
            <ThemedText style={styles.labelText}>You</ThemedText>
          </View>
        )}
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
              <TextInput
                style={[
                  styles.input,
                  createInputStyle(),
                  { color: colors.text },
                ]}
                placeholder="Type a message..."
                placeholderTextColor={colors.icon}
                value={input}
                onChangeText={setInput}
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
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    padding: Spacing.md,
    borderTopWidth: 1,
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
