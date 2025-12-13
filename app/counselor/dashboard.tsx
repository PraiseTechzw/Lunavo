/**
 * Life Coach/Counselor Dashboard - Manage escalated posts
 */

import { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
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
import { createShadow, getCursorStyle } from '@/app/utils/platform-styles';
import { getEscalations, getPostById, updateEscalation, getCurrentUser } from '@/lib/database';
import { subscribeToEscalations, unsubscribe, RealtimeChannel } from '@/lib/realtime';
import { Escalation, EscalationLevel, Post } from '@/app/types';
import { formatDistanceToNow } from 'date-fns';
import { useRoleGuard } from '@/hooks/use-auth-guard';

export default function CounselorDashboardScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  
  // Role guard - only counselors and life-coaches can access
  const { user, loading: authLoading } = useRoleGuard(['counselor', 'life-coach', 'admin'], '/(tabs)');
  
  const [refreshing, setRefreshing] = useState(false);
  const [escalations, setEscalations] = useState<Escalation[]>([]);
  const [filter, setFilter] = useState<'all' | EscalationLevel>('all');
  const [assignedFilter, setAssignedFilter] = useState<'all' | 'assigned' | 'unassigned'>('all');
  const escalationsChannelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (user) {
      loadEscalations();
      setupRealtimeSubscription();
    }

    return () => {
      if (escalationsChannelRef.current) {
        unsubscribe(escalationsChannelRef.current);
      }
    };
  }, [user, filter, assignedFilter]);

  const loadEscalations = async () => {
    try {
      const allEscalations = await getEscalations();
      let filtered = allEscalations;

      // Filter by escalation level
      if (filter !== 'all') {
        filtered = filtered.filter((e) => e.escalationLevel === filter);
      }

      // Filter by assignment
      if (assignedFilter === 'assigned') {
        filtered = filtered.filter((e) => e.assignedTo === user?.id);
      } else if (assignedFilter === 'unassigned') {
        filtered = filtered.filter((e) => !e.assignedTo);
      }

      // Sort by priority (critical > high > medium > low) and then by date
      filtered.sort((a, b) => {
        const levelOrder: Record<EscalationLevel, number> = {
          critical: 5,
          high: 4,
          medium: 3,
          low: 2,
          none: 0,
        };
        const levelDiff = levelOrder[b.escalationLevel] - levelOrder[a.escalationLevel];
        if (levelDiff !== 0) return levelDiff;
        return new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime();
      });

      setEscalations(filtered);
    } catch (error) {
      console.error('Error loading escalations:', error);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = subscribeToEscalations((newEscalation) => {
      loadEscalations();
    });
    escalationsChannelRef.current = channel;
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadEscalations();
    setRefreshing(false);
  };

  const handleAssignToSelf = async (escalationId: string) => {
    try {
      if (!user) return;

      await updateEscalation(escalationId, {
        assignedTo: user.id,
        status: 'in-progress',
      });

      Alert.alert('Success', 'Escalation assigned to you.');
      loadEscalations();
    } catch (error) {
      console.error('Error assigning escalation:', error);
      Alert.alert('Error', 'Failed to assign escalation.');
    }
  };

  const handleMarkResolved = async (escalationId: string) => {
    Alert.alert(
      'Mark as Resolved',
      'Are you sure you want to mark this escalation as resolved?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Resolve',
          onPress: async () => {
            try {
              await updateEscalation(escalationId, {
                status: 'resolved',
                resolvedAt: new Date(),
              });
              Alert.alert('Success', 'Escalation marked as resolved.');
              loadEscalations();
            } catch (error) {
              console.error('Error resolving escalation:', error);
              Alert.alert('Error', 'Failed to resolve escalation.');
            }
          },
        },
      ]
    );
  };

  const getEscalationColor = (level: EscalationLevel) => {
    switch (level) {
      case 'critical':
        return '#EF4444';
      case 'high':
        return '#F59E0B';
      case 'medium':
        return '#3B82F6';
      case 'low':
        return '#10B981';
      default:
        return colors.icon;
    }
  };

  const getResponseTime = (escalation: Escalation): string => {
    if (escalation.status === 'resolved' && escalation.resolvedAt) {
      const timeDiff = new Date(escalation.resolvedAt).getTime() - new Date(escalation.detectedAt).getTime();
      const hours = Math.floor(timeDiff / (1000 * 60 * 60));
      const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
      return `${hours}h ${minutes}m`;
    }
    const timeDiff = Date.now() - new Date(escalation.detectedAt).getTime();
    const hours = Math.floor(timeDiff / (1000 * 60 * 60));
    return `${hours}h ago`;
  };

  const renderEscalation = ({ item }: { item: Escalation }) => (
    <TouchableOpacity
      style={[
        styles.escalationCard,
        { backgroundColor: colors.card, borderLeftColor: getEscalationColor(item.escalationLevel) },
        createShadow(2, '#000', 0.1),
      ]}
      onPress={() => router.push(`/counselor/escalation/${item.id}`)}
      activeOpacity={0.7}
    >
      <View style={styles.escalationHeader}>
        <View style={styles.escalationLevelContainer}>
          <View
            style={[
              styles.levelBadge,
              { backgroundColor: getEscalationColor(item.escalationLevel) + '20' },
            ]}
          >
            <ThemedText
              type="small"
              style={{ color: getEscalationColor(item.escalationLevel), fontWeight: '700' }}
            >
              {item.escalationLevel.toUpperCase()}
            </ThemedText>
          </View>
          {item.assignedTo === user?.id && (
            <View style={[styles.assignedBadge, { backgroundColor: colors.primary + '20' }]}>
              <ThemedText type="small" style={{ color: colors.primary, fontWeight: '600' }}>
                Assigned to You
              </ThemedText>
            </View>
          )}
        </View>
        <ThemedText type="small" style={{ color: colors.icon }}>
          {formatDistanceToNow(new Date(item.detectedAt), { addSuffix: true })}
        </ThemedText>
      </View>

      <ThemedText type="body" style={[styles.escalationReason, { color: colors.text }]} numberOfLines={2}>
        {item.reason}
      </ThemedText>

      <View style={styles.escalationFooter}>
        <View style={styles.responseTimeContainer}>
          <MaterialIcons name="schedule" size={16} color={colors.icon} />
          <ThemedText type="small" style={{ color: colors.icon, marginLeft: Spacing.xs }}>
            {getResponseTime(item)}
          </ThemedText>
        </View>
        <View style={styles.statusBadge}>
          <ThemedText
            type="small"
            style={{
              color:
                item.status === 'resolved'
                  ? colors.success
                  : item.status === 'in-progress'
                  ? colors.primary
                  : colors.icon,
              fontWeight: '600',
            }}
          >
            {item.status === 'resolved'
              ? 'Resolved'
              : item.status === 'in-progress'
              ? 'In Progress'
              : 'Pending'}
          </ThemedText>
        </View>
      </View>

      {!item.assignedTo && (
        <TouchableOpacity
          style={[styles.assignButton, { backgroundColor: colors.primary }]}
          onPress={() => handleAssignToSelf(item.id)}
        >
          <MaterialIcons name="person-add" size={16} color="#FFFFFF" />
          <ThemedText type="small" style={{ color: '#FFFFFF', fontWeight: '600', marginLeft: Spacing.xs }}>
            Assign to Me
          </ThemedText>
        </TouchableOpacity>
      )}

      {item.assignedTo === user?.id && item.status !== 'resolved' && (
        <TouchableOpacity
          style={[styles.resolveButton, { backgroundColor: colors.success }]}
          onPress={() => handleMarkResolved(item.id)}
        >
          <MaterialIcons name="check-circle" size={16} color="#FFFFFF" />
          <ThemedText type="small" style={{ color: '#FFFFFF', fontWeight: '600', marginLeft: Spacing.xs }}>
            Mark as Resolved
          </ThemedText>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );

  if (authLoading) {
    return (
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <ThemedView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ThemedText>Loading...</ThemedText>
        </ThemedView>
      </SafeAreaView>
    );
  }

  const levelFilters: Array<{ id: 'all' | EscalationLevel; label: string }> = [
    { id: 'all', label: 'All' },
    { id: 'critical', label: 'Critical' },
    { id: 'high', label: 'High' },
    { id: 'medium', label: 'Medium' },
    { id: 'low', label: 'Low' },
  ];

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ThemedView style={styles.container}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.background }]}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => router.back()} style={getCursorStyle()}>
              <MaterialIcons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <ThemedText type="h2" style={styles.headerTitle}>
              Escalations
            </ThemedText>
          </View>
          <ThemedText type="body" style={{ color: colors.icon }}>
            {escalations.length} total
          </ThemedText>
        </View>

        {/* Filters */}
        <View style={styles.filtersContainer}>
          <FlatList
            horizontal
            data={levelFilters}
            renderItem={({ item }) => {
              const isSelected = filter === item.id;
              return (
                <TouchableOpacity
                  style={[
                    styles.filterChip,
                    {
                      backgroundColor: isSelected ? colors.primary : colors.surface,
                    },
                  ]}
                  onPress={() => setFilter(item.id)}
                  activeOpacity={0.7}
                >
                  <ThemedText
                    type="small"
                    style={{
                      color: isSelected ? '#FFFFFF' : colors.text,
                      fontWeight: '600',
                    }}
                  >
                    {item.label}
                  </ThemedText>
                </TouchableOpacity>
              );
            }}
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersContent}
          />
          <View style={styles.assignmentFilters}>
            <TouchableOpacity
              style={[
                styles.assignmentFilter,
                {
                  backgroundColor: assignedFilter === 'all' ? colors.primary : colors.surface,
                },
              ]}
              onPress={() => setAssignedFilter('all')}
            >
              <ThemedText
                type="small"
                style={{
                  color: assignedFilter === 'all' ? '#FFFFFF' : colors.text,
                  fontWeight: '600',
                }}
              >
                All
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.assignmentFilter,
                {
                  backgroundColor: assignedFilter === 'assigned' ? colors.primary : colors.surface,
                },
              ]}
              onPress={() => setAssignedFilter('assigned')}
            >
              <ThemedText
                type="small"
                style={{
                  color: assignedFilter === 'assigned' ? '#FFFFFF' : colors.text,
                  fontWeight: '600',
                }}
              >
                My Escalations
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.assignmentFilter,
                {
                  backgroundColor: assignedFilter === 'unassigned' ? colors.primary : colors.surface,
                },
              ]}
              onPress={() => setAssignedFilter('unassigned')}
            >
              <ThemedText
                type="small"
                style={{
                  color: assignedFilter === 'unassigned' ? '#FFFFFF' : colors.text,
                  fontWeight: '600',
                }}
              >
                Unassigned
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>

        {/* Escalations List */}
        <FlatList
          data={escalations}
          renderItem={renderEscalation}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialIcons name="inbox" size={64} color={colors.icon} />
              <ThemedText type="body" style={[styles.emptyText, { color: colors.icon }]}>
                No escalations found
              </ThemedText>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  headerTitle: {
    fontWeight: '700',
    fontSize: 20,
  },
  filtersContainer: {
    paddingVertical: Spacing.md,
  },
  filtersContent: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    marginRight: Spacing.sm,
  },
  assignmentFilters: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  assignmentFilter: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  listContent: {
    padding: Spacing.md,
    paddingBottom: 80,
  },
  escalationCard: {
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.md,
    borderLeftWidth: 4,
  },
  escalationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  escalationLevelContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'center',
  },
  levelBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  assignedBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  escalationReason: {
    marginBottom: Spacing.sm,
    fontWeight: '600',
  },
  escalationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  responseTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  assignButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.sm,
  },
  resolveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.sm,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xxl,
    marginTop: Spacing.xxl,
  },
  emptyText: {
    marginTop: Spacing.md,
    textAlign: 'center',
  },
});

