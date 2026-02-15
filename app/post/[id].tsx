/**
 * Post detail screen - view a post and its replies (Thread View)
 */

import { CategoryBadge } from "@/app/components/category-badge";
import { ThemedText } from "@/app/components/themed-text";
import { ThemedView } from "@/app/components/themed-view";
import { Colors, Spacing } from "@/app/constants/theme";
import { useColorScheme } from "@/app/hooks/use-color-scheme";
import { Post, Reply } from "@/app/types";
import { sanitizeContent } from "@/app/utils/anonymization";
import {
  createReply,
  createReport,
  getCurrentUser,
  getPost,
  getReplies,
  upvotePost,
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
import * as Haptics from 'expo-haptics';
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
  const [hasLiked, setHasLiked] = useState(false);
  const insets = useSafeAreaInsets();
  const repliesChannelRef = useRef<RealtimeChannel | null>(null);
  const postChannelRef = useRef<RealtimeChannel | null>(null);
  const replyChangesChannelRef = useRef<RealtimeChannel | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);

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

    // Subscribe to reply updates
    const replyChangesChannel = subscribeToReplyChanges(
      id,
      ({ eventType, reply }) => {
        if (eventType === "DELETE" && reply === null) {
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

    // Subscribe to post updates
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
      if (repliesChannelRef.current) unsubscribe(repliesChannelRef.current);
      if (postChannelRef.current) unsubscribe(postChannelRef.current);
      if (replyChangesChannelRef.current) unsubscribe(replyChangesChannelRef.current);
    };
  }, [id, loadPost, setupRealtimeSubscriptions]);

  const handleSubmitReply = async () => {
    if (!replyContent.trim()) {
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

  const handleReport = (targetType: 'post' | 'reply', targetId: string) => {
    Alert.alert(
      "Report Content",
      "Are you sure you want to report this content as inappropriate?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Report",
          style: "destructive",
          onPress: async () => {
            try {
              const user = await getCurrentUser();
              if (!user) return;

              await createReport({
                targetType,
                targetId,
                reporterId: user.id,
                reason: "Inappropriate content",
                description: "User reported via mobile app"
              });
              Alert.alert("Reported", "Thank you for keeping our community safe. We will review this content.");
            } catch (e) {
              Alert.alert("Error", "Failed to submit report.");
            }
          }
        }
      ]
    );
  };

  const handleLike = async () => {
    if (!post || hasLiked) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setHasLiked(true);

    // Optimistic update
    setPost(prev => prev ? ({ ...prev, upvotes: (prev.upvotes || 0) + 1 }) : null);

    try {
      await upvotePost(post.id);
    } catch (e) {
      // Revert if failed
      setHasLiked(false);
      setPost(prev => prev ? ({ ...prev, upvotes: (prev.upvotes || 0) - 1 }) : null);
    }
  };

  const handleReplyTo = (username: string) => {
    const mention = `@${username} `;
    setReplyContent(prev => prev + mention);
    inputRef.current?.focus();
  };

  const getAvatarColor = (id: string): string => {
    const colors = ['#CDB4DB', '#BDE0FE', '#A2D2FF', '#FFC8DD', '#FFAFCC'];
    const index = id.charCodeAt(0) % colors.length;
    return colors[index];
  };

  if (!post) {
    return (
      <ThemedView style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </ThemedView>
    );
  }

  const isEscalated = post.escalationLevel !== "none";
  const avatarColor = getAvatarColor(post.id);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={0} // Managed by logic below or default behavior
    >
      <ThemedView style={styles.container}>
        <StatusBar barStyle={colorScheme === "dark" ? "light-content" : "dark-content"} />
        <Stack.Screen
          options={{
            headerShown: true,
            headerTitle: "Discussion",
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
            headerRight: () => (
              <TouchableOpacity onPress={() => handleReport('post', post.id)} style={{ marginRight: 8, padding: 4 }}>
                <Ionicons name="flag-outline" size={20} color={colors.icon} />
              </TouchableOpacity>
            )
          }}
        />

        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 100 }]}
          keyboardShouldPersistTaps="handled"
        >
          {isEscalated && (
            <View style={[styles.escalationBanner, { backgroundColor: colors.danger + "15", borderColor: colors.danger + '30' }]}>
              <Ionicons name="warning" size={20} color={colors.danger} />
              <ThemedText style={[styles.escalationText, { color: colors.danger }]}>
                Alert: Moderate concern detected. Support notified.
              </ThemedText>
            </View>
          )}

          {/* Main Post */}
          <View style={styles.postContainer}>
            <View style={styles.postHeader}>
              <View style={[styles.avatarBig, { backgroundColor: avatarColor }]}>
                <ThemedText style={styles.avatarTextBig}>
                  {post.authorPseudonym?.[0]?.toUpperCase() || 'A'}
                </ThemedText>
              </View>
              <View>
                <ThemedText type="body" style={{ fontSize: 16, fontWeight: '600' }}>
                  {post.authorPseudonym}
                </ThemedText>
                <ThemedText type="small" style={{ color: colors.icon }}>
                  {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                </ThemedText>
              </View>
            </View>

            <ThemedText type="h2" style={styles.postTitle}>{post.title}</ThemedText>

            <View style={styles.markdownWrapper}>
              <Markdown
                style={{
                  body: {
                    color: colors.text,
                    fontSize: 16,
                    lineHeight: 26,
                  },
                  link: { color: colors.primary },
                  blockquote: {
                    backgroundColor: colors.surface,
                    borderLeftColor: colors.primary,
                    borderLeftWidth: 4,
                    paddingHorizontal: 12,
                    paddingVertical: 4,
                    borderRadius: 4,
                  },
                }}
              >
                {post.content}
              </Markdown>
            </View>

            <View style={styles.postFooter}>
              <CategoryBadge category={post.category} />
              <TouchableOpacity
                style={[styles.likeRow, hasLiked && { opacity: 0.7 }]}
                onPress={handleLike}
              >
                <Ionicons name={hasLiked ? "heart" : "heart-outline"} size={22} color={hasLiked ? colors.danger : colors.icon} />
                <ThemedText style={{ color: hasLiked ? colors.danger : colors.icon, fontWeight: '600' }}>
                  {post.upvotes || 0}
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.divider} />

          <ThemedText type="h3" style={styles.repliesTitle}>
            Replies <ThemedText style={{ color: colors.icon, fontSize: 18 }}>({replies.length})</ThemedText>
          </ThemedText>

          {/* Replies List */}
          {replies.length === 0 ? (
            <View style={styles.emptyReplies}>
              <Ionicons name="chatbubbles-outline" size={40} color={colors.icon} style={{ opacity: 0.3 }} />
              <ThemedText style={{ color: colors.icon, marginTop: 10 }}>No replies yet. Start the conversation!</ThemedText>
            </View>
          ) : (
            <View style={styles.repliesList}>
              {replies.map((reply) => {
                const replyAvatarColor = getAvatarColor(reply.id);
                const isOP = reply.authorPseudonym === post.authorPseudonym;

                return (
                  <View key={reply.id} style={[styles.replyItem, { borderLeftColor: reply.isFromVolunteer ? colors.success : 'transparent', borderLeftWidth: reply.isFromVolunteer ? 3 : 0 }]}>
                    <View style={styles.replyHeader}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <View style={[styles.avatarSmall, { backgroundColor: replyAvatarColor }]}>
                          <ThemedText style={styles.avatarTextSmall}>
                            {reply.authorPseudonym?.[0]?.toUpperCase() || 'A'}
                          </ThemedText>
                        </View>
                        <View>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <ThemedText style={[styles.replyAuthor, { color: reply.isFromVolunteer ? colors.success : colors.text }]}>
                              {reply.authorPseudonym}
                            </ThemedText>
                            {isOP && <View style={[styles.roleBadge, { backgroundColor: colors.primary + '20' }]}><ThemedText style={[styles.roleText, { color: colors.primary }]}>OP</ThemedText></View>}
                            {reply.isFromVolunteer && <View style={[styles.roleBadge, { backgroundColor: colors.success + '20' }]}><ThemedText style={[styles.roleText, { color: colors.success }]}>VOLUNTEER</ThemedText></View>}
                          </View>
                          <ThemedText type="small" style={{ color: colors.icon, fontSize: 11 }}>
                            {formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })}
                          </ThemedText>
                        </View>
                      </View>
                    </View>

                    <Markdown
                      style={{
                        body: { color: colors.text, fontSize: 15, lineHeight: 22 }
                      }}
                    >
                      {reply.content}
                    </Markdown>

                    <View style={styles.replyFooter}>
                      <TouchableOpacity onPress={() => handleReplyTo(reply.authorPseudonym)} style={styles.actionBtn}>
                        <Ionicons name="arrow-undo-outline" size={14} color={colors.icon} />
                        <ThemedText type="small" style={{ color: colors.icon, fontWeight: '600' }}>Reply</ThemedText>
                      </TouchableOpacity>

                      <TouchableOpacity onPress={() => handleReport('reply', reply.id)} style={styles.actionBtn}>
                        <ThemedText type="small" style={{ color: colors.icon }}>Report</ThemedText>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

        </ScrollView>

        {/* Reply Input Area */}
        <View style={[styles.inputWrapper, { backgroundColor: colors.background, borderColor: colors.border, paddingBottom: Math.max(insets.bottom, 20) }]}>
          <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TextInput
              ref={inputRef}
              style={[styles.input, { color: colors.text }]}
              placeholder="Write a supportive reply..."
              placeholderTextColor={colors.icon}
              multiline
              value={replyContent}
              onChangeText={setReplyContent}
            />
            <TouchableOpacity
              style={[styles.sendBtn, { backgroundColor: colors.primary, opacity: replyContent.trim() ? 1 : 0.5 }]}
              onPress={handleSubmitReply}
              disabled={!replyContent.trim() || isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Ionicons name="arrow-up" size={20} color="#FFF" />
              )}
            </TouchableOpacity>
          </View>
        </View>

      </ThemedView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    padding: Spacing.lg,
  },
  escalationBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    gap: 10,
  },
  escalationText: {
    flex: 1,
    fontWeight: "700",
    fontSize: 13,
  },
  postContainer: {
    marginBottom: Spacing.xl,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: Spacing.md,
  },
  avatarBig: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarTextBig: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  postTitle: {
    fontSize: 24,
    lineHeight: 30,
    marginBottom: 12,
  },
  markdownWrapper: {
    marginBottom: Spacing.md,
  },
  postFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.md,
  },
  likeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  divider: {
    height: 1,
    backgroundColor: '#0000000D',
    marginBottom: Spacing.lg,
  },
  repliesTitle: {
    marginBottom: Spacing.md,
  },
  repliesList: {
    gap: 16,
  },
  replyItem: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  replyHeader: {
    marginBottom: 8,
  },
  avatarSmall: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarTextSmall: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  replyAuthor: {
    fontWeight: '700',
    fontSize: 14,
  },
  roleBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  roleText: {
    fontSize: 10,
    fontWeight: '800',
  },
  emptyReplies: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  inputWrapper: {
    padding: Spacing.md,
    borderTopWidth: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderRadius: 24,
    borderWidth: 1,
    padding: 6,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 0,
  },
  replyFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
  },
});
