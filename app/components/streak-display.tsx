/**
 * Streak Display Component - Visualizes user streaks
 */

import { View, StyleSheet } from 'react-native';
import { ThemedText } from '@/app/components/themed-text';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius } from '@/app/constants/theme';
import { useColorScheme } from '@/app/hooks/use-color-scheme';

interface StreakDisplayProps {
  current: number;
  longest: number;
  type: 'check-in' | 'helping' | 'engagement';
  size?: 'small' | 'medium' | 'large';
}

export function StreakDisplay({ current, longest, type, size = 'medium' }: StreakDisplayProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const getStreakLabel = () => {
    switch (type) {
      case 'check-in':
        return 'Check-in';
      case 'helping':
        return 'Helping';
      case 'engagement':
        return 'Engagement';
    }
  };

  const getStreakColor = () => {
    if (current >= 30) return '#DC2626'; // Red for high streaks
    if (current >= 14) return '#F59E0B'; // Orange
    if (current >= 7) return '#3B82F6'; // Blue
    return colors.primary;
  };

  const iconSize = size === 'small' ? 16 : size === 'large' ? 32 : 24;
  const textSize = size === 'small' ? 'small' : size === 'large' ? 'h3' : 'body';

  return (
    <View style={styles.container}>
      <View style={styles.streakRow}>
        <MaterialIcons name="local-fire-department" size={iconSize} color={getStreakColor()} />
        <View style={styles.streakInfo}>
          <ThemedText type={textSize} style={{ fontWeight: '700', color: colors.text }}>
            {current} days
          </ThemedText>
          <ThemedText type="small" style={{ color: colors.icon }}>
            {getStreakLabel()} Streak
          </ThemedText>
        </View>
      </View>
      {longest > current && (
        <View style={styles.longestRow}>
          <ThemedText type="small" style={{ color: colors.icon }}>
            Best: {longest} days
          </ThemedText>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  streakInfo: {
    gap: 2,
  },
  longestRow: {
    marginLeft: Spacing.sm,
  },
});


