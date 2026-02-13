/**
 * Volunteer Responder Dashboard - Premium Version
 */

import { ThemedText } from '@/app/components/themed-text';
import { ThemedView } from '@/app/components/themed-view';
import { BorderRadius, Colors, PlatformStyles, Spacing } from '@/app/constants/theme';
import { useColorScheme } from '@/app/hooks/use-color-scheme';
import { Post } from '@/app/types';
import { getPosts } from '@/app/utils/storage';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function VolunteerDashboardScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const [refreshing, setRefreshing] = useState(false);
  const [pendingPosts, setPendingPosts] = useState<Post[]>([]);
  const [stats] = useState({
    totalResponses: 142, // Mock for demo
    helpfulResponses: 89,
    activeThreads: 5,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const allPosts = await getPosts();
    const pending = allPosts
      .filter(p => (p.replies?.length || 0) < 2)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 5);
    setPendingPosts(pending);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.backBtn, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}
          >
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <ThemedText type="h1">Ambassador Hub</ThemedText>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
        >
          {/* Support Status Hero */}
          <Animated.View entering={FadeInDown.duration(600)}>
            <LinearGradient
              colors={colors.gradients.secondary as any}
              style={styles.heroCard}
            >
              <View style={styles.heroContent}>
                <ThemedText style={styles.heroTitle}>Your Impact</ThemedText>
                <ThemedText style={styles.heroSub}>89 Students helped this semester</ThemedText>

                <View style={styles.statsRow}>
                  <View style={styles.miniStat}>
                    <ThemedText style={styles.statVal}>{stats.totalResponses}</ThemedText>
                    <ThemedText style={styles.statLab}>Responses</ThemedText>
                  </View>
                  <View style={styles.miniStat}>
                    <ThemedText style={styles.statVal}>98%</ThemedText>
                    <ThemedText style={styles.statLab}>Satisfaction</ThemedText>
                  </View>
                </View>
              </View>
              <Ionicons name="shield-checkmark" size={100} color="rgba(255,255,255,0.1)" style={styles.heroIcon} />
            </LinearGradient>
          </Animated.View>

          {/* Section: Urgent Support Needed */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <ThemedText type="h2">Queue</ThemedText>
              <ThemedText type="small" style={{ color: colors.icon }}>{pendingPosts.length} post(s) needing help</ThemedText>
            </View>

            {pendingPosts.length === 0 ? (
              <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
                <Ionicons name="checkmark-done-circle-outline" size={48} color={colors.success} />
                <ThemedText style={{ marginTop: 12 }}>Inbox is clear. Great job!</ThemedText>
              </View>
            ) : (
              pendingPosts.map((post, idx) => (
                <Animated.View key={post.id} entering={FadeInDown.delay(200 + idx * 100)}>
                  <TouchableOpacity
                    style={[styles.postCard, { backgroundColor: colors.card }]}
                    onPress={() => router.push(`/post/${post.id}`)}
                  >
                    <View style={styles.postTop}>
                      <View style={[styles.tag, { backgroundColor: colors.primary + '15' }]}>
                        <ThemedText style={{ color: colors.primary, fontSize: 10, fontWeight: '800' }}>{post.category?.toUpperCase()}</ThemedText>
                      </View>
                      <ThemedText style={styles.timeText}>{formatDistanceToNow(post.createdAt, { addSuffix: true })}</ThemedText>
                    </View>
                    <ThemedText type="h3" numberOfLines={1} style={styles.postTitle}>{post.title}</ThemedText>
                    <ThemedText numberOfLines={2} style={styles.postSnippet}>{post.content}</ThemedText>

                    <View style={styles.postFooter}>
                      <View style={styles.replyBadge}>
                        <Ionicons name="chatbubble-outline" size={14} color={colors.icon} />
                        <ThemedText style={styles.replyText}>{post.replies?.length || 0} replies</ThemedText>
                      </View>
                      <View style={styles.actionPrompt}>
                        <ThemedText style={{ color: colors.secondary, fontWeight: '700', fontSize: 12 }}>SUPPORT NOW</ThemedText>
                        <Ionicons name="arrow-forward" size={16} color={colors.secondary} />
                      </View>
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              ))
            )}
          </View>

          {/* Training & Tools */}
          <View style={styles.section}>
            <ThemedText type="h2" style={styles.sectionTitle}>Ambassador Tools</ThemedText>
            <View style={styles.grid}>
              <TouchableOpacity style={[styles.gridItem, { backgroundColor: colors.card }]}>
                <View style={[styles.iconBox, { backgroundColor: '#8B5CF620' }]}>
                  <Ionicons name="book-outline" size={24} color="#8B5CF6" />
                </View>
                <ThemedText style={styles.gridLabel}>Guidelines</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.gridItem, { backgroundColor: colors.card }]}>
                <View style={[styles.iconBox, { backgroundColor: '#F59E0B20' }]}>
                  <Ionicons name="megaphone-outline" size={24} color="#F59E0B" />
                </View>
                <ThemedText style={styles.gridLabel}>Report Issue</ThemedText>
              </TouchableOpacity>
            </View>
          </View>

          <View style={{ height: 40 }} />
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
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  heroCard: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.xxl,
    overflow: 'hidden',
    position: 'relative',
    ...PlatformStyles.premiumShadow,
    marginBottom: Spacing.xl,
  },
  heroContent: {
    zIndex: 1,
  },
  heroTitle: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: '800',
  },
  heroSub: {
    color: 'rgba(255,255,255,0.8)',
    marginBottom: Spacing.xl,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.xl,
  },
  miniStat: {
    alignItems: 'flex-start',
  },
  statVal: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: '900',
  },
  statLab: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
  },
  heroIcon: {
    position: 'absolute',
    bottom: -20,
    right: -20,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  emptyState: {
    padding: 40,
    borderRadius: BorderRadius.xxl,
    alignItems: 'center',
    ...PlatformStyles.shadow,
  },
  postCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.xxl,
    marginBottom: Spacing.md,
    ...PlatformStyles.shadow,
  },
  postTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  timeText: {
    fontSize: 12,
    color: '#64748B',
  },
  postTitle: {
    fontSize: 18,
    marginBottom: 4,
  },
  postSnippet: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  postFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  replyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  replyText: {
    fontSize: 12,
    color: '#64748B',
  },
  actionPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  grid: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  gridItem: {
    flex: 1,
    padding: Spacing.lg,
    borderRadius: BorderRadius.xxl,
    alignItems: 'center',
    gap: Spacing.sm,
    ...PlatformStyles.shadow,
  },
  iconBox: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridLabel: {
    fontWeight: '700',
    fontSize: 14,
  },
});
