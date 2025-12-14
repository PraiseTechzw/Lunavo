/**
 * Profile Settings Screen
 */

import { ThemedText } from '@/app/components/themed-text';
import { ThemedView } from '@/app/components/themed-view';
import { WebCard, WebContainer } from '@/app/components/web';
import { BorderRadius, Colors, Spacing } from '@/app/constants/theme';
import { useColorScheme } from '@/app/hooks/use-color-scheme';
import { createShadow, getCursorStyle } from '@/app/utils/platform-styles';
import { getPseudonym } from '@/app/utils/storage';
import { signOut } from '@/lib/auth';
import { getCurrentUser } from '@/lib/database';
import { UserRole } from '@/lib/permissions';
import { supabase } from '@/lib/supabase';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  Dimensions,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  TouchableOpacity,
  View,
} from 'react-native';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

export default function ProfileSettingsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const [userName, setUserName] = useState('User');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [userEmail, setUserEmail] = useState<string>('');
  const isStudentAffairs = userRole === 'student-affairs' || userRole === 'admin';

  useEffect(() => {
    loadUserInfo();
  }, []);

  const loadUserInfo = async () => {
    try {
      const user = await getCurrentUser();
      if (user) {
        setUserRole(user.role as UserRole);
        setIsAnonymous(user.isAnonymous);
        
        // Get email from auth user
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser?.email) {
          setUserEmail(authUser.email);
        }
        
        // Set display name
        const pseudonym = await getPseudonym();
        if (pseudonym) {
          setUserName(pseudonym.split(/(?=[A-Z])/)[0] || user.pseudonym || 'User');
        } else if (user.username) {
          setUserName(user.username);
        } else if (user.pseudonym) {
          setUserName(user.pseudonym);
        }
      }
    } catch (error) {
      console.error('Error loading user info:', error);
    }
  };

  const handleLogout = async () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut();
            router.replace('/auth/login');
          } catch (error) {
            console.error('Error signing out:', error);
            router.replace('/auth/login');
          }
        },
      },
    ]);
  };

  const content = (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Page Header - Web optimized */}
      {(isWeb && isStudentAffairs) && (
        <View style={styles.pageHeader}>
          <ThemedText type="h1" style={[styles.pageTitle, { color: colors.text }]}>
            Settings
          </ThemedText>
          <ThemedText type="body" style={[styles.pageSubtitle, { color: colors.icon }]}>
            Manage your account and preferences
          </ThemedText>
        </View>
      )}

      {/* Profile Header */}
      <WebCard style={styles.profileCard}>
        <View style={styles.profileHeader}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <ThemedText type="h2" style={{ color: '#FFFFFF' }}>
              {userName[0]?.toUpperCase() || 'A'}
            </ThemedText>
          </View>
          <ThemedText type="h2" style={[styles.userName, { color: colors.text }]}>
            {userName}
          </ThemedText>
          <ThemedText type="caption" style={[styles.userRoleText, { color: colors.icon }]}>
            {userRole ? `${userRole.charAt(0).toUpperCase() + userRole.slice(1).replace('-', ' ')}` : 'User'} at Chinhoyi University of Technology
          </ThemedText>
          {userEmail && (
            <ThemedText type="small" style={{ color: colors.icon, marginTop: Spacing.xs }}>
              {userEmail}
            </ThemedText>
          )}
        </View>
      </WebCard>

      {/* Anonymous Toggle Card */}
      <WebCard style={styles.card}>
        <View style={styles.cardContent}>
          <View style={styles.cardText}>
            <ThemedText type="body" style={[styles.cardTitle, { color: colors.text }]}>
              Go Anonymous
            </ThemedText>
            <ThemedText type="small" style={[styles.cardDescription, { color: colors.icon }]}>
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
      </WebCard>

      {/* Settings Options */}
      <WebCard style={styles.settingsCard}>
        <View style={styles.settingsSection}>
          <TouchableOpacity
            style={[
              styles.settingItem,
              { backgroundColor: colors.surface },
            ]}
            onPress={() => router.push('/profile-settings')}
            activeOpacity={0.7}
          >
            <View style={[styles.settingIconContainer, { backgroundColor: colors.primary + '15' }]}>
              <Ionicons name="person-outline" size={24} color={colors.primary} />
            </View>
            <View style={styles.settingTextContainer}>
              <ThemedText type="body" style={[styles.settingText, { color: colors.text }]}>
                Account Information
              </ThemedText>
              <ThemedText type="small" style={{ color: colors.icon }}>
                Manage your profile and account details
              </ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.icon} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.settingItem,
              { backgroundColor: colors.surface },
            ]}
            onPress={() => router.push('/notifications')}
            activeOpacity={0.7}
          >
            <View style={[styles.settingIconContainer, { backgroundColor: colors.secondary + '15' }]}>
              <Ionicons name="notifications-outline" size={24} color={colors.secondary} />
            </View>
            <View style={styles.settingTextContainer}>
              <ThemedText type="body" style={[styles.settingText, { color: colors.text }]}>
                Notifications
              </ThemedText>
              <ThemedText type="small" style={{ color: colors.icon }}>
                Configure notification preferences
              </ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.icon} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.settingItem,
              { backgroundColor: colors.surface },
            ]}
            onPress={() => router.push('/privacy')}
            activeOpacity={0.7}
          >
            <View style={[styles.settingIconContainer, { backgroundColor: colors.info + '15' }]}>
              <Ionicons name="lock-closed-outline" size={24} color={colors.info} />
            </View>
            <View style={styles.settingTextContainer}>
              <ThemedText type="body" style={[styles.settingText, { color: colors.text }]}>
                Privacy Policy
              </ThemedText>
              <ThemedText type="small" style={{ color: colors.icon }}>
                View our privacy and data protection policy
              </ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.icon} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.settingItem,
              { backgroundColor: colors.surface },
            ]}
            onPress={() => router.push('/accessibility-settings')}
            activeOpacity={0.7}
          >
            <View style={[styles.settingIconContainer, { backgroundColor: colors.success + '15' }]}>
              <MaterialIcons name="accessibility" size={24} color={colors.success} />
            </View>
            <View style={styles.settingTextContainer}>
              <ThemedText type="body" style={[styles.settingText, { color: colors.text }]}>
                Accessibility
              </ThemedText>
              <ThemedText type="small" style={{ color: colors.icon }}>
                Customize accessibility options
              </ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.icon} />
          </TouchableOpacity>
        </View>
      </WebCard>

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
          <MaterialIcons name="save" size={20} color="#FFFFFF" />
          <ThemedText type="body" style={[styles.saveButtonText, { color: '#FFFFFF', marginLeft: Spacing.sm }]}>
            Save Changes
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.logoutButton, { borderColor: colors.border }]}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <MaterialIcons name="logout" size={20} color={colors.danger} />
          <ThemedText type="body" style={[styles.logoutText, { color: colors.danger, marginLeft: Spacing.sm }]}>
            Log Out
          </ThemedText>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  // Web layout with container for Student Affairs
  if (isWeb && isStudentAffairs) {
    return (
      <ThemedView style={styles.container}>
        <WebContainer maxWidth={1200} padding={32}>
          {content}
        </WebContainer>
      </ThemedView>
    );
  }

  // Mobile/Regular layout
  return (
    <ThemedView style={styles.container}>
      {content}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: isWeb ? 0 : Spacing.md,
    paddingBottom: isWeb ? Spacing.xxl : 80,
  },
  pageHeader: {
    marginBottom: Spacing.xl,
    ...(isWeb ? {
      marginTop: Spacing.lg,
    } : {}),
  },
  pageTitle: {
    fontWeight: '700',
    fontSize: isWeb ? 32 : 24,
    marginBottom: Spacing.xs,
  },
  pageSubtitle: {
    fontSize: isWeb ? 16 : 14,
  },
  profileCard: {
    marginBottom: Spacing.lg,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  avatar: {
    width: isWeb ? 100 : 80,
    height: isWeb ? 100 : 80,
    borderRadius: isWeb ? 50 : 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  userName: {
    marginBottom: Spacing.xs,
    fontWeight: '700',
    fontSize: isWeb ? 24 : 20,
  },
  userRoleText: {
    opacity: 0.7,
  },
  card: {
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
  settingsCard: {
    marginBottom: Spacing.lg,
  },
  settingsSection: {
    gap: Spacing.md,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    gap: Spacing.md,
    ...getCursorStyle(),
  },
  settingIconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingTextContainer: {
    flex: 1,
  },
  settingText: {
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  actionsSection: {
    marginTop: Spacing.md,
    marginBottom: Spacing.xl,
    gap: Spacing.md,
    ...(isWeb ? {
      // @ts-ignore - Web-specific CSS grid
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
    } : {}),
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    ...(isWeb ? {} : {
      marginBottom: Spacing.md,
    }),
    ...getCursorStyle(),
  },
  saveButtonText: {
    fontWeight: '600',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    ...getCursorStyle(),
  },
  logoutText: {
    fontWeight: '600',
  },
});




