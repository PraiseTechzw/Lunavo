/**
 * Escalation Management Screen - View and manage escalated posts
 */

import { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ThemedView } from '@/app/components/themed-view';
import { ThemedText } from '@/app/components/themed-text';
import { MaterialIcons } from '@expo/vector-icons';
import { useColorScheme } from '@/app/hooks/use-color-scheme';
import { Colors, Spacing, BorderRadius } from '@/app/constants/theme';
import { getPosts, updatePost } from '@/app/utils/storage';
import { createShadow, getCursorStyle } from '@/app/utils/platform-styles';
import { Post } from '@/app/types';
import { formatDistanceToNow } from 'date-fns';
import { subscribeToEscalations, subscribeToPostChanges, unsubscribe, RealtimeChannel } from '@/lib/realtime';

export default function EscalationsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const [refreshing, setRefreshing] = useState(false);
  const [escalatedPosts, setEscalatedPosts] = useState<Post[]>([]);
  const [filter, setFilter] = useState<'all' | 'critical' | 'high' | 'medium' | 'low'>('all');
  const escalationsChannelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    loadEscalations();
    setupRealtimeSubscriptions();

    return () => {
      if (escalationsChannelRef.current) {
        unsubscribe(escalationsChannelRef.current);
      }
    };
  }, [filter]);

  const setupRealtimeSubscriptions = () => {
    // Subscribe to new escalations
    const escalationsChannel = subscribeToEscalations((escalation) => {
      // Reload escalations when a new one is created
      loadEscalations();
    });

    // Subscribe to post changes (escalation level updates)
    const postChangesChannel = subscribeToPostChanges(({ eventType, post }) => {
      if (post && post.escalationLevel !== 'none') {
        // Reload escalations when a post is escalated
        loadEscalations();
      } else if (eventType === 'UPDATE' && post) {
        // Update existing escalated post
        setEscalatedPosts((prev) =>
          prev.map((p) => (p.id === post.id ? post : p))
        );
      }
    });

    escalationsChannelRef.current = escalationsChannel;
  };

  const loadEscalations = async () => {
    const allPosts = await getPosts();
    let filtered = allPosts.filter(p => p.escalationLevel !== 'none');
    
    if (filter !== 'all') {
      filtered = filtered.filter(p => p.escalationLevel === filter);
    }
    
    filtered.sort((a, b) => {
      const levelOrder = { critical: 5, high: 4, medium: 3, low: 2, none: 0 };
      return levelOrder[b.escalationLevel] - levelOrder[a.escalationLevel];
    });
    
    setEscalatedPosts(filtered);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadEscalations();
    setRefreshing(false);
  };

  const handleResolve = async (postId: string) => {
    Alert.alert(
      'Resolve Escalation',
      'Mark this post as resolved?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Resolve',
          onPress: async () => {
            await updatePost(postId, { status: 'resolved', escalationLevel: 'none' });
            await loadEscalations();
          },
        },
      ]
    );
  };

  const getEscalationColor = (level: string) => {
    switch (level) {
      case 'critical': return '#F44336';
      case 'high': return '#FF9800';
      case 'medium': return '#FFC107';
      case 'low': return '#2196F3';
      default: return colors.icon;
    }
  };

  const filters: Array<'all' | 'critical' | 'high' | 'medium' | 'low'> = ['all', 'critical', 'high', 'medium', 'low'];

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ThemedView style={styles.container}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.background }]}>
          <TouchableOpacity onPress={() => router.back()} style={getCursorStyle()}>
            <MaterialIcons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <ThemedText type="h2" style={styles.headerTitle}>
            Escalated Posts
          </ThemedText>
          <View style={{ width: 24 }} />
        </View>

        {/* Filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filtersScroll}
          contentContainerStyle={styles.filtersContent}
        >
          {filters.map((filterOption) => (
            <TouchableOpacity
              key={filterOption}
              style={[
                styles.filterChip,
                {
                  backgroundColor: filter === filterOption ? colors.primary : colors.surface,
                },
              ]}
              onPress={() => setFilter(filterOption)}
              activeOpacity={0.7}
            >
              <ThemedText
                type="small"
                style={{
                  color: filter === filterOption ? '#FFFFFF' : colors.text,
                  fontWeight: '600',
                }}
              >
                {filterOption === 'all' ? 'All' : filterOption.toUpperCase()}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {escalatedPosts.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.card }]}>
              <MaterialIcons name="check-circle" size={64} color={colors.success} />
              <ThemedText type="h3" style={styles.emptyTitle}>
                No Escalations
              </ThemedText>
              <ThemedText type="body" style={[styles.emptyText, { color: colors.icon }]}>
                All posts are currently resolved
              </ThemedText>
            </View>
          ) : (
            escalatedPosts.map((post) => (
              <View
                key={post.id}
                style={[
                  styles.postCard,
                  { backgroundColor: colors.card },
                  createShadow(3, '#000', 0.1),
                  { borderLeftWidth: 4, borderLeftColor: getEscalationColor(post.escalationLevel) },
                ]}
              >
                <View style={styles.postHeader}>
                  <View style={[
                    styles.escalationBadge,
                    { backgroundColor: getEscalationColor(post.escalationLevel) + '20' }
                  ]}>
                    <MaterialIcons
                      name="priority-high"
                      size={16}
                      color={getEscalationColor(post.escalationLevel)}
                    />
                    <ThemedText
                      type="small"
                      style={{ color: getEscalationColor(post.escalationLevel), fontWeight: '700', marginLeft: 4 }}
                    >
                      {post.escalationLevel.toUpperCase()}
                    </ThemedText>
                  </View>
                  <ThemedText type="small" style={{ color: colors.icon }}>
                    {formatDistanceToNow(post.createdAt, { addSuffix: true })}
                  </ThemedText>
                </View>

                <TouchableOpacity
                  onPress={() => router.push(`/post/${post.id}`)}
                  activeOpacity={0.7}
                >
                  <ThemedText type="h3" style={styles.postTitle}>
                    {post.title}
                  </ThemedText>
                  <ThemedText type="body" style={styles.postContent} numberOfLines={3}>
                    {post.content}
                  </ThemedText>
                </TouchableOpacity>

                {post.escalationReason && (
                  <View style={[styles.reasonBox, { backgroundColor: colors.surface }]}>
                    <MaterialIcons name="info" size={16} color={colors.warning} />
                    <ThemedText type="small" style={[styles.reasonText, { color: colors.icon }]}>
                      {post.escalationReason}
                    </ThemedText>
                  </View>
                )}

                <View style={styles.postFooter}>
                  <View style={styles.metaInfo}>
                    <MaterialIcons name="person" size={16} color={colors.icon} />
                    <ThemedText type="small" style={{ color: colors.icon, marginLeft: 4 }}>
                      {post.authorPseudonym}
                    </ThemedText>
                    <MaterialIcons name="category" size={16} color={colors.icon} style={{ marginLeft: Spacing.md }} />
                    <ThemedText type="small" style={{ color: colors.icon, marginLeft: 4 }}>
                      {post.category}
                    </ThemedText>
                  </View>
                  <TouchableOpacity
                    style={[styles.resolveButton, { backgroundColor: colors.success + '20' }]}
                    onPress={() => handleResolve(post.id)}
                    activeOpacity={0.7}
                  >
                    <MaterialIcons name="check-circle" size={20} color={colors.success} />
                    <ThemedText type="small" style={{ color: colors.success, fontWeight: '600', marginLeft: 4 }}>
                      Resolve
                    </ThemedText>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}

          <View style={{ height: Spacing.xl }} />
        </ScrollView>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontWeight: '700',
  },
  filtersScroll: {
    maxHeight: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  filtersContent: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    marginRight: Spacing.sm,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
  },
  emptyCard: {
    padding: Spacing.xl * 2,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  emptyTitle: {
    marginTop: Spacing.md,
    fontWeight: '700',
  },
  emptyText: {
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  postCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  escalationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  postTitle: {
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  postContent: {
    opacity: 0.8,
    marginBottom: Spacing.sm,
  },
  reasonBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.sm,
    gap: Spacing.xs,
  },
  reasonText: {
    flex: 1,
    fontSize: 12,
    fontStyle: 'italic',
  },
  postFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  metaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  resolveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
});



