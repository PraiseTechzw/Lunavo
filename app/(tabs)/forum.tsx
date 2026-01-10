/**
 * Peer Support Forum - Premium Topic Cards View
 */

import { FAB as FABButton } from '@/app/components/navigation/fab-button';
import { ThemedText } from '@/app/components/themed-text';
import { ThemedView } from '@/app/components/themed-view';
import { CATEGORIES } from '@/app/constants/categories';
import { BorderRadius, Colors, PlatformStyles, Spacing } from '@/app/constants/theme';
import { useColorScheme } from '@/app/hooks/use-color-scheme';
import { PostCategory } from '@/app/types';
import { getTopicStats, TopicStats } from '@/lib/database';
import { RealtimeChannel, subscribeToPosts, unsubscribe } from '@/lib/realtime';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

const getCategoryIcon = (category: PostCategory): string => {
  const iconMap: Record<PostCategory, string> = {
    'mental-health': 'head-outline',
    'crisis': 'alert-circle-outline',
    'substance-abuse': 'medkit-outline',
    'sexual-health': 'heart-outline',
    'stis-hiv': 'shield-checkmark-outline',
    'family-home': 'home-outline',
    'academic': 'book-outline',
    'social': 'people-outline',
    'relationships': 'chatbubbles-outline',
    'campus': 'business-outline',
    'general': 'help-circle-outline',
  };
  return iconMap[category] || 'help-circle-outline';
};

const getCategoryDisplayName = (category: PostCategory): string => {
  const nameMap: Record<PostCategory, string> = {
    'mental-health': 'Wellness & Mind',
    'crisis': 'Urgent Help',
    'substance-abuse': 'Recovery',
    'sexual-health': 'Vitality',
    'stis-hiv': 'Protection',
    'family-home': 'Sanctuary',
    'academic': 'Scholarship',
    'social': 'Connection',
    'relationships': 'Harmony',
    'campus': 'Civitas',
    'general': 'Common Room',
  };
  return nameMap[category] || category;
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
      if (postsChannelRef.current) unsubscribe(postsChannelRef.current);
    };
  }, []);

  useEffect(() => {
    filterTopics();
  }, [searchQuery, selectedFilter, topicStats]);

  const loadTopicStats = async () => {
    try {
      setLoading(true);
      const stats = await getTopicStats();
      setTopicStats(stats);
    } catch (error) {
      console.error('Error loading topic stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterTopics = () => {
    let filtered = [...topicStats];
    if (searchQuery.trim()) {
      const searchLower = searchQuery.toLowerCase();
      filtered = filtered.filter(stat => {
        const category = CATEGORIES[stat.category as PostCategory];
        return category.name.toLowerCase().includes(searchLower) ||
          getCategoryDisplayName(stat.category).toLowerCase().includes(searchLower);
      });
    }
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
    postsChannelRef.current = subscribeToPosts(() => loadTopicStats());
  };

  const renderTopicCard = ({ item, index }: { item: TopicStats, index: number }) => {
    const category = CATEGORIES[item.category as PostCategory];
    const iconName = getCategoryIcon(item.category);
    const displayName = getCategoryDisplayName(item.category);

    return (
      <Animated.View entering={FadeInDown.delay(index * 50).duration(600)}>
        <TouchableOpacity
          style={[styles.topicCard, { backgroundColor: colors.card }]}
          onPress={() => router.push(`/topic/${item.category}` as any)}
          activeOpacity={0.8}
        >
          <View style={[styles.iconBox, { backgroundColor: category.color + '15' }]}>
            <Ionicons name={iconName as any} size={28} color={category.color} />
          </View>

          <View style={styles.topicInfo}>
            <ThemedText type="h3" style={styles.topicTitle}>{displayName}</ThemedText>
            <ThemedText type="small" style={{ color: colors.icon }}>{category.description}</ThemedText>

            <View style={styles.statsRow}>
              <View style={styles.statChip}>
                <Ionicons name="people-outline" size={12} color={colors.icon} />
                <ThemedText style={styles.statText}>{item.memberCount}</ThemedText>
              </View>
              {item.recentPostCount > 0 && (
                <View style={[styles.statChip, { backgroundColor: colors.success + '20' }]}>
                  <Ionicons name="trending-up" size={12} color={colors.success} />
                  <ThemedText style={[styles.statText, { color: colors.success }]}>+{item.recentPostCount}</ThemedText>
                </View>
              )}
            </View>
          </View>

          <Ionicons name="chevron-forward" size={20} color={colors.border} />
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safeAreaTop}>
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <ThemedText type="h1">Community</ThemedText>
          <ThemedText style={{ color: colors.icon }}>Find your circle of support</ThemedText>
        </View>

        <View style={styles.searchSection}>
          <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="search" size={20} color={colors.icon} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search topics..."
              placeholderTextColor={colors.icon}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        <View style={styles.filterSection}>
          <TouchableOpacity
            style={[styles.filterTab, selectedFilter === 'all' && { borderBottomColor: colors.primary }]}
            onPress={() => setSelectedFilter('all')}
          >
            <ThemedText style={[styles.filterLabel, selectedFilter === 'all' && { color: colors.primary }]}>Discovery</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterTab, selectedFilter === 'trending' && { borderBottomColor: colors.primary }]}
            onPress={() => setSelectedFilter('trending')}
          >
            <ThemedText style={[styles.filterLabel, selectedFilter === 'trending' && { color: colors.primary }]}>Active Now</ThemedText>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <FlatList
            data={displayedTopics}
            renderItem={renderTopicCard}
            keyExtractor={item => item.category}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
            }
          />
        )}

        <FABButton
          icon="add"
          label="Share Story"
          onPress={() => router.push('/create-post')}
          position="bottom-right"
          color={colors.primary}
        />
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
    padding: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  searchSection: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    height: 50,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    marginLeft: Spacing.sm,
    fontSize: 16,
  },
  filterSection: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    gap: Spacing.lg,
  },
  filterTab: {
    paddingVertical: Spacing.xs,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  filterLabel: {
    fontWeight: '700',
    color: '#64748B',
  },
  listContent: {
    padding: Spacing.lg,
    paddingBottom: 120,
  },
  topicCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.xxl,
    marginBottom: Spacing.md,
    ...PlatformStyles.shadow,
  },
  iconBox: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  topicInfo: {
    flex: 1,
  },
  topicTitle: {
    marginBottom: 2,
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: Spacing.sm,
    gap: Spacing.sm,
  },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    gap: 4,
  },
  statText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
