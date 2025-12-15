/**
 * Peer Activity Panel - For Peer Educator Executives
 * Monitor peer educator performance
 * NO STUDENT IDENTITIES VISIBLE
 */

import { DrawerHeader } from '@/components/navigation/drawer-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import { useRoleGuard } from '@/hooks/use-auth-guard';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getPosts, getReplies } from '@/lib/database';
import { supabase } from '@/lib/supabase';
import { User } from '@/types';
import { createShadow, getCursorStyle } from '@/utils/platform-styles';
import { MaterialIcons } from '@expo/vector-icons';
import { format, isToday, isYesterday } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';
import { usePathname, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
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
const isMobile = Platform.OS !== 'web';

interface PeerEducatorActivity {
  peerEducator: User;
  totalResponses: number;
  averageResponseTime: number; // in hours
  onTimeResponses: number;
  lateResponses: number;
  helpfulResponses: number;
  activeThreads: number;
  lastActive: Date;
  isActive: boolean;
  responseLoad: 'low' | 'medium' | 'high';
  qualityScore: number; // 0-100, based on helpful ratings
}

export default function PeerActivityPanelScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  
  const { user, loading: authLoading } = useRoleGuard(
    ['peer-educator-executive', 'admin'],
    '/(tabs)'
  );
  
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [peerActivities, setPeerActivities] = useState<PeerEducatorActivity[]>([]);
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive' | 'high-load'>('all');
  const [sortBy, setSortBy] = useState<'activity' | 'responses' | 'quality'>('activity');
  const [drawerVisible, setDrawerVisible] = useState(false);

  useEffect(() => {
    if (user) {
      loadPeerActivities();
    }
  }, [user, sortBy]);

  const loadPeerActivities = async () => {
    try {
      setLoading(true);
      
      // Get all peer educators
      const { data: peerEducators, error } = await supabase
        .from('users')
        .select('*')
        .in('role', ['peer-educator', 'peer-educator-executive'])
        .order('last_active', { ascending: false });

      if (error) throw error;

      // Get all posts and replies
      const posts = await getPosts();
      const allReplies = await Promise.all(
        posts.map((p) => getReplies(p.id).catch(() => []))
      );
      const replies = allReplies.flat();

      // Calculate activity for each peer educator
      const activities: PeerEducatorActivity[] = await Promise.all(
        (peerEducators || []).map(async (peer: User) => {
          const peerReplies = replies.filter(r => r.authorId === peer.id && r.isFromVolunteer);
          const now = new Date();
          const lastActive = new Date(peer.lastActive);
          const hoursSinceActive = (now.getTime() - lastActive.getTime()) / (1000 * 60 * 60);
          const isActive = hoursSinceActive < 24; // Active if last active within 24 hours

          // Calculate response times
          let totalResponseTime = 0;
          let responseCount = 0;
          let onTime = 0;
          let late = 0;
          const SLA_HOURS = 24;

          for (const reply of peerReplies) {
            const post = posts.find(p => p.id === reply.postId);
            if (post) {
              const postTime = new Date(post.createdAt).getTime();
              const replyTime = new Date(reply.createdAt).getTime();
              const hoursDiff = (replyTime - postTime) / (1000 * 60 * 60);
              
              totalResponseTime += hoursDiff;
              responseCount++;
              
              if (hoursDiff <= SLA_HOURS) {
                onTime++;
              } else {
                late++;
              }
            }
          }

          const averageResponseTime = responseCount > 0 ? totalResponseTime / responseCount : 0;
          const helpfulResponses = peerReplies.filter(r => r.isHelpful > 0).length;
          const qualityScore = peerReplies.length > 0 
            ? Math.round((helpfulResponses / peerReplies.length) * 100)
            : 0;

          // Calculate active threads (posts with at least one reply from this peer)
          const activeThreads = new Set(peerReplies.map(r => r.postId)).size;

          // Determine response load
          let responseLoad: 'low' | 'medium' | 'high' = 'low';
          const recentReplies = peerReplies.filter(r => {
            const replyTime = new Date(r.createdAt).getTime();
            const daysAgo = (now.getTime() - replyTime) / (1000 * 60 * 60 * 24);
            return daysAgo <= 7;
          }).length;
          
          if (recentReplies >= 20) responseLoad = 'high';
          else if (recentReplies >= 10) responseLoad = 'medium';

          return {
            peerEducator: peer,
            totalResponses: peerReplies.length,
            averageResponseTime,
            onTimeResponses: onTime,
            lateResponses: late,
            helpfulResponses,
            activeThreads,
            lastActive,
            isActive,
            responseLoad,
            qualityScore,
          };
        })
      );

      // Sort activities
      let sorted = [...activities];
      switch (sortBy) {
        case 'responses':
          sorted.sort((a, b) => b.totalResponses - a.totalResponses);
          break;
        case 'quality':
          sorted.sort((a, b) => b.qualityScore - a.qualityScore);
          break;
        case 'activity':
        default:
          sorted.sort((a, b) => {
            // Sort by active status first, then by last active
            if (a.isActive !== b.isActive) {
              return a.isActive ? -1 : 1;
            }
            return b.lastActive.getTime() - a.lastActive.getTime();
          });
          break;
      }

      // Apply filter
      let filtered = sorted;
      switch (filter) {
        case 'active':
          filtered = sorted.filter(a => a.isActive);
          break;
        case 'inactive':
          filtered = sorted.filter(a => !a.isActive);
          break;
        case 'high-load':
          filtered = sorted.filter(a => a.responseLoad === 'high');
          break;
      }

      setPeerActivities(filtered);
    } catch (error) {
      console.error('Error loading peer activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadPeerActivities();
    setRefreshing(false);
  };

  const getLoadColor = (load: string) => {
    switch (load) {
      case 'high': return colors.danger;
      case 'medium': return '#FFA500';
      case 'low': return colors.success;
      default: return colors.icon;
    }
  };

  const getQualityColor = (score: number) => {
    if (score >= 80) return colors.success;
    if (score >= 60) return '#FFA500';
    return colors.danger;
  };

  const formatLastActive = (date: Date) => {
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    const daysAgo = Math.floor((new Date().getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (daysAgo < 7) return `${daysAgo} days ago`;
    return format(date, 'MMM d, yyyy');
  };

  if (authLoading || loading) {
    return (
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <ThemedView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <ThemedText style={{ marginTop: Spacing.md, color: colors.icon }}>Loading...</ThemedText>
        </ThemedView>
      </SafeAreaView>
    );
  }

  const activeCount = peerActivities.filter(a => a.isActive).length;
  const inactiveCount = peerActivities.filter(a => !a.isActive).length;
  const highLoadCount = peerActivities.filter(a => a.responseLoad === 'high').length;

  const pathname = usePathname();

  return (
    <SafeAreaView edges={isMobile ? ['top'] : []} style={styles.safeArea}>
      <ThemedView style={styles.container}>
        {/* Mobile Header */}
        {isMobile && (
          <DrawerHeader
            title="Peer Activity Panel"
            onMenuPress={() => setDrawerVisible(true)}
            rightAction={{
              icon: 'refresh',
              onPress: handleRefresh,
            }}
          />
        )}

        {/* Web Header */}
        {isWeb && (
          <View style={[styles.webHeader, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
            <View style={styles.webHeaderContent}>
              <View>
                <ThemedText type="h1" style={[styles.webHeaderTitle, { color: colors.text }]}>
                  Peer Activity Panel
                </ThemedText>
                <ThemedText type="body" style={{ color: colors.icon, marginTop: 4 }}>
                  Monitor peer educator performance and activity
                </ThemedText>
              </View>
              <TouchableOpacity
                onPress={handleRefresh}
                style={[styles.refreshButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                {...getCursorStyle()}
              >
                <MaterialIcons name="refresh" size={20} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            isWeb && styles.webScrollContent
          ]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
          }
        >

          {/* Summary Stats */}
          <View style={styles.summaryContainer}>
            <View style={[styles.summaryCard, { backgroundColor: colors.success + '20' }, createShadow(2, colors.success, 0.1)]}>
              <LinearGradient
                colors={[colors.success + '30', colors.success + '10']}
                style={styles.summaryIconContainer}
              >
                <MaterialIcons name="person-check" size={28} color={colors.success} />
              </LinearGradient>
              <ThemedText type="h1" style={{ color: colors.success, fontWeight: '700', marginTop: Spacing.sm }}>
                {activeCount}
              </ThemedText>
              <ThemedText type="small" style={{ color: colors.icon, fontWeight: '600' }}>
                Active
              </ThemedText>
            </View>
            <View style={[styles.summaryCard, { backgroundColor: colors.icon + '20' }, createShadow(2, colors.icon, 0.1)]}>
              <LinearGradient
                colors={[colors.icon + '30', colors.icon + '10']}
                style={styles.summaryIconContainer}
              >
                <MaterialIcons name="person-off" size={28} color={colors.icon} />
              </LinearGradient>
              <ThemedText type="h1" style={{ color: colors.icon, fontWeight: '700', marginTop: Spacing.sm }}>
                {inactiveCount}
              </ThemedText>
              <ThemedText type="small" style={{ color: colors.icon, fontWeight: '600' }}>
                Inactive
              </ThemedText>
            </View>
            <View style={[styles.summaryCard, { backgroundColor: colors.danger + '20' }, createShadow(2, colors.danger, 0.1)]}>
              <LinearGradient
                colors={[colors.danger + '30', colors.danger + '10']}
                style={styles.summaryIconContainer}
              >
                <MaterialIcons name="warning" size={28} color={colors.danger} />
              </LinearGradient>
              <ThemedText type="h1" style={{ color: colors.danger, fontWeight: '700', marginTop: Spacing.sm }}>
                {highLoadCount}
              </ThemedText>
              <ThemedText type="small" style={{ color: colors.icon, fontWeight: '600' }}>
                High Load
              </ThemedText>
            </View>
          </View>

          {/* Filters and Sort */}
          <View style={styles.controlsContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
              {(['all', 'active', 'inactive', 'high-load'] as const).map((f) => (
                <TouchableOpacity
                  key={f}
                  style={[
                    styles.filterButton,
                    {
                      backgroundColor: filter === f ? colors.primary : colors.surface,
                      borderColor: filter === f ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => setFilter(f)}
                  {...getCursorStyle()}
                >
                  <ThemedText
                    type="small"
                    style={{
                      color: filter === f ? '#FFFFFF' : colors.text,
                      fontWeight: '600',
                      textTransform: 'capitalize',
                    }}
                  >
                    {f.replace('-', ' ')}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.sortContainer}>
              <ThemedText type="small" style={{ color: colors.icon, marginRight: Spacing.sm }}>
                Sort:
              </ThemedText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {(['activity', 'responses', 'quality'] as const).map((s) => (
                  <TouchableOpacity
                    key={s}
                    style={[
                      styles.sortButton,
                      {
                        backgroundColor: sortBy === s ? colors.secondary : colors.surface,
                        borderColor: sortBy === s ? colors.secondary : colors.border,
                      },
                    ]}
                    onPress={() => setSortBy(s)}
                    {...getCursorStyle()}
                  >
                    <ThemedText
                      type="small"
                      style={{
                        color: sortBy === s ? '#FFFFFF' : colors.text,
                        fontWeight: '600',
                        textTransform: 'capitalize',
                      }}
                    >
                      {s}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>

          {/* Peer Educator List */}
          {peerActivities.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="people" size={64} color={colors.icon} />
              <ThemedText type="h3" style={{ color: colors.text, marginTop: Spacing.lg }}>
                No Peer Educators Found
              </ThemedText>
              <ThemedText type="body" style={{ color: colors.icon, marginTop: Spacing.sm, textAlign: 'center' }}>
                {filter === 'all' 
                  ? 'No peer educators in the system.'
                  : `No peer educators match the "${filter}" filter.`}
              </ThemedText>
            </View>
          ) : (
            <View style={styles.peersList}>
              {peerActivities.map((activity) => (
                <View
                  key={activity.peerEducator.id}
                  style={[styles.peerCard, { backgroundColor: colors.card }, createShadow(2, '#000', 0.1)]}
                >
                  <View style={styles.peerHeader}>
                    <View style={styles.peerInfo}>
                      <View style={[styles.statusIndicator, { backgroundColor: activity.isActive ? colors.success : colors.icon }]} />
                      <View style={{ flex: 1 }}>
                        <ThemedText type="body" style={{ fontWeight: '700', color: colors.text }}>
                          {activity.peerEducator.pseudonym || 'Anonymous'}
                        </ThemedText>
                        <ThemedText type="small" style={{ color: colors.icon }}>
                          Last active: {formatLastActive(activity.lastActive)}
                        </ThemedText>
                      </View>
                    </View>
                    {!activity.isActive && (
                      <View style={[styles.inactiveBadge, { backgroundColor: colors.icon + '20' }]}>
                        <ThemedText type="small" style={{ color: colors.icon, fontWeight: '600' }}>
                          Inactive
                        </ThemedText>
                      </View>
                    )}
                  </View>

                  <View style={styles.peerMetrics}>
                    <View style={styles.metricItem}>
                      <MaterialIcons name="chat-bubble-outline" size={20} color={colors.primary} />
                      <ThemedText type="body" style={{ color: colors.text, fontWeight: '600', marginLeft: Spacing.xs }}>
                        {activity.totalResponses}
                      </ThemedText>
                      <ThemedText type="small" style={{ color: colors.icon, marginLeft: 4 }}>
                        responses
                      </ThemedText>
                    </View>

                    <View style={styles.metricItem}>
                      <MaterialIcons name="timer" size={20} color={colors.primary} />
                      <ThemedText type="body" style={{ color: colors.text, fontWeight: '600', marginLeft: Spacing.xs }}>
                        {activity.averageResponseTime.toFixed(1)}h
                      </ThemedText>
                      <ThemedText type="small" style={{ color: colors.icon, marginLeft: 4 }}>
                        avg time
                      </ThemedText>
                    </View>

                    <View style={styles.metricItem}>
                      <MaterialIcons name="check-circle" size={20} color={colors.success} />
                      <ThemedText type="body" style={{ color: colors.text, fontWeight: '600', marginLeft: Spacing.xs }}>
                        {activity.onTimeResponses}/{activity.onTimeResponses + activity.lateResponses}
                      </ThemedText>
                      <ThemedText type="small" style={{ color: colors.icon, marginLeft: 4 }}>
                        on time
                      </ThemedText>
                    </View>
                  </View>

                  <View style={styles.peerFooter}>
                    <View style={styles.footerItem}>
                      <View style={[styles.loadBadge, { backgroundColor: getLoadColor(activity.responseLoad) + '20' }]}>
                        <ThemedText type="small" style={{ color: getLoadColor(activity.responseLoad), fontWeight: '600' }}>
                          Load: {activity.responseLoad}
                        </ThemedText>
                      </View>
                    </View>

                    <View style={styles.footerItem}>
                      <View style={[styles.qualityBadge, { backgroundColor: getQualityColor(activity.qualityScore) + '20' }]}>
                        <MaterialIcons name="star" size={14} color={getQualityColor(activity.qualityScore)} />
                        <ThemedText type="small" style={{ color: getQualityColor(activity.qualityScore), fontWeight: '600', marginLeft: 4 }}>
                          {activity.qualityScore}%
                        </ThemedText>
                      </View>
                    </View>

                    <View style={styles.footerItem}>
                      <ThemedText type="small" style={{ color: colors.icon }}>
                        {activity.activeThreads} threads
                      </ThemedText>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>

        {/* Drawer Menu - Mobile Only */}
        {isMobile && (
          <DrawerMenu
            visible={drawerVisible}
            onClose={() => setDrawerVisible(false)}
            role={user?.role || undefined}
          />
        )}
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: 80,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  headerTitle: {
    fontWeight: '700',
    fontSize: 20,
  },
  summaryContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  summaryCard: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  controlsContainer: {
    marginBottom: Spacing.lg,
    gap: Spacing.md,
  },
  filterScroll: {
    marginHorizontal: -Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  filterButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 2,
    marginRight: Spacing.sm,
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sortButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 2,
    marginRight: Spacing.sm,
  },
  peersList: {
    gap: Spacing.md,
  },
  peerCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  peerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  peerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: Spacing.sm,
  },
  inactiveBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  peerMetrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: '30%',
  },
  peerFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  qualityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  emptyContainer: {
    padding: Spacing.xxl * 2,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 400,
  },
});
