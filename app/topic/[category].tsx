/**
 * Topic Detail Screen - Level 2: Posts within a topic
 * Shows posts filtered by category with Latest/Trending/Unanswered tabs
 */

import { ThemedText } from '@/app/components/themed-text';
import { ThemedView } from '@/app/components/themed-view';
import { CATEGORIES } from '@/app/constants/categories';
import { BorderRadius, Colors, Spacing } from '@/app/constants/theme';
import { useColorScheme } from '@/app/hooks/use-color-scheme';
import { Post, PostCategory } from '@/app/types';
import { createShadow, getCursorStyle } from '@/app/utils/platform-styles';
import { getPosts, getTrendingPosts, getUnansweredPosts } from '@/lib/database';
import { RealtimeChannel, subscribeToPostChanges, subscribeToPosts, unsubscribe } from '@/lib/realtime';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type FilterType = 'latest' | 'trending' | 'unanswered';

// Generate consistent color for avatar based on user ID
const getAvatarColor = (id: string): string => {
  const colors = ['#CDB4DB', '#BDE0FE', '#A2D2FF', '#FFC8DD', '#FFAFCC'];
  const index = id.charCodeAt(0) % colors.length;
  return colors[index];
};

export default function TopicDetailScreen() {
  const { category } = useLocalSearchParams<{ category: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const [posts, setPosts] = useState<Post[]>([]);
  const [pinnedPost, setPinnedPost] = useState<Post | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('latest');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const postsChannelRef = useRef<RealtimeChannel | null>(null);
  const categoryData = category ? CATEGORIES[category as PostCategory] : null;

  useEffect(() => {
    if (category) {
      loadPosts();
      setupRealtimeSubscriptions();
    }

    return () => {
      if (postsChannelRef.current) {
        unsubscribe(postsChannelRef.current);
      }
    };
  }, [category, selectedFilter]);

  const loadPosts = async () => {
    if (!category) return;

    try {
      setLoading(true);
      const categoryEnum = category as PostCategory;

      let loadedPosts: Post[] = [];
      switch (selectedFilter) {
        case 'latest':
          loadedPosts = await getPosts({ category: categoryEnum });
          // Sort by most recent
          loadedPosts.sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          break;
        case 'trending':
          loadedPosts = await getTrendingPosts(categoryEnum);
          break;
        case 'unanswered':
          loadedPosts = await getUnansweredPosts(categoryEnum);
          break;
      }

      // Separate pinned post (if any - for now we'll use the first post as example)
      // In a real app, you'd have a `isPinned` field
      const regularPosts = loadedPosts;
      setPinnedPost(null); // No pinned posts for now
      setPosts(regularPosts);
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadPosts();
    setRefreshing(false);
  };

  const setupRealtimeSubscriptions = () => {
    if (!category) return;

    // Subscribe to new posts in this category
    const newPostsChannel = subscribeToPosts((newPost) => {
      if (newPost.category === category) {
        setPosts((prevPosts) => {
          const exists = prevPosts.some((p) => p.id === newPost.id);
          if (exists) return prevPosts;
          return [newPost, ...prevPosts];
        });
      }
    });

    // Subscribe to post updates
    const postChangesChannel = subscribeToPostChanges(({ eventType, post }) => {
      if (post && post.category === category) {
        setPosts((prevPosts) => {
          if (eventType === 'UPDATE') {
            return prevPosts.map((p) => (p.id === post.id ? post : p));
          } else if (eventType === 'DELETE') {
            return prevPosts.filter((p) => p.id !== post.id);
          }
          return prevPosts;
        });
      }
    });

    postsChannelRef.current = newPostsChannel;
  };

  const handlePostPress = (post: Post) => {
    router.push(`/post/${post.id}`);
  };

  const renderPostCard = ({ item }: { item: Post }) => {
    const avatarColor = getAvatarColor(item.authorId);
    const hasNewActivity = false; // Could check if post has recent replies

    return (
      <TouchableOpacity
        style={[
          styles.postCard,
          { backgroundColor: colors.card },
          createShadow(1, '#000', 0.05),
        ]}
        onPress={() => handlePostPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.postHeader}>
          <View style={styles.userInfo}>
            <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
              <MaterialIcons name="person" size={20} color="#FFFFFF" />
            </View>
            <View style={styles.userDetails}>
              <ThemedText type="body" style={[styles.username, { color: colors.text }]}>
                {item.authorPseudonym}
              </ThemedText>
              <View style={styles.metaRow}>
                <ThemedText type="small" style={[styles.timestamp, { color: colors.icon }]}>
                  {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                </ThemedText>
                {hasNewActivity && (
                  <View style={[styles.newDot, { backgroundColor: colors.primary }]} />
                )}
              </View>
            </View>
          </View>
        </View>

        <ThemedText type="h3" style={[styles.postTitle, { color: colors.text }]} numberOfLines={2}>
          {item.title}
        </ThemedText>

        <ThemedText type="body" style={[styles.postContent, { color: colors.icon }]} numberOfLines={3}>
          {item.content}
        </ThemedText>

        <View style={styles.postFooter}>
          <View style={[styles.replyBubble, { backgroundColor: colors.surface }]}>
            <MaterialIcons name="chat-bubble-outline" size={16} color={colors.icon} />
            <ThemedText type="small" style={[styles.replyCount, { color: colors.text }]}>
              {item.replies?.length || 0} {item.replies?.length === 1 ? 'reply' : 'replies'}
            </ThemedText>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const filterTabs: Array<{ id: FilterType; label: string }> = [
    { id: 'latest', label: 'Latest' },
    { id: 'trending', label: 'Trending' },
    { id: 'unanswered', label: 'Unanswered' },
  ];

  if (!categoryData) {
    return (
      <SafeAreaView edges={['top']} style={styles.safeAreaTop}>
        <ThemedView style={styles.container}>
          <ThemedText>Category not found</ThemedText>
        </ThemedView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={styles.safeAreaTop}>
      <ThemedView style={styles.container}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.background }]}>
          <TouchableOpacity
            style={[styles.backButton, getCursorStyle()]}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <ThemedText type="h2" style={styles.headerTitle}>
            {categoryData.name}
          </ThemedText>
          <TouchableOpacity
            style={[styles.searchButton, getCursorStyle()]}
            onPress={() => {/* Navigate to search */}}
          >
            <Ionicons name="search" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Pinned Post (if exists) */}
        {pinnedPost && (
          <View style={[styles.pinnedCard, { backgroundColor: colors.card }, createShadow(2, '#000', 0.1)]}>
            <View style={styles.pinnedHeader}>
              <MaterialIcons name="push-pin" size={16} color={colors.primary} />
              <ThemedText type="small" style={[styles.pinnedLabel, { color: colors.primary }]}>
                PINNED
              </ThemedText>
            </View>
            <ThemedText type="h3" style={[styles.pinnedTitle, { color: colors.text }]}>
              Community Guidelines
            </ThemedText>
            <ThemedText type="body" style={[styles.pinnedContent, { color: colors.icon }]} numberOfLines={2}>
              Please read before posting. Let's work together to keep this a safe, supportive space...
            </ThemedText>
          </View>
        )}

        {/* Filter Tabs */}
        <View style={styles.tabsContainer}>
          {filterTabs.map((tab) => {
            const isSelected = selectedFilter === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[
                  styles.tab,
                  {
                    backgroundColor: isSelected ? colors.primary : 'transparent',
                    borderBottomColor: isSelected ? colors.primary : 'transparent',
                  },
                ]}
                onPress={() => setSelectedFilter(tab.id)}
                activeOpacity={0.7}
              >
                <ThemedText
                  type="body"
                  style={{
                    color: isSelected ? '#FFFFFF' : colors.text,
                    fontWeight: isSelected ? '600' : '400',
                  }}
                >
                  {tab.label}
                </ThemedText>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Posts List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <ThemedText type="body" style={[styles.loadingText, { color: colors.icon }]}>
              Loading posts...
            </ThemedText>
          </View>
        ) : (
          <FlatList
            data={posts}
            renderItem={renderPostCard}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.postsContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <MaterialIcons name="forum" size={48} color={colors.icon} />
                <ThemedText type="body" style={[styles.emptyText, { color: colors.icon }]}>
                  No posts yet. Be the first to share!
                </ThemedText>
                <TouchableOpacity
                  style={[styles.createButton, { backgroundColor: colors.primary }]}
                  onPress={() => router.push(`/create-post?category=${category}`)}
                >
                  <ThemedText type="body" style={{ color: '#FFFFFF', fontWeight: '600' }}>
                    Create Post
                  </ThemedText>
                </TouchableOpacity>
              </View>
            }
          />
        )}
      </ThemedView>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontWeight: '700',
    fontSize: 20,
    flex: 1,
    textAlign: 'center',
  },
  searchButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinnedCard: {
    margin: Spacing.lg,
    marginBottom: Spacing.md,
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    borderLeftWidth: 4,
    borderLeftColor: '#A2D2FF',
  },
  pinnedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    gap: Spacing.xs,
  },
  pinnedLabel: {
    fontWeight: '600',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  pinnedTitle: {
    fontWeight: '700',
    fontSize: 18,
    marginBottom: Spacing.xs,
  },
  pinnedContent: {
    fontSize: 14,
    lineHeight: 20,
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
    paddingHorizontal: Spacing.lg,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    marginRight: Spacing.md,
  },
  postsContent: {
    padding: Spacing.lg,
    paddingBottom: 100,
  },
  postCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  postHeader: {
    marginBottom: Spacing.md,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  userDetails: {
    flex: 1,
  },
  username: {
    fontWeight: '600',
    fontSize: 15,
    marginBottom: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  timestamp: {
    fontSize: 12,
  },
  newDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  postTitle: {
    fontWeight: '700',
    fontSize: 16,
    marginBottom: Spacing.sm,
    lineHeight: 22,
  },
  postContent: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  postFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  replyBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  replyCount: {
    fontSize: 12,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  loadingText: {
    marginTop: Spacing.md,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: Spacing.xxl,
  },
  emptyText: {
    opacity: 0.7,
    textAlign: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  createButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
});

