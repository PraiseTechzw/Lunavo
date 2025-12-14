/**
 * Web Top Navigation Component
 * Horizontal navigation bar for web (replaces bottom tabs)
 */

import { ThemedText } from '@/app/components/themed-text';
import { BorderRadius, Colors, Spacing } from '@/app/constants/theme';
import { useColorScheme } from '@/app/hooks/use-color-scheme';
import { getCursorStyle } from '@/app/utils/platform-styles';
import { getCurrentUser } from '@/lib/database';
import { UserRole } from '@/lib/permissions';
import { MaterialIcons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform, StyleSheet, TouchableOpacity, View } from 'react-native';

interface NavItem {
  id: string;
  label: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  route: string;
  badge?: number;
}

export function WebTopNav() {
  const router = useRouter();
  const pathname = usePathname();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const [userRole, setUserRole] = useState<UserRole | null>(null);

  useEffect(() => {
    loadUserRole();
  }, []);

  const loadUserRole = async () => {
    try {
      const user = await getCurrentUser();
      if (user) {
        setUserRole(user.role as UserRole);
      }
    } catch (error) {
      console.error('Error loading user role:', error);
    }
  };

  if (Platform.OS !== 'web') {
    return null;
  }

  // Determine which tabs to show based on role
  const getNavItems = (): NavItem[] => {
    const allItems: NavItem[] = [
      { id: 'home', label: 'Home', icon: 'home', route: '/(tabs)' },
      { id: 'forum', label: 'Forum', icon: 'forum', route: '/(tabs)/forum' },
      { id: 'chat', label: 'Chat', icon: 'chat', route: '/(tabs)/chat' },
      { id: 'resources', label: 'Resources', icon: 'book', route: '/(tabs)/resources' },
      { id: 'profile', label: 'Profile', icon: 'person', route: '/(tabs)/profile' },
    ];

    if (!userRole) return allItems;

    // Filter based on role
    return allItems.filter((item) => {
      // Counselors and Life Coaches should not see Forum
      if (item.id === 'forum' && (userRole === 'counselor' || userRole === 'life-coach')) {
        return false;
      }

      // Student Affairs should not see Forum or Chat
      if ((item.id === 'forum' || item.id === 'chat') && userRole === 'student-affairs') {
        return false;
      }

      return true;
    });
  };

  const navItems = getNavItems();

  const isActive = (route: string) => {
    if (route === '/(tabs)') {
      return pathname === '/(tabs)' || pathname === '/(tabs)/';
    }
    return pathname?.startsWith(route);
  };

  const handleNavigate = (route: string) => {
    router.push(route as any);
  };

  return (
    <View 
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderBottomColor: colors.border,
        }
      ]}
    >
      <View style={styles.navContent}>
        {navItems.map((item) => {
          const active = isActive(item.route);
          return (
            <TouchableOpacity
              key={item.id}
              onPress={() => handleNavigate(item.route)}
              style={[
                styles.navItem,
                active && {
                  backgroundColor: colors.primary + '15',
                  borderBottomColor: colors.primary,
                },
              ]}
              activeOpacity={0.7}
            >
              <MaterialIcons
                name={item.icon}
                size={22}
                color={active ? colors.primary : colors.icon}
              />
              <ThemedText
                type="body"
                style={[
                  styles.navItemLabel,
                  {
                    color: active ? colors.primary : colors.text,
                    fontWeight: active ? '600' : '500',
                  },
                ]}
              >
                {item.label}
              </ThemedText>
              {item.badge && item.badge > 0 && (
                <View style={[styles.badge, { backgroundColor: colors.danger }]}>
                  <ThemedText type="small" style={styles.badgeText}>
                    {item.badge > 99 ? '99+' : item.badge}
                  </ThemedText>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 56,
    borderBottomWidth: 1,
    ...(Platform.OS === 'web' ? {
      position: 'fixed' as any,
      top: 70, // Below header
      left: 0,
      right: 0,
      zIndex: 998,
    } : {}),
  },
  navContent: {
    flexDirection: 'row',
    alignItems: 'center',
    height: '100%',
    maxWidth: 1400,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.xs,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    gap: Spacing.sm,
    ...getCursorStyle(),
    transition: 'all 0.2s ease',
  },
  navItemLabel: {
    fontSize: 14,
  },
  badge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    marginLeft: Spacing.xs,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
});


