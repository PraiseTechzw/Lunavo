/**
 * Peer Support Forum - Premium Topic Cards View
 */

import { ThemedText } from '@/app/components/themed-text';
import { ThemedView } from '@/app/components/themed-view';
import { CATEGORIES } from '@/app/constants/categories';
import { Colors, PlatformStyles, Spacing } from '@/app/constants/theme';
import { useColorScheme } from '@/app/hooks/use-color-scheme';
import { PostCategory } from '@/app/types';
import { getTopicStats, TopicStats } from '@/lib/database';
import { RealtimeChannel, subscribeToPosts, unsubscribe } from '@/lib/realtime';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

// removed unused helpers

export default function ForumScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];
  const [topicStats, setTopicStats] = useState<TopicStats[]>([]);
  const [displayedTopics, setDisplayedTopics] = useState<TopicStats[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'trending'>('all');
  const [refreshing, setRefreshing] = useState(false);
  const postsChannelRef = useRef<RealtimeChannel | null>(null);

  const loadTopicStats = useCallback(async () => {
    try {
      const stats = await getTopicStats();
      setTopicStats(stats);
    } catch (error) {
      console.error('Error loading topic stats:', error);
    }
  }, []);

  const setupRealtimeSubscriptions = useCallback(() => {
    postsChannelRef.current = subscribeToPosts(() => loadTopicStats());
  }, [loadTopicStats]);

  useEffect(() => {
    loadTopicStats();
    setupRealtimeSubscriptions();
    return () => {
      if (postsChannelRef.current) unsubscribe(postsChannelRef.current);
    };
  }, [loadTopicStats, setupRealtimeSubscriptions]);

  const filterTopics = useCallback(() => {
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
  }, [searchQuery, selectedFilter, topicStats]);

  useEffect(() => {
    filterTopics();
  }, [filterTopics]);

  const handleRefresh = async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await loadTopicStats();
    setRefreshing(false);
  };

  // setupRealtimeSubscriptions wrapped in useCallback above

  const renderTopicCard = ({ item, index }: { item: TopicStats, index: number }) => {
    const category = item.categoryDetails || CATEGORIES[item.category as PostCategory];
    if (!category) return null;

    return (
      <Animated.View entering={FadeInDown.delay(100 + index * 50).duration(800).springify()}>
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push(`/topic/${item.category}` as any);
          }}
          activeOpacity={0.9}
          style={styles.cardWrapper}
        >
          <ThemedView style={[styles.modernCard, { borderColor: colors.border }]}>
            <View style={[styles.cardAccent, { backgroundColor: category.color }]} />

            <View style={styles.cardContent}>
              <View style={styles.cardUpper}>
                <View style={[styles.modernIconBox, { backgroundColor: category.color + '15' }]}>
                  <Ionicons name={category.icon as any} size={28} color={category.color} />
                </View>
                <View style={styles.cardTitleArea}>
                  <ThemedText type="h3" style={styles.modernTitle}>{category.name}</ThemedText>
                  <View style={styles.statusRow}>
                    {item.recentPostCount > 0 ? (
                      <View style={styles.activeBadge}>
                        <View style={[styles.pulseDot, { backgroundColor: colors.success }]} />
                        <ThemedText style={[styles.activeText, { color: colors.success }]}>Active Now</ThemedText>
                      </View>
                    ) : (
                      <ThemedText style={styles.quietText}>Quiet today</ThemedText>
                    )}
                  </View>
                </View>
              </View>

              <ThemedText numberOfLines={2} style={[styles.modernDescription, { color: colors.icon }]}>
                {category.description}
              </ThemedText>

              <View style={styles.modernFooter}>
                <View style={styles.modernStats}>
                  <View style={styles.miniStat}>
                    <Ionicons name="people" size={12} color={colors.icon} />
                    <ThemedText style={styles.miniStatText}>{item.memberCount}</ThemedText>
                  </View>
                  <View style={styles.statSeparator} />
                  <View style={styles.miniStat}>
                    <Ionicons name="chatbubble-ellipses" size={12} color={colors.icon} />
                    <ThemedText style={styles.miniStatText}>{item.recentPostCount} new</ThemedText>
                  </View>
                </View>

                <View style={styles.goButton}>
                  <Ionicons name="arrow-forward" size={16} color={colors.text} />
                </View>
              </View>
            </View>
          </ThemedView>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderFeaturedCircle = ({ item }: { item: TopicStats }) => {
    const category = item.categoryDetails || CATEGORIES[item.category as PostCategory];
    if (!category) return null;

    return (
      <TouchableOpacity
        style={styles.featuredCard}
        onPress={() => router.push(`/topic/${item.category}` as any)}
      >
        <View style={[styles.featuredIconGradient, { backgroundColor: category.color }]}>
          <Ionicons name={category.icon as any} size={32} color="#FFF" />
        </View>
        <ThemedText numberOfLines={1} style={styles.featuredName}>{category.name}</ThemedText>
      </TouchableOpacity>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <FlatList
          data={displayedTopics}
          renderItem={renderTopicCard}
          keyExtractor={item => item.category}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={styles.listHeader}>
              <View style={styles.heroSection}>
                <View style={styles.heroTextContent}>
                  <ThemedText type="h1" style={styles.heroTitle}>Peer Circles</ThemedText>
                  <ThemedText style={[styles.heroSubtitle, { color: colors.icon }]}>
                    Join safe, anonymous spaces built for students by students.
                  </ThemedText>
                </View>
                <TouchableOpacity
                  style={[styles.floatingCreate, { backgroundColor: colors.primary }]}
                  onPress={() => router.push('/create-channel')}
                >
                  <Ionicons name="add" size={30} color="#FFF" />
                </TouchableOpacity>
              </View>

              <View style={styles.searchContainer}>
                <View style={[styles.modernSearchBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Ionicons name="search-outline" size={20} color={colors.icon} />
                  <TextInput
                    style={[styles.modernSearchInput, { color: colors.text }]}
                    placeholder="Find your community..."
                    placeholderTextColor={colors.icon}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
                </View>
              </View>

              <View style={styles.featuredSection}>
                <ThemedText style={[styles.sectionLabel, { color: colors.icon }]}>DISCOVER SPACES</ThemedText>
                <FlatList
                  data={topicStats.slice(0, 5)}
                  renderItem={renderFeaturedCircle}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  keyExtractor={item => 'featured-' + item.category}
                  contentContainerStyle={styles.featuredList}
                />
              </View>

              <View style={styles.filterSection}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterOptions}>
                  <TouchableOpacity
                    style={[styles.filterChip, { backgroundColor: colors.surface, borderColor: colors.border }, selectedFilter === 'all' && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                    onPress={() => setSelectedFilter('all')}
                  >
                    <ThemedText style={[styles.filterChipText, { color: colors.text }, selectedFilter === 'all' && { color: '#FFF' }]}>Explore All</ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.filterChip, { backgroundColor: colors.surface, borderColor: colors.border }, selectedFilter === 'trending' && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                    onPress={() => setSelectedFilter('trending')}
                  >
                    <Ionicons
                      name="trending-up"
                      size={14}
                      color={selectedFilter === 'trending' ? '#FFF' : colors.text}
                      style={{ marginRight: 6 }}
                    />
                    <ThemedText style={[styles.filterChipText, { color: colors.text }, selectedFilter === 'trending' && { color: '#FFF' }]}>Popular</ThemedText>
                  </TouchableOpacity>
                </ScrollView>
              </View>
            </View>
          }
          ListFooterComponent={null}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
            />
          }
        />
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  listHeader: {
    paddingBottom: Spacing.md,
  },
  heroSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xxl,
    marginBottom: Spacing.xl,
    gap: 12,
  },
  heroTextContent: {
    flex: 1,
  },
  heroTitle: {
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: -1.5,
  },
  heroSubtitle: {
    fontSize: 16,
    lineHeight: 22,
    marginTop: 4,
    fontWeight: '500',
  },
  floatingCreate: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    ...PlatformStyles.premiumShadow,
  },
  searchContainer: {
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  modernSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 54,
    borderRadius: 16,
    paddingHorizontal: 16,
    borderWidth: 1.5,
  },
  modernSearchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    fontWeight: '500',
  },
  featuredSection: {
    marginBottom: Spacing.xl,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 2,
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
    opacity: 0.5,
  },
  featuredList: {
    paddingHorizontal: Spacing.xl,
    gap: 16,
  },
  featuredCard: {
    alignItems: 'center',
    width: 80,
  },
  featuredIconGradient: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    ...PlatformStyles.shadow,
  },
  featuredName: {
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  filterSection: {
    marginBottom: Spacing.xl,
  },
  filterOptions: {
    paddingHorizontal: Spacing.xl,
    gap: 10,
  },
  filterChip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.05)',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '800',
  },
  listContent: {
    paddingBottom: 120,
  },
  cardWrapper: {
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
  },
  modernCard: {
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
    ...PlatformStyles.premiumShadow,
    elevation: 4,
  },
  cardAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 6,
  },
  cardContent: {
    padding: 20,
  },
  cardUpper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 12,
  },
  modernIconBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitleArea: {
    flex: 1,
  },
  modernTitle: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  activeText: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  quietText: {
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.4,
  },
  modernDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
    fontWeight: '400',
  },
  modernFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  modernStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  miniStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  miniStatText: {
    fontSize: 13,
    fontWeight: '700',
    opacity: 0.6,
  },
  statSeparator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  goButton: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  createPromptCard: {
    margin: Spacing.xl,
    padding: 24,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.03)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  createPromptIcon: {
    width: 60,
    height: 60,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createPromptText: {
    flex: 1,
  },
  createPromptTitle: {
    fontSize: 18,
    fontWeight: '900',
  },
  createPromptDesc: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
});
