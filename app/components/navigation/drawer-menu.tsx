/**
 * Premium Drawer Menu Component
 * Mobile secondary navigation with user profile and role-aware sections
 */

import { PEACELogo } from '@/app/components/peace-logo';
import { ThemedText } from '@/app/components/themed-text';
import { BorderRadius, Colors, PlatformStyles, Spacing } from '@/app/constants/theme';
import { useColorScheme } from '@/app/hooks/use-color-scheme';
import { UserRole } from '@/app/types';
import { signOut } from '@/lib/auth';
import { getCurrentUser } from '@/lib/database';
import { getRoleMetadata } from '@/lib/permissions';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Modal, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInRight, SlideInRight } from 'react-native-reanimated';

interface DrawerItem {
  id: string;
  label: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  route?: string;
  onPress?: () => void;
  badge?: number;
  section?: string;
  danger?: boolean;
}

interface DrawerMenuProps {
  visible: boolean;
  onClose: () => void;
  role?: string;
}

const COMMON_ITEMS: DrawerItem[] = [
  { id: 'settings', label: 'Settings', icon: 'cog-outline', route: '/profile-settings', section: 'main' },
  { id: 'help', label: 'Help & Support', icon: 'lifebuoy', route: '/help', section: 'main' },
  { id: 'privacy', label: 'Privacy Policy', icon: 'shield-lock-outline', route: '/privacy', section: 'main' },
  { id: 'feedback', label: 'Send Feedback', icon: 'message-text-outline', route: '/feedback', section: 'main' },
  { id: 'about', label: 'About PEACE', icon: 'information-outline', route: '/about', section: 'about' },
];

const ROLE_SPECIFIC_ITEMS: Record<string, DrawerItem[]> = {
  'peer-educator': [
    { id: 'dashboard', label: 'Educator Dashboard', icon: 'view-dashboard-outline', route: '/peer-educator/dashboard', section: 'role' },
    { id: 'meetings', label: 'Meetings', icon: 'calendar-clock', route: '/meetings', section: 'role' },
    { id: 'club-info', label: 'Club Info', icon: 'account-group-outline', route: '/peer-educator/club-info', section: 'role' },
  ],
  'peer-educator-executive': [
    { id: 'dashboard', label: 'Executive Dashboard', icon: 'view-dashboard-variant-outline', route: '/executive', section: 'role' },
    { id: 'meetings', label: 'Manage Meetings', icon: 'calendar-edit', route: '/executive/events', section: 'role' },
    { id: 'members', label: 'Manage Members', icon: 'account-multiple-outline', route: '/executive/members', section: 'role' },
    { id: 'edu-dashboard', label: 'Educator Dashboard', icon: 'view-dashboard-outline', route: '/peer-educator/dashboard', section: 'role' },
    { id: 'edu-queue', label: 'Support Queue', icon: 'account-group-outline', route: '/peer-educator/queue', section: 'role' },
    { id: 'edu-meetings', label: 'PE Meetings', icon: 'calendar-clock', route: '/meetings', section: 'role' },
  ],
  moderator: [
    { id: 'moderation', label: 'Moderation Queue', icon: 'shield-alert-outline', route: '/admin/moderation', section: 'role' },
    { id: 'reports', label: 'Reports', icon: 'flag-outline', route: '/admin/reports', section: 'role' },
  ],
  counselor: [
    { id: 'dashboard', label: 'Counselor Hub', icon: 'heart-pulse', route: '/counselor/dashboard', section: 'role' },
    { id: 'escalations', label: 'Escalations', icon: 'alert-circle-outline', route: '/counselor/escalations', section: 'role' },
  ],
  'life-coach': [
    { id: 'dashboard', label: 'Coach Dashboard', icon: 'hand-heart-outline', route: '/counselor/dashboard', section: 'role' },
  ],
  admin: [
    { id: 'dashboard', label: 'Admin Panel', icon: 'console', route: '/admin/dashboard', section: 'role' },
    { id: 'analytics', label: 'Analytics', icon: 'chart-box-outline', route: '/admin/analytics', section: 'role' },
    { id: 'users', label: 'User Management', icon: 'account-cog-outline', route: '/admin/users', section: 'role' },
  ],
};

