/**
 * Content Moderation Screen - Review and moderate posts
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
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
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

const MODERATION_HISTORY_KEY = 'moderation_history';
const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

export default function ModerationScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  
  // Role guard - only admins can access
  const { user, loading } = useRoleGuard(['admin'], '/(tabs)');
  
  const [refreshing, setRefreshing] = useState(false);
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [filter, setFilter] = useState<'all' | 'flagged' | 'reported' | 'escalated' | 'queue'>('queue');
  const [selectedPosts, setSelectedPosts] = useState<Set<string>>(new Set());
  const [bulkMode, setBulkMode] = useState(false);
  const [moderationHistory, setModerationHistory] = useState<any[]>([]);
  
  // Early return for loading
  if (loading) {
    return (
      <ThemedView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ThemedText>Loading...</ThemedText>
      </ThemedView>
    );
  }

  useEffect(() => {
    loadPosts();
    loadModerationHistory();
  }, [filter]);

  const loadModerationHistory = async () => {
    try {
      const historyJson = await AsyncStorage.getItem(MODERATION_HISTORY_KEY);
      if (historyJson) {
        setModerationHistory(JSON.parse(historyJson));
      }
    } catch (error) {
      console.error('Error loading moderation history:', error);
    }
  };

  const saveModerationAction = async (action: {
    postId: string;
    action: 'approved' | 'removed' | 'escalated';
    timestamp: string;
    postTitle: string;
  }) => {
    try {
      const history = [...moderationHistory, action].slice(-100); // Keep last 100 actions
      setModerationHistory(history);
      await AsyncStorage.setItem(MODERATION_HISTORY_KEY, JSON.stringify(history));
    } catch (error) {
      console.error('Error saving moderation action:', error);
    }
  };

  const loadPosts = async () => {
    try {
      const posts = await getPosts();
      let filtered = posts;
      
      switch (filter) {
        case 'queue':
          // Moderation queue: prioritize by reported count, escalation level, and recency
          filtered = posts
            .filter(p => p.isFlagged || p.reportedCount > 0 || p.escalationLevel !== 'none')
            .sort((a, b) => {
              // Priority: critical escalations first, then by report count, then by recency
              const levelOrder: Record<string, number> = { critical: 5, high: 4, medium: 3, low: 2, none: 0 };
              const levelDiff = (levelOrder[b.escalationLevel] || 0) - (levelOrder[a.escalationLevel] || 0);
              if (levelDiff !== 0) return levelDiff;
              
              const reportDiff = (b.reportedCount || 0) - (a.reportedCount || 0);
              if (reportDiff !== 0) return reportDiff;
              
              return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            });
          break;
        case 'flagged':
          filtered = posts.filter(p => p.isFlagged || p.reportedCount > 0);
          break;
        case 'reported':
          filtered = posts.filter(p => p.reportedCount > 0);
          break;
        case 'escalated':
          filtered = posts.filter(p => p.escalationLevel !== 'none');
          break;
      }
      
      if (filter !== 'queue') {
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }
      
      setAllPosts(filtered);
    } catch (error) {
      console.error('Error loading posts:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPosts();
    setRefreshing(false);
  };

  const handleApprove = async (postId: string) => {
    try {
      const post = allPosts.find(p => p.id === postId);
      await updatePost(postId, { isFlagged: false, reportedCount: 0 });
      await saveModerationAction({
        postId,
        action: 'approved',
        timestamp: new Date().toISOString(),
        postTitle: post?.title || 'Unknown',
      });
      setSelectedPosts(new Set(selectedPosts).delete(postId) ? new Set(selectedPosts) : new Set(selectedPosts));
      await loadPosts();
    } catch (error) {
      console.error('Error approving post:', error);
      Alert.alert('Error', 'Failed to approve post.');
    }
  };

  const handleRemove = async (postId: string) => {
    Alert.alert(
      'Remove Post',
      'This post will be hidden from all users. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              const post = allPosts.find(p => p.id === postId);
              await updatePost(postId, { status: 'archived' });
              await saveModerationAction({
                postId,
                action: 'removed',
                timestamp: new Date().toISOString(),
                postTitle: post?.title || 'Unknown',
              });
              setSelectedPosts(new Set(selectedPosts).delete(postId) ? new Set(selectedPosts) : new Set(selectedPosts));
              await loadPosts();
            } catch (error) {
              console.error('Error removing post:', error);
              Alert.alert('Error', 'Failed to remove post.');
            }
          },
        },
      ]
    );
  };

  const togglePostSelection = (postId: string) => {
    const newSelected = new Set(selectedPosts);
    if (newSelected.has(postId)) {
      newSelected.delete(postId);
    } else {
      newSelected.add(postId);
    }
    setSelectedPosts(newSelected);
  };

  const handleBulkApprove = async () => {
    if (selectedPosts.size === 0) {
      Alert.alert('No Selection', 'Please select posts to approve.');
      return;
    }

    Alert.alert(
      'Bulk Approve',
      `Approve ${selectedPosts.size} post(s)?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: async () => {
            try {
              for (const postId of selectedPosts) {
                await handleApprove(postId);
              }
              setSelectedPosts(new Set());
              setBulkMode(false);
              Alert.alert('Success', `${selectedPosts.size} post(s) approved.`);
            } catch (error) {
              Alert.alert('Error', 'Failed to approve some posts.');
            }
          },
        },
      ]
    );
  };

  const handleBulkRemove = async () => {
    if (selectedPosts.size === 0) {
      Alert.alert('No Selection', 'Please select posts to remove.');
      return;
    }

    Alert.alert(
      'Bulk Remove',
      `Remove ${selectedPosts.size} post(s)? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              for (const postId of selectedPosts) {
                await handleRemove(postId);
              }
              setSelectedPosts(new Set());
              setBulkMode(false);
            } catch (error) {
              Alert.alert('Error', 'Failed to remove some posts.');
            }
          },
        },
      ]
    );
  };

  const filters: Array<'all' | 'flagged' | 'reported' | 'escalated' | 'queue' | 'history'> = [
    'queue',
    'all',
    'flagged',
    'reported',
    'escalated',
    'history',
  ];

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
            Content Moderation
          </ThemedText>
          <ThemedText type="body" style={[styles.pageSubtitle, { color: colors.icon }]}>
            Review and moderate community content
          </ThemedText>
        </View>
      )}

      {/* Filters and Bulk Actions */}
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
              onPress={() => {
                setFilter(filterOption);
                setBulkMode(false);
                setSelectedPosts(new Set());
              }}
              activeOpacity={0.7}
            >
              <ThemedText
                type="small"
                style={{
                  color: filter === filterOption ? '#FFFFFF' : colors.text,
                  fontWeight: '600',
                }}
              >
                {filterOption === 'all' ? 'All' : filterOption === 'queue' ? 'Queue' : filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </ScrollView>
        
        {filter !== 'history' && (
          <View style={styles.bulkActionsContainer}>
              <TouchableOpacity
                style={[
                  styles.bulkModeButton,
                  {
                    backgroundColor: bulkMode ? colors.primary : colors.surface,
                  },
                ]}
                onPress={() => {
                  setBulkMode(!bulkMode);
                  if (!bulkMode) {
                    setSelectedPosts(new Set());
                  }
                }}
              >
                <MaterialIcons
                  name={bulkMode ? 'check-box' : 'check-box-outline-blank'}
                  size={20}
                  color={bulkMode ? '#FFFFFF' : colors.text}
                />
                <ThemedText
                  type="small"
                  style={{
                    color: bulkMode ? '#FFFFFF' : colors.text,
                    marginLeft: Spacing.xs,
                    fontWeight: '600',
                  }}
                >
                  Select
                </ThemedText>
              </TouchableOpacity>
              
              {bulkMode && selectedPosts.size > 0 && (
                <View style={styles.bulkActionButtons}>
                  <TouchableOpacity
                    style={[styles.bulkActionButton, { backgroundColor: colors.success }]}
                    onPress={handleBulkApprove}
                  >
                    <MaterialIcons name="check" size={18} color="#FFFFFF" />
                    <ThemedText type="small" style={{ color: '#FFFFFF', marginLeft: Spacing.xs, fontWeight: '600' }}>
                      Approve ({selectedPosts.size})
                    </ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.bulkActionButton, { backgroundColor: colors.danger }]}
                    onPress={handleBulkRemove}
                  >
                    <MaterialIcons name="delete" size={18} color="#FFFFFF" />
                    <ThemedText type="small" style={{ color: '#FFFFFF', marginLeft: Spacing.xs, fontWeight: '600' }}>
                      Remove ({selectedPosts.size})
                    </ThemedText>
                  </TouchableOpacity>
                </View>
            )}
          </View>
        )}
      </WebCard>

      {/* Content */}
      {filter === 'history' ? (
        moderationHistory.length === 0 ? (
          <WebCard style={styles.emptyCard}>
            <MaterialIcons name="history" size={64} color={colors.icon} />
            <ThemedText type="h3" style={[styles.emptyTitle, { color: colors.text }]}>
              No Moderation History
            </ThemedText>
            <ThemedText type="body" style={[styles.emptyText, { color: colors.icon }]}>
              Your moderation actions will appear here
            </ThemedText>
          </WebCard>
        ) : (
          <View style={styles.historyList}>
            {moderationHistory.slice().reverse().map((action, index) => (
              <WebCard
                key={index}
                hoverable
                style={styles.historyItem}
              >
                  <MaterialIcons
                    name={action.action === 'approved' ? 'check-circle' : 'delete'}
                    size={24}
                    color={action.action === 'approved' ? colors.success : colors.danger}
                  />
                <View style={styles.historyContent}>
                  <ThemedText type="body" style={[styles.historyTitle, { color: colors.text }]}>
                    {action.action === 'approved' ? 'Approved' : 'Removed'}: {action.postTitle}
                  </ThemedText>
                  <ThemedText type="small" style={{ color: colors.icon, marginTop: Spacing.xs }}>
                    {formatDistanceToNow(new Date(action.timestamp), { addSuffix: true })}
                  </ThemedText>
                </View>
              </WebCard>
            ))}
          </View>
        )
      ) : allPosts.length === 0 ? (
        <WebCard style={styles.emptyCard}>
          <MaterialIcons name="check-circle" size={64} color={colors.success} />
          <ThemedText type="h3" style={[styles.emptyTitle, { color: colors.text }]}>
            No Posts to Moderate
          </ThemedText>
          <ThemedText type="body" style={[styles.emptyText, { color: colors.icon }]}>
            All posts are compliant
          </ThemedText>
        </WebCard>
      ) : (
        <View style={styles.postsList}>
          {allPosts.map((post) => {
            const isSelected = selectedPosts.has(post.id);
            return (
              <WebCard
                key={post.id}
                hoverable
                style={[
                  styles.postCard,
                  { 
                    borderWidth: isSelected ? 2 : 0,
                    borderColor: isSelected ? colors.primary : 'transparent',
                  },
                ]}
                onPress={() => {
                  if (!bulkMode) {
                    router.push(`/post/${post.id}`);
                  }
                }}
              >
                {bulkMode && (
                  <TouchableOpacity
                    style={styles.checkbox}
                    onPress={() => togglePostSelection(post.id)}
                  >
                    <MaterialIcons
                      name={isSelected ? 'check-box' : 'check-box-outline-blank'}
                      size={24}
                      color={isSelected ? colors.primary : colors.icon}
                    />
                  </TouchableOpacity>
                )}
                <View style={styles.postHeader}>
                  <View style={styles.authorInfo}>
                    <MaterialIcons name="person" size={20} color={colors.icon} />
                    <ThemedText type="small" style={{ color: colors.icon, marginLeft: 4 }}>
                      {post.authorPseudonym}
                    </ThemedText>
                    <ThemedText type="small" style={{ color: colors.icon, marginLeft: Spacing.sm }}>
                      • {formatDistanceToNow(post.createdAt, { addSuffix: true })}
                    </ThemedText>
                  </View>
                  <View style={styles.badges}>
                    {post.isFlagged && (
                      <View style={[styles.badge, { backgroundColor: colors.warning + '20' }]}>
                        <MaterialIcons name="flag" size={14} color={colors.warning} />
                        <ThemedText type="small" style={{ color: colors.warning, fontWeight: '600', marginLeft: 2 }}>
                          Flagged
                        </ThemedText>
                      </View>
                    )}
                    {post.reportedCount > 0 && (
                      <View style={[styles.badge, { backgroundColor: colors.danger + '20' }]}>
                        <MaterialIcons name="report-problem" size={14} color={colors.danger} />
                        <ThemedText type="small" style={{ color: colors.danger, fontWeight: '600', marginLeft: 2 }}>
                          {post.reportedCount} reports
                        </ThemedText>
                      </View>
                    )}
                    {post.escalationLevel !== 'none' && (
                      <View style={[styles.badge, { backgroundColor: colors.danger + '20' }]}>
                        <MaterialIcons name="priority-high" size={14} color={colors.danger} />
                        <ThemedText type="small" style={{ color: colors.danger, fontWeight: '600', marginLeft: 2 }}>
                          {post.escalationLevel}
                        </ThemedText>
                      </View>
                    )}
                  </View>
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

                <View style={styles.postFooter}>
                  <View style={[styles.categoryBadge, { backgroundColor: colors.surface }]}>
                    <ThemedText type="small" style={{ fontWeight: '600' }}>
                      {post.category}
                    </ThemedText>
                  </View>
                  <View style={styles.actions}>
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: colors.success + '20' }]}
                      onPress={() => handleApprove(post.id)}
                      activeOpacity={0.7}
                    >
                      <MaterialIcons name="check" size={18} color={colors.success} />
                      <ThemedText type="small" style={{ color: colors.success, fontWeight: '600', marginLeft: 4 }}>
                        Approve
                      </ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: colors.danger + '20' }]}
                      onPress={() => handleRemove(post.id)}
                      activeOpacity={0.7}
                    >
                      <MaterialIcons name="delete" size={18} color={colors.danger} />
                      <ThemedText type="small" style={{ color: colors.danger, fontWeight: '600', marginLeft: 4 }}>
                        Remove
                      </ThemedText>
                    </TouchableOpacity>
                  </View>
                </View>
              </WebCard>
            );
          })}
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
            Content Moderation
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
  bulkActionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  bulkModeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
    ...getCursorStyle(),
  },
  bulkActionButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  bulkActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
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
    position: 'relative',
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  badges: {
    flexDirection: 'row',
    gap: Spacing.xs,
    flexWrap: 'wrap',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
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
  postFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  categoryBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    backgroundColor: '#F0F0F0',
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    ...getCursorStyle(),
  },
  checkbox: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    zIndex: 1,
    ...getCursorStyle(),
  },
  historyList: {
    gap: Spacing.md,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.md,
  },
  historyContent: {
    flex: 1,
  },
  historyTitle: {
    fontWeight: '600',
  },
});



