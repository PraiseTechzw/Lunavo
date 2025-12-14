/**
 * Web Card Component
 * Enhanced card component optimized for web with hover effects
 */

import { ThemedView } from '@/app/components/themed-view';
import { BorderRadius, Colors, Spacing } from '@/app/constants/theme';
import { useColorScheme } from '@/app/hooks/use-color-scheme';
import { createShadow, getCursorStyle } from '@/app/utils/platform-styles';
import { Platform, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';

export interface WebCardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  hoverable?: boolean;
  padding?: number;
  elevated?: boolean;
}

export function WebCard({ 
  children, 
  onPress,
  style,
  hoverable = false,
  padding = Spacing.lg,
  elevated = true 
}: WebCardProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const cardStyle = [
    styles.card,
    {
      backgroundColor: colors.card,
      padding,
    },
    elevated && createShadow(2, '#000', 0.1),
    hoverable && onPress && getCursorStyle(),
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.8}
        style={cardStyle}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <ThemedView style={cardStyle}>
      {children}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    ...(Platform.OS === 'web' ? {
      transition: 'all 0.2s ease',
      ':hover': {
        transform: 'translateY(-2px)',
        boxShadow: '0 8px 16px rgba(0, 0, 0, 0.12)',
      },
    } : {}),
  },
});


