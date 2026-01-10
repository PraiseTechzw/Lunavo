/**
 * Sidebar Navigation Component
 * Web-optimized sidebar for Admin and Student Affairs
 */

import { ThemedText } from '@/app/components/themed-text';
import { ThemedView } from '@/app/components/themed-view';
import { BorderRadius, Colors, Spacing } from '@/app/constants/theme';
import { useColorScheme } from '@/app/hooks/use-color-scheme';
import { getRoleLabel, UserRole } from '@/lib/permissions';
import { MaterialIcons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import { useState } from 'react';
import { Dimensions, Platform, StyleSheet, TouchableOpacity, View } from 'react-native';

const { width } = Dimensions.get('window');
const isDesktop = Platform.OS === 'web' && width >= 1024;

interface SidebarItem {
  id: string;
  label: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  route: string;
  badge?: number;
  section?: string;
}

interface SidebarNavigationProps {
  role: UserRole;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

const ADMIN_ITEMS: SidebarItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', route: '/admin/dashboard', section: 'main' },
  { id: 'analytics', label: 'Analytics', icon: 'analytics', route: '/admin/analytics', section: 'main' },
  { id: 'moderation', label: 'Moderation', icon: 'security', route: '/admin/moderation', section: 'main' },
  { id: 'escalations', label: 'Escalations', icon: 'priority-high', route: '/admin/escalations', section: 'main' },
  { id: 'reports', label: 'Reports', icon: 'report-problem', route: '/admin/reports', section: 'main' },
  { id: 'users', label: 'Users', icon: 'people', route: '/admin/users', section: 'management' },
  { id: 'resources', label: 'Resources', icon: 'book', route: '/(tabs)/resources', section: 'management' },
  { id: 'settings', label: 'Settings', icon: 'settings', route: '/profile-settings', section: 'settings' },
];

const STUDENT_AFFAIRS_ITEMS: SidebarItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', route: '/student-affairs/dashboard', section: 'main' },
  { id: 'analytics', label: 'Analytics', icon: 'analytics', route: '/student-affairs/analytics', section: 'main' },
  { id: 'trends', label: 'Trends', icon: 'trending-up', route: '/student-affairs/trends', section: 'main' },
  { id: 'resources', label: 'Resources', icon: 'book', route: '/(tabs)/resources', section: 'management' },
  { id: 'settings', label: 'Settings', icon: 'settings', route: '/profile-settings', section: 'settings' },
];

export function SidebarNavigation({ role, collapsed = false, onToggleCollapse }: SidebarNavigationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const [isCollapsed, setIsCollapsed] = useState(collapsed);

  const items = role === 'admin' ? ADMIN_ITEMS : STUDENT_AFFAIRS_ITEMS;
  const groupedItems = items.reduce((acc, item) => {
    const section = item.section || 'main';
    if (!acc[section]) acc[section] = [];
    acc[section].push(item);
    return acc;
  }, {} as Record<string, SidebarItem[]>);

  const handleToggle = () => {
    setIsCollapsed(!isCollapsed);
    onToggleCollapse?.();
  };

  const handleNavigate = (route: string) => {
    router.push(route as any);
  };

  const isActive = (route: string) => {
    return pathname?.startsWith(route);
  };

  if (Platform.OS !== 'web') {
    return null; // Sidebar only on web
  }

  return (
    <ThemedView style={[styles.sidebar as any, { backgroundColor: colors.surface, borderRightColor: colors.border }]}>
      {/* Header */}
      <View style={styles.header}>
        {!isCollapsed && (
          <View>
            <ThemedText type="h3" style={[styles.logo, { color: colors.text }]}>
              PEACE
            </ThemedText>
            <ThemedText type="small" style={[styles.roleLabel, { color: colors.primary }]}>
              {getRoleLabel(role)}
            </ThemedText>
          </View>
        )}
        <TouchableOpacity
          onPress={handleToggle}
          style={[styles.toggleButton, { backgroundColor: colors.card }]}
        >
          <MaterialIcons
            name={isCollapsed ? 'chevron-right' : 'chevron-left'}
            size={20}
            color={colors.text}
          />
        </TouchableOpacity>
      </View>

      {/* Navigation Items */}
      <View style={styles.navContent}>
        {Object.entries(groupedItems).map(([section, sectionItems]) => (
          <View key={section} style={styles.section}>
            {!isCollapsed && section !== 'main' && (
              <ThemedText type="small" style={[styles.sectionLabel, { color: colors.icon }]}>
                {section.toUpperCase()}
              </ThemedText>
            )}
            {sectionItems.map((item) => {
              const active = isActive(item.route);
              return (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => handleNavigate(item.route)}
                  style={[
                    styles.navItem,
                    active && { backgroundColor: colors.primary + '15' },
                    isCollapsed && styles.navItemCollapsed,
                  ]}
                  activeOpacity={0.7}
                >
                  <View style={styles.navItemContent}>
                    <MaterialIcons
                      name={item.icon}
                      size={24}
                      color={active ? colors.primary : colors.icon}
                    />
                    {!isCollapsed && (
                      <>
                        <ThemedText
                          type="body"
                          style={[
                            styles.navItemLabel as any,
                            { color: active ? colors.primary : colors.text },
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
                      </>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          onPress={() => router.push('/(tabs)/profile' as any)}
          style={[styles.profileButton, { backgroundColor: colors.card }]}
        >
          <MaterialIcons name="person" size={24} color={colors.primary} />
          {!isCollapsed && (
            <ThemedText type="body" style={[styles.profileText, { color: colors.text }]}>
              Profile
            </ThemedText>
          )}
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    width: 280,
    ...(Platform.OS === 'web' ? {
      height: '100vh',
      position: 'fixed',
    } as any : {
      height: '100%',
    }),
    borderRightWidth: 1,
    flexDirection: 'column',
    left: 0,
    top: 0,
    zIndex: 100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  logo: {
    fontWeight: '700',
    fontSize: 20,
  },
  roleLabel: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  toggleButton: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navContent: {
    flex: 1,
    padding: Spacing.md,
    overflowY: 'auto',
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  navItem: {
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xs,
    overflow: 'hidden',
  },
  navItemCollapsed: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  navItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.md,
  },
  navItemLabel: {
    flex: 1,
    fontWeight: '500',
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  footer: {
    padding: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  profileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.md,
  },
  profileText: {
    fontWeight: '500',
  },
});
