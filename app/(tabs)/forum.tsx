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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ThemedView } from '@/app/components/themed-view';
import { ThemedText } from '@/app/components/themed-text';
import { PostCard } from '@/app/components/post-card';
import { Post, PostCategory } from '@/app/types';
import { getPosts } from '@/app/utils/storage';
import { useColorScheme } from '@/app/hooks/use-color-scheme';
import { Colors, Spacing, BorderRadius } from '@/app/constants/theme';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { createShadow, getCursorStyle } from '@/app/utils/platform-styles';
import { CATEGORIES } from '@/app/constants/categories';
import { subscribeToPosts, subscribeToPostChanges, unsubscribe, RealtimeChannel } from '@/lib/realtime';

export default function ForumScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<PostCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const postsChannelRef = useRef<RealtimeChannel | null>(null);

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

  const loadPosts = async () => {
    try {
      const allPosts = await getPosts();
      setPosts(allPosts);
    } catch (error) {
      console.error('Error loading posts:', error);
    }
  };

  const setupRealtimeSubscriptions = () => {
    // Subscribe to new posts
    const newPostsChannel = subscribeToPosts((newPost) => {
      setPosts((prevPosts) => [newPost, ...prevPosts]);
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
          }
          return prevPosts;
        });
      }
    });

    postsChannelRef.current = newPostsChannel;
  };

  const filteredPosts = posts.filter((post) => {
    const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory;
    const matchesSearch =
      searchQuery === '' ||
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

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
      <FlatList
        data={filteredPosts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.postsContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <ThemedText type="body" style={styles.emptyText}>
              No posts found. Be the first to share!
            </ThemedText>
          </View>
        }
      />

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

