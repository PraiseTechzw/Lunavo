/**
 * Peer Support Forum - Premium Topic Cards View
 */

import { ThemedText } from '@/app/components/themed-text';
import { CATEGORIES } from '@/app/constants/categories';
import { BorderRadius, Colors, PlatformStyles, Spacing } from '@/app/constants/theme';
import { useColorScheme } from '@/app/hooks/use-color-scheme';
import { PostCategory } from '@/app/types';
import { getTopicStats, TopicStats } from '@/lib/database';
import { RealtimeChannel, subscribeToPosts, unsubscribe } from '@/lib/realtime';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const getCategoryIcon = (category: PostCategory): string => {
  const iconMap: Record<PostCategory, string> = {
    'mental-health': 'leaf-outline',
    'crisis': 'pulse-outline',
    'substance-abuse': 'fitness-outline',
    'sexual-health': 'heart-circle-outline',
    'stis-hiv': 'shield-outline',
    'family-home': 'home-outline',
    'academic': 'school-outline',
    'social': 'people-circle-outline',
    'relationships': 'infinite-outline',
    'campus': 'business-outline',
    'general': 'chatbubbles-outline',
  };
  return iconMap[category] || 'help-circle-outline';
};

const getCategoryDisplayName = (category: PostCategory): string => {
  const nameMap: Record<PostCategory, string> = {
    'mental-health': 'Wellness & Mind',
    'crisis': 'Urgent Support',
    'substance-abuse': 'Recovery Path',
    'sexual-health': 'Vitality',
    'stis-hiv': 'Protection',
    'family-home': 'Sanctuary',
    'academic': 'Scholarship',
    'social': 'Connections',
    'relationships': 'Harmony',
    'campus': 'Campus Life',
    'general': 'Open Forum',
  };
  return nameMap[category] || category;
};

