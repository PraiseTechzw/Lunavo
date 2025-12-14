/**
 * Topic/Category Page - Shows all posts for a specific category
 */

import { PostCard } from '@/app/components/post-card';
import { ThemedText } from '@/app/components/themed-text';
import { ThemedView } from '@/app/components/themed-view';
import { WebCard, WebContainer } from '@/app/components/web';
import { CATEGORIES } from '@/app/constants/categories';
import { BorderRadius, Colors, Spacing } from '@/app/constants/theme';
import { useColorScheme } from '@/app/hooks/use-color-scheme';
import { Post, PostCategory } from '@/app/types';
import { createInputStyle, getCursorStyle } from '@/app/utils/platform-styles';
import { getPosts as getPostsFromDB } from '@/lib/database';
import { RealtimeChannel, subscribeToPosts, unsubscribe } from '@/lib/realtime';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    FlatList,
    Platform,
    RefreshControl,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

// Get display name for category
const getCategoryDisplayName = (category: PostCategory): string => {
  const nameMap: Record<PostCategory, string> = {
    'mental-health': 'Depression & Anxiety',
    'crisis': 'Crisis Support',
    'substance-abuse': 'Addiction',
    'sexual-health': 'Sexual Health',
    'stis-hiv': 'STIs/HIV',
    'family-home': 'Family & Home',
    'academic': 'Academic Support',
    'social': 'Social & Personal',
    'relationships': 'Relationship Advice',
    'campus': 'Campus Life',
    'general': 'General Support',
  };
  return nameMap[category] || category;
};

// Get icon for category
const getCategoryIcon = (category: PostCategory): string => {
  const iconMap: Record<PostCategory, string> = {
    'mental-health': 'sentiment-dissatisfied',
    'crisis': 'warning',
    'substance-abuse': 'medkit',
    'sexual-health': 'heart',
    'stis-hiv': 'heart-circle',
    'family-home': 'home',
    'academic': 'library-books',
    'social': 'people',
    'relationships': 'people-outline',
    'campus': 'school',
    'general': 'chatbubbles',
  };
  return iconMap[category] || 'help-circle';
};

