/**
 * Post detail screen - view a post and its replies
 */

import { CategoryBadge } from '@/app/components/category-badge';
import { ThemedText } from '@/app/components/themed-text';
import { ThemedView } from '@/app/components/themed-view';
import { BorderRadius, Colors, Spacing } from '@/app/constants/theme';
import { useColorScheme } from '@/app/hooks/use-color-scheme';
import { Post, Reply } from '@/app/types';
import { generatePseudonym, sanitizeContent } from '@/app/utils/anonymization';
import { createInputStyle, getCursorStyle } from '@/app/utils/platform-styles';
import { getPosts, getPseudonym } from '@/app/utils/storage';
import { createReply, getCurrentUser, getReplies as getRepliesFromDB } from '@/lib/database';
import { subscribeToPostUpdates, subscribeToReplies, subscribeToReplyChanges, unsubscribe } from '@/lib/realtime';
import { Ionicons } from '@expo/vector-icons';
import { RealtimeChannel } from '@supabase/supabase-js';
import { formatDistanceToNow } from 'date-fns';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
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

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const [post, setPost] = useState<Post | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [replyContent, setReplyContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sendingReplyId, setSendingReplyId] = useState<string | null>(null);
  const repliesChannelRef = useRef<RealtimeChannel | null>(null);
  const postChannelRef = useRef<RealtimeChannel | null>(null);
  const replyChangesChannelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (id) {
      loadPost();
      setupRealtimeSubscriptions();
    }

    return () => {
      // Cleanup subscriptions on unmount
      if (repliesChannelRef.current) {
        unsubscribe(repliesChannelRef.current);
      }
      if (postChannelRef.current) {
        unsubscribe(postChannelRef.current);
      }
    };
  }, [id]);

  const loadPost = async () => {
    try {
      const allPosts = await getPosts();
      const foundPost = allPosts.find((p) => p.id === id);
      if (foundPost) {
        setPost(foundPost);
        const postReplies = await getRepliesFromDB(id);
        setReplies(postReplies);
      } else {
        Alert.alert('Not Found', 'This post could not be found.', [
          { 
            text: 'OK', 
            onPress: () => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/(tabs)/forum' as any);
              }
            }
          },
        ]);
      }
    } catch (error) {
      console.error('Error loading post:', error);
    }
  };

  const setupRealtimeSubscriptions = () => {
    if (!id) return;

    // Subscribe to new replies
    const repliesChannel = subscribeToReplies(id, (newReply) => {
      setReplies((prevReplies) => {
        // Check if reply already exists (avoid duplicates)
        const exists = prevReplies.some((r) => r.id === newReply.id || (r.id.startsWith('temp_') && r.content === newReply.content));
        if (exists) {
          // Replace optimistic reply with real one
          return prevReplies.map((r) => 
            (r.id.startsWith('temp_') && r.content === newReply.content) ? newReply : r
          ).filter((r, index, self) => 
            index === self.findIndex((reply) => reply.id === r.id)
          );
        }
        return [...prevReplies, newReply];
      });
      // Clear sending state when real reply arrives
      setSendingReplyId(null);
    });

    // Subscribe to reply updates (helpful votes, etc.)
    const replyChangesChannel = subscribeToReplyChanges(id, ({ eventType, reply }) => {
      if (eventType === 'DELETE' && reply === null) {
        // Handle reply deletion if needed
        return;
      }

      if (reply) {
        setReplies((prevReplies) => {
          if (eventType === 'UPDATE') {
            return prevReplies.map((r) => (r.id === reply.id ? reply : r));
          } else if (eventType === 'INSERT') {
            // Replace optimistic reply with real one
            const exists = prevReplies.some((r) => r.id === reply.id || (r.id.startsWith('temp_') && r.content === reply.content));
            if (exists) {
              return prevReplies.map((r) => 
                (r.id.startsWith('temp_') && r.content === reply.content) ? reply : r
              ).filter((r, index, self) => 
                index === self.findIndex((reply) => reply.id === r.id)
              );
            }
            return [...prevReplies, reply];
          }
          return prevReplies;
        });
        setSendingReplyId(null);
      }
    });

    // Subscribe to post updates (upvotes, status changes, etc.)
    const postUpdateChannel = subscribeToPostUpdates(id, (updatedPost) => {
      setPost(updatedPost);
    });

    repliesChannelRef.current = repliesChannel;
    replyChangesChannelRef.current = replyChangesChannel;
    postChannelRef.current = postUpdateChannel;
  };

  const handleSubmitReply = async () => {
    if (!replyContent.trim() || !post || !id || isSubmitting) return;

    setIsSubmitting(true);
    const messageText = replyContent.trim();
    setReplyContent('');

    let tempId: string | null = null;

    try {
      // Get current user
      const user = await getCurrentUser();
      if (!user) {
        Alert.alert('Error', 'You must be logged in to reply.');
        setReplyContent(messageText);
        setIsSubmitting(false);
        return;
      }

      const pseudonym = (await getPseudonym()) || generatePseudonym();
      const sanitizedContent = sanitizeContent(messageText);

      // Create optimistic reply
      tempId = `temp_${Date.now()}`;
      const optimisticReply: Reply = {
        id: tempId,
        postId: post.id,
        authorId: user.id,
        authorPseudonym: pseudonym,
        content: sanitizedContent,
        isAnonymous: true,
        isHelpful: 0,
        isFromVolunteer: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        reportedCount: 0,
      };

      // Add optimistic reply immediately
      setReplies((prev) => [...prev, optimisticReply]);
      setSendingReplyId(tempId);

      // Create reply in database (will trigger real-time event)
      await createReply({
        postId: post.id,
        authorId: user.id,
        content: sanitizedContent,
        isAnonymous: true,
        isFromVolunteer: false,
      });

      // Real-time subscription will replace optimistic reply with real one
      // If real-time doesn't fire within 2 seconds, clear sending state anyway
      setTimeout(() => {
        setSendingReplyId(null);
      }, 2000);
    } catch (error) {
      console.error('Error posting reply:', error);
      // Remove optimistic reply on error
      if (tempId) {
        setReplies((prev) => prev.filter((r) => r.id !== tempId));
      }
      setReplyContent(messageText);
      Alert.alert('Error', 'Failed to post reply. Please try again.');
      setSendingReplyId(null);
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

  const isEscalated = post.escalationLevel !== 'none';

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ThemedView style={styles.container}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {isEscalated && (
            <View style={[styles.escalationBanner, { backgroundColor: colors.danger + '20' }]}>
              <Ionicons name="warning" size={20} color={colors.danger} />
              <ThemedText style={[styles.escalationText, { color: colors.danger }]}>
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
            <ThemedText type="small" style={{ color: colors.icon }}>
              👤 {post.authorPseudonym}
            </ThemedText>
            <ThemedText type="small" style={{ color: colors.icon }}>
              {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
            </ThemedText>
          </View>

          <ThemedText type="body" style={styles.content}>
            {post.content}
          </ThemedText>

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
            replies.map((reply) => {
              const isSending = sendingReplyId === reply.id;
              return (
                <View 
                  key={reply.id} 
                  style={[
                    styles.replyCard, 
                    { 
                      backgroundColor: colors.surface,
                      opacity: isSending ? 0.7 : 1,
                    }
                  ]}
                >
                  <View style={styles.replyHeader}>
                    <ThemedText type="body" style={styles.replyAuthor}>
                      {reply.authorPseudonym}
                      {reply.isFromVolunteer && (
                        <Text style={[styles.volunteerBadge, { color: colors.success }]}>
                          {' '}✓ Volunteer
                        </Text>
                      )}
                    </ThemedText>
                    <View style={styles.replyHeaderRight}>
                      {isSending && (
                        <ActivityIndicator size="small" color={colors.icon} style={{ marginRight: Spacing.xs }} />
                      )}
                      <ThemedText type="small" style={{ color: colors.icon }}>
                        {isSending ? 'Sending...' : formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })}
                      </ThemedText>
                    </View>
                  </View>
                  <ThemedText type="body" style={styles.replyContent}>
                    {reply.content}
                  </ThemedText>
                  {reply.isHelpful > 0 && (
                    <ThemedText type="small" style={{ color: colors.success, marginTop: Spacing.xs }}>
                      👍 {reply.isHelpful} found this helpful
                    </ThemedText>
                  )}
                </View>
              );
            })
          )}
        </ScrollView>

        <View style={[styles.replyInputContainer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
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
            placeholder="Offer support, share advice, or ask a question..."
            placeholderTextColor={colors.icon}
            value={replyContent}
            onChangeText={setReplyContent}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            style={[
              styles.replyButton,
              getCursorStyle(),
              {
                backgroundColor: colors.primary,
                opacity: isSubmitting || !replyContent.trim() ? 0.5 : 1,
              },
            ]}
            onPress={handleSubmitReply}
            disabled={isSubmitting || !replyContent.trim()}
          >
            <ThemedText style={{ color: '#FFFFFF', fontWeight: '600' }}>
              {isSubmitting ? 'Posting...' : 'Reply'}
            </ThemedText>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
  },
  escalationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  escalationText: {
    flex: 1,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    marginBottom: Spacing.sm,
  },
  meta: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  content: {
    marginBottom: Spacing.lg,
    lineHeight: 24,
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: Spacing.lg,
  },
  repliesHeader: {
    marginBottom: Spacing.md,
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
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  replyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  replyHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  replyAuthor: {
    fontWeight: '600',
  },
  volunteerBadge: {
    fontSize: 12,
    fontWeight: '600',
  },
  replyContent: {
    lineHeight: 22,
  },
  replyInputContainer: {
    padding: Spacing.md,
    borderTopWidth: 1,
    gap: Spacing.sm,
  },
  replyInput: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    minHeight: 80,
    maxHeight: 120,
    textAlignVertical: 'top',
  },
  replyButton: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
});

