/**
 * Drawer Menu Component
 * Mobile secondary navigation for all roles
 */

import { PEACELogo } from '@/app/components/peace-logo';
import { ThemedText } from '@/app/components/themed-text';
import { ThemedView } from '@/app/components/themed-view';
import { BorderRadius, Colors, Spacing } from '@/app/constants/theme';
import { useColorScheme } from '@/app/hooks/use-color-scheme';
import { UserRole } from '@/app/types';
import { createShadow } from '@/app/utils/platform-styles';
import { getRoleMetadata } from '@/lib/permissions';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Modal, Platform, StyleSheet, TouchableOpacity, View } from 'react-native';

interface DrawerItem {
  id: string;
  label: string;
  icon: keyof typeof MaterialIcons.glyphMap;
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
  { id: 'settings', label: 'Settings', icon: 'settings', route: '/profile-settings', section: 'main' },
  { id: 'help', label: 'Help & Support', icon: 'help-outline', route: '/help', section: 'main' },
  { id: 'privacy', label: 'Privacy Policy', icon: 'privacy-tip', route: '/privacy', section: 'main' },
  { id: 'feedback', label: 'Send Feedback', icon: 'feedback', route: '/feedback', section: 'main' },
  { id: 'about', label: 'About PEACE', icon: 'info', route: '/about', section: 'about' },
];

const ROLE_SPECIFIC_ITEMS: Record<string, DrawerItem[]> = {
  'peer-educator': [
    { id: 'dashboard', label: 'Peer Educator Dashboard', icon: 'dashboard', route: '/peer-educator/dashboard', section: 'role' },
    { id: 'meetings', label: 'Meetings', icon: 'event', route: '/meetings', section: 'role' },
    { id: 'club-info', label: 'Club Information', icon: 'groups', route: '/peer-educator/club-info', section: 'role' },
  ],
  'peer-educator-executive': [
    { id: 'dashboard', label: 'Executive Dashboard', icon: 'dashboard', route: '/peer-educator/dashboard', section: 'role' },
    { id: 'meetings', label: 'Manage Meetings', icon: 'event', route: '/meetings', section: 'role' },
    { id: 'club-info', label: 'Club Information', icon: 'groups', route: '/peer-educator/club-info', section: 'role' },
    { id: 'members', label: 'Manage Members', icon: 'people', route: '/peer-educator/members', section: 'role' },
  ],
  moderator: [
    { id: 'moderation', label: 'Moderation Queue', icon: 'security', route: '/admin/moderation', section: 'role' },
    { id: 'reports', label: 'Reports', icon: 'report-problem', route: '/admin/reports', section: 'role' },
  ],
  counselor: [
    { id: 'dashboard', label: 'Counselor Dashboard', icon: 'dashboard', route: '/counselor/dashboard', section: 'role' },
    { id: 'escalations', label: 'Escalations', icon: 'priority-high', route: '/counselor/escalations', section: 'role' },
  ],
  'life-coach': [
    { id: 'dashboard', label: 'Life Coach Dashboard', icon: 'dashboard', route: '/counselor/dashboard', section: 'role' },
    { id: 'escalations', label: 'Escalations', icon: 'priority-high', route: '/counselor/escalations', section: 'role' },
  ],
  admin: [
    { id: 'dashboard', label: 'Admin Dashboard', icon: 'dashboard', route: '/admin/dashboard', section: 'role' },
    { id: 'analytics', label: 'Analytics', icon: 'analytics', route: '/admin/analytics', section: 'role' },
    { id: 'moderation', label: 'Moderation', icon: 'security', route: '/admin/moderation', section: 'role' },
    { id: 'users', label: 'User Management', icon: 'people', route: '/admin/users', section: 'role' },
  ],
};

export function DrawerMenu({ visible, onClose, role }: DrawerMenuProps) {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  // Only show on mobile
  if (Platform.OS === 'web') {
    return null;
  }

  const roleItems = role ? ROLE_SPECIFIC_ITEMS[role] || [] : [];
  const allItems = [...roleItems, ...COMMON_ITEMS];

  const groupedItems = allItems.reduce((acc, item) => {
    const section = item.section || 'main';
    if (!acc[section]) acc[section] = [];
    acc[section].push(item);
    return acc;
  }, {} as Record<string, DrawerItem[]>);

  const handleNavigate = (item: DrawerItem) => {
    if (item.route) {
      router.push(item.route as any);
      onClose();
    } else if (item.onPress) {
      item.onPress();
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <ThemedView
          style={[styles.drawer, { backgroundColor: colors.surface }]}
          onStartShouldSetResponder={() => true}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerLogoSection}>
              <PEACELogo size={50} />
              <View>
                <ThemedText type="h3" style={[styles.title, { color: colors.text }]}>
                  PEACE
                </ThemedText>
                {role && (
                  <View style={[styles.roleBadge, { backgroundColor: getRoleMetadata(role as UserRole).accentColor + '20' }]}>
                    <ThemedText type="small" style={[styles.roleBadgeText, { color: getRoleMetadata(role as UserRole).accentColor }]}>
                      {getRoleMetadata(role as UserRole).label}
                    </ThemedText>
                  </View>
                )}
              </View>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.closeButton, { backgroundColor: colors.card }]}
            >
              <MaterialIcons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Navigation Items */}
          <View style={styles.content}>
            {Object.entries(groupedItems).map(([section, sectionItems]) => (
              <View key={section} style={styles.section}>
                {section !== 'main' && (
                  <ThemedText type="small" style={[styles.sectionLabel, { color: colors.icon }]}>
                    {section.toUpperCase()}
                  </ThemedText>
                )}
                {sectionItems.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => handleNavigate(item)}
                    style={[
                      styles.menuItem,
                      { backgroundColor: colors.card },
                      createShadow(1, '#000', 0.05),
                    ]}
                    activeOpacity={0.7}
                  >
                    <View style={styles.menuItemContent}>
                      <MaterialIcons
                        name={item.icon}
                        size={24}
                        color={item.danger ? colors.danger : colors.primary}
                      />
                      <ThemedText
                        type="body"
                        style={[
                          styles.menuItemLabel,
                          { color: item.danger ? colors.danger : colors.text },
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
                      <MaterialIcons
                        name="chevron-right"
                        size={20}
                        color={colors.icon}
                        style={styles.chevron}
                      />
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ))}
          </View>

          {/* Footer */}
          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            <ThemedText type="small" style={[styles.footerText, { color: colors.icon }]}>
              PEACE v1.0.0
            </ThemedText>
          </View>
        </ThemedView>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  drawer: {
    width: '85%',
    maxWidth: 400,
    height: '100%',
    alignSelf: 'flex-end',
    borderTopLeftRadius: BorderRadius.xl,
    borderBottomLeftRadius: BorderRadius.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
  },
  title: {
    fontWeight: '800',
    fontSize: 22,
    lineHeight: 24,
  },
  headerLogoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: Spacing.md,
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
  menuItem: {
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    overflow: 'hidden',
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.md,
  },
  menuItemLabel: {
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
  chevron: {
    marginLeft: 'auto',
  },
  footer: {
    padding: Spacing.md,
    borderTopWidth: 1,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    marginTop: 4,
  },
  roleBadgeText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 10,
    textTransform: 'uppercase',
  },
});
