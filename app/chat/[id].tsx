import { ThemedText } from "@/app/components/themed-text";
import { ThemedView } from "@/app/components/themed-view";
import { Colors, Spacing } from "@/app/constants/theme";
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
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { SupportSession } from "@/app/types";
import { getSupportSessions, updateSupportSession } from "@/lib/database";

declare const styles: any;

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
  const [session, setSession] = useState<SupportSession | null>(null);
  const [role, setRole] = useState<string | null>(null);

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
            {isMine ? (
              <LinearGradient
                colors={[colors.primary, colors.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.bubble, styles.mineBubble]}
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
                    maxWidth: "70%",
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

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <ThemedView style={styles.container}>
        <LinearGradient
          colors={[
            (session && priorityColor(session.priority)) + "25",
            colors.card,
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.header, { backgroundColor: colors.background }]}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={getCursorStyle()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: Spacing.md }}>
            <ThemedText type="h2" style={styles.headerTitle}>
              {session?.student_pseudonym || "Anonymous Chat"}
            </ThemedText>
            {session?.category ? (
              <ThemedText type="small" style={{ opacity: 0.6 }}>
                {String(session.category).toUpperCase()} • {messages.length}{" "}
                msgs
              </ThemedText>
            ) : null}
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <View
              style={{
                width: 10,
                height: 10,
                borderRadius: 5,
                backgroundColor: isOnline ? "#10B981" : colors.icon,
              }}
            />
            <ThemedText type="small" style={{ opacity: 0.6 }}>
              {isOnline ? "Online" : "Offline"}
            </ThemedText>
          </View>
          {session?.priority && (
            <View
              style={[
                styles.priorityBadge,
                { backgroundColor: priorityColor(session.priority) + "20" },
              ]}
            >
              <ThemedText
                type="small"
                style={{
                  color: priorityColor(session.priority),
                  fontWeight: "700",
                }}
              >
                {session.priority}
              </ThemedText>
            </View>
          )}
        </LinearGradient>

        {canUseSupportTools && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[
              styles.toolsRow,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <TouchableOpacity
              style={styles.toolChip}
              onPress={() => router.push("/resource" as any)}
            >
              <Ionicons name="book" size={16} color={colors.primary} />
              <ThemedText style={styles.toolChipText}>Resources</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.toolChip}
              onPress={() => router.push("/urgent-support" as any)}
            >
              <Ionicons name="shield-checkmark" size={16} color="#EF4444" />
              <ThemedText style={styles.toolChipText}>Urgent</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.toolChip}
              onPress={handleScheduleMeeting}
            >
              <Ionicons name="calendar" size={16} color="#F59E0B" />
              <ThemedText style={styles.toolChipText}>Meeting</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity style={styles.toolChip} onPress={handleResolve}>
              <Ionicons name="checkmark-done" size={16} color="#10B981" />
              <ThemedText style={styles.toolChipText}>Resolve</ThemedText>
            </TouchableOpacity>
          </ScrollView>
        )}

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
