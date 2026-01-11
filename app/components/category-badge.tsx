/**
 * Category badge component for displaying post categories
 */

import { CATEGORIES } from '@/app/constants/categories';
import { BorderRadius, Colors, Spacing } from '@/app/constants/theme';
import { useColorScheme } from '@/app/hooks/use-color-scheme';
import { PostCategory } from '@/app/types';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface CategoryBadgeProps {
  category: PostCategory;
  onPress?: () => void;
  size?: 'small' | 'medium' | 'large';
}

export function CategoryBadge({ category, onPress, size = 'medium' }: CategoryBadgeProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const categoryData = CATEGORIES[category];
  const colors = Colors[colorScheme];

  const sizeStyles = {
    small: { padding: Spacing.xs, fontSize: 10 },
    medium: { padding: Spacing.sm, fontSize: 12 },
    large: { padding: Spacing.md, fontSize: 14 },
  };

  const iconSize = size === 'small' ? 12 : size === 'medium' ? 14 : 16;

  const content = (
    <View style={[styles.container, { backgroundColor: (categoryData?.color || colors.primary) + '20' }]}>
      <Ionicons name={(categoryData?.icon || 'help-circle-outline') as any} size={iconSize} color={categoryData?.color || colors.primary} />
      <Text
        style={[
          styles.text,
          { color: categoryData?.color || colors.primary, fontSize: sizeStyles[size].fontSize },
        ]}
      >
        {categoryData?.name || category}
      </Text>
    </View>
  );

  if (onPress) {
    return <TouchableOpacity onPress={onPress}>{content}</TouchableOpacity>;
  }

  return content;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    gap: Spacing.xs,
  },
  text: {
    fontWeight: '600',
  },
});

