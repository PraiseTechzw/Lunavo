/**
 * Web Header Component
 * Modern top navigation bar for web interface
 */

import { ThemedText } from '@/app/components/themed-text';
import { ThemedView } from '@/app/components/themed-view';
import { BorderRadius, Colors, Spacing } from '@/app/constants/theme';
import { useColorScheme } from '@/app/hooks/use-color-scheme';
import { createShadow, getCursorStyle } from '@/app/utils/platform-styles';
import { getCurrentUser } from '@/lib/database';
import { MaterialIcons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, Platform, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

export interface WebHeaderProps {
  showSearch?: boolean;
  onSearchChange?: (query: string) => void;
  searchPlaceholder?: string;
  rightActions?: React.ReactNode;
}

export function WebHeader({ 
  showSearch = false, 
  onSearchChange,
  searchPlaceholder = 'Search...',
  rightActions 
}: WebHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const [user, setUser] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error('Error loading user:', error);
    }
  };

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    onSearchChange?.(text);
  };

  if (Platform.OS !== 'web') {
    return null;
  }

  return (
    <ThemedView 
      style={[
        styles.header, 
        { 
          backgroundColor: colors.surface,
          borderBottomColor: colors.border,
        }
      ]}
    >
      <View style={styles.headerContent}>
        {/* Logo/Brand */}
        <TouchableOpacity
          onPress={() => router.push('/(tabs)' as any)}
          style={styles.logoContainer}
        >
          <Image
            // Note: To use logo.png instead, add it to assets/images/logo.png and change path to:
            // source={require('@/assets/images/logo.png')}
            source={require('@/assets/images/icon.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <ThemedText type="h3" style={[styles.logoText, { color: colors.text }]}>
            Lunavo
          </ThemedText>
        </TouchableOpacity>

        {/* Search Bar */}
        {showSearch && (
          <View style={[styles.searchContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <MaterialIcons name="search" size={20} color={colors.icon} />
            <TextInput
              placeholder={searchPlaceholder}
              placeholderTextColor={colors.icon}
              value={searchQuery}
              onChangeText={handleSearchChange}
              style={[
                styles.searchInput,
                { 
                  color: colors.text,
                }
              ]}
            />
            {searchQuery && (
              <TouchableOpacity
                onPress={() => handleSearchChange('')}
                style={styles.clearButton}
              >
                <MaterialIcons name="close" size={18} color={colors.icon} />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Right Actions */}
        <View style={styles.rightActions}>
          {rightActions || (
            <>
              {/* Notifications */}
              <TouchableOpacity
                onPress={() => router.push('/notifications' as any)}
                style={[styles.actionButton, { backgroundColor: colors.card }]}
              >
                <MaterialIcons name="notifications-none" size={24} color={colors.icon} />
                {/* Badge can be added here */}
              </TouchableOpacity>

              {/* Profile */}
              <TouchableOpacity
                onPress={() => router.push('/(tabs)/profile' as any)}
                style={[styles.profileButton, { backgroundColor: colors.card }]}
              >
                {user?.avatar_url ? (
                  <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
                    <ThemedText type="body" style={styles.avatarText}>
                      {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                    </ThemedText>
                  </View>
                ) : (
                  <MaterialIcons name="person" size={24} color={colors.primary} />
                )}
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 70,
    borderBottomWidth: 1,
    width: '100%',
    ...(Platform.OS === 'web' ? {
      position: 'fixed' as any,
      top: 0,
      left: 0,
      right: 0,
      zIndex: 1000,
    } : {}),
    ...createShadow(2, '#000', 0.08),
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    height: '100%',
    maxWidth: 1920,
    width: '100%',
    alignSelf: 'center',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    ...getCursorStyle(),
  },
  logoImage: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.sm,
  },
  logoText: {
    fontWeight: '700',
    fontSize: 22,
    letterSpacing: -0.5,
  },
  searchContainer: {
    flex: 1,
    maxWidth: 500,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    border: 'none',
    outline: 'none',
    padding: 0,
    fontFamily: 'inherit',
  },
  clearButton: {
    padding: Spacing.xs,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    ...getCursorStyle(),
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    ...getCursorStyle(),
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
});
