/**
 * Drawer Menu Component
 * Mobile sidebar menu for navigation
 */

import React from 'react';
import {
  Modal,
  StyleSheet,
  TouchableOpacity,
  View,
  ScrollView,
  Platform,
  Dimensions,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { UserRole } from '@/types';
import { PEACELogo } from '@/components/peace-logo';
import * as Haptics from 'expo-haptics';

interface DrawerMenuProps {
  visible: boolean;
  onClose: () => void;
  role?: UserRole;
}

const { width } = Dimensions.get('window');
const DRAWER_WIDTH = width * 0.8;

export function DrawerMenu({ visible, onClose, role }: DrawerMenuProps) {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const handleNavigate = (route: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
    router.push(route as any);
  };

  const menuItems = [
    { label: 'Home', icon: 'home', route: '/(tabs)' },
    { label: 'My Badges', icon: 'emoji-events', route: '/badges' },
    { label: 'Rewards Shop', icon: 'shopping-bag', route: '/rewards-shop' },
    { label: 'Notifications', icon: 'notifications', route: '/notifications' },
    { label: 'Profile Settings', icon: 'settings', route: '/profile-settings' },
    { label: 'Help & Support', icon: 'help', route: '/help' },
    { label: 'About PEACE', icon: 'info-outline', route: '/about' },
    { label: 'Privacy Policy', icon: 'security', route: '/privacy' },
    { label: 'Feedback', icon: 'feedback', route: '/feedback' },
  ];

  // Role-based items
  if (role === 'admin') {
    menuItems.unshift({ label: 'Admin Dashboard', icon: 'admin-panel-settings', route: '/admin/dashboard' });
  } else if (role === 'student-affairs') {
    menuItems.unshift({ label: 'Staff Dashboard', icon: 'dashboard', route: '/student-affairs/dashboard' });
  } else if (role === 'peer-educator' || role === 'peer-educator-executive') {
    menuItems.unshift({ label: 'Educator Dashboard', icon: 'school', route: '/peer-educator/dashboard' });
  }

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        
        <ThemedView style={[styles.drawer, { backgroundColor: colors.background }]}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.logoRow}>
              <PEACELogo size={32} />
              <ThemedText type="h2" style={[styles.logoText, { color: colors.text }]}>PEACE</ThemedText>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <MaterialIcons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.menuSection}>
              {menuItems.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.menuItem}
                  onPress={() => handleNavigate(item.route)}
                >
                  <MaterialIcons name={item.icon as any} size={24} color={colors.primary} />
                  <ThemedText type="body" style={styles.menuLabel}>{item.label}</ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            <ThemedText type="small" style={{ color: colors.icon }}>Version 1.1.0</ThemedText>
          </View>
        </ThemedView>
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
    width: DRAWER_WIDTH,
    height: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    paddingTop: Platform.OS === 'ios' ? 60 : Spacing.lg,
    borderBottomWidth: 1,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  logoText: {
    fontWeight: '800',
    fontSize: 20,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  scrollContent: {
    flex: 1,
  },
  menuSection: {
    paddingVertical: Spacing.md,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    marginHorizontal: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xs,
    gap: Spacing.md,
  },
  menuLabel: {
    fontWeight: '600',
  },
  footer: {
    padding: Spacing.lg,
    borderTopWidth: 1,
    alignItems: 'center',
  },
});