export function DrawerMenu({ visible, onClose, role }: DrawerMenuProps) {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    if (visible) {
      loadUser();
    }
  }, [visible]);

  const loadUser = async () => {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    } catch (e) {
      console.error('Drawer: Failed to load user', e);
    }
  };

  if (Platform.OS === 'web') return null;

  const roleItems = role ? ROLE_SPECIFIC_ITEMS[role] || [] : [];
  const allItems = [...roleItems, ...COMMON_ITEMS];

  const groupedItems = allItems.reduce((acc, item) => {
    const section = item.section || 'main';
    if (!acc[section]) acc[section] = [];
    acc[section].push(item);
    return acc;
  }, {} as Record<string, DrawerItem[]>);

  const handleNavigate = (item: DrawerItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (item.route) {
      router.push(item.route as any);
      onClose();
    } else if (item.onPress) {
      item.onPress();
      onClose();
    }
  };

  const handleLogout = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/auth/login');
          onClose();
        },
      },
    ]);
  };

  const roleMeta = role ? getRoleMetadata(role as UserRole) : null;

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />

        <Animated.View
          entering={SlideInRight.duration(300)}
          style={[styles.drawer, { backgroundColor: colors.background }]}
        >
          {/* User Profile Header - Role-Colored */}
          <LinearGradient
            colors={roleMeta ? [roleMeta.accentColor, roleMeta.accentColor + 'CC'] : (colors.gradients.primary as any)}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.header}
          >
            <View style={styles.avatarContainer}>
              <MaterialCommunityIcons name="account-circle" size={60} color="rgba(255,255,255,0.9)" />
            </View>
            <ThemedText style={styles.userName}>{user?.pseudonym || 'Anonymous User'}</ThemedText>
            {roleMeta && (
              <View style={[styles.roleBadge, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                <ThemedText style={styles.roleText}>{roleMeta.label}</ThemedText>
              </View>
            )}
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <MaterialCommunityIcons name="close" size={24} color="#FFF" />
            </TouchableOpacity>
          </LinearGradient>

          {/* Navigation Items */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {Object.entries(groupedItems).map(([section, sectionItems]) => (
              <View key={section} style={styles.section}>
                {section !== 'main' && (
                  <ThemedText style={[styles.sectionLabel, { color: colors.icon }]}>
                    {section === 'role' ? 'YOUR TOOLS' : section.toUpperCase()}
                  </ThemedText>
                )}
                {sectionItems.map((item, idx) => (
                  <Animated.View key={item.id} entering={FadeInRight.delay(100 + idx * 50)}>
                    <TouchableOpacity
                      onPress={() => handleNavigate(item)}
                      style={[styles.menuItem, { backgroundColor: colors.card }]}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.iconBox, { backgroundColor: (item.danger ? colors.danger : colors.primary) + '15' }]}>
                        <MaterialCommunityIcons
                          name={item.icon}
                          size={22}
                          color={item.danger ? colors.danger : colors.primary}
                        />
                      </View>
                      <ThemedText
                        style={[styles.menuLabel, { color: item.danger ? colors.danger : colors.text }]}
                      >
                        {item.label}
                      </ThemedText>
                      {item.badge && item.badge > 0 && (
                        <View style={[styles.badge, { backgroundColor: colors.danger }]}>
                          <ThemedText style={styles.badgeText}>{item.badge > 99 ? '99+' : item.badge}</ThemedText>
                        </View>
                      )}
                      <MaterialCommunityIcons name="chevron-right" size={20} color={colors.icon} />
                    </TouchableOpacity>
                  </Animated.View>
                ))}
              </View>
            ))}

            {/* Logout Button */}
            <TouchableOpacity onPress={handleLogout} style={[styles.logoutBtn, { borderColor: colors.danger + '30' }]}>
              <MaterialCommunityIcons name="logout" size={20} color={colors.danger} />
              <ThemedText style={[styles.logoutText, { color: colors.danger }]}>Sign Out</ThemedText>
            </TouchableOpacity>

            <View style={{ height: 40 }} />
          </ScrollView>

          {/* Footer */}
          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            <PEACELogo size={24} />
            <ThemedText style={[styles.footerText, { color: colors.icon }]}>PEACE v1.0.0</ThemedText>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  drawer: {
    width: '80%',
    maxWidth: 320,
    height: '100%',
    ...PlatformStyles.premiumShadow,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    position: 'relative',
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  userName: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
  roleBadge: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  closeBtn: {
    position: 'absolute',
    top: 50,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: Spacing.md,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: Spacing.sm,
    marginLeft: Spacing.sm,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.xs,
    gap: Spacing.md,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    marginTop: Spacing.lg,
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  logoutText: {
    fontWeight: '600',
    fontSize: 15,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
  },
  footerText: {
    fontSize: 12,
  },
});
