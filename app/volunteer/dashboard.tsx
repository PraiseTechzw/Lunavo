/**
 * Volunteer Responder Dashboard - For trained peer volunteers
 */

import { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
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
import { getPosts } from '@/app/utils/storage';
import { createShadow, getCursorStyle } from '@/app/utils/platform-styles';
import { Post } from '@/app/types';
import { formatDistanceToNow } from 'date-fns';

export default function VolunteerDashboardScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const [refreshing, setRefreshing] = useState(false);
  const [pendingPosts, setPendingPosts] = useState<Post[]>([]);
  const [myResponses, setMyResponses] = useState<Post[]>([]);
  const [stats, setStats] = useState({
    totalResponses: 0,
    helpfulResponses: 0,
    activeThreads: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const allPosts = await getPosts();
    
    // Posts needing responses (no replies or few replies)
    const pending = allPosts
      .filter(p => (p.replies?.length || 0) < 2)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 5);
    setPendingPosts(pending);
    
    // Posts I've responded to (simplified - in real app would track by user ID)
    const responded = allPosts
      .filter(p => p.replies && p.replies.length > 0)
      .slice(0, 5);
    setMyResponses(responded);
    
    // Calculate stats (simplified)
    const totalResponses = allPosts.reduce((sum, p) => sum + (p.replies?.length || 0), 0);
    const helpfulResponses = allPosts.reduce((sum, p) => 
      sum + (p.replies?.filter(r => r.isHelpful > 0).length || 0), 0
    );
    
    setStats({
      totalResponses,
      helpfulResponses,
      activeThreads: pending.length,
    });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ThemedView style={styles.container}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.background }]}>
          <TouchableOpacity onPress={() => router.back()} style={getCursorStyle()}>
            <MaterialIcons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <ThemedText type="h2" style={styles.headerTitle}>
            Volunteer Dashboard
          </ThemedText>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {/* Stats */}
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: colors.card }, createShadow(2, '#000', 0.1)]}>
              <MaterialIcons name="chat" size={32} color={colors.primary} />
              <ThemedText type="h1" style={styles.statValue}>
                {stats.totalResponses}
              </ThemedText>
              <ThemedText type="small" style={[styles.statLabel, { color: colors.icon }]}>
                Total Responses
              </ThemedText>
            </View>

            <View style={[styles.statCard, { backgroundColor: colors.card }, createShadow(2, '#000', 0.1)]}>
              <MaterialIcons name="thumb-up" size={32} color={colors.success} />
              <ThemedText type="h1" style={styles.statValue}>
                {stats.helpfulResponses}
              </ThemedText>
              <ThemedText type="small" style={[styles.statLabel, { color: colors.icon }]}>
                Helpful Responses
              </ThemedText>
            </View>

            <View style={[styles.statCard, { backgroundColor: colors.card }, createShadow(2, '#000', 0.1)]}>
              <MaterialIcons name="forum" size={32} color={colors.warning} />
              <ThemedText type="h1" style={styles.statValue}>
                {stats.activeThreads}
              </ThemedText>
              <ThemedText type="small" style={[styles.statLabel, { color: colors.icon }]}>
                Active Threads
              </ThemedText>
            </View>
          </View>

          {/* Volunteer Badge */}
          <View style={[styles.badgeCard, { backgroundColor: colors.primary + '20' }, createShadow(2, '#000', 0.1)]}>
            <MaterialIcons name="verified" size={32} color={colors.primary} />
            <View style={styles.badgeContent}>
              <ThemedText type="h3" style={[styles.badgeTitle, { color: colors.primary }]}>
                Verified Volunteer
              </ThemedText>
              <ThemedText type="body" style={[styles.badgeDescription, { color: colors.icon }]}>
                Thank you for helping support fellow students. Your contributions make a difference.
              </ThemedText>
            </View>
          </View>

          {/* Pending Posts */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <ThemedText type="h3" style={styles.sectionTitle}>
                Posts Needing Support
              </ThemedText>
              <TouchableOpacity
                onPress={() => router.push('/(tabs)/forum')}
                style={getCursorStyle()}
              >
                <ThemedText type="body" style={[styles.viewAll, { color: colors.primary }]}>
                  View All
                </ThemedText>
              </TouchableOpacity>
            </View>

            {pendingPosts.length === 0 ? (
              <View style={[styles.emptyCard, { backgroundColor: colors.card }]}>
                <MaterialIcons name="check-circle" size={48} color={colors.success} />
                <ThemedText type="body" style={[styles.emptyText, { color: colors.icon }]}>
                  All posts have received responses!
                </ThemedText>
              </View>
            ) : (
              pendingPosts.map((post) => (
                <TouchableOpacity
                  key={post.id}
                  style={[
                    styles.postCard,
                    { backgroundColor: colors.card },
                    createShadow(2, '#000', 0.1),
                  ]}
                  onPress={() => router.push(`/post/${post.id}`)}
                  activeOpacity={0.7}
                >
                  <View style={styles.postHeader}>
                    <View style={[styles.categoryBadge, { backgroundColor: colors.surface }]}>
                      <ThemedText type="small" style={{ fontWeight: '600' }}>
                        {post.category}
                      </ThemedText>
                    </View>
                    <ThemedText type="small" style={{ color: colors.icon }}>
                      {formatDistanceToNow(post.createdAt, { addSuffix: true })}
                    </ThemedText>
                  </View>
                  <ThemedText type="body" style={styles.postTitle} numberOfLines={2}>
                    {post.title}
                  </ThemedText>
                  <View style={styles.postFooter}>
                    <View style={styles.replyCount}>
                      <MaterialIcons name="chat" size={16} color={colors.icon} />
                      <ThemedText type="small" style={{ color: colors.icon, marginLeft: 4 }}>
                        {post.replies?.length || 0} {post.replies?.length === 1 ? 'reply' : 'replies'}
                      </ThemedText>
                    </View>
                    <View style={[styles.respondButton, { backgroundColor: colors.primary + '20' }]}>
                      <MaterialIcons name="reply" size={16} color={colors.primary} />
                      <ThemedText type="small" style={{ color: colors.primary, fontWeight: '600', marginLeft: 4 }}>
                        Respond
                      </ThemedText>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>

          {/* Guidelines */}
          <View style={styles.section}>
            <ThemedText type="h3" style={styles.sectionTitle}>
              Volunteer Guidelines
            </ThemedText>
            <View style={[styles.guidelinesCard, { backgroundColor: colors.card }, createShadow(2, '#000', 0.1)]}>
              {[
                'Be empathetic and non-judgmental',
                'Provide accurate, helpful information',
                'Escalate serious concerns immediately',
                'Respect privacy and anonymity',
                'Use supportive, encouraging language',
              ].map((guideline, index) => (
                <View key={index} style={styles.guidelineItem}>
                  <MaterialIcons name="check-circle" size={20} color={colors.success} />
                  <ThemedText type="body" style={styles.guidelineText}>
                    {guideline}
                  </ThemedText>
                </View>
              ))}
            </View>
          </View>

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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  statCard: {
    width: '48%',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    marginVertical: Spacing.xs,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  badgeCard: {
    flexDirection: 'row',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xl,
    gap: Spacing.md,
  },
  badgeContent: {
    flex: 1,
  },
  badgeTitle: {
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  badgeDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontWeight: '700',
  },
  viewAll: {
    fontWeight: '600',
  },
  emptyCard: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  emptyText: {
    marginTop: Spacing.md,
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
    marginBottom: Spacing.xs,
  },
  categoryBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  postTitle: {
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  postFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  replyCount: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  respondButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  guidelinesCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  guidelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  guidelineText: {
    flex: 1,
    fontSize: 14,
  },
});



