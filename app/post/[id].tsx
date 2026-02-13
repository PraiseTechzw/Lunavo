/**
 * Post detail screen - view a post and its replies
 */

import { CategoryBadge } from "@/app/components/category-badge";
import { ThemedText } from "@/app/components/themed-text";
import { ThemedView } from "@/app/components/themed-view";
import { Colors, PlatformStyles, Spacing } from "@/app/constants/theme";
import { useColorScheme } from "@/app/hooks/use-color-scheme";
import { Post, Reply } from "@/app/types";
import { sanitizeContent } from "@/app/utils/anonymization";
import {
    createReply,
    getCurrentUser,
    getPost,
    getReplies,
} from "@/lib/database";
import {
    RealtimeChannel,
    subscribeToPostUpdates,
    subscribeToReplies,
    subscribeToReplyChanges,
    unsubscribe,
} from "@/lib/realtime";
import { Ionicons } from "@expo/vector-icons";
import { useHeaderHeight } from "@react-navigation/elements";
import { formatDistanceToNow } from "date-fns";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import Markdown from "react-native-markdown-display";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const headerHeight = useHeaderHeight();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const [post, setPost] = useState<Post | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [replyContent, setReplyContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const insets = useSafeAreaInsets();
  const repliesChannelRef = useRef<RealtimeChannel | null>(null);
  const postChannelRef = useRef<RealtimeChannel | null>(null);
  const replyChangesChannelRef = useRef<RealtimeChannel | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  const loadPost = useCallback(async () => {
    try {
      if (!id) return;
      const foundPost = await getPost(id);
      if (foundPost) {
        setPost(foundPost);
        const postReplies = await getReplies(id);
        setReplies(postReplies);
      } else {
        Alert.alert("Not Found", "This post could not be found.", [
          { text: "OK", onPress: () => router.back() },
        ]);
      }
    } catch (error) {
      console.error("Error loading post:", error);
    }
  }, [id, router]);

  const setupRealtimeSubscriptions = useCallback(() => {
    if (!id) return;

    // Subscribe to new replies
    const repliesChannel = subscribeToReplies(id, (newReply) => {
      setReplies((prevReplies) => {
        // Check if reply already exists (avoid duplicates)
        const exists = prevReplies.some((r) => r.id === newReply.id);
        if (exists) return prevReplies;
        return [...prevReplies, newReply];
      });
    });

    // Subscribe to reply updates (helpful votes, etc.)
    const replyChangesChannel = subscribeToReplyChanges(
      id,
      ({ eventType, reply }) => {
        if (eventType === "DELETE" && reply === null) {
          // Handle reply deletion if needed
          return;
        }

        if (reply) {
          setReplies((prevReplies) => {
            if (eventType === "UPDATE") {
              return prevReplies.map((r) => (r.id === reply.id ? reply : r));
            }
            return prevReplies;
          });
        }
      },
    );

    // Subscribe to post updates (upvotes, status changes, etc.)
    const postUpdateChannel = subscribeToPostUpdates(id, (updatedPost) => {
      setPost(updatedPost);
    });

    repliesChannelRef.current = repliesChannel;
    postChannelRef.current = postUpdateChannel;
    replyChangesChannelRef.current = replyChangesChannel;
  }, [id]);

  useEffect(() => {
    if (id) {
      loadPost();
      setupRealtimeSubscriptions();
    }
    return () => {
      if (repliesChannelRef.current) {
        unsubscribe(repliesChannelRef.current);
      }
      if (postChannelRef.current) {
        unsubscribe(postChannelRef.current);
      }
      if (replyChangesChannelRef.current) {
        unsubscribe(replyChangesChannelRef.current);
      }
    };
  }, [id, loadPost, setupRealtimeSubscriptions]);

  const handleSubmitReply = async () => {
    if (!replyContent.trim()) {
      Alert.alert("Empty Reply", "Please enter a reply before submitting.");
      return;
    }

    if (!post) return;

    setIsSubmitting(true);
    try {
      const sanitizedContent = sanitizeContent(replyContent);

      const user = await getCurrentUser();
      if (!user) {
        Alert.alert("Error", "You must be logged in to reply.");
        return;
      }

      const newReply = await createReply({
        postId: post.id,
        authorId: user.id,
        content: sanitizedContent,
        isAnonymous: true,
        // Calculate isFromVolunteer based on user role if needed, or backend handles it
        isFromVolunteer: ["peer-educator", "counselor"].includes(user.role),
      });

      setReplies([...replies, newReply]);
      setReplyContent("");

      // Scroll to bottom
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);

      // Update local state
      const updatedPost = { ...post, replies: [...replies, newReply] };
      setPost(updatedPost);
    } catch (error) {
      console.error("Error posting reply:", error);
      Alert.alert("Error", "Failed to post reply. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReport = () => {
    if (!post) return;
    router.push(`/report?targetType=post&targetId=${post.id}`);
  };

  if (!post) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Loading...</ThemedText>
      </ThemedView>
    );
  }

  const isEscalated = post.escalationLevel !== "none";

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={headerHeight}
    >
      <ThemedView style={styles.container}>
        <StatusBar
          barStyle={colorScheme === "dark" ? "light-content" : "dark-content"}
        />
        <Stack.Screen
          options={{
            headerShown: true,
            headerTitle: "Circle Post",
            headerShadowVisible: false,
            headerStyle: { backgroundColor: colors.background },
            headerLeft: () => (
              <TouchableOpacity
                onPress={() => router.back()}
                style={[
                  styles.backButton,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Ionicons name="chevron-back" size={24} color={colors.text} />
              </TouchableOpacity>
            ),
          }}
        />
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          {isEscalated && (
            <View
              style={[
                styles.escalationBanner,
                { backgroundColor: colors.danger + "20" },
              ]}
            >
              <Ionicons name="warning" size={20} color={colors.danger} />
              <ThemedText
                style={[styles.escalationText, { color: colors.danger }]}
              >
                Support team has been notified and will reach out soon.
              </ThemedText>
            </View>
          )}

          <View style={styles.header}>
            <CategoryBadge category={post.category} />
            <TouchableOpacity onPress={handleReport}>
              <Ionicons name="flag-outline" size={20} color={colors.icon} />
            </TouchableOpacity>
          </View>

          <ThemedText type="h1" style={styles.title}>
            {post.title}
          </ThemedText>

          <View style={styles.meta}>
            <View style={styles.metaItem}>
              <Ionicons name="person-outline" size={12} color={colors.icon} />
              <ThemedText
                type="small"
                style={{ color: colors.icon, fontWeight: "700" }}
              >
                {post.authorPseudonym}
              </ThemedText>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={12} color={colors.icon} />
              <ThemedText
                type="small"
                style={{ color: colors.icon, fontWeight: "600" }}
              >
                {formatDistanceToNow(new Date(post.createdAt), {
                  addSuffix: true,
                })}
              </ThemedText>
            </View>
          </View>

          <Markdown
            style={{
              body: {
                color: colors.text,
                fontSize: 17,
                lineHeight: 26,
              },
              link: {
                color: colors.primary,
                textDecorationLine: "underline",
              },
              image: {
                borderRadius: 12,
                marginTop: 12,
                marginBottom: 12,
              },
              strong: {
                fontWeight: "bold",
                color: colors.text,
              },
              em: {
                fontStyle: "italic",
              },
              blockquote: {
                backgroundColor: colors.surface,
                borderLeftColor: colors.primary,
                borderLeftWidth: 4,
                paddingHorizontal: 16,
                paddingVertical: 8,
                marginVertical: 8,
                borderRadius: 4,
              },
              bullet_list: {
                marginVertical: 8,
              },
              ordered_list: {
                marginVertical: 8,
              },
              list_item: {
                marginVertical: 4,
              },
              hr: {
                backgroundColor: colors.border,
                height: 1,
                marginVertical: 16,
              },
            }}
          >
            {post.content}
          </Markdown>

          <View style={styles.divider} />

          <View style={styles.repliesHeader}>
            <ThemedText type="h3">Replies ({replies.length})</ThemedText>
          </View>

          {replies.length === 0 ? (
            <View style={styles.emptyReplies}>
              <ThemedText type="body" style={styles.emptyText}>
                No replies yet. Be the first to offer support!
              </ThemedText>
            </View>
          ) : (
            replies.map((reply) => (
              <View
                key={reply.id}
                style={[styles.replyCard, { backgroundColor: colors.surface }]}
              >
                <View style={styles.replyHeader}>
                  <ThemedText type="body" style={styles.replyAuthor}>
                    {reply.authorPseudonym}
                    {reply.isFromVolunteer && (
                      <Text
                        style={[
                          styles.volunteerBadge,
                          { color: colors.success },
                        ]}
                      >
                        {" "}
                        ✓ Volunteer
                      </Text>
                    )}
                  </ThemedText>
                  <ThemedText type="small" style={{ color: colors.icon }}>
                    {formatDistanceToNow(new Date(reply.createdAt), {
                      addSuffix: true,
                    })}
                  </ThemedText>
                </View>
                <Markdown
                  style={{
                    body: {
                      color: colors.text,
                      fontSize: 15,
                      lineHeight: 22,
                    },
                    link: {
                      color: colors.primary,
                    },
                  }}
                >
                  {reply.content}
                </Markdown>
                {reply.isHelpful > 0 && (
                  <View
                    style={[
                      styles.helpfulBadge,
                      { backgroundColor: colors.success + "15" },
                    ]}
                  >
                    <Ionicons
                      name="checkmark-circle"
                      size={14}
                      color={colors.success}
                    />
                    <ThemedText
                      type="small"
                      style={{ color: colors.success, fontWeight: "800" }}
                    >
                      Helpful ({reply.isHelpful})
                    </ThemedText>
                  </View>
                )}
              </View>
            ))
          )}
        </ScrollView>

        <View
          style={[
            styles.replyInputContainer,
            {
              backgroundColor: colors.background,
              borderTopColor: colors.border,
              paddingBottom: Math.max(insets.bottom, Spacing.md),
            },
          ]}
        >
          <TouchableOpacity
            style={[styles.attachButton, { backgroundColor: colors.surface }]}
            onPress={() =>
              Alert.alert(
                "Photos",
                "Support for image attachments coming soon.",
              )
            }
          >
            <Ionicons name="image-outline" size={24} color={colors.icon} />
          </TouchableOpacity>
          <TextInput
            style={[
              styles.replyInput,
              {
                backgroundColor: colors.surface,
                color: colors.text,
                borderColor: colors.border,
              },
            ]}
            placeholder="Write a supportive reply..."
            placeholderTextColor={colors.icon}
            value={replyContent}
            onChangeText={setReplyContent}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            style={[
              styles.replyButton,
              {
                backgroundColor: colors.primary,
                opacity: isSubmitting || !replyContent.trim() ? 0.6 : 1,
              },
            ]}
            onPress={handleSubmitReply}
            disabled={isSubmitting || !replyContent.trim()}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons
                name="send"
                size={20}
                color="#FFFFFF"
                style={{ marginLeft: 2 }}
              />
            )}
          </TouchableOpacity>
        </View>
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    marginLeft: Spacing.sm,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.xl,
    paddingBottom: 40,
  },
  escalationBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    marginBottom: Spacing.xl,
    gap: 12,
  },
  escalationText: {
    flex: 1,
    fontWeight: "700",
    fontSize: 14,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: -1,
    lineHeight: 34,
    marginBottom: Spacing.md,
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: Spacing.xl,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: "rgba(0,0,0,0.03)",
  },
  content: {
    fontSize: 17,
    lineHeight: 28,
    marginBottom: Spacing.xxl,
    fontWeight: "400",
    opacity: 0.9,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(0,0,0,0.05)",
    marginBottom: Spacing.xl,
  },
  repliesHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: Spacing.lg,
  },
  emptyReplies: {
    padding: Spacing.xxl,
    alignItems: "center",
  },
  emptyText: {
    opacity: 0.5,
    textAlign: "center",
    fontSize: 15,
  },
  replyCard: {
    padding: 16,
    borderRadius: 20,
    marginBottom: Spacing.md,
    ...PlatformStyles.shadow,
    elevation: 2,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.03)",
  },
  replyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  replyAuthor: {
    fontWeight: "800",
    fontSize: 15,
  },
  volunteerBadge: {
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  replyContent: {
    lineHeight: 22,
    fontSize: 15,
  },
  helpfulBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  replyInputContainer: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },
  attachButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  replyInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    maxHeight: 120,
    minHeight: 44,
  },
  replyButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    ...PlatformStyles.premiumShadow,
  },
});
