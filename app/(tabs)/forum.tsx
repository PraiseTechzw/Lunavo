/**
 * Peer Support Forum - Level 1: Find Support (Topic Cards View)
 * Shows all support topics/categories as cards with stats
 */

import { FAB as FABButton } from '@/components/navigation/fab-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { CATEGORIES } from '@/constants/categories';
import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { PostCategory } from '@/types';
import { createShadow, getCursorStyle } from '@/utils/platform-styles';
import { getTopicStats, TopicStats } from '@/lib/database';
import { subscribeToPosts, unsubscribe } from '@/lib/realtime';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { RealtimeChannel } from '@supabase/supabase-js';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Platform,
    RefreshControl,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Icon mapping for categories (matching the design)
const getCategoryIcon = (category: PostCategory): string => {
  const iconMap: Record<PostCategory, string> = {
    'mental-health': 'sentiment-dissatisfied', // Purple brain/head icon
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

// Get short description for category
const getCategoryDescription = (category: PostCategory): string => {
  const descMap: Record<PostCategory, string> = {
    'mental-health': 'A safe space to share coping strategies and experiences.',
    'crisis': 'Immediate support for urgent situations.',
    'substance-abuse': 'Support for recovery and healthy choices.',
    'sexual-health': 'Safe space for sexual and reproductive health questions.',
    'stis-hiv': 'Education and support for STI/HIV prevention.',
    'family-home': 'Navigating family dynamics and home challenges.',
    'academic': 'Study stress, exam anxiety, and academic performance.',
    'social': 'Friendship, social anxiety, and personal growth.',
    'relationships': 'Navigating complex dynamics in family and partnerships.',
    'campus': 'Campus resources and student life support.',
    'general': 'Other concerns and questions.',
  };
  return descMap[category] || 'Connect with others who understand.';
};

export default function ForumScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const [topicStats, setTopicStats] = useState<TopicStats[]>([]);
  const [displayedTopics, setDisplayedTopics] = useState<TopicStats[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'trending'>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const postsChannelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    loadTopicStats();
    setupRealtimeSubscriptions();

    return () => {
      if (postsChannelRef.current) {
        unsubscribe(postsChannelRef.current);
      }
    };
  }, []);

  useEffect(() => {
    filterTopics();
  }, [searchQuery, selectedFilter, topicStats]);

  const loadTopicStats = async () => {
    try {
      setLoading(true);
      const stats = await getTopicStats();
      
      // Sort by trending (recent posts) or member count
      const sorted = selectedFilter === 'trending'
        ? [...stats].sort((a, b) => b.recentPostCount - a.recentPostCount)
        : [...stats].sort((a, b) => b.memberCount - a.memberCount);
      
      setTopicStats(sorted);
    } catch (error) {
      console.error('Error loading topic stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterTopics = () => {
    let filtered = [...topicStats];

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(stat => {
        const category = CATEGORIES[stat.category as PostCategory];
        const name = getCategoryDisplayName(stat.category);
        const desc = getCategoryDescription(stat.category);
        const searchLower = searchQuery.toLowerCase();
        return (
          name.toLowerCase().includes(searchLower) ||
          desc.toLowerCase().includes(searchLower) ||
          category.name.toLowerCase().includes(searchLower)
        );
      });
    }

    // Sort by filter
    if (selectedFilter === 'trending') {
      filtered.sort((a, b) => b.recentPostCount - a.recentPostCount);
    } else {
      filtered.sort((a, b) => b.memberCount - a.memberCount);
    }

    setDisplayedTopics(filtered);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadTopicStats();
    setRefreshing(false);
  };

  const setupRealtimeSubscriptions = () => {
    // Subscribe to new posts to update stats in real-time
    const newPostsChannel = subscribeToPosts((newPost) => {
      // Optimistically update stats for the category of the new post immediately
      setTopicStats((prevStats) => {
        const categoryExists = prevStats.some((stat) => stat.category === newPost.category);
        
        if (categoryExists) {
          // Update existing category stats
          return prevStats.map((stat) => {
            if (stat.category === newPost.category) {
              return {
                ...stat,
                memberCount: stat.memberCount + 1,
                recentPostCount: stat.recentPostCount + 1,
              };
            }
            return stat;
          });
        } else {
          // If category doesn't exist in stats yet, refresh to get accurate data
          loadTopicStats();
          return prevStats;
        }
      });
      
      // Refresh stats in background to ensure accuracy (but UI already updated)
      // Use a small delay to avoid race conditions
      setTimeout(() => {
        loadTopicStats();
      }, 500);
    });

    postsChannelRef.current = newPostsChannel;
  };

  const formatMemberCount = (count: number): string => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  };

  const handleTopicPress = (category: PostCategory) => {
    router.push(`/topic/${category}` as any);
  };

  const renderTopicCard = ({ item }: { item: TopicStats }) => {
    const category = CATEGORIES[item.category as PostCategory];
    const iconName = getCategoryIcon(item.category);
    const displayName = getCategoryDisplayName(item.category);
    const description = getCategoryDescription(item.category);

    return (
      <TouchableOpacity
        style={[
          styles.topicCard,
          { backgroundColor: colors.card },
          createShadow(2, '#000', 0.1),
        ]}
        onPress={() => handleTopicPress(item.category)}
        activeOpacity={0.7}
      >
        <View style={styles.topicCardContent}>
          {/* Icon */}
          <View style={[styles.topicIcon, { backgroundColor: category.color + '20' }]}>
            <Ionicons name={iconName as any} size={32} color={category.color} />
          </View>

          {/* Content */}
          <View style={styles.topicInfo}>
            <ThemedText type="h3" style={[styles.topicTitle, { color: colors.text }]}>
              {displayName}
            </ThemedText>
            <ThemedText type="small" style={[styles.topicDescription, { color: colors.icon }]} numberOfLines={2}>
              {description}
            </ThemedText>

            {/* Stats */}
            <View style={styles.topicStats}>
              <View style={styles.statItem}>
                <Ionicons name="people-outline" size={16} color={colors.icon} />
                <ThemedText type="small" style={[styles.statText, { color: colors.icon }]}>
                  {formatMemberCount(item.memberCount)}
                </ThemedText>
              </View>
              <View style={[styles.statItem, styles.onlineStat]}>
                <View style={[styles.onlineDot, { backgroundColor: '#10B981' }]} />
                <ThemedText type="small" style={[styles.statText, { color: '#10B981' }]}>
                  {item.onlineCount} Online
                </ThemedText>
              </View>
            </View>
          </View>

          {/* Arrow */}
          <MaterialIcons name="arrow-forward-ios" size={20} color={colors.icon} />
        </View>
      </TouchableOpacity>
    );
  };

  const filterOptions = [
    { id: 'all' as const, label: 'All' },
    { id: 'trending' as const, label: 'Trending' },
  ];

  return (
    <SafeAreaView edges={['top']} style={styles.safeAreaTop}>
      <ThemedView style={styles.container}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.background }]}>
          <ThemedText type="h2" style={styles.headerTitle}>
            Find Support
          </ThemedText>
          <TouchableOpacity
            style={[styles.createButton, getCursorStyle()]}
            onPress={() => router.push('/create-post')}
          >
            <MaterialIcons name="edit" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={[styles.searchContainer, { backgroundColor: colors.background }]}>
          <Ionicons name="search" size={20} color={colors.icon} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search for topics..."
            placeholderTextColor={colors.icon}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Filter Tabs */}
        <View style={styles.filtersContainer}>
          <FlatList
            horizontal
            data={filterOptions}
            renderItem={({ item }) => {
              const isSelected = selectedFilter === item.id;
              return (
                <TouchableOpacity
                  style={[
                    styles.filterChip,
                    {
                      backgroundColor: isSelected ? colors.primary : colors.surface,
                    },
                  ]}
                  onPress={() => setSelectedFilter(item.id)}
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

        {/* Topics List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <ThemedText type="body" style={[styles.loadingText, { color: colors.icon }]}>
              Loading topics...
            </ThemedText>
          </View>
        ) : (
          <FlatList
            data={displayedTopics}
            renderItem={renderTopicCard}
            keyExtractor={(item) => item.category}
            contentContainerStyle={styles.topicsContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <MaterialIcons name="forum" size={48} color={colors.icon} />
                <ThemedText type="body" style={[styles.emptyText, { color: colors.icon }]}>
                  No topics found. Try a different search.
                </ThemedText>
              </View>
            }
          />
        )}
        
        {/* FAB - Create Post (Mobile Only) */}
        {Platform.OS !== 'web' && (
          <FABButton
            icon="add"
            label="Create Post"
            onPress={() => router.push('/create-post')}
            position="bottom-right"
            color={colors.primary}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  headerTitle: {
    fontWeight: '700',
    fontSize: 24,
  },
  createButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.md,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: Spacing.xs,
  },
  filtersContainer: {
    marginBottom: Spacing.md,
  },
  filtersContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  filterChip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    marginRight: Spacing.sm,
  },
  topicsContent: {
    padding: Spacing.lg,
    paddingBottom: 100,
  },
  topicCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  topicCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  topicIcon: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  topicInfo: {
    flex: 1,
  },
  topicTitle: {
    fontWeight: '700',
    fontSize: 18,
    marginBottom: Spacing.xs,
  },
  topicDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: Spacing.sm,
  },
  topicStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  onlineStat: {
    marginLeft: Spacing.sm,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statText: {
    fontSize: 13,
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
  },
});