export default function ForumScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'dark';
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
        const category = stat.categoryDetails || CATEGORIES[stat.category as PostCategory];
        if (!category) return false;
        return category.name.toLowerCase().includes(searchLower) ||
          category.description.toLowerCase().includes(searchLower);
      });
    }
    if (selectedFilter === 'trending') {
      filtered.sort((a, b) => b.recentPostCount - a.recentPostCount);
    } else {
      // Default sort: prioritize categories with recent activity, then by popularity
      filtered.sort((a, b) => {
        if (a.recentPostCount > 0 && b.recentPostCount === 0) return -1;
        if (b.recentPostCount > 0 && a.recentPostCount === 0) return 1;
        return b.memberCount - a.memberCount;
      });
    }
    setDisplayedTopics(filtered);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await loadTopicStats();
    setRefreshing(false);
  };

  const setupRealtimeSubscriptions = () => {
    postsChannelRef.current = subscribeToPosts(() => loadTopicStats());
  };

  const renderTopicCard = ({ item, index }: { item: TopicStats, index: number }) => {
    const category = item.categoryDetails || CATEGORIES[item.category as PostCategory];
    if (!category) return null;

    const iconName = category.icon;
    const displayName = category.name;

    return (
      <Animated.View entering={FadeInDown.delay(index * 50).duration(600).springify()}>
        <TouchableOpacity
          onPress={() => {
            Haptics.selectionAsync();
            router.push(`/topic/${item.category}` as any);
          }}
          activeOpacity={0.95}
          style={styles.cardContainer}
        >
          <View style={[styles.topicCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.categoryHeader, { backgroundColor: category.color + '10' }]}>
              <View style={[styles.iconBox, { backgroundColor: category.color + '15' }]}>
                <Ionicons name={iconName as any} size={26} color={category.color} />
              </View>
              <View style={styles.headerInfo}>
                <ThemedText type="h3" style={styles.topicTitle}>{displayName}</ThemedText>
                {item.recentPostCount > 0 && (
                  <View style={[styles.activeIndicator, { backgroundColor: colors.success }]} />
                )}
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.icon} style={{ opacity: 0.4 }} />
            </View>

            <View style={styles.cardBody}>
              <ThemedText numberOfLines={2} style={[styles.description, { color: colors.icon }]}>
                {category.description}
              </ThemedText>

              <View style={styles.statsRow}>
                <View style={styles.statPill}>
                  <Ionicons name="people-outline" size={12} color={colors.icon} />
                  <ThemedText style={[styles.statText, { color: colors.icon }]}>
                    {item.memberCount} <ThemedText type="small" style={{ fontSize: 10 }}>members</ThemedText>
                  </ThemedText>
                </View>

                <View style={styles.statPill}>
                  <Ionicons name="chatbubbles-outline" size={12} color={colors.icon} />
                  <ThemedText style={[styles.statText, { color: colors.icon }]}>
                    {item.recentPostCount} <ThemedText type="small" style={{ fontSize: 10 }}>active</ThemedText>
                  </ThemedText>
                </View>

                {item.recentPostCount > 0 && (
                  <View style={[styles.trendingBadge, { backgroundColor: colors.success + '15' }]}>
                    <Ionicons name="trending-up" size={12} color={colors.success} />
                    <ThemedText style={[styles.trendingText, { color: colors.success }]}>Trending</ThemedText>
                  </View>
                )}
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView edges={['top']} style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <ThemedText type="h1" style={styles.headerTitle}>Circles</ThemedText>
            <ThemedText style={{ color: colors.icon, marginTop: 4, fontSize: 16 }}>Find your peer support circle</ThemedText>
          </View>

          <TouchableOpacity
            style={[styles.newPostButton, { backgroundColor: colors.primary }]}
            onPress={() => {
              Haptics.selectionAsync();
              // Navigate to a screen to create a new channel/topic
              router.push('/create-channel' as any);
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="add-circle-sharp" size={24} color="#FFFFFF" />
            <ThemedText style={styles.newPostText}>Channel</ThemedText>
          </TouchableOpacity>
        </View>

        <View style={styles.searchSection}>
          <View style={[styles.searchBar, { backgroundColor: colors.surface + '80', borderColor: colors.border }]}>
            <Ionicons name="search" size={20} color={colors.icon} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search conversations..."
              placeholderTextColor={colors.icon}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        <View style={styles.filterSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: Spacing.xl, gap: Spacing.sm }}>
            <TouchableOpacity
              style={[
                styles.filterChip,
                selectedFilter === 'all'
                  ? { backgroundColor: colors.text }
                  : { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.border }
              ]}
              onPress={() => {
                Haptics.selectionAsync();
                setSelectedFilter('all');
              }}
            >
              <ThemedText style={[
                styles.filterLabel,
                selectedFilter === 'all' ? { color: colors.background } : { color: colors.text }
              ]}>All Topics</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filterChip,
                selectedFilter === 'trending'
                  ? { backgroundColor: colors.text }
                  : { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.border }
              ]}
              onPress={() => {
                Haptics.selectionAsync();
                setSelectedFilter('trending');
              }}
            >
              <Ionicons
                name="trending-up"
                size={14}
                color={selectedFilter === 'trending' ? colors.background : colors.text}
                style={{ marginRight: 6 }}
              />
              <ThemedText style={[
                styles.filterLabel,
                selectedFilter === 'trending' ? { color: colors.background } : { color: colors.text }
              ]}>Popular</ThemedText>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <ThemedText style={{ marginTop: 16, color: colors.icon }}>Loading topics...</ThemedText>
          </View>
        ) : (
          <FlatList
            data={displayedTopics}
            renderItem={renderTopicCard}
            keyExtractor={item => item.category}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={colors.primary}
                progressViewOffset={20}
              />
            }
          />
        )}
      </View>
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
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -1,
  },
  newPostButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: BorderRadius.xl,
    ...PlatformStyles.premiumShadow,
  },
  newPostText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
  searchSection: {
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    height: 56,
    borderRadius: BorderRadius.xxl,
    borderWidth: 1.5,
  },
  searchInput: {
    flex: 1,
    marginLeft: Spacing.md,
    fontSize: 16,
    fontWeight: '500',
    fontFamily: PlatformStyles.fontFamily,
  },
  filterSection: {
    marginBottom: Spacing.lg,
    height: 44,
  },
  filterChip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: BorderRadius.xxl,
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterLabel: {
    fontWeight: '700',
    fontSize: 14,
  },
  listContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xs,
    paddingBottom: 120,
  },
  cardContainer: {
    marginBottom: Spacing.lg,
  },
  topicCard: {
    borderRadius: BorderRadius.xxl,
    borderWidth: 1,
    overflow: 'hidden',
    ...PlatformStyles.premiumShadow,
    elevation: 4,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  iconBox: {
    width: 52,
    height: 52,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.lg,
    ...PlatformStyles.shadow,
  },
  headerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  topicTitle: {
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  activeIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  cardBody: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: Spacing.lg,
    fontWeight: '400',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.lg,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  statText: {
    fontSize: 12,
    fontWeight: '700',
  },
  trendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.md,
  },
  trendingText: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
});
