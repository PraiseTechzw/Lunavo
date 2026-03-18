/**
 * Badges Screen - View all badges and earned badges
 * Designed with a premium "Google-style" achievement interface
 */

import { useState, useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { createShadow, getCursorStyle } from '@/utils/platform-styles';
import { BADGE_DEFINITIONS, getBadgeProgress, checkAllBadges, BadgeDefinition } from '@/lib/gamification';
import { getUserBadges } from '@/lib/database';
import { useRoleGuard } from '@/hooks/use-auth-guard';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown, useAnimatedStyle, withSpring, useSharedValue } from 'react-native-reanimated';

const { width } = Dimensions.get('window');
const COLUMN_COUNT = 3;
const ITEM_WIDTH = (width - Spacing.md * 2 - Spacing.sm * (COLUMN_COUNT - 1)) / COLUMN_COUNT;

export default function BadgesScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  
  const { user, loading: authLoading } = useRoleGuard(
    ['student', 'peer-educator', 'peer-educator-executive', 'moderator', 'counselor', 'life-coach', 'student-affairs', 'admin'],
    '/(tabs)'
  );
  
  const [refreshing, setRefreshing] = useState(false);
  const [earnedBadgeNames, setEarnedBadgeNames] = useState<Set<string>>(new Set());
  const [badgeProgress, setBadgeProgress] = useState<Record<string, { current: number; target: number; percentage: number }>>({});
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'check-in' | 'helping' | 'engagement' | 'achievement'>('all');
  const [selectedBadge, setSelectedBadge] = useState<BadgeDefinition | null>(null);

  useEffect(() => {
    if (user) {
      loadBadges();
    }
  }, [user]);

  const loadBadges = async () => {
    try {
      // Get user's earned badges
      const userBadges = await getUserBadges(user!.id);
      const earnedNames = new Set(userBadges.map((ub: any) => ub.badge?.name).filter(Boolean));
      setEarnedBadgeNames(earnedNames);

      // Get progress for all badges
      const progressMap: Record<string, { current: number; target: number; percentage: number }> = {};
      for (const badge of BADGE_DEFINITIONS) {
        const progress = await getBadgeProgress(user!.id, badge.id);
        progressMap[badge.id] = progress;
      }
      setBadgeProgress(progressMap);

      // Check for newly eligible badges
      await checkAllBadges(user!.id);
    } catch (error) {
      console.error('Error loading badges:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadBadges();
    setRefreshing(false);
  };

  const filteredBadges = useMemo(() => {
    if (selectedCategory === 'all') return BADGE_DEFINITIONS;
    return BADGE_DEFINITIONS.filter(b => b.category === selectedCategory);
  }, [selectedCategory]);

  if (authLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ThemedText>Authenticating...</ThemedText>
      </View>
    );
  }

  const earnedCount = earnedBadgeNames.size;
  const totalCount = BADGE_DEFINITIONS.length;

  return (
    <SafeAreaView edges={['top']} style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ThemedView style={styles.container}>
        {/* Header Navigation */}
        <View style={styles.navBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <ThemedText type="h2" style={styles.navTitle}>Achievements</ThemedText>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
          }
        >
          {/* Progress Overview Section */}
          <View style={styles.overviewSection}>
            <LinearGradient
              colors={['#6366F1', '#8B5CF6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.statsCard}
            >
              <View style={styles.statsRow}>
                <View>
                  <ThemedText style={styles.statsLevel}>Level {Math.floor(earnedCount / 3) + 1}</ThemedText>
                  <ThemedText style={styles.statsEarned}>{earnedCount} / {totalCount} Badges</ThemedText>
                </View>
                <View style={styles.trophyContainer}>
                  <MaterialIcons name="emoji-events" size={48} color="#FFF" />
                </View>
              </View>
              
              <View style={styles.statsProgressContainer}>
                <View style={[styles.statsProgressBar, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                  <View 
                    style={[
                      styles.statsProgressFill, 
                      { width: `${(earnedCount / totalCount) * 100}%`, backgroundColor: '#FFF' }
                    ]} 
                  />
                </View>
                <ThemedText style={styles.progressLabel}>
                  {Math.round((earnedCount / totalCount) * 100)}% complete
                </ThemedText>
              </View>
            </LinearGradient>
          </View>

          {/* Category Tabs */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={styles.tabsScroll}
          >
            {['all', 'check-in', 'helping', 'engagement', 'achievement'].map((cat) => (
              <TouchableOpacity
                key={cat}
                onPress={() => setSelectedCategory(cat as any)}
                style={[
                  styles.tabChip,
                  selectedCategory === cat && { backgroundColor: colors.primary }
                ]}
              >
                <ThemedText 
                  style={[
                    styles.tabText, 
                    selectedCategory === cat && { color: '#FFF' }
                  ]}
                >
                  {cat === 'all' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1).replace('-', ' ')}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Badges Grid */}
          <View style={styles.grid}>
            {filteredBadges.map((badge, index) => {
              const isEarned = earnedBadgeNames.has(badge.name);
              const progress = badgeProgress[badge.id] || { percentage: 0 };
              
              return (
                <Animated.View 
                  key={badge.id}
                  entering={FadeInDown.delay(index * 40)}
                  style={styles.gridItem}
                >
                  <TouchableOpacity
                    onPress={() => setSelectedBadge(badge)}
                    activeOpacity={0.7}
                    style={styles.badgeWrapper}
                  >
                    <View style={styles.badgeOuterCircle}>
                      {/* Circular Progress Border */}
                      <View style={[styles.progressRing, { 
                        borderColor: isEarned ? badge.color : '#E2E8F0',
                        borderTopColor: isEarned ? badge.color : (progress.percentage > 0 ? badge.color : '#E2E8F0'),
                        borderRightColor: progress.percentage >= 25 ? badge.color : '#E2E8F0',
                        borderBottomColor: progress.percentage >= 50 ? badge.color : '#E2E8F0',
                        borderLeftColor: progress.percentage >= 75 ? badge.color : '#E2E8F0',
                      }]} />

                      <LinearGradient
                        colors={isEarned ? [badge.color + '40', badge.color + '10'] : ['#F1F5F9', '#F1F5F9']}
                        style={styles.badgeInnerCircle}
                      >
                        <MaterialIcons 
                          name={badge.icon as any} 
                          size={32} 
                          color={isEarned ? badge.color : '#94A3B8'} 
                        />
                      </LinearGradient>

                      {isEarned && (
                        <View style={[styles.checkBadge, { backgroundColor: badge.color }]}>
                          <MaterialIcons name="check" size={12} color="#FFF" />
                        </View>
                      )}
                    </View>
                    
                    <ThemedText 
                      numberOfLines={1} 
                      style={[
                        styles.badgeLabel, 
                        { color: isEarned ? colors.text : colors.icon }
                      ]}
                    >
                      {badge.name}
                    </ThemedText>
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
          </View>
        </ScrollView>

        {/* Badge Detail Overlay (Simulated Google Bottom Sheet) */}
        {selectedBadge && (
          <View style={[StyleSheet.absoluteFill, styles.overlay]}>
            <TouchableOpacity 
              style={styles.overlayClose} 
              onPress={() => setSelectedBadge(null)} 
            />
            <Animated.View entering={FadeInDown} style={[styles.detailCard, { backgroundColor: colors.card }]}>
              <TouchableOpacity 
                style={styles.closeButton} 
                onPress={() => setSelectedBadge(null)}
              >
                <Ionicons name="close" size={24} color={colors.icon} />
              </TouchableOpacity>

              <View style={styles.detailHeader}>
                <View style={[styles.detailIconContainer, { backgroundColor: selectedBadge.color + '20' }]}>
                  <MaterialIcons name={selectedBadge.icon as any} size={56} color={selectedBadge.color} />
                </View>
                <ThemedText type="h2" style={styles.detailTitle}>{selectedBadge.name}</ThemedText>
                <ThemedText style={styles.detailCategory}>{selectedBadge.category.toUpperCase()}</ThemedText>
              </View>

              <View style={styles.detailContent}>
                <ThemedText style={styles.detailDesc}>{selectedBadge.description}</ThemedText>
                
                <View style={styles.requirementBox}>
                  <ThemedText style={styles.reqTitle}>How to earn</ThemedText>
                  <ThemedText style={styles.reqText}>{selectedBadge.criteria.description}</ThemedText>
                  
                  {!earnedBadgeNames.has(selectedBadge.name) && (
                    <View style={styles.detailProgress}>
                      <View style={styles.detailProgressRow}>
                        <ThemedText style={styles.detailProgressText}>Current Progress</ThemedText>
                        <ThemedText style={styles.detailProgressValue}>
                          {badgeProgress[selectedBadge.id]?.current || 0} / {selectedBadge.criteria.value}
                        </ThemedText>
                      </View>
                      <View style={styles.detailProgressBar}>
                        <View 
                          style={[
                            styles.detailProgressFill, 
                            { 
                              width: `${badgeProgress[selectedBadge.id]?.percentage || 0}%`,
                              backgroundColor: selectedBadge.color
                            }
                          ]} 
                        />
                      </View>
                    </View>
                  )}
                </View>
              </View>

              <TouchableOpacity 
                style={[styles.actionButton, { backgroundColor: selectedBadge.color }]}
                onPress={() => setSelectedBadge(null)}
              >
                <ThemedText style={styles.actionBtnText}>
                  {earnedBadgeNames.has(selectedBadge.name) ? 'Awesome!' : 'Got it'}
                </ThemedText>
              </TouchableOpacity>
            </Animated.View>
          </View>
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
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  scrollContent: {
    paddingBottom: Spacing.xxl,
  },
  overviewSection: {
    padding: Spacing.md,
  },
  statsCard: {
    padding: Spacing.xl,
    borderRadius: 24,
    ...createShadow(8, '#6366F1', 0.2),
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statsLevel: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: '900',
  },
  statsEarned: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  trophyContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsProgressContainer: {
    marginTop: Spacing.lg,
  },
  statsProgressBar: {
    height: 6,
    borderRadius: 3,
  },
  statsProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressLabel: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'right',
  },
  tabsScroll: {
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  tabChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    marginRight: 8,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  gridItem: {
    width: ITEM_WIDTH,
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  badgeWrapper: {
    alignItems: 'center',
    width: '100%',
  },
  badgeOuterCircle: {
    width: ITEM_WIDTH * 0.8,
    height: ITEM_WIDTH * 0.8,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  progressRing: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 100,
    borderWidth: 3,
  },
  badgeInnerCircle: {
    width: '85%',
    height: '85%',
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 10,
    textAlign: 'center',
  },
  overlay: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  overlayClose: {
    flex: 1,
  },
  detailCard: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: Spacing.xl,
    paddingBottom: Platform.OS === 'ios' ? 40 : Spacing.xl,
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 10,
  },
  detailHeader: {
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  detailIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  detailTitle: {
    textAlign: 'center',
    fontWeight: '900',
  },
  detailCategory: {
    fontSize: 12,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 1.5,
    marginTop: 4,
  },
  detailContent: {
    marginTop: Spacing.lg,
  },
  detailDesc: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    color: '#475569',
  },
  requirementBox: {
    marginTop: Spacing.xl,
    backgroundColor: '#F8FAFC',
    padding: Spacing.lg,
    borderRadius: 20,
  },
  reqTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 8,
  },
  reqText: {
    fontSize: 14,
    color: '#64748B',
  },
  detailProgress: {
    marginTop: Spacing.md,
  },
  detailProgressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailProgressText: {
    fontSize: 12,
    fontWeight: '600',
  },
  detailProgressValue: {
    fontSize: 12,
    fontWeight: '800',
  },
  detailProgressBar: {
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  detailProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  actionButton: {
    marginTop: Spacing.xl,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    ...createShadow(4, '#000', 0.1),
  },
  actionBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
});
