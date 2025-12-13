/**
 * Rewards Screen - View and redeem rewards
 */

import { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
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
import { getUserPoints, getPointsHistory, spendPoints } from '@/lib/points-system';
import { getCurrentUser } from '@/lib/database';
import { useRoleGuard } from '@/hooks/use-auth-guard';
import { format } from 'date-fns';

interface Reward {
  id: string;
  name: string;
  description: string;
  pointsCost: number;
  category: 'badge' | 'title' | 'theme' | 'feature' | 'physical';
  icon: string;
  color: string;
  available: boolean;
}

const REWARDS: Reward[] = [
  {
    id: 'custom-title-1',
    name: 'Helper Title',
    description: 'Unlock "Helper" title for your profile',
    pointsCost: 100,
    category: 'title',
    icon: 'star',
    color: '#F59E0B',
    available: true,
  },
  {
    id: 'custom-title-2',
    name: 'Champion Title',
    description: 'Unlock "Champion" title for your profile',
    pointsCost: 250,
    category: 'title',
    icon: 'emoji-events',
    color: '#8B5CF6',
    available: true,
  },
  {
    id: 'custom-theme-1',
    name: 'Dark Theme Unlock',
    description: 'Unlock exclusive dark theme variant',
    pointsCost: 150,
    category: 'theme',
    icon: 'palette',
    color: '#6366F1',
    available: true,
  },
  {
    id: 'custom-badge-1',
    name: 'Special Badge',
    description: 'Unlock a special profile badge',
    pointsCost: 200,
    category: 'badge',
    icon: 'verified',
    color: '#10B981',
    available: true,
  },
  {
    id: 'feature-1',
    name: 'Priority Support',
    description: 'Get priority in support queue for 1 month',
    pointsCost: 300,
    category: 'feature',
    icon: 'priority-high',
    color: '#EF4444',
    available: true,
  },
];

export default function RewardsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  
  const { user, loading: authLoading } = useRoleGuard(
    ['student', 'peer-educator', 'peer-educator-executive', 'moderator', 'counselor', 'life-coach', 'student-affairs', 'admin'],
    '/(tabs)'
  );
  
  const [refreshing, setRefreshing] = useState(false);
  const [points, setPoints] = useState(0);
  const [history, setHistory] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    if (user) {
      loadRewardsData();
    }
  }, [user]);

  const loadRewardsData = async () => {
    try {
      const [userPoints, pointsHistory] = await Promise.all([
        getUserPoints(user!.id),
        getPointsHistory(user!.id, 20),
      ]);
      setPoints(userPoints);
      setHistory(pointsHistory);
    } catch (error) {
      console.error('Error loading rewards data:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadRewardsData();
    setRefreshing(false);
  };

  const handleRedeem = async (reward: Reward) => {
    if (points < reward.pointsCost) {
      Alert.alert('Insufficient Points', `You need ${reward.pointsCost} points to redeem this reward. You currently have ${points} points.`);
      return;
    }

    Alert.alert(
      'Redeem Reward',
      `Are you sure you want to redeem "${reward.name}" for ${reward.pointsCost} points?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Redeem',
          onPress: async () => {
            const success = await spendPoints(
              user!.id,
              reward.pointsCost,
              'reward',
              `Redeemed: ${reward.name}`
            );

            if (success) {
              Alert.alert('Success', `You've successfully redeemed "${reward.name}"!`);
              await loadRewardsData();
            } else {
              Alert.alert('Error', 'Failed to redeem reward. Please try again.');
            }
          },
        },
      ]
    );
  };

  const getCategoryRewards = () => {
    if (selectedCategory === 'all') {
      return REWARDS;
    }
    return REWARDS.filter((r) => r.category === selectedCategory);
  };

  if (authLoading) {
    return (
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <ThemedView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ThemedText>Loading...</ThemedText>
        </ThemedView>
      </SafeAreaView>
    );
  }

  const categories = ['all', 'title', 'theme', 'badge', 'feature'];
  const filteredRewards = getCategoryRewards();

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ThemedView style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
          }
        >
          {/* Header */}
          <View style={[styles.header, { backgroundColor: colors.background }]}>
            <TouchableOpacity onPress={() => router.back()} style={getCursorStyle()}>
              <MaterialIcons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <ThemedText type="h2" style={styles.headerTitle}>
              Rewards
            </ThemedText>
            <View style={{ width: 24 }} />
          </View>

          {/* Points Balance Card */}
          <View style={[styles.pointsCard, { backgroundColor: colors.primary }, createShadow(3, '#000', 0.15)]}>
            <MaterialIcons name="stars" size={32} color="#FFFFFF" />
            <View style={styles.pointsInfo}>
              <ThemedText type="h2" style={{ color: '#FFFFFF', fontWeight: '700' }}>
                {points}
              </ThemedText>
              <ThemedText type="body" style={{ color: '#FFFFFF', opacity: 0.9 }}>
                Points Available
              </ThemedText>
            </View>
          </View>

          {/* Category Filters */}
          <View style={styles.filtersContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.filterChip,
                    {
                      backgroundColor: selectedCategory === category ? colors.primary : colors.surface,
                    },
                  ]}
                  onPress={() => setSelectedCategory(category)}
                >
                  <ThemedText
                    type="small"
                    style={{
                      color: selectedCategory === category ? '#FFFFFF' : colors.text,
                      fontWeight: '600',
                    }}
                  >
                    {category === 'all' ? 'All' : category.charAt(0).toUpperCase() + category.slice(1)}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Rewards List */}
          <View style={styles.rewardsSection}>
            <ThemedText type="h3" style={styles.sectionTitle}>
              Available Rewards
            </ThemedText>
            {filteredRewards.map((reward) => {
              const canAfford = points >= reward.pointsCost;
              return (
                <View
                  key={reward.id}
                  style={[
                    styles.rewardCard,
                    {
                      backgroundColor: colors.card,
                      opacity: reward.available ? 1 : 0.6,
                    },
                    createShadow(2, '#000', 0.1),
                  ]}
                >
                  <View style={styles.rewardHeader}>
                    <View
                      style={[
                        styles.rewardIcon,
                        { backgroundColor: reward.color + '20' },
                      ]}
                    >
                      <MaterialIcons name={reward.icon as any} size={24} color={reward.color} />
                    </View>
                    <View style={styles.rewardInfo}>
                      <ThemedText type="body" style={{ fontWeight: '600', color: colors.text }}>
                        {reward.name}
                      </ThemedText>
                      <ThemedText type="small" style={{ color: colors.icon, marginTop: Spacing.xs }}>
                        {reward.description}
                      </ThemedText>
                    </View>
                    <View style={styles.rewardCost}>
                      <MaterialIcons name="stars" size={20} color={colors.primary} />
                      <ThemedText type="body" style={{ fontWeight: '700', color: colors.primary, marginLeft: Spacing.xs }}>
                        {reward.pointsCost}
                      </ThemedText>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.redeemButton,
                      {
                        backgroundColor: canAfford ? colors.primary : colors.surface,
                        borderColor: canAfford ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => handleRedeem(reward)}
                    disabled={!canAfford || !reward.available}
                  >
                    <ThemedText
                      type="body"
                      style={{
                        color: canAfford ? '#FFFFFF' : colors.icon,
                        fontWeight: '600',
                      }}
                    >
                      {canAfford ? 'Redeem' : 'Insufficient Points'}
                    </ThemedText>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>

          {/* Points History */}
          {history.length > 0 && (
            <View style={styles.historySection}>
              <ThemedText type="h3" style={styles.sectionTitle}>
                Recent Activity
              </ThemedText>
              {history.map((transaction) => (
                <View
                  key={transaction.id}
                  style={[
                    styles.historyItem,
                    { backgroundColor: colors.card },
                    createShadow(1, '#000', 0.05),
                  ]}
                >
                  <View style={styles.historyLeft}>
                    <MaterialIcons
                      name={transaction.type === 'earned' ? 'add-circle' : 'remove-circle'}
                      size={24}
                      color={transaction.type === 'earned' ? colors.success : colors.danger}
                    />
                    <View style={styles.historyInfo}>
                      <ThemedText type="body" style={{ fontWeight: '600', color: colors.text }}>
                        {transaction.description}
                      </ThemedText>
                      <ThemedText type="small" style={{ color: colors.icon }}>
                        {format(transaction.createdAt, 'MMM dd, yyyy • HH:mm')}
                      </ThemedText>
                    </View>
                  </View>
                  <ThemedText
                    type="body"
                    style={{
                      fontWeight: '700',
                      color: transaction.type === 'earned' ? colors.success : colors.danger,
                    }}
                  >
                    {transaction.type === 'earned' ? '+' : '-'}{transaction.amount}
                  </ThemedText>
                </View>
              ))}
            </View>
          )}
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: 80,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  headerTitle: {
    fontWeight: '700',
    fontSize: 20,
  },
  pointsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  pointsInfo: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  filtersContainer: {
    marginBottom: Spacing.lg,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    marginRight: Spacing.sm,
  },
  rewardsSection: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontWeight: '700',
    marginBottom: Spacing.md,
  },
  rewardCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  rewardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  rewardIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  rewardInfo: {
    flex: 1,
  },
  rewardCost: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  redeemButton: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
  },
  historySection: {
    marginBottom: Spacing.lg,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  historyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  historyInfo: {
    marginLeft: Spacing.md,
    flex: 1,
  },
});


