/**
 * Posts Needing Help - Peer Educator view
 */

import { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ThemedView } from '@/app/components/themed-view';
import { ThemedText } from '@/app/components/themed-text';
import { MaterialIcons } from '@expo/vector-icons';
import { useColorScheme } from '@/app/hooks/use-color-scheme';
import { Colors, Spacing, BorderRadius } from '@/app/constants/theme';
import { createShadow, getCursorStyle } from '@/app/utils/platform-styles';
import { getPosts, getReplies, getCurrentUser } from '@/lib/database';
import { Post, PostCategory } from '@/app/types';
import { formatDistanceToNow } from 'date-fns';
import { PostCard } from '@/app/components/post-card';
import { CATEGORIES } from '@/app/constants/categories';
import { useRoleGuard } from '@/hooks/use-auth-guard';

export default function PostsNeedingHelpScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  
  const { user, loading: authLoading } = useRoleGuard(
    ['peer-educator', 'peer-educator-executive', 'admin'],
    '/(tabs)'
  );
  
  const [refreshing, setRefreshing] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<PostCategory | 'all'>('all');
  const [sortBy, setSortBy] = useState<'urgency' | 'recent'>('urgency');

  useEffect(() => {
    if (user) {
      loadPosts();
    }
  }, [user, selectedCategory, sortBy]);

  const loadPosts = async () => {
    try {
      const [allPosts, allReplies] = await Promise.all([
        getPosts({ category: selectedCategory !== 'all' ? selectedCategory : undefined }),
        getPosts().then(async (posts) => {
          const replies = await Promise.all(posts.map((p) => getReplies(p.id)));
          return replies.flat();
        }),
      ]);

      // Filter posts needing support (no replies or few replies)
      let postsNeedingHelp = allPosts.filter((post) => {
        const replies = allReplies.filter((r) => r.postId === post.id);
        return replies.length === 0 || (replies.length < 2 && post.escalationLevel === 'none');
      });

      // Sort by urgency
      if (sortBy === 'urgency') {
        postsNeedingHelp.sort((a, b) => {
          // Escalated posts first
          if (a.escalationLevel !== 'none' && b.escalationLevel === 'none') return -1;
          if (a.escalationLevel === 'none' && b.escalationLevel !== 'none') return 1;
          
          // Then by reply count (fewer replies = more urgent)
          const aReplies = allReplies.filter((r) => r.postId === a.id).length;
          const bReplies = allReplies.filter((r) => r.postId === b.id).length;
          if (aReplies !== bReplies) return aReplies - bReplies;
          
          // Then by date (newer first)
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
      } else {
        // Sort by recent
        postsNeedingHelp.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      }

      setPosts(postsNeedingHelp);
    } catch (error) {
      console.error('Error loading posts:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadPosts();
    setRefreshing(false);
  };

  const handlePostPress = (post: Post) => {
    router.push(`/post/${post.id}`);
  };

  const renderPost = ({ item }: { item: Post }) => (
    <PostCard post={item} onPress={() => handlePostPress(item)} />
  );

  if (authLoading) {
    return (
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <ThemedView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ThemedText>Loading...</ThemedText>
        </ThemedView>
      </SafeAreaView>
    );
  }

  const categories: Array<{ id: PostCategory | 'all'; label: string }> = [
    { id: 'all', label: 'All' },
    { id: 'mental-health', label: 'Mental Health' },
    { id: 'academic', label: 'Academic' },
    { id: 'relationships', label: 'Relationships' },
    { id: 'substance-abuse', label: 'Substance Abuse' },
    { id: 'sexual-health', label: 'Sexual Health' },
  ];

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ThemedView style={styles.container}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.background }]}>
          <TouchableOpacity onPress={() => router.back()} style={getCursorStyle()}>
            <MaterialIcons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <ThemedText type="h2" style={styles.headerTitle}>
            Posts Needing Help
          </ThemedText>
          <View style={{ width: 24 }} />
        </View>

        {/* Filters */}
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
                      backgroundColor: isSelected ? colors.primary : colors.surface,
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
          
          {/* Sort Options */}
          <View style={styles.sortContainer}>
            <TouchableOpacity
              style={[
                styles.sortButton,
                {
                  backgroundColor: sortBy === 'urgency' ? colors.primary : colors.surface,
                },
              ]}
              onPress={() => setSortBy('urgency')}
            >
              <MaterialIcons
                name="priority-high"
                size={16}
                color={sortBy === 'urgency' ? '#FFFFFF' : colors.text}
              />
              <ThemedText
                type="small"
                style={{
                  color: sortBy === 'urgency' ? '#FFFFFF' : colors.text,
                  fontWeight: '600',
                  marginLeft: Spacing.xs,
                }}
              >
                Urgency
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.sortButton,
                {
                  backgroundColor: sortBy === 'recent' ? colors.primary : colors.surface,
                },
              ]}
              onPress={() => setSortBy('recent')}
            >
              <MaterialIcons
                name="schedule"
                size={16}
                color={sortBy === 'recent' ? '#FFFFFF' : colors.text}
              />
              <ThemedText
                type="small"
                style={{
                  color: sortBy === 'recent' ? '#FFFFFF' : colors.text,
                  fontWeight: '600',
                  marginLeft: Spacing.xs,
                }}
              >
                Recent
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>

        {/* Posts List */}
        <FlatList
          data={posts}
          renderItem={renderPost}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialIcons name="check-circle" size={64} color={colors.success} />
              <ThemedText type="body" style={[styles.emptyText, { color: colors.icon }]}>
                All posts have received support!
              </ThemedText>
            </View>
          }
        />
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
  filtersContainer: {
    paddingVertical: Spacing.md,
  },
  filtersContent: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    marginRight: Spacing.sm,
  },
  sortContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  listContent: {
    padding: Spacing.md,
    paddingBottom: 80,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xxl,
    marginTop: Spacing.xxl,
  },
  emptyText: {
    marginTop: Spacing.md,
    textAlign: 'center',
  },
});


