/**
 * Peer Support Forum - Main feed screen
 */

import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ThemedView } from '@/app/components/themed-view';
import { ThemedText } from '@/app/components/themed-text';
import { PostCard } from '@/app/components/post-card';
import { PostSkeleton } from '@/app/components/loading-skeleton';
import { Post, PostCategory } from '@/app/types';
import { getPosts } from '@/lib/database';
import { useColorScheme } from '@/app/hooks/use-color-scheme';
import { Colors, Spacing, BorderRadius } from '@/app/constants/theme';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { createShadow, getCursorStyle } from '@/app/utils/platform-styles';
import { CATEGORIES } from '@/app/constants/categories';
import { subscribeToPosts, subscribeToPostChanges, unsubscribe, RealtimeChannel } from '@/lib/realtime';

const POSTS_PER_PAGE = 20;

export default function ForumScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const [posts, setPosts] = useState<Post[]>([]);
  const [displayedPosts, setDisplayedPosts] = useState<Post[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<PostCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const postsChannelRef = useRef<RealtimeChannel | null>(null);
  const currentPageRef = useRef(1);

  useEffect(() => {
    loadPosts();
    setupRealtimeSubscriptions();

    return () => {
      // Cleanup subscriptions on unmount
      if (postsChannelRef.current) {
        unsubscribe(postsChannelRef.current);
      }
    };
  }, []);

  useEffect(() => {
    // Reset pagination when filters change
    currentPageRef.current = 1;
    filterAndPaginatePosts();
  }, [selectedCategory, searchQuery, posts]);

  const loadPosts = async () => {
    try {
      setLoading(true);
      const allPosts = await getPosts();
      // Sort by most recent first
      const sortedPosts = allPosts.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setPosts(sortedPosts);
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAndPaginatePosts = () => {
    const filtered = posts.filter((post) => {
      const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory;
      const matchesSearch =
        searchQuery === '' ||
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.content.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });

    // Paginate
    const page = currentPageRef.current;
    const startIndex = 0;
    const endIndex = page * POSTS_PER_PAGE;
    setDisplayedPosts(filtered.slice(startIndex, endIndex));
    setHasMore(endIndex < filtered.length);
  };

  const loadMorePosts = () => {
    if (loadingMore || !hasMore) return;
    
    setLoadingMore(true);
    currentPageRef.current += 1;
    
    // Simulate slight delay for better UX
    setTimeout(() => {
      filterAndPaginatePosts();
      setLoadingMore(false);
    }, 300);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    currentPageRef.current = 1;
    await loadPosts();
    setRefreshing(false);
  };

  const setupRealtimeSubscriptions = () => {
    // Subscribe to new posts
    const newPostsChannel = subscribeToPosts((newPost) => {
      setPosts((prevPosts) => {
        // Check if post already exists (avoid duplicates)
        const exists = prevPosts.some((p) => p.id === newPost.id);
        if (exists) return prevPosts;
        // Add new post at the beginning (most recent first)
        return [newPost, ...prevPosts];
      });
    });

    // Subscribe to post updates (upvotes, status changes, etc.)
    const postChangesChannel = subscribeToPostChanges(({ eventType, post }) => {
      if (eventType === 'DELETE' && post === null) {
        // Handle post deletion if needed
        return;
      }

      if (post) {
        setPosts((prevPosts) => {
          if (eventType === 'INSERT') {
            // Check if post already exists (avoid duplicates)
            const exists = prevPosts.some((p) => p.id === post.id);
            if (exists) return prevPosts;
            return [post, ...prevPosts];
          } else if (eventType === 'UPDATE') {
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

  // Category filters matching the design
  const categories: Array<{ id: PostCategory | 'all'; label: string }> = [
    { id: 'all', label: 'All' },
    { id: 'mental-health', label: 'Stress' },
    { id: 'relationships', label: 'Relationships' },
    { id: 'academic', label: 'Academics' },
  ];

  const handlePostPress = (post: Post) => {
    router.push(`/post/${post.id}`);
  };

  const renderPost = ({ item }: { item: Post }) => (
    <PostCard post={item} onPress={() => handlePostPress(item)} />
  );

  return (
    <SafeAreaView edges={['top']} style={styles.safeAreaTop}>
      <ThemedView style={styles.container}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.background }]}>
        <ThemedText type="h2" style={styles.headerTitle}>
          Peer Support Forum
        </ThemedText>
        <View style={styles.headerIcons}>
          <TouchableOpacity style={getCursorStyle()}>
            <MaterialIcons name="search" size={24} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity style={[getCursorStyle(), { marginLeft: Spacing.md, position: 'relative' }]}>
            <MaterialIcons name="notifications-none" size={24} color={colors.text} />
            <View style={[styles.badge, { backgroundColor: colors.primary, borderColor: colors.background }]}>
              <Text style={styles.badgeText}>2</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Category Filters */}
      <View style={styles.filtersContainer}>
        <FlatList
          horizontal
          data={categories}
          renderItem={({ item }) => {
            const isSelected = selectedCategory === item.id;
            return (
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: isSelected
                      ? '#A2D2FF'
                      : colors.surface,
                  },
                ]}
                onPress={() => setSelectedCategory(item.id)}
                activeOpacity={0.7}
              >
                <ThemedText
                  type="small"
                  style={{
                    color: isSelected ? '#FFFFFF' : colors.text,
                    fontWeight: '600',
                  }}
                >
                  {item.label}
                </ThemedText>
              </TouchableOpacity>
            );
          }}
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersContent}
        />
      </View>

      {/* Posts List */}
      {loading ? (
        <PostSkeleton count={3} />
      ) : (
        <FlatList
          data={displayedPosts}
          renderItem={renderPost}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.postsContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          onEndReached={loadMorePosts}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.loadingMore}>
                <ActivityIndicator size="small" color={colors.primary} />
                <ThemedText type="small" style={[styles.loadingText, { color: colors.icon }]}>
                  Loading more posts...
                </ThemedText>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialIcons name="forum" size={48} color={colors.icon} />
              <ThemedText type="body" style={styles.emptyText}>
                No posts found. Be the first to share!
              </ThemedText>
            </View>
          }
        />
      )}

      {/* Floating Action Button */}
      <TouchableOpacity
        style={[
          styles.fab,
          { backgroundColor: '#A2D2FF' },
          createShadow(6, '#A2D2FF', 0.4),
        ]}
        onPress={() => router.push('/create-post')}
        activeOpacity={0.8}
      >
        <MaterialIcons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  headerTitle: {
    fontWeight: '700',
    fontSize: 20,
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  filtersContainer: {
    marginBottom: Spacing.md,
  },
  filtersContent: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    marginRight: Spacing.sm,
  },
  postsContent: {
    padding: Spacing.md,
    paddingBottom: 80,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: Spacing.xl,
  },
  emptyText: {
    opacity: 0.7,
    textAlign: 'center',
    marginTop: Spacing.md,
  },
  loadingMore: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  loadingText: {
    marginLeft: Spacing.xs,
  },
  fab: {
    position: 'absolute',
    bottom: 80,
    right: Spacing.md,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

