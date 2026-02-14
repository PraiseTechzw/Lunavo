/**
 * Life Coach/Counselor Dashboard - Premium Version
 */

import { ThemedText } from '@/app/components/themed-text';
import { ThemedView } from '@/app/components/themed-view';
import { BorderRadius, Colors, PlatformStyles, Spacing } from '@/app/constants/theme';
import { useColorScheme } from '@/app/hooks/use-color-scheme';
import { Escalation, EscalationLevel } from '@/app/types';
import { useRoleGuard } from '@/hooks/use-auth-guard';
import { getEscalations } from '@/lib/database';
import { RealtimeChannel, subscribeToEscalations, unsubscribe } from '@/lib/realtime';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  View,
  ScrollView
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CounselorDashboardScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { user, loading: authLoading } = useRoleGuard(
    ['counselor', 'life-coach', 'peer-educator-executive', 'admin'],
    '/(tabs)',
  );

  const [refreshing, setRefreshing] = useState(false);
  const [escalations, setEscalations] = useState<Escalation[]>([]);
  const [filter, setFilter] = useState<'all' | EscalationLevel>('all');
  const [assignedFilter, setAssignedFilter] = useState<'all' | 'assigned' | 'unassigned'>('all');
  const escalationsChannelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (user) {
      loadEscalations();
      const channel = subscribeToEscalations(() => loadEscalations());
      escalationsChannelRef.current = channel;
    }
    return () => { if (escalationsChannelRef.current) unsubscribe(escalationsChannelRef.current); };
  }, [user, filter, assignedFilter]);

  const loadEscalations = async () => {
    try {
      let filtered = await getEscalations();
      if (filter !== 'all') filtered = filtered.filter(e => e.escalationLevel === filter);
      if (assignedFilter === 'assigned') filtered = filtered.filter(e => e.assignedTo === user?.id);
      else if (assignedFilter === 'unassigned') filtered = filtered.filter(e => !e.assignedTo);

      filtered.sort((a, b) => new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime());
      setEscalations(filtered);
    } catch (error) { console.error(error); }
  };

  if (authLoading) return null;

  const renderEscalation = ({ item, index }: { item: Escalation, index: number }) => {
    const levelColor = item.escalationLevel === 'critical' ? colors.danger : item.escalationLevel === 'high' ? colors.warning : colors.primary;

    return (
      <Animated.View entering={FadeInDown.delay(index * 100)}>
        <TouchableOpacity
          style={[styles.escalationCard, { backgroundColor: colors.card }]}
          onPress={() => router.push(`/counselor/escalation/${item.id}`)}
        >
          <View style={styles.cardHeader}>
            <View style={[styles.levelBadge, { backgroundColor: levelColor + '20' }]}>
              <ThemedText style={{ color: levelColor, fontSize: 10, fontWeight: '900' }}>{item.escalationLevel.toUpperCase()}</ThemedText>
            </View>
            <ThemedText style={styles.timeText}>{formatDistanceToNow(new Date(item.detectedAt), { addSuffix: true })}</ThemedText>
          </View>

          <ThemedText type="h3" numberOfLines={2} style={styles.reasonText}>{item.reason}</ThemedText>

          <View style={styles.cardFooter}>
            <View style={styles.statusBox}>
              <Ionicons name="ellipse" size={8} color={item.status === 'resolved' ? colors.success : colors.warning} />
              <ThemedText style={styles.statusText}>{item.status?.replace('-', ' ')}</ThemedText>
            </View>
            {item.assignedTo === user?.id ? (
              <View style={styles.myBadge}>
                <Ionicons name="person" size={12} color={colors.primary} />
                <ThemedText style={{ color: colors.primary, fontSize: 10, fontWeight: '700' }}>ASSIGNED TO YOU</ThemedText>
              </View>
            ) : (
              <TouchableOpacity style={styles.assignLink} onPress={() => { }}>
                <ThemedText style={{ color: colors.secondary, fontWeight: '700', fontSize: 12 }}>CLAIM CASE</ThemedText>
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <ThemedText type="h1">Response Center</ThemedText>
          <View style={{ width: 44 }} />
        </View>

        <View style={styles.filterSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
            {(['all', 'critical', 'high', 'medium', 'low'] as const).map(lev => (
              <TouchableOpacity
                key={lev}
                style={[styles.filterChip, filter === lev && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                onPress={() => setFilter(lev)}
              >
                <ThemedText style={[styles.filterLabel, filter === lev && { color: '#FFF' }]}>{lev.toUpperCase()}</ThemedText>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <FlatList
          data={escalations}
          renderItem={renderEscalation}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadEscalations} tintColor={colors.primary} />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="shield-checkmark-outline" size={64} color={colors.icon} opacity={0.3} />
              <ThemedText style={{ marginTop: 16, opacity: 0.5 }}>All students are currently safe.</ThemedText>
            </View>
          }
        />
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
  filterSection: {
    marginBottom: Spacing.md,
  },
  filterScroll: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  filterLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  listContent: {
    padding: Spacing.lg,
  },
  escalationCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.xxl,
    marginBottom: Spacing.md,
    ...PlatformStyles.shadow,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  levelBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  timeText: {
    fontSize: 12,
    color: '#64748B',
  },
  reasonText: {
    marginBottom: Spacing.xl,
    lineHeight: 24,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  statusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusText: {
    fontSize: 12,
    textTransform: 'capitalize',
    fontWeight: '600',
    color: '#64748B',
  },
  myBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  assignLink: {
    paddingVertical: 4,
  },
  emptyState: {
    padding: 60,
    alignItems: 'center',
  },
});
