/**
 * Escalation Management Screen - View and manage escalated posts
 */

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { WebCard, WebContainer } from '@/components/web';
import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Post } from '@/types';
import { getCursorStyle } from '@/utils/platform-styles';
import { useRoleGuard } from '@/hooks/use-auth-guard';
import { getPosts, updatePost } from '@/lib/database';
import { subscribeToEscalations, subscribeToPostChanges, unsubscribe } from '@/lib/realtime';
import { MaterialIcons } from '@expo/vector-icons';
import { RealtimeChannel } from '@supabase/supabase-js';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Dimensions,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

export default function EscalationsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  
  // Role guard - only admins can access
  const { user, loading } = useRoleGuard(['admin'], '/(tabs)');
  
  const [refreshing, setRefreshing] = useState(false);
  const [escalatedPosts, setEscalatedPosts] = useState<Post[]>([]);
  const [filter, setFilter] = useState<'all' | 'critical' | 'high' | 'medium' | 'low'>('all');
  const escalationsChannelRef = useRef<RealtimeChannel | null>(null);
  const postChangesChannelRef = useRef<RealtimeChannel | null>(null);
  
  // Early return for loading
  if (loading) {
    return (
      <ThemedView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ThemedText>Loading...</ThemedText>
      </ThemedView>
    );
  }

  useEffect(() => {
    loadEscalations();
    setupRealtimeSubscriptions();

    return () => {
      if (escalationsChannelRef.current) {
        unsubscribe(escalationsChannelRef.current);
      }
      if (postChangesChannelRef.current) {
        unsubscribe(postChangesChannelRef.current);
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
    postChangesChannelRef.current = postChangesChannel;
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

  const content = (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Page Header - Web optimized */}
      {isWeb && (
        <View style={styles.pageHeader}>
          <ThemedText type="h1" style={[styles.pageTitle, { color: colors.text }]}>
            Escalated Posts
          </ThemedText>
          <ThemedText type="body" style={[styles.pageSubtitle, { color: colors.icon }]}>
            Manage and resolve escalated content
          </ThemedText>
        </View>
      )}

      {/* Filters */}
      <WebCard style={styles.filtersCard}>
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
                  borderColor: filter === filterOption ? colors.primary : colors.border,
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
      </WebCard>

      {/* Escalated Posts List */}
      {escalatedPosts.length === 0 ? (
        <WebCard style={styles.emptyCard}>
          <MaterialIcons name="check-circle" size={64} color={colors.success} />
          <ThemedText type="h3" style={[styles.emptyTitle, { color: colors.text }]}>
            No Escalations
          </ThemedText>
          <ThemedText type="body" style={[styles.emptyText, { color: colors.icon }]}>
            All posts are currently resolved
          </ThemedText>
        </WebCard>
      ) : (
        <View style={styles.postsList}>
          {escalatedPosts.map((post) => (
            <WebCard
              key={post.id}
              hoverable
              style={{
                ...styles.postCard,
                borderLeftWidth: 4,
                borderLeftColor: getEscalationColor(post.escalationLevel),
              }}
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
                <ThemedText type="h3" style={[styles.postTitle, { color: colors.text }]}>
                  {post.title}
                </ThemedText>
                <ThemedText type="body" style={[styles.postContent, { color: colors.text }]} numberOfLines={3}>
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
            </WebCard>
          ))}
        </View>
      )}

      <View style={{ height: Spacing.xl }} />
    </ScrollView>
  );

  // Web layout with container
  if (isWeb) {
    return (
      <ThemedView style={styles.container}>
        <WebContainer maxWidth={1600} padding={32}>
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
          <TouchableOpacity 
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/admin/dashboard' as any);
              }
            }} 
            style={getCursorStyle()}
          >
            <MaterialIcons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <ThemedText type="h2" style={styles.headerTitle}>
            Escalated Posts
          </ThemedText>
          <View style={{ width: 24 }} />
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
    ...(isWeb ? {
      height: '100%',
      overflow: 'hidden',
    } : {}),
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
  pageHeader: {
    marginBottom: Spacing.xl,
    marginTop: Spacing.lg,
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
  filtersScroll: {
    maxHeight: 60,
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
    borderWidth: 1,
    ...getCursorStyle(),
  },
  scrollView: {
    flex: 1,
    ...(isWeb ? {
      height: '100%',
      overflowY: 'auto' as any,
    } : {}),
  },
  scrollContent: {
    padding: isWeb ? 0 : Spacing.md,
    paddingBottom: isWeb ? Spacing.xxl : 80,
    ...(isWeb ? {
      minHeight: '100%',
    } : {}),
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
  },
  postsList: {
    gap: Spacing.md,
  },
  postCard: {
    padding: Spacing.lg,
    gap: Spacing.md,
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
    ...getCursorStyle(),
  },
});



