/**
 * Reports Management Screen - Review and handle reports
 */

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { WebCard, WebContainer } from '@/components/web';
import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Report } from '@/types';
import { getCursorStyle } from '@/utils/platform-styles';
import { useRoleGuard } from '@/hooks/use-auth-guard';
import { getReports, updateReport } from '@/lib/database';
import { MaterialIcons } from '@expo/vector-icons';
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

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

export default function ReportsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  
  // Role guard - only admins can access
  const { user, loading } = useRoleGuard(['admin'], '/(tabs)');
  
  const [refreshing, setRefreshing] = useState(false);
  const [reports, setReports] = useState<Report[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'reviewed' | 'resolved' | 'dismissed'>('all');
  
  // Early return for loading
  if (loading) {
    return (
      <ThemedView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ThemedText>Loading...</ThemedText>
      </ThemedView>
    );
  }

  useEffect(() => {
    loadReports();
  }, [filter]);

  const loadReports = async () => {
    const allReports = await getReports();
    let filtered = allReports;
    
    if (filter !== 'all') {
      filtered = allReports.filter(r => r.status === filter);
    }
    
    filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    setReports(filtered);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadReports();
    setRefreshing(false);
  };

  const handleStatusUpdate = async (reportId: string, status: Report['status']) => {
    await updateReport(reportId, { status });
    await loadReports();
    Alert.alert('Success', `Report marked as ${status}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return colors.warning;
      case 'reviewed': return colors.info;
      case 'resolved': return colors.success;
      case 'dismissed': return colors.icon;
      default: return colors.icon;
    }
  };

  const filters: Array<'all' | 'pending' | 'reviewed' | 'resolved' | 'dismissed'> = [
    'all',
    'pending',
    'reviewed',
    'resolved',
    'dismissed',
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
            Reports Management
          </ThemedText>
          <ThemedText type="body" style={[styles.pageSubtitle, { color: colors.icon }]}>
            Review and manage user reports
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
                {filterOption === 'all' ? 'All' : filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </WebCard>

      {/* Reports List */}
      {reports.length === 0 ? (
        <WebCard style={styles.emptyCard}>
          <MaterialIcons name="check-circle" size={64} color={colors.success} />
          <ThemedText type="h3" style={[styles.emptyTitle, { color: colors.text }]}>
            No Reports
          </ThemedText>
          <ThemedText type="body" style={[styles.emptyText, { color: colors.icon }]}>
            All reports have been handled
          </ThemedText>
        </WebCard>
      ) : (
        <View style={styles.reportsList}>
          {reports.map((report) => (
            <WebCard
              key={report.id}
              hoverable
              style={styles.reportCard}
            >
              <View style={styles.reportHeader}>
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusColor(report.status) + '20' }
                ]}>
                  <ThemedText
                    type="small"
                    style={{ color: getStatusColor(report.status), fontWeight: '700' }}
                  >
                    {report.status.toUpperCase()}
                  </ThemedText>
                </View>
                <View style={[
                  styles.typeBadge,
                  { backgroundColor: colors.primary + '20' }
                ]}>
                  <MaterialIcons name="description" size={14} color={colors.primary} />
                  <ThemedText type="small" style={{ color: colors.primary, fontWeight: '600', marginLeft: 4 }}>
                    {report.targetType.toUpperCase()}
                  </ThemedText>
                </View>
              </View>

              <View style={styles.reportBody}>
                <ThemedText type="body" style={[styles.reasonLabel, { color: colors.text }]}>
                  Reason:
                </ThemedText>
                <ThemedText type="body" style={[styles.reasonText, { color: colors.text }]}>
                  {report.reason}
                </ThemedText>

                {report.description && (
                  <>
                    <ThemedText type="body" style={[styles.descriptionLabel, { color: colors.icon }]}>
                      Description:
                    </ThemedText>
                    <ThemedText type="body" style={[styles.descriptionText, { color: colors.text }]}>
                      {report.description}
                    </ThemedText>
                  </>
                )}

                <TouchableOpacity
                  style={styles.viewTargetButton}
                  onPress={() => {
                    if (report.targetType === 'post') {
                      router.push(`/post/${report.targetId}`);
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <MaterialIcons name="visibility" size={16} color={colors.primary} />
                  <ThemedText type="small" style={{ color: colors.primary, fontWeight: '600', marginLeft: 4 }}>
                    View {report.targetType}
                  </ThemedText>
                </TouchableOpacity>
              </View>

              <View style={styles.reportFooter}>
                <ThemedText type="small" style={{ color: colors.icon }}>
                  {formatDistanceToNow(report.createdAt, { addSuffix: true })}
                </ThemedText>

                {report.status === 'pending' && (
                  <View style={styles.actions}>
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: colors.success + '20' }]}
                      onPress={() => handleStatusUpdate(report.id, 'resolved')}
                      activeOpacity={0.7}
                    >
                      <MaterialIcons name="check" size={16} color={colors.success} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: colors.icon + '20' }]}
                      onPress={() => handleStatusUpdate(report.id, 'dismissed')}
                      activeOpacity={0.7}
                    >
                      <MaterialIcons name="close" size={16} color={colors.icon} />
                    </TouchableOpacity>
                  </View>
                )}
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
            Reports
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
  reportsList: {
    gap: Spacing.md,
  },
  reportCard: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  reportBody: {
    marginBottom: Spacing.md,
  },
  reasonLabel: {
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  reasonText: {
    marginBottom: Spacing.sm,
  },
  descriptionLabel: {
    fontWeight: '600',
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  descriptionText: {
    opacity: 0.8,
  },
  viewTargetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  reportFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    ...getCursorStyle(),
  },
});



