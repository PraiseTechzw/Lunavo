/**
 * Content Moderation Screen - Review and moderate posts
 */

import { useState, useEffect } from 'react';
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

export default function ModerationScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const [refreshing, setRefreshing] = useState(false);
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [filter, setFilter] = useState<'all' | 'flagged' | 'reported' | 'escalated'>('all');

  useEffect(() => {
    loadPosts();
  }, [filter]);

  const loadPosts = async () => {
    const posts = await getPosts();
    let filtered = posts;
    
    switch (filter) {
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
    
    filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    setAllPosts(filtered);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPosts();
    setRefreshing(false);
  };

  const handleApprove = async (postId: string) => {
    Alert.alert(
      'Approve Post',
      'This post will remain visible to all users.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: async () => {
            await updatePost(postId, { isFlagged: false, reportedCount: 0 });
            await loadPosts();
            Alert.alert('Success', 'Post approved and unflagged.');
          },
        },
      ]
    );
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
            await updatePost(postId, { status: 'archived' });
            await loadPosts();
            Alert.alert('Success', 'Post has been removed.');
          },
        },
      ]
    );
  };

  const filters: Array<'all' | 'flagged' | 'reported' | 'escalated'> = [
    'all',
    'flagged',
    'reported',
    'escalated',
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
            Content Moderation
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
                {filterOption === 'all' ? 'All' : filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
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
          {allPosts.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.card }]}>
              <MaterialIcons name="check-circle" size={64} color={colors.success} />
              <ThemedText type="h3" style={styles.emptyTitle}>
                No Posts to Moderate
              </ThemedText>
              <ThemedText type="body" style={[styles.emptyText, { color: colors.icon }]}>
                All posts are compliant
              </ThemedText>
            </View>
          ) : (
            allPosts.map((post) => (
              <View
                key={post.id}
                style={[
                  styles.postCard,
                  { backgroundColor: colors.card },
                  createShadow(3, '#000', 0.1),
                ]}
              >
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
                  <ThemedText type="h3" style={styles.postTitle}>
                    {post.title}
                  </ThemedText>
                  <ThemedText type="body" style={styles.postContent} numberOfLines={3}>
                    {post.content}
                  </ThemedText>
                </TouchableOpacity>

                <View style={styles.postFooter}>
                  <View style={styles.categoryBadge}>
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
  },
});



