/**
 * Drawer Header Component
 * Header with drawer menu button for mobile screens
 */

import { PEACELogo } from '@/app/components/peace-logo';
import { ThemedText } from '@/app/components/themed-text';
import { Colors, Spacing } from '@/app/constants/theme';
import { useColorScheme } from '@/app/hooks/use-color-scheme';
import { MaterialIcons } from '@expo/vector-icons';
import { Platform, StyleSheet, TouchableOpacity, View } from 'react-native';

interface DrawerHeaderProps {
  title: string;
  onMenuPress: () => void;
  rightAction?: {
    icon: keyof typeof MaterialIcons.glyphMap;
    onPress: () => void;
  };
}

export function DrawerHeader({ title, onMenuPress, rightAction }: DrawerHeaderProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  // Only show on mobile
  if (Platform.OS === 'web') {
    return null;
  }

  return (
    <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
      <TouchableOpacity
        onPress={onMenuPress}
        style={styles.menuButton}
        activeOpacity={0.7}
      >
        <MaterialIcons name="menu" size={24} color={colors.text} />
      </TouchableOpacity>

      <View style={styles.titleContainer}>
        <PEACELogo size={24} />
        <ThemedText type="h2" style={[styles.title, { color: colors.text }]}>
          {title}
        </ThemedText>
      </View>

      {rightAction ? (
        <TouchableOpacity
          onPress={rightAction.onPress}
          style={styles.actionButton}
          activeOpacity={0.7}
        >
          <MaterialIcons name={rightAction.icon} size={24} color={colors.text} />
        </TouchableOpacity>
      ) : (
        <View style={styles.placeholder} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    height: 60,
  },
  menuButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start', // Align left
    gap: Spacing.xs,
    marginLeft: Spacing.sm, // Add space from menu button
  },
  title: {
    fontWeight: '700',
    fontSize: 18, // Slightly smaller to fit names
  },
  actionButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholder: {
    width: 40,
  },
});
