/**
 * Thread Detail Screen - Level 3: Individual post with replies
 * Enhanced UI matching the thread design
 */

import { ThemedText } from '@/app/components/themed-text';
import { ThemedView } from '@/app/components/themed-view';
import { BorderRadius, Colors, Spacing } from '@/app/constants/theme';
import { useColorScheme } from '@/app/hooks/use-color-scheme';
import { Post, Reply } from '@/app/types';
import { generatePseudonym, sanitizeContent } from '@/app/utils/anonymization';
import { createInputStyle, getCursorStyle } from '@/app/utils/platform-styles';
import { getPseudonym } from '@/app/utils/storage';
import { createReply, getCurrentUser, getPost, getReplies, upvotePost } from '@/lib/database';
import { RealtimeChannel, subscribeToPostUpdates, subscribeToReplies, subscribeToReplyChanges, unsubscribe } from '@/lib/realtime';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Generate consistent color for avatar based on user ID
const getAvatarColor = (id: string): string => {
  const colors = ['#CDB4DB', '#BDE0FE', '#A2D2FF', '#FFC8DD', '#FFAFCC', '#B4E4FF'];
  const index = id.charCodeAt(0) % colors.length;
  return colors[index];
};

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const [post, setPost] = useState<Post | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [replyContent, setReplyContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const repliesChannelRef = useRef<RealtimeChannel | null>(null);
  const postChannelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (id) {
      loadPost();
      loadCurrentUser();
      setupRealtimeSubscriptions();
    }

    return () => {
      if (repliesChannelRef.current) {
        unsubscribe(repliesChannelRef.current);
      }
      if (postChannelRef.current) {
        unsubscribe(postChannelRef.current);
      }
    };
  }, [id]);

  const loadCurrentUser = async () => {
    try {
      const user = await getCurrentUser();
      setCurrentUser(user);
    } catch (error) {
      console.error('Error loading current user:', error);
    }
  };

  const loadPost = async () => {
    try {
      if (!id) return;
      const foundPost = await getPost(id);
      if (foundPost) {
        setPost(foundPost);
        const postReplies = await getReplies(id);
        setReplies(postReplies);
      } else {
        Alert.alert('Not Found', 'This post could not be found.', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      }
    } catch (error) {
      console.error('Error loading post:', error);
      Alert.alert('Error', 'Failed to load post. Please try again.');
    }
  };

  const setupRealtimeSubscriptions = () => {
    if (!id) return;

    // Subscribe to new replies
    const repliesChannel = subscribeToReplies(id, (newReply) => {
      setReplies((prevReplies) => {
        const exists = prevReplies.some((r) => r.id === newReply.id);
        if (exists) return prevReplies;
        return [...prevReplies, newReply];
      });
    });

    // Subscribe to reply updates
    const replyChangesChannel = subscribeToReplyChanges(id, ({ eventType, reply }) => {
      if (reply) {
        setReplies((prevReplies) => {
          if (eventType === 'UPDATE') {
            return prevReplies.map((r) => (r.id === reply.id ? reply : r));
          } else if (eventType === 'DELETE') {
            return prevReplies.filter((r) => r.id !== reply.id);
          }
          return prevReplies;
        });
      }
    });

    // Subscribe to post updates
    const postUpdateChannel = subscribeToPostUpdates(id, (updatedPost) => {
      setPost(updatedPost);
    });

    repliesChannelRef.current = repliesChannel;
    postChannelRef.current = postUpdateChannel;
  };

  const handleSubmitReply = async () => {
    if (!replyContent.trim()) {
      Alert.alert('Empty Reply', 'Please enter a reply before submitting.');
      return;
    }

    if (!post) return;

    setIsSubmitting(true);
    try {
      const user = await getCurrentUser();
      if (!user) {
        Alert.alert('Error', 'Please log in to reply.');
        setIsSubmitting(false);
        return;
      }

      const pseudonym = (await getPseudonym()) || generatePseudonym();
      const sanitizedContent = sanitizeContent(replyContent);

      const newReply = await createReply({
        postId: post.id,
        authorId: user.id,
        content: sanitizedContent,
        isAnonymous: true,
        isFromVolunteer: false,
      });

      setReplies([...replies, newReply]);
      setReplyContent('');

      // Update post reply count
      const updatedPost = { ...post, replies: [...replies, newReply] };
      setPost(updatedPost);
    } catch (error) {
      console.error('Error posting reply:', error);
      Alert.alert('Error', 'Failed to post reply. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLike = async () => {
    if (!post) return;
    try {
      const newUpvotes = await upvotePost(post.id);
      setPost({ ...post, upvotes: newUpvotes });
      setIsLiked(!isLiked);
    } catch (error) {
      console.error('Error upvoting post:', error);
    }
  };

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked);
    // TODO: Implement bookmark functionality
  };

  const handleReport = () => {
    if (!post) return;
    router.push(`/report?targetType=post&targetId=${post.id}`);
  };

  const handleReplyLike = async (replyId: string) => {
    // TODO: Implement reply like functionality
    console.log('Like reply:', replyId);
  };

  if (!post) {
    return (
      <SafeAreaView edges={['top']} style={styles.safeAreaTop}>
        <ThemedView style={styles.container}>
          <View style={styles.loadingContainer}>
            <MaterialIcons name="forum" size={48} color={colors.icon} />
            <ThemedText type="body" style={{ color: colors.icon, marginTop: Spacing.md }}>
              Loading thread...
            </ThemedText>
          </View>
        </ThemedView>
      </SafeAreaView>
    );
  }

  const avatarColor = getAvatarColor(post.authorId);
  const userAvatarColor = currentUser ? getAvatarColor(currentUser.id) : '#A2D2FF';

  return (
    <SafeAreaView edges={['top']} style={styles.safeAreaTop}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ThemedView style={styles.container}>
          {/* Header */}
          <View style={[styles.header, { backgroundColor: colors.background }]}>
            <TouchableOpacity
              style={[styles.headerButton, getCursorStyle()]}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <ThemedText type="h2" style={styles.headerTitle}>
              Thread
            </ThemedText>
            <TouchableOpacity
              style={[styles.headerButton, getCursorStyle()]}
              onPress={handleReport}
            >
              <MaterialIcons name="more-vert" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
            {/* Original Post */}
            <View style={styles.postSection}>
              {/* User Info */}
              <View style={styles.userSection}>
                <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
                  <MaterialIcons name="person" size={24} color="#FFFFFF" />
                </View>
                <View style={styles.userInfo}>
                  <ThemedText type="body" style={[styles.username, { color: colors.text }]}>
                    {post.authorPseudonym}
                  </ThemedText>
                  <ThemedText type="small" style={[styles.timestamp, { color: colors.icon }]}>
                    {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                  </ThemedText>
                </View>
              </View>

              {/* Post Title */}
              <ThemedText type="h1" style={[styles.postTitle, { color: colors.text }]}>
                {post.title}
              </ThemedText>

              {/* Post Content */}
              <ThemedText type="body" style={[styles.postContent, { color: colors.text }]}>
                {post.content}
              </ThemedText>

              {/* Hashtags */}
              {post.tags && post.tags.length > 0 && (
                <View style={styles.hashtagsContainer}>
                  {post.tags.map((tag, index) => (
                    <View
                      key={index}
                      style={[styles.hashtag, { backgroundColor: colors.surface }]}
                    >
                      <ThemedText type="small" style={[styles.hashtagText, { color: colors.primary }]}>
                        #{tag}
                      </ThemedText>
                    </View>
                  ))}
                </View>
              )}

              {/* Interaction Bar */}
              <View style={styles.interactionBar}>
                <TouchableOpacity
                  style={styles.interactionButton}
                  onPress={handleLike}
                  activeOpacity={0.7}
                >
                  <MaterialIcons
                    name={isLiked ? 'favorite' : 'favorite-border'}
                    size={20}
                    color={isLiked ? '#EF4444' : colors.icon}
                  />
                  <ThemedText type="small" style={[styles.interactionText, { color: colors.text }]}>
                    {post.upvotes || 0}
                  </ThemedText>
                </TouchableOpacity>

                <View style={styles.interactionButton}>
                  <MaterialIcons name="chat-bubble-outline" size={20} color={colors.icon} />
                  <ThemedText type="small" style={[styles.interactionText, { color: colors.text }]}>
                    {replies.length}
                  </ThemedText>
                </View>

                <TouchableOpacity
                  style={styles.interactionButton}
                  onPress={handleBookmark}
                  activeOpacity={0.7}
                >
                  <MaterialIcons
                    name={isBookmarked ? 'bookmark' : 'bookmark-border'}
                    size={20}
                    color={isBookmarked ? colors.primary : colors.icon}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Replies Section */}
            <View style={styles.repliesSection}>
              <ThemedText type="h3" style={[styles.repliesHeader, { color: colors.text }]}>
                REPLIES ({replies.length})
              </ThemedText>

              {replies.length === 0 ? (
                <View style={styles.emptyReplies}>
                  <ThemedText type="body" style={[styles.emptyText, { color: colors.icon }]}>
                    No replies yet. Be the first to offer support!
                  </ThemedText>
                </View>
              ) : (
                replies.map((reply) => {
                  const replyAvatarColor = getAvatarColor(reply.authorId);
                  return (
                    <View
                      key={reply.id}
                      style={[styles.replyCard, { backgroundColor: colors.card }]}
                    >
                      <View style={styles.replyHeader}>
                        <View style={styles.replyUserInfo}>
                          <View style={[styles.replyAvatar, { backgroundColor: replyAvatarColor }]}>
                            <MaterialIcons name="person" size={18} color="#FFFFFF" />
                          </View>
                          <View>
                            <ThemedText type="body" style={[styles.replyUsername, { color: colors.text }]}>
                              {reply.authorPseudonym}
                              {reply.isFromVolunteer && (
                                <Text style={[styles.volunteerBadge, { color: colors.success }]}>
                                  {' '}✓ Volunteer
                                </Text>
                              )}
                            </ThemedText>
                            <ThemedText type="small" style={[styles.replyTimestamp, { color: colors.icon }]}>
                              {formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })}
                            </ThemedText>
                          </View>
                        </View>
                      </View>

                      <ThemedText type="body" style={[styles.replyContent, { color: colors.text }]}>
                        {reply.content}
                      </ThemedText>

                      <View style={styles.replyActions}>
                        <TouchableOpacity
                          style={styles.replyActionButton}
                          onPress={() => handleReplyLike(reply.id)}
                          activeOpacity={0.7}
                        >
                          <MaterialIcons name="favorite-border" size={16} color={colors.icon} />
                          <ThemedText type="small" style={[styles.replyActionText, { color: colors.icon }]}>
                            {reply.isHelpful || 0}
                          </ThemedText>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.replyActionButton}
                          activeOpacity={0.7}
                        >
                          <ThemedText type="small" style={[styles.replyActionText, { color: colors.primary }]}>
                            Reply
                          </ThemedText>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          </ScrollView>

          {/* Reply Input */}
          <View style={[styles.replyInputContainer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
            <View style={[styles.userAvatarSmall, { backgroundColor: userAvatarColor }]}>
              <MaterialIcons name="person" size={16} color="#FFFFFF" />
            </View>
            <TextInput
              style={[
                styles.replyInput,
                createInputStyle(),
                {
                  backgroundColor: colors.surface,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              placeholder="Write a supportive comment..."
              placeholderTextColor={colors.icon}
              value={replyContent}
              onChangeText={setReplyContent}
              multiline
              maxLength={1000}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                getCursorStyle(),
                {
                  backgroundColor: colors.primary,
                  opacity: isSubmitting || !replyContent.trim() ? 0.5 : 1,
                },
              ]}
              onPress={handleSubmitReply}
              disabled={isSubmitting || !replyContent.trim()}
            >
              <Ionicons name="send" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </ThemedView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeAreaTop: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontWeight: '700',
    fontSize: 20,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  postSection: {
    marginBottom: Spacing.xl,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontWeight: '600',
    fontSize: 16,
    marginBottom: 2,
  },
  timestamp: {
    fontSize: 13,
  },
  postTitle: {
    fontWeight: '700',
    fontSize: 20,
    marginBottom: Spacing.md,
    lineHeight: 28,
  },
  postContent: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: Spacing.md,
  },
  hashtagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  hashtag: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  hashtagText: {
    fontSize: 13,
    fontWeight: '600',
  },
  interactionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
  interactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  interactionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  repliesSection: {
    marginTop: Spacing.lg,
  },
  repliesHeader: {
    fontWeight: '700',
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.lg,
  },
  emptyReplies: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    opacity: 0.7,
    textAlign: 'center',
  },
  replyCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  replyHeader: {
    marginBottom: Spacing.md,
  },
  replyUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  replyAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  replyUsername: {
    fontWeight: '600',
    fontSize: 15,
    marginBottom: 2,
  },
  volunteerBadge: {
    fontSize: 12,
    fontWeight: '600',
  },
  replyTimestamp: {
    fontSize: 12,
  },
  replyContent: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: Spacing.md,
  },
  replyActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
  replyActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  replyActionText: {
    fontSize: 13,
    fontWeight: '500',
  },
  replyInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: Spacing.md,
    borderTopWidth: 1,
    gap: Spacing.sm,
  },
  userAvatarSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  replyInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    minHeight: 44,
    maxHeight: 100,
    textAlignVertical: 'top',
    fontSize: 15,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
});
