/**
 * Post detail screen - view a post and its replies (Thread View)
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
  createReport,
  getCurrentUser,
  getPost,
  getReplies,
  getUserReplyLikesForPost,
  hasUserLikedPost,
  togglePostLike,
  toggleReplyLike,
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
  const [likedReplies, setLikedReplies] = useState<string[]>([]);
  const [replyingTo, setReplyingTo] = useState<Reply | null>(null);
  const insets = useSafeAreaInsets();
  const repliesChannelRef = useRef<RealtimeChannel | null>(null);
  const postChannelRef = useRef<RealtimeChannel | null>(null);
  const replyChangesChannelRef = useRef<RealtimeChannel | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);

  const loadPost = useCallback(async () => {
    try {
      if (!id) return;

      const [foundPost, user] = await Promise.all([
        getPost(id),
        getCurrentUser()
      ]);

      if (foundPost) {
        setPost(foundPost);
        const postReplies = await getReplies(id);
        setReplies(postReplies);

        if (user) {
          const [postLiked, replyLikes] = await Promise.all([
            hasUserLikedPost(user.id, id),
            getUserReplyLikesForPost(user.id, id)
          ]);
          setHasLiked(postLiked);
          setLikedReplies(replyLikes);
        }
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
        return [...prevReplies, newReply].sort((a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
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
        parentReplyId: replyingTo?.id,
      });

      setReplies(prev => [...prev, newReply]);
      setReplyContent("");
      setReplyingTo(null);

      // Scroll to bottom or just let it be if it's a nested reply
      if (!newReply.parentReplyId) {
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }

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
    if (!post) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Determine new state
    const newLikedState = !hasLiked;
    setHasLiked(newLikedState);

    // Optimistic update of count
    const diff = newLikedState ? 1 : -1;
    setPost(prev => prev ? ({ ...prev, upvotes: Math.max(0, (prev.upvotes || 0) + diff) }) : null);

    try {
      const user = await getCurrentUser();
      if (!user) {
        // Revert
        setHasLiked(!newLikedState);
        setPost(prev => prev ? ({ ...prev, upvotes: Math.max(0, (prev.upvotes || 0) - diff) }) : null);
        router.push("/(auth)/sign-in");
        return;
      }

      // Perform toggle on server
      const { count } = await togglePostLike(user.id, post.id);

      // Sync exact server count
      setPost(prev => prev ? ({ ...prev, upvotes: count }) : null);
    } catch (e) {
      // Revert if failed
      setHasLiked(!newLikedState);
      setPost(prev => prev ? ({ ...prev, upvotes: Math.max(0, (prev.upvotes || 0) - diff) }) : null);
      console.error("Like failed", e);
    }
  };

  const handleLikeReply = async (replyId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const isLiked = likedReplies.includes(replyId);
    const newLikedReplies = isLiked
      ? likedReplies.filter(id => id !== replyId)
      : [...likedReplies, replyId];

    setLikedReplies(newLikedReplies);

    // Optimistic update of reply count
    const diff = isLiked ? -1 : 1;
    setReplies(prev => prev.map(r =>
      r.id === replyId ? { ...r, isHelpful: Math.max(0, (r.isHelpful || 0) + diff) } : r
    ));

    try {
      const user = await getCurrentUser();
      if (!user) {
        // Revert
        setLikedReplies(likedReplies);
        setReplies(prev => prev.map(r =>
          r.id === replyId ? { ...r, isHelpful: Math.max(0, (r.isHelpful || 0) - diff) } : r
        ));
        router.push("/(auth)/sign-in");
        return;
      }

      const { count } = await toggleReplyLike(user.id, replyId);

      // Sync exact count
      setReplies(prev => prev.map(r =>
        r.id === replyId ? { ...r, isHelpful: count } : r
      ));
    } catch (e) {
      // Revert
      setLikedReplies(likedReplies);
      setReplies(prev => prev.map(r =>
        r.id === replyId ? { ...r, isHelpful: Math.max(0, (r.isHelpful || 0) - diff) } : r
      ));
      console.error("Reply like failed", e);
    }
  };

  const handleReplyTo = (reply: Reply) => {
    setReplyingTo(reply);
    setReplyContent(`@${reply.authorPseudonym} `);
    inputRef.current?.focus();
  };

  const getAvatarColor = (id: string): string => {
    const colors = ['#CDB4DB', '#BDE0FE', '#A2D2FF', '#FFC8DD', '#FFAFCC'];
    const index = id.charCodeAt(0) % colors.length;
    return colors[index];
  };

  interface ThreadedReply extends Reply {
    subReplies: ThreadedReply[];
  }

  const buildReplyTree = (flatReplies: Reply[]): ThreadedReply[] => {
    const map = new Map<string, ThreadedReply>();
    const roots: ThreadedReply[] = [];

    // Sort by helpfulness and date
    const sorted = [...flatReplies].sort((a, b) => {
      if ((b.isHelpful || 0) !== (a.isHelpful || 0)) {
        return (b.isHelpful || 0) - (a.isHelpful || 0);
      }
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

    sorted.forEach(r => map.set(r.id, { ...r, subReplies: [] }));

    sorted.forEach(r => {
      const threaded = map.get(r.id)!;
      if (r.parentReplyId && map.has(r.parentReplyId)) {
        map.get(r.parentReplyId)!.subReplies.push(threaded);
      } else {
        roots.push(threaded);
      }
    });

    return roots;
  };

  const renderReply = (reply: ThreadedReply, depth = 0) => {
    const replyAvatarColor = getAvatarColor(reply.id);
    const isOP = reply.authorPseudonym === post?.authorPseudonym;
    const maxDepth = 5;
    const currentDepth = Math.min(depth, maxDepth);
    const isLiked = likedReplies.includes(reply.id);

    return (
      <View key={reply.id} style={[
        styles.threadWrapper,
        currentDepth > 0 && { marginLeft: Spacing.sm }
      ]}>
        {/* Vertical Threading Line */}
        {currentDepth > 0 && (
          <View style={[
            styles.threadLine,
            { backgroundColor: colors.border }
          ]} />
        )}

        <View style={styles.replyFullWidth}>
          <View
            style={[
              styles.replyItem,
              {
                backgroundColor: currentDepth === 0 ? colors.card : 'transparent',
                borderColor: currentDepth === 0 ? colors.border : 'transparent',
                borderWidth: currentDepth === 0 ? 1 : 0,
                paddingLeft: currentDepth > 0 ? 12 : 16,
                marginTop: currentDepth > 0 ? 8 : 16,
              },
              reply.isFromVolunteer && { borderLeftColor: colors.success, borderLeftWidth: 3 },
              currentDepth === 0 && PlatformStyles.shadow
            ]}
          >
            <View style={styles.replyHeader}>
              <View style={styles.replyAuthorRow}>
                <View style={[styles.avatarSmall, { backgroundColor: replyAvatarColor }]}>
                  <ThemedText style={styles.avatarTextSmall}>
                    {reply.authorPseudonym?.[0]?.toUpperCase() || 'A'}
                  </ThemedText>
                </View>
                <View style={styles.replyMeta}>
                  <View style={styles.authorBadgeRow}>
                    <ThemedText style={[
                      styles.replyAuthor,
                      { color: reply.isFromVolunteer ? colors.success : colors.text }
                    ]}>
                      {reply.authorPseudonym}
                    </ThemedText>
                    {isOP && (
                      <View style={[styles.roleBadge, { backgroundColor: colors.primary + '15' }]}>
                        <ThemedText style={[styles.roleText, { color: colors.primary }]}>OP</ThemedText>
                      </View>
                    )}
                    {reply.isFromVolunteer && (
                      <View style={[styles.roleBadge, { backgroundColor: colors.success + '15' }]}>
                        <ThemedText style={[styles.roleText, { color: colors.success }]}>MOD</ThemedText>
                      </View>
                    )}
                  </View>
                  <ThemedText type="small" style={styles.replyTime}>
                    {formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })}
                  </ThemedText>
                </View>
              </View>

              <TouchableOpacity onPress={() => handleReport('reply', reply.id)} style={styles.reportIcon}>
                <Ionicons name="flag-outline" size={14} color={colors.icon} />
              </TouchableOpacity>
            </View>

            <View style={styles.replyContentBody}>
              <Markdown
                style={{
                  body: {
                    color: colors.text,
                    fontSize: 15,
                    lineHeight: 22,
                    fontFamily: PlatformStyles.fontFamily
                  }
                }}
              >
                {reply.content}
              </Markdown>
            </View>

            <View style={styles.replyFooter}>
              <View style={styles.footerActions}>
                <TouchableOpacity
                  onPress={() => handleLikeReply(reply.id)}
                  style={[styles.actionBtn, isLiked && { backgroundColor: colors.danger + '10' }]}
                >
                  <Ionicons
                    name={isLiked ? "heart" : "heart-outline"}
                    size={16}
                    color={isLiked ? colors.danger : colors.icon}
                  />
                  <ThemedText type="small" style={[
                    styles.actionText,
                    { color: isLiked ? colors.danger : colors.icon, fontWeight: '700' }
                  ]}>
                    {reply.isHelpful || 0}
                  </ThemedText>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleReplyTo(reply)}
                  style={styles.actionBtn}
                >
                  <Ionicons name="chatbubble-outline" size={16} color={colors.icon} />
                  <ThemedText type="small" style={styles.actionText}>Reply</ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {reply.subReplies.length > 0 && (
            <View style={styles.childRepliesWrapper}>
              {reply.subReplies.map(sub => renderReply(sub, depth + 1))}
            </View>
          )}
        </View>
      </View>
    );
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
  const threadedReplies = buildReplyTree(replies);

  return (
    <ThemedView style={{ flex: 1 }}>
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
      <StatusBar barStyle={colorScheme === "dark" ? "light-content" : "dark-content"} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={headerHeight}
      >

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
              {threadedReplies.map(reply => renderReply(reply))}
            </View>
          )}

        </ScrollView>

        {/* Reply Input Area */}
        <View style={[styles.inputWrapper, { backgroundColor: colors.background, borderColor: colors.border, paddingBottom: Math.max(insets.bottom, 20) }]}>
          {replyingTo && (
            <View style={[styles.replyingToBanner, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <ThemedText type="small" style={{ color: colors.icon }}>
                Replying to <ThemedText type="small" style={{ fontWeight: 'bold', color: colors.text }}>{replyingTo.authorPseudonym}</ThemedText>
              </ThemedText>
              <TouchableOpacity onPress={() => { setReplyingTo(null); setReplyContent(''); }}>
                <Ionicons name="close-circle" size={18} color={colors.icon} />
              </TouchableOpacity>
            </View>
          )}
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

      </KeyboardAvoidingView>
    </ThemedView>
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
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  nestedContainer: {
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(0,0,0,0.05)',
    marginLeft: 8,
  },
  replyingToBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomWidth: 0,
    marginBottom: -1,
  },
  threadWrapper: {
    flexDirection: 'row',
  },
  threadLine: {
    width: 2,
    marginLeft: 4,
    marginRight: 8,
    borderRadius: 1,
    opacity: 0.5,
  },
  replyFullWidth: {
    flex: 1,
  },
  replyAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  replyMeta: {
    flex: 1,
  },
  authorBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  replyTime: {
    color: '#64748B',
    fontSize: 12,
  },
  reportIcon: {
    padding: 4,
  },
  replyContentBody: {
    marginVertical: 4,
  },
  footerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionText: {
    color: '#64748B',
    fontWeight: '600',
    fontSize: 13,
  },
  childRepliesWrapper: {
    marginTop: 4,
  },
});
