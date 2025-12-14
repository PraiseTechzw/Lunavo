/**
 * Category badge component for displaying post categories
 */

import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PostCategory } from '@/types';
import { CATEGORIES } from '@/constants/categories';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';

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
    <View style={[styles.container, { backgroundColor: categoryData.color + '20' }]}>
      <Ionicons name={categoryData.icon as any} size={iconSize} color={categoryData.color} />
      <Text
        style={[
          styles.text,
          { color: categoryData.color, fontSize: sizeStyles[size].fontSize },
        ]}
      >
        {categoryData.name}
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

