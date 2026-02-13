/**
 * Student Affairs Dashboard - Premium Version
 */

import { ThemedText } from '@/app/components/themed-text';
import { ThemedView } from '@/app/components/themed-view';
import { CATEGORIES } from '@/app/constants/categories';
import { BorderRadius, Colors, PlatformStyles, Spacing } from '@/app/constants/theme';
import { useColorScheme } from '@/app/hooks/use-color-scheme';
import { Analytics } from '@/app/types';
import { useRoleGuard } from '@/hooks/use-auth-guard';
import { getAnalytics, getPosts } from '@/lib/database';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function StudentAffairsDashboardScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { user, loading: authLoading } = useRoleGuard(['student-affairs', 'admin'], '/(tabs)');

  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [topCategories, setTopCategories] = useState<[string, number][]>([]);

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const loadData = async () => {
    try {
      const [analyticsData, posts] = await Promise.all([
        getAnalytics(),
        getPosts(),
      ]);
      setAnalytics(analyticsData);

      const breakdown: Record<string, number> = {};
      posts.forEach(p => { breakdown[p.category] = (breakdown[p.category] || 0) + 1; });
      setTopCategories(Object.entries(breakdown).sort((a, b) => b[1] - a[1]).slice(0, 4));
    } catch (error) {
      console.error(error);
    }
  };

  if (authLoading) return null;

  const StatCard = ({ icon, label, value, gradient, delay }: any) => (
    <Animated.View entering={FadeInDown.delay(delay).duration(600)} style={styles.statWrapper}>
      <LinearGradient colors={gradient} style={styles.premiumStatCard}>
        <Ionicons name={icon} size={28} color="#FFF" />
        <ThemedText style={styles.premiumStatVal}>{value}</ThemedText>
        <ThemedText style={styles.premiumStatLab}>{label}</ThemedText>
      </LinearGradient>
    </Animated.View>
  );

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <ThemedText type="h1">Command Center</ThemedText>
          <TouchableOpacity onPress={() => { }}>
            <Ionicons name="download-outline" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.statsGrid}>
            <StatCard
              delay={100}
              icon="megaphone-outline"
              label="Total Voice"
              value={analytics?.totalPosts || 0}
              gradient={colors.gradients.primary as any}
            />
            <StatCard
              delay={200}
              icon="people-outline"
              label="Citizens"
              value={analytics?.activeUsers || 0}
              gradient={colors.gradients.cool as any}
            />
            <StatCard
              delay={300}
              icon="alert-circle-outline"
              label="Escalations"
              value={12}
              gradient={colors.gradients.warm as any}
            />
            <StatCard
              delay={400}
              icon="checkmark-done-circle-outline"
              label="Resolved"
              value="94%"
              gradient={colors.gradients.success as any}
            />
          </View>

          <View style={styles.section}>
            <ThemedText type="h2" style={styles.sectionTitle}>Key Concerns</ThemedText>
            {topCategories.map(([catId, count], idx) => {
              const cat = CATEGORIES[catId as keyof typeof CATEGORIES];
              return (
                <View key={catId} style={[styles.concernCard, { backgroundColor: colors.card }]}>
                  <View style={styles.concernInfo}>
                    <ThemedText type="h3">{cat?.name || catId}</ThemedText>
                    <ThemedText style={{ color: colors.icon }}>{count} interactions</ThemedText>
                  </View>
                  <View style={styles.progressBox}>
                    <View style={[styles.progressFill, { width: `${(count / (analytics?.totalPosts || 1)) * 100}%`, backgroundColor: cat?.color || colors.primary }]} />
                  </View>
                </View>
              );
            })}
          </View>

          <View style={styles.actions}>
            <TouchableOpacity style={[styles.mainAction, { backgroundColor: colors.primary }]} onPress={() => router.push('/student-affairs/trends')}>
              <ThemedText style={styles.actionText}>SYSTEM TRENDS ENGINE</ThemedText>
              <Ionicons name="pulse" size={20} color="#FFF" />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.subAction, { borderColor: colors.border }]} onPress={() => router.push('/student-affairs/analytics')}>
              <ThemedText style={[styles.actionText, { color: colors.text }]}>DETAILED ANALYTICS</ThemedText>
              <Ionicons name="bar-chart-outline" size={20} color={colors.text} />
            </TouchableOpacity>
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  statWrapper: {
    width: '47%',
  },
  premiumStatCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.xxl,
    gap: Spacing.xs,
    ...PlatformStyles.premiumShadow,
  },
  premiumStatVal: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: '900',
  },
  premiumStatLab: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  concernCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.xxl,
    marginBottom: Spacing.md,
    ...PlatformStyles.shadow,
  },
  concernInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  progressBox: {
    height: 10,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 5,
  },
  actions: {
    gap: Spacing.md,
  },
  mainAction: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    gap: Spacing.sm,
    ...PlatformStyles.premiumShadow,
  },
  subAction: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  actionText: {
    color: '#FFF',
    fontWeight: '900',
    letterSpacing: 1,
  },
});