export default function TopicScreen() {
  const router = useRouter();
  const { category } = useLocalSearchParams<{ category: string }>();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  
  const [posts, setPosts] = useState<Post[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'popular'>('recent');
  const postsChannelRef = useRef<RealtimeChannel | null>(null);

  const categoryKey = category as PostCategory;
  const categoryInfo = CATEGORIES[categoryKey];
  const displayName = categoryInfo ? getCategoryDisplayName(categoryKey) : category;
  const iconName = getCategoryIcon(categoryKey);

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
  }, [category]);

  useEffect(() => {
    filterAndSortPosts();
  }, [posts, searchQuery, sortBy]);

  const setupRealtimeSubscriptions = () => {
    if (!categoryKey) return;
    
    const channel = subscribeToPosts((newPost) => {
      // Only add posts that match the current category
      if (newPost.category === categoryKey) {
        setPosts((prevPosts) => {
          // Check if post already exists (avoid duplicates)
          const exists = prevPosts.some((p) => p.id === newPost.id);
          if (exists) return prevPosts;
          
          // Add new post at the beginning (most recent first)
          // This ensures new posts appear instantly at the top
          return [newPost, ...prevPosts];
        });
      }
    });
    postsChannelRef.current = channel;
  };

  const loadPosts = async () => {
    try {
      setLoading(true);
      const allPosts = await getPostsFromDB({ category: categoryKey });
      setPosts(allPosts);
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortPosts = () => {
    let filtered = [...posts];

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (post) =>
          post.title.toLowerCase().includes(query) ||
          post.content.toLowerCase().includes(query)
      );
    }

    // Sort posts
    filtered.sort((a, b) => {
      if (sortBy === 'popular') {
        const aScore = (a.upvotes || 0) + (a.replies?.length || 0) * 2;
        const bScore = (b.upvotes || 0) + (b.replies?.length || 0) * 2;
        return bScore - aScore;
      } else {
        // Recent
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    setFilteredPosts(filtered);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPosts();
    setRefreshing(false);
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/forum' as any);
    }
  };

  if (!categoryInfo) {
    return (
      <ThemedView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ThemedText type="h2">Category not found</ThemedText>
        <TouchableOpacity onPress={handleBack} style={{ marginTop: Spacing.md }}>
          <ThemedText style={{ color: colors.primary }}>Go Back</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  if (loading && posts.length === 0) {
    return (
      <ThemedView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <ThemedText style={{ marginTop: Spacing.md, color: colors.icon }}>
          Loading posts...
        </ThemedText>
      </ThemedView>
    );
  }

  const content = (
    <FlatList
      data={filteredPosts}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <PostCard
          post={item}
          onPress={() => router.push(`/post/${item.id}` as any)}
        />
      )}
      ListHeaderComponent={
        <>
          {/* Page Header - Web optimized */}
          {isWeb && (
            <View style={styles.pageHeader}>
              <View style={styles.pageHeaderContent}>
                <View style={[styles.categoryIconContainer, { backgroundColor: categoryInfo.color + '15' }]}>
                  <Ionicons name={iconName as any} size={32} color={categoryInfo.color} />
                </View>
                <View style={styles.pageHeaderText}>
                  <ThemedText type="h1" style={[styles.pageTitle, { color: colors.text }]}>
                    {displayName}
                  </ThemedText>
                  <ThemedText type="body" style={[styles.pageSubtitle, { color: colors.icon }]}>
                    {categoryInfo.description || `Posts in ${displayName}`}
                  </ThemedText>
                </View>
              </View>
            </View>
          )}

          {/* Search and Filters */}
          <WebCard style={styles.filtersCard}>
            <View style={[styles.searchContainer, { backgroundColor: colors.surface }]}>
              <MaterialIcons name="search" size={20} color={colors.icon} style={styles.searchIcon} />
              <TextInput
                style={[styles.searchInput, createInputStyle(), { color: colors.text }]}
                placeholder="Search posts..."
                placeholderTextColor={colors.icon}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            <View style={styles.sortOptions}>
              <TouchableOpacity
                style={[
                  styles.sortChip,
                  {
                    backgroundColor: sortBy === 'recent' ? colors.primary : colors.surface,
                    borderColor: sortBy === 'recent' ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setSortBy('recent')}
              >
                <ThemedText
                  type="small"
                  style={{
                    color: sortBy === 'recent' ? '#FFFFFF' : colors.text,
                    fontWeight: '600',
                  }}
                >
                  Recent
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.sortChip,
                  {
                    backgroundColor: sortBy === 'popular' ? colors.primary : colors.surface,
                    borderColor: sortBy === 'popular' ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setSortBy('popular')}
              >
                <ThemedText
                  type="small"
                  style={{
                    color: sortBy === 'popular' ? '#FFFFFF' : colors.text,
                    fontWeight: '600',
                  }}
                >
                  Popular
                </ThemedText>
              </TouchableOpacity>
            </View>
          </WebCard>

          {/* Posts Count */}
          <View style={styles.postsCountContainer}>
            <ThemedText type="body" style={{ color: colors.icon }}>
              {filteredPosts.length} {filteredPosts.length === 1 ? 'post' : 'posts'}
            </ThemedText>
          </View>
        </>
      }
      ListEmptyComponent={
        <WebCard style={styles.emptyCard}>
          <MaterialIcons name="forum" size={64} color={colors.icon} />
          <ThemedText type="h3" style={[styles.emptyTitle, { color: colors.text }]}>
            No Posts Yet
          </ThemedText>
          <ThemedText type="body" style={[styles.emptyText, { color: colors.icon }]}>
            {searchQuery
              ? 'No posts match your search'
              : `Be the first to share in ${displayName}`}
          </ThemedText>
          {!searchQuery && (
            <TouchableOpacity
              style={[styles.createButton, { backgroundColor: colors.primary }]}
              onPress={() => router.push('/create-post' as any)}
            >
              <MaterialIcons name="add" size={20} color="#FFFFFF" />
              <ThemedText type="body" style={{ color: '#FFFFFF', marginLeft: Spacing.sm, fontWeight: '600' }}>
                Create Post
              </ThemedText>
            </TouchableOpacity>
          )}
        </WebCard>
      }
      contentContainerStyle={styles.listContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      showsVerticalScrollIndicator={false}
    />
  );

  // Web layout with container
  if (isWeb) {
    return (
      <ThemedView style={styles.container}>
        <WebContainer maxWidth={1200} padding={32}>
          {content}
        </WebContainer>
      </ThemedView>
    );
  }

  // Mobile layout
  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ThemedView style={styles.container}>
        {/* Mobile Header */}
        <View style={[styles.header, { backgroundColor: colors.background }]}>
          <TouchableOpacity onPress={handleBack} style={getCursorStyle()}>
            <MaterialIcons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <View style={[styles.categoryIconSmall, { backgroundColor: categoryInfo.color + '15' }]}>
              <Ionicons name={iconName as any} size={20} color={categoryInfo.color} />
            </View>
            <ThemedText type="h2" style={styles.headerTitle} numberOfLines={1}>
              {displayName}
            </ThemedText>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/create-post' as any)}
            style={getCursorStyle()}
          >
            <MaterialIcons name="add" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>
        {content}
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: Spacing.md,
    gap: Spacing.sm,
  },
  categoryIconSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontWeight: '700',
  },
  pageHeader: {
    marginBottom: Spacing.xl,
    marginTop: Spacing.lg,
  },
  pageHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  categoryIconContainer: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pageHeaderText: {
    flex: 1,
  },
  pageTitle: {
    fontWeight: '700',
    fontSize: isWeb ? 32 : 24,
    marginBottom: Spacing.xs,
  },
  pageSubtitle: {
    fontSize: isWeb ? 16 : 14,
  },
  filtersCard: {
    marginBottom: Spacing.lg,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: Spacing.sm,
    fontSize: 16,
  },
  sortOptions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  sortChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    ...getCursorStyle(),
  },
  postsCountContainer: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.md,
  },
  listContent: {
    padding: isWeb ? 0 : Spacing.md,
    paddingBottom: isWeb ? Spacing.xxl : 80,
  },
  emptyCard: {
    padding: Spacing.xxl * 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    marginTop: Spacing.md,
    fontWeight: '700',
  },
  emptyText: {
    marginTop: Spacing.xs,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    ...getCursorStyle(),
  },
});
