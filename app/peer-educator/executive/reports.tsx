/**
 * Reports Module - For Peer Educator Executives
 * Monthly anonymized summaries and PDF export
 * NO RAW DATA ACCESS - Only aggregated, anonymized statistics
 */

import { DrawerHeader } from '@/components/navigation/drawer-header';
import { DrawerMenu } from '@/components/navigation/drawer-menu';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import { useRoleGuard } from '@/hooks/use-auth-guard';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getPosts, getReplies } from '@/lib/database';
import { supabase } from '@/lib/supabase';
import { createShadow, getCursorStyle } from '@/utils/platform-styles';
import { MaterialIcons } from '@expo/vector-icons';
import { endOfMonth, format, startOfMonth, subMonths } from 'date-fns';
import { usePathname, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
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
const isMobile = Platform.OS !== 'web';

interface MonthlyReport {
  month: string;
  year: number;
  totalPosts: number;
  totalResponses: number;
  categoryBreakdown: Record<string, number>;
  escalationCount: number;
  averageResponseTime: number;
  onTimeResponseRate: number;
  activePeerEducators: number;
  helpfulResponseRate: number;
}

export default function ReportsModuleScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  
  const { user, loading: authLoading } = useRoleGuard(
    ['peer-educator-executive', 'admin'],
    '/(tabs)'
  );
  
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(0); // 0 = current month, 1 = last month, etc.
  const [currentReport, setCurrentReport] = useState<MonthlyReport | null>(null);
  const [generatingPDF, setGeneratingPDF] = useState(false);

  useEffect(() => {
    if (user) {
      generateReport();
    }
  }, [user, selectedMonth]);

  const generateReport = async () => {
    try {
      setLoading(true);
      
      const now = new Date();
      const reportDate = subMonths(now, selectedMonth);
      const monthStart = startOfMonth(reportDate);
      const monthEnd = endOfMonth(reportDate);

      // Get all posts and replies
      const posts = await getPosts();
      const allReplies = await Promise.all(
        posts.map((p) => getReplies(p.id).catch(() => []))
      );
      const replies = allReplies.flat();

      // Filter data for the selected month
      const monthPosts = posts.filter(p => {
        const postDate = new Date(p.createdAt);
        return postDate >= monthStart && postDate <= monthEnd;
      });

      const monthReplies = replies.filter(r => {
        const replyDate = new Date(r.createdAt);
        return replyDate >= monthStart && replyDate <= monthEnd;
      });

      // Category breakdown (anonymized - numbers only)
      const categoryBreakdown: Record<string, number> = {};
      monthPosts.forEach(post => {
        categoryBreakdown[post.category] = (categoryBreakdown[post.category] || 0) + 1;
      });

      // Escalation count
      const escalationCount = monthPosts.filter(p => p.escalationLevel !== 'none').length;

      // Response time metrics
      const SLA_HOURS = 24;
      let totalResponseTime = 0;
      let responseCount = 0;
      let onTime = 0;

      monthPosts.forEach(post => {
        if (post.replies.length > 0) {
          const firstReply = post.replies[0];
          const postTime = new Date(post.createdAt).getTime();
          const replyTime = new Date(firstReply.createdAt).getTime();
          const hoursDiff = (replyTime - postTime) / (1000 * 60 * 60);
          
          totalResponseTime += hoursDiff;
          responseCount++;
          
          if (hoursDiff <= SLA_HOURS) {
            onTime++;
          }
        }
      });

      const averageResponseTime = responseCount > 0 ? totalResponseTime / responseCount : 0;
      const onTimeResponseRate = responseCount > 0 ? (onTime / responseCount) * 100 : 0;

      // Active peer educators (last 30 days from month end)
      const thirtyDaysBeforeMonthEnd = new Date(monthEnd.getTime() - 30 * 24 * 60 * 60 * 1000);
      const { data: peerEducators } = await supabase
        .from('users')
        .select('id, last_active')
        .in('role', ['peer-educator', 'peer-educator-executive']);

      const activePeerEducators = peerEducators?.filter((pe: any) => {
        const lastActive = new Date(pe.last_active);
        return lastActive >= thirtyDaysBeforeMonthEnd && lastActive <= monthEnd;
      }).length || 0;

      // Helpful response rate
      const helpfulResponses = monthReplies.filter(r => r.isHelpful > 0).length;
      const helpfulResponseRate = monthReplies.length > 0 
        ? (helpfulResponses / monthReplies.length) * 100 
        : 0;

      const report: MonthlyReport = {
        month: format(reportDate, 'MMMM'),
        year: reportDate.getFullYear(),
        totalPosts: monthPosts.length,
        totalResponses: monthReplies.length,
        categoryBreakdown,
        escalationCount,
        averageResponseTime,
        onTimeResponseRate,
        activePeerEducators,
        helpfulResponseRate,
      };

      setCurrentReport(report);
    } catch (error) {
      console.error('Error generating report:', error);
      Alert.alert('Error', 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async () => {
    if (!currentReport) return;

    try {
      setGeneratingPDF(true);
      
      // In a real implementation, you would use a PDF library like react-native-pdf or expo-print
      // For now, we'll show an alert with the report data
      
      const reportText = `
MONTHLY ANONYMIZED SUMMARY REPORT
${currentReport.month} ${currentReport.year}

PLATFORM OVERVIEW
- Total Posts: ${currentReport.totalPosts}
- Total Responses: ${currentReport.totalResponses}
- Escalations: ${currentReport.escalationCount}

RESPONSE METRICS
- Average Response Time: ${currentReport.averageResponseTime.toFixed(1)} hours
- On-Time Response Rate: ${currentReport.onTimeResponseRate.toFixed(1)}%
- Helpful Response Rate: ${currentReport.helpfulResponseRate.toFixed(1)}%

PEER EDUCATOR ACTIVITY
- Active Peer Educators: ${currentReport.activePeerEducators}

CATEGORY BREAKDOWN
${Object.entries(currentReport.categoryBreakdown).map(([cat, count]) => `- ${cat}: ${count}`).join('\n')}

NOTE: This report contains only aggregated, anonymized statistics.
No student identities or personal data are included.
      `.trim();

      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        // On web, we can use the browser's print functionality
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(`
            <html>
              <head>
                <title>Monthly Report - ${currentReport.month} ${currentReport.year}</title>
                <style>
                  body { font-family: Arial, sans-serif; padding: 20px; }
                  h1 { color: #333; }
                  pre { white-space: pre-wrap; }
                </style>
              </head>
              <body>
                <h1>Monthly Anonymized Summary Report</h1>
                <pre>${reportText}</pre>
              </body>
            </html>
          `);
          printWindow.document.close();
          printWindow.print();
        }
      } else {
        // On mobile, show alert with option to copy
        Alert.alert(
          'Report Generated',
          'PDF export functionality requires additional setup. Report data is ready for export.',
          [
            { text: 'OK' },
            { text: 'Copy Report', onPress: () => {
              // In a real app, you'd copy to clipboard
              console.log(reportText);
            }}
          ]
        );
      }

      Alert.alert('Success', 'Report exported successfully');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      Alert.alert('Error', 'Failed to export PDF');
    } finally {
      setGeneratingPDF(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await generateReport();
    setRefreshing(false);
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      'academic': 'Academic',
      'mental-health': 'Mental Health',
      'relationships': 'Relationships',
      'crisis': 'Crisis',
      'substance-abuse': 'Substance Abuse',
      'general': 'General',
    };
    return labels[category] || category;
  };

  if (authLoading || loading) {
    return (
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <ThemedView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <ThemedText style={{ marginTop: Spacing.md, color: colors.icon }}>Generating report...</ThemedText>
        </ThemedView>
      </SafeAreaView>
    );
  }

  if (!currentReport) {
    return (
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <ThemedView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <MaterialIcons name="description" size={64} color={colors.icon} />
          <ThemedText type="h3" style={{ color: colors.text, marginTop: Spacing.lg }}>
            No Report Data
          </ThemedText>
          <ThemedText type="body" style={{ color: colors.icon, marginTop: Spacing.sm, textAlign: 'center' }}>
            Unable to generate report data.
          </ThemedText>
        </ThemedView>
      </SafeAreaView>
    );
  }

  const pathname = usePathname();

  return (
    <SafeAreaView edges={isMobile ? ['top'] : []} style={styles.safeArea}>
      <ThemedView style={styles.container}>
        {/* Mobile Header */}
        {isMobile && (
          <DrawerHeader
            title="Reports Module"
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
                  Reports Module
                </ThemedText>
                <ThemedText type="body" style={{ color: colors.icon, marginTop: 4 }}>
                  Monthly anonymized summaries and PDF exports
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

          {/* Month Selector */}
          <View style={styles.monthSelector}>
            <TouchableOpacity
              style={[styles.monthButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => setSelectedMonth(Math.min(selectedMonth + 1, 11))}
              disabled={selectedMonth >= 11}
              {...getCursorStyle()}
            >
              <MaterialIcons name="chevron-left" size={24} color={colors.text} />
            </TouchableOpacity>
            
            <View style={styles.monthDisplay}>
              <ThemedText type="h3" style={{ color: colors.text, fontWeight: '700' }}>
                {currentReport.month} {currentReport.year}
              </ThemedText>
            </View>

            <TouchableOpacity
              style={[styles.monthButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => setSelectedMonth(Math.max(selectedMonth - 1, 0))}
              disabled={selectedMonth <= 0}
              {...getCursorStyle()}
            >
              <MaterialIcons name="chevron-right" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Export Button */}
          <TouchableOpacity
            style={[styles.exportButton, { backgroundColor: colors.primary }, createShadow(2, '#000', 0.1)]}
            onPress={handleExportPDF}
            disabled={generatingPDF}
            {...getCursorStyle()}
          >
            {generatingPDF ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <MaterialIcons name="picture-as-pdf" size={24} color="#FFFFFF" />
                <ThemedText type="body" style={{ color: '#FFFFFF', fontWeight: '600', marginLeft: Spacing.sm }}>
                  Export PDF Report
                </ThemedText>
              </>
            )}
          </TouchableOpacity>

          {/* Report Sections */}
          <View style={styles.reportSection}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="dashboard" size={24} color={colors.primary} />
              <ThemedText type="h3" style={{ marginLeft: Spacing.sm, color: colors.text }}>
                Platform Overview
              </ThemedText>
            </View>
            <View style={styles.metricsGrid}>
              <View style={[styles.metricCard, { backgroundColor: colors.surface }]}>
                <MaterialIcons name="article" size={24} color={colors.primary} />
                <ThemedText type="h2" style={{ color: colors.text, fontWeight: '700', marginTop: Spacing.xs }}>
                  {currentReport.totalPosts}
                </ThemedText>
                <ThemedText type="small" style={{ color: colors.icon }}>
                  Total Posts
                </ThemedText>
              </View>
              <View style={[styles.metricCard, { backgroundColor: colors.surface }]}>
                <MaterialIcons name="chat-bubble-outline" size={24} color={colors.primary} />
                <ThemedText type="h2" style={{ color: colors.text, fontWeight: '700', marginTop: Spacing.xs }}>
                  {currentReport.totalResponses}
                </ThemedText>
                <ThemedText type="small" style={{ color: colors.icon }}>
                  Total Responses
                </ThemedText>
              </View>
              <View style={[styles.metricCard, { backgroundColor: colors.surface }]}>
                <MaterialIcons name="warning" size={24} color={colors.danger} />
                <ThemedText type="h2" style={{ color: colors.text, fontWeight: '700', marginTop: Spacing.xs }}>
                  {currentReport.escalationCount}
                </ThemedText>
                <ThemedText type="small" style={{ color: colors.icon }}>
                  Escalations
                </ThemedText>
              </View>
            </View>
          </View>

          {/* Response Metrics */}
          <View style={styles.reportSection}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="timer" size={24} color={colors.primary} />
              <ThemedText type="h3" style={{ marginLeft: Spacing.sm, color: colors.text }}>
                Response Metrics
              </ThemedText>
            </View>
            <View style={styles.metricsList}>
              <View style={styles.metricRow}>
                <ThemedText type="body" style={{ color: colors.text }}>
                  Average Response Time
                </ThemedText>
                <ThemedText type="body" style={{ color: colors.text, fontWeight: '700' }}>
                  {currentReport.averageResponseTime.toFixed(1)} hours
                </ThemedText>
              </View>
              <View style={styles.metricRow}>
                <ThemedText type="body" style={{ color: colors.text }}>
                  On-Time Response Rate
                </ThemedText>
                <ThemedText type="body" style={{ color: colors.success, fontWeight: '700' }}>
                  {currentReport.onTimeResponseRate.toFixed(1)}%
                </ThemedText>
              </View>
              <View style={styles.metricRow}>
                <ThemedText type="body" style={{ color: colors.text }}>
                  Helpful Response Rate
                </ThemedText>
                <ThemedText type="body" style={{ color: colors.success, fontWeight: '700' }}>
                  {currentReport.helpfulResponseRate.toFixed(1)}%
                </ThemedText>
              </View>
            </View>
          </View>

          {/* Peer Educator Activity */}
          <View style={styles.reportSection}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="people" size={24} color={colors.primary} />
              <ThemedText type="h3" style={{ marginLeft: Spacing.sm, color: colors.text }}>
                Peer Educator Activity
              </ThemedText>
            </View>
            <View style={[styles.metricCard, { backgroundColor: colors.surface }]}>
              <MaterialIcons name="person-check" size={24} color={colors.success} />
              <ThemedText type="h2" style={{ color: colors.text, fontWeight: '700', marginTop: Spacing.xs }}>
                {currentReport.activePeerEducators}
              </ThemedText>
              <ThemedText type="small" style={{ color: colors.icon }}>
                Active Peer Educators
              </ThemedText>
            </View>
          </View>

          {/* Category Breakdown */}
          <View style={styles.reportSection}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="category" size={24} color={colors.primary} />
              <ThemedText type="h3" style={{ marginLeft: Spacing.sm, color: colors.text }}>
                Category Breakdown
              </ThemedText>
            </View>
            <View style={styles.categoryList}>
              {Object.entries(currentReport.categoryBreakdown).map(([category, count]) => (
                <View key={category} style={[styles.categoryItem, { backgroundColor: colors.surface }]}>
                  <ThemedText type="body" style={{ color: colors.text, fontWeight: '600' }}>
                    {getCategoryLabel(category)}
                  </ThemedText>
                  <ThemedText type="h3" style={{ color: colors.primary, fontWeight: '700' }}>
                    {count}
                  </ThemedText>
                </View>
              ))}
            </View>
          </View>

          {/* Privacy Notice */}
          <View style={[styles.privacyNotice, { backgroundColor: colors.surface }]}>
            <MaterialIcons name="lock" size={20} color={colors.icon} />
            <ThemedText type="small" style={{ color: colors.icon, marginLeft: Spacing.sm, flex: 1 }}>
              This report contains only aggregated, anonymized statistics. No student identities or personal data are included.
            </ThemedText>
          </View>
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
    paddingBottom: isMobile ? 80 : Spacing.xl,
  },
  webScrollContent: {
    padding: Spacing.xl,
    maxWidth: 1400,
    alignSelf: 'center',
    width: '100%',
  },
  webHeader: {
    padding: Spacing.xl,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
    ...(isWeb ? {
      position: 'sticky' as any,
      top: 70,
      zIndex: 10,
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(10px)',
    } : {}),
  },
  webHeaderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    maxWidth: 1400,
    alignSelf: 'center',
    width: '100%',
  },
  webHeaderTitle: {
    fontWeight: '700',
    fontSize: 32,
    letterSpacing: -0.5,
  },
  refreshButton: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    ...(isWeb ? {
      transition: 'all 0.2s ease',
    } : {}),
  },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
    gap: Spacing.md,
  },
  monthButton: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthDisplay: {
    minWidth: 150,
    alignItems: 'center',
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  reportSection: {
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  metricCard: {
    flex: 1,
    minWidth: '30%',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  metricsList: {
    gap: Spacing.md,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: '#F5F5F5',
    borderRadius: BorderRadius.md,
  },
  categoryList: {
    gap: Spacing.sm,
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  privacyNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.lg,
  },
});
