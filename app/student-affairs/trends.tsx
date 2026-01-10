/**
 * Trend Analysis - Student Affairs - Premium Version
 */

import { ThemedText } from '@/app/components/themed-text';
import { ThemedView } from '@/app/components/themed-view';
import { BorderRadius, Colors, PlatformStyles, Spacing } from '@/app/constants/theme';
import { useColorScheme } from '@/app/hooks/use-color-scheme';
import { useRoleGuard } from '@/hooks/use-auth-guard';
import { getEscalations, getPosts } from '@/lib/database';
import { Ionicons } from '@expo/vector-icons';
import { format, parseISO } from 'date-fns';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TrendsAnalysisScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { user, loading: authLoading } = useRoleGuard(['student-affairs', 'admin'], '/(tabs)');

  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [dailyPosts, setDailyPosts] = useState<[string, number][]>([]);
  const [escalationTrends, setEscalationTrends] = useState<Record<string, number>>({});

  useEffect(() => {
    if (user) loadTrends();
  }, [user, timeRange]);

  const loadTrends = async () => {
    try {
      const [posts, escalations] = await Promise.all([getPosts(), getEscalations()]);
      const daily: Record<string, number> = {};
      posts.forEach(p => {
        const d = format(new Date(p.createdAt), 'yyyy-MM-dd');
        daily[d] = (daily[d] || 0) + 1;
      });
      setDailyPosts(Object.entries(daily).sort((a, b) => a[0].localeCompare(b[0])).slice(-7));

      const esc: Record<string, number> = { critical: 0, high: 0, medium: 0, low: 0 };
      escalations.forEach(e => { esc[e.escalationLevel] = (esc[e.escalationLevel] || 0) + 1; });
      setEscalationTrends(esc);
    } catch (error) { console.error(error); }
  };

  if (authLoading) return null;

  const maxPosts = Math.max(...dailyPosts.map(d => d[1]), 1);

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <ThemedText type="h1">Command Center</ThemedText>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Time Range Selector */}
          <View style={styles.rangeRow}>
            {(['7d', '30d', '90d'] as const).map(range => (
              <TouchableOpacity
                key={range}
                onPress={() => setTimeRange(range)}
                style={[styles.rangeTab, timeRange === range && { backgroundColor: colors.primary }]}
              >
                <ThemedText style={[styles.rangeText, timeRange === range && { color: '#FFF' }]}>{range.toUpperCase()}</ThemedText>
              </TouchableOpacity>
            ))}
          </View>

          {/* Activity Chart */}
          <Animated.View entering={FadeIn.duration(800)} style={[styles.chartCard, { backgroundColor: colors.card }]}>
            <ThemedText type="h3" style={{ marginBottom: Spacing.xl }}>System Activity</ThemedText>
            <View style={styles.chartArea}>
              {dailyPosts.map(([date, count], idx) => (
                <View key={date} style={styles.barStack}>
                  <Animated.View
                    entering={FadeInDown.delay(idx * 100)}
                    style={[styles.bar, { height: `${(count / maxPosts) * 100}%`, backgroundColor: colors.primary }]}
                  />
                  <ThemedText style={styles.barLabel}>{format(parseISO(date), 'dd MMM')}</ThemedText>
                </View>
              ))}
            </View>
          </Animated.View>

          {/* Risk Levels */}
          <View style={styles.section}>
            <ThemedText type="h2" style={{ marginBottom: Spacing.md }}>Risk Distribution</ThemedText>
            {Object.entries(escalationTrends).map(([level, count], idx) => {
              const levelColor = level === 'critical' ? colors.danger : level === 'high' ? colors.warning : colors.primary;
              return (
                <Animated.View key={level} entering={FadeInRight.delay(idx * 150)}>
                  <View style={[styles.riskRow, { backgroundColor: colors.card }]}>
                    <View style={[styles.riskDot, { backgroundColor: levelColor }]} />
                    <ThemedText style={styles.riskLabel}>{level.toUpperCase()}</ThemedText>
                    <View style={styles.riskProgressBg}>
                      <View style={[styles.riskProgressFill, { width: `${(count / 20) * 100}%`, backgroundColor: levelColor }]} />
                    </View>
                    <ThemedText style={styles.riskCount}>{count}</ThemedText>
                  </View>
                </Animated.View>
              );
            })}
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
  rangeRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  rangeTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  rangeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  chartCard: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.xxl,
    marginBottom: Spacing.xl,
    ...PlatformStyles.shadow,
  },
  chartArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 150,
    justifyContent: 'space-between',
  },
  barStack: {
    alignItems: 'center',
    gap: 8,
  },
  bar: {
    width: 24,
    borderRadius: 6,
    minHeight: 4,
  },
  barLabel: {
    fontSize: 10,
    opacity: 0.5,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  riskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.sm,
    ...PlatformStyles.shadow,
  },
  riskDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: Spacing.md,
  },
  riskLabel: {
    width: 80,
    fontSize: 12,
    fontWeight: '800',
  },
  riskProgressBg: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 3,
    marginHorizontal: Spacing.md,
    overflow: 'hidden',
  },
  riskProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  riskCount: {
    fontWeight: '700',
  },
});
