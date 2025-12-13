/**
 * Profile Settings Screen
 */

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedView } from '@/app/components/themed-view';
import { ThemedText } from '@/app/components/themed-text';
import { Ionicons } from '@expo/vector-icons';
import { getPseudonym } from '@/app/utils/storage';
import { useColorScheme } from '@/app/hooks/use-color-scheme';
import { Colors, Spacing, BorderRadius } from '@/app/constants/theme';
import { getCursorStyle, createShadow } from '@/app/utils/platform-styles';

export default function ProfileSettingsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const [userName, setUserName] = useState('Alex');
  const [isAnonymous, setIsAnonymous] = useState(false);

  useEffect(() => {
    loadUserInfo();
  }, []);

  const loadUserInfo = async () => {
    const pseudonym = await getPseudonym();
    if (pseudonym) {
      setUserName(pseudonym.split(/(?=[A-Z])/)[0] || 'Student');
    }
  };

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: () => {
          // Handle logout
          router.replace('/onboarding');
        },
      },
    ]);
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={[styles.avatar, { backgroundColor: '#FFA500' }]}>
            <ThemedText type="h2" style={{ color: '#FFFFFF' }}>
              {userName[0]?.toUpperCase() || 'A'}
            </ThemedText>
          </View>
          <ThemedText type="h2" style={styles.userName}>
            {userName}
          </ThemedText>
          <ThemedText type="caption" style={styles.userRole}>
            Student at Chinhoyi University of Technology
          </ThemedText>
        </View>

        {/* Anonymous Toggle Card */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card },
            createShadow(2, '#000', 0.1),
          ]}
        >
          <View style={styles.cardContent}>
            <View style={styles.cardText}>
              <ThemedText type="body" style={styles.cardTitle}>
                Go Anonymous
              </ThemedText>
              <ThemedText type="small" style={styles.cardDescription}>
                Your name and profile picture will be hidden from others
              </ThemedText>
            </View>
            <Switch
              value={isAnonymous}
              onValueChange={setIsAnonymous}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Settings Options */}
        <View style={styles.settingsSection}>
          <TouchableOpacity
            style={[
              styles.settingItem,
              { backgroundColor: colors.card },
              createShadow(1, '#000', 0.05),
            ]}
            onPress={() => Alert.alert('Account Information', 'Feature coming soon')}
            activeOpacity={0.7}
          >
            <Ionicons name="person-outline" size={24} color={colors.text} />
            <ThemedText type="body" style={styles.settingText}>
              Account Information
            </ThemedText>
            <Ionicons name="chevron-forward" size={20} color={colors.icon} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.settingItem,
              { backgroundColor: colors.card },
              createShadow(1, '#000', 0.05),
            ]}
            onPress={() => Alert.alert('Notifications', 'Feature coming soon')}
            activeOpacity={0.7}
          >
            <Ionicons name="notifications-outline" size={24} color={colors.text} />
            <ThemedText type="body" style={styles.settingText}>
              Notifications
            </ThemedText>
            <Ionicons name="chevron-forward" size={20} color={colors.icon} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.settingItem,
              { backgroundColor: colors.card },
              createShadow(1, '#000', 0.05),
            ]}
            onPress={() => Alert.alert('Privacy Policy', 'Feature coming soon')}
            activeOpacity={0.7}
          >
            <Ionicons name="lock-closed-outline" size={24} color={colors.text} />
            <ThemedText type="body" style={styles.settingText}>
              Privacy Policy
            </ThemedText>
            <Ionicons name="chevron-forward" size={20} color={colors.icon} />
          </TouchableOpacity>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsSection}>
          <TouchableOpacity
            style={[
              styles.saveButton,
              { backgroundColor: colors.primary },
              createShadow(3, colors.primary, 0.3),
            ]}
            onPress={() => Alert.alert('Saved', 'Your changes have been saved.')}
            activeOpacity={0.8}
          >
            <ThemedText type="body" style={[styles.saveButtonText, { color: '#FFFFFF' }]}>
              Save Changes
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <ThemedText type="body" style={[styles.logoutText, { color: colors.danger }]}>
              Log Out
            </ThemedText>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  userName: {
    marginBottom: Spacing.xs,
    fontWeight: '700',
  },
  userRole: {
    opacity: 0.7,
  },
  card: {
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardText: {
    flex: 1,
    marginRight: Spacing.md,
  },
  cardTitle: {
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  cardDescription: {
    opacity: 0.7,
  },
  settingsSection: {
    marginBottom: Spacing.lg,
    gap: Spacing.md,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.md,
  },
  settingText: {
    flex: 1,
    fontWeight: '500',
  },
  actionsSection: {
    marginTop: Spacing.md,
    marginBottom: Spacing.xl,
  },
  saveButton: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  saveButtonText: {
    fontWeight: '600',
  },
  logoutButton: {
    padding: Spacing.md,
    alignItems: 'center',
  },
  logoutText: {
    fontWeight: '600',
  },
});




