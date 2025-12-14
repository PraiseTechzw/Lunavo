/**
 * Floating Action Button (FAB)
 * Primary action button for mobile
 */

import { ThemedText } from '@/app/components/themed-text';
import { BorderRadius, Colors, Spacing } from '@/app/constants/theme';
import { useColorScheme } from '@/app/hooks/use-color-scheme';
import { createShadow } from '@/app/utils/platform-styles';
import { MaterialIcons } from '@expo/vector-icons';
import { Platform, StyleSheet, TouchableOpacity, View } from 'react-native';

interface FABProps {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  onPress: () => void;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  color?: string;
}

export function FAB({ icon, label, onPress, position = 'bottom-right', color }: FABProps) {
  // Export as both named and default for flexibility
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const fabColor = color || colors.primary;

  // Only show on mobile
  if (Platform.OS === 'web') {
    return null;
  }

  const positionStyles = {
    'bottom-right': { bottom: 20, right: 20 },
    'bottom-left': { bottom: 20, left: 20 },
    'top-right': { top: 20, right: 20 },
    'top-left': { top: 20, left: 20 },
  };

  return (
    <TouchableOpacity
      style={[
        styles.fab,
        { backgroundColor: fabColor },
        positionStyles[position],
        createShadow(8, fabColor, 0.3),
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <MaterialIcons name={icon} size={28} color="#FFFFFF" />
      <View style={styles.labelContainer}>
        <ThemedText type="small" style={styles.label}>
          {label}
        </ThemedText>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    zIndex: 1000,
  },
  labelContainer: {
    position: 'absolute',
    bottom: -30,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  label: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
});

