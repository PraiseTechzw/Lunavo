/**
 * Profile Settings Screen
 */

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { WebCard, WebContainer } from '@/components/web';
import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { signOut } from '@/lib/auth';
import { updateUser } from '@/lib/database';
import { supabase } from '@/lib/supabase';
import { createShadow, getCursorStyle } from '@/utils/platform-styles';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Platform,
    ScrollView,
    StyleSheet,
    Switch,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

interface UserProfileData {
  id: string;
  email: string;
  username?: string;
  student_number?: string;
  phone?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  location?: string;
  preferred_contact_method?: string;
  pseudonym: string;
  isAnonymous: boolean;
  role: string;
  createdAt: string;
  lastActive: string;
  profile_data?: Record<string, any>;
}

export default function ProfileSettingsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userData, setUserData] = useState<UserProfileData | null>(null);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [userEmail, setUserEmail] = useState<string>('');
  const isStudentAffairs = userData?.role === 'student-affairs' || userData?.role === 'admin';

  useEffect(() => {
    loadUserInfo();
  }, []);

  const loadUserInfo = async () => {
    try {
      setLoading(true);
      // Get auth user email first
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        console.error('Auth error:', authError);
        Alert.alert('Error', 'Failed to authenticate. Please log in again.');
        router.replace('/auth/login');
        return;
      }

      if (!authUser) {
        Alert.alert('Error', 'You must be logged in to view your profile');
        router.replace('/auth/login');
        return;
      }

      if (authUser.email) {
        setUserEmail(authUser.email);
      }

      // Get full user data directly from database to access all fields
      const { data: dbUser, error: dbError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (dbError) {
        console.error('Error loading user info:', dbError);
        Alert.alert('Error', dbError.message || 'Failed to load profile information');
        setLoading(false);
        return;
      }

      if (dbUser) {
        const profileData: UserProfileData = {
          id: dbUser.id,
          email: authUser.email || '',
          username: dbUser.username || undefined,
          student_number: dbUser.student_number || undefined,
          phone: dbUser.phone || undefined,
          emergency_contact_name: dbUser.emergency_contact_name || undefined,
          emergency_contact_phone: dbUser.emergency_contact_phone || undefined,
          location: dbUser.location || undefined,
          preferred_contact_method: dbUser.preferred_contact_method || undefined,
          pseudonym: dbUser.pseudonym || 'User',
          isAnonymous: dbUser.is_anonymous || false,
          role: dbUser.role || 'student',
          createdAt: dbUser.created_at,
          lastActive: dbUser.last_active,
          profile_data: dbUser.profile_data || {},
        };
        setUserData(profileData);
        setIsAnonymous(profileData.isAnonymous);
      } else {
        console.error('No user data found');
        Alert.alert('Error', 'User profile not found');
      }
    } catch (error: any) {
      console.error('Error loading user info:', error);
      Alert.alert('Error', error.message || 'Failed to load profile information. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveChanges = async () => {
    if (!userData) return;

    try {
      setSaving(true);
      // Update anonymous status
      await updateUser(userData.id, {
        isAnonymous,
      });
      
      // Update the user data state
      setUserData({ ...userData, isAnonymous });
      
      Alert.alert('Success', 'Your changes have been saved.');
    } catch (error: any) {
      console.error('Error saving changes:', error);
      Alert.alert('Error', error.message || 'Failed to save changes. Please try again.');
    } finally {
      setSaving(false);
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

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <ThemedText style={[styles.loadingText, { color: colors.text }]}>
              Loading profile...
            </ThemedText>
          </View>
        </SafeAreaView>
      </ThemedView>
    );
  }

  if (!userData) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loadingContainer}>
            <ThemedText style={[styles.errorText, { color: colors.danger }]}>
              Failed to load profile information
            </ThemedText>
            <TouchableOpacity
              style={[styles.retryButton, { backgroundColor: colors.primary }]}
              onPress={loadUserInfo}
            >
              <ThemedText style={{ color: '#FFFFFF', fontWeight: '600' }}>
                Retry
              </ThemedText>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </ThemedView>
    );
  }

  const content = (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Header with Back Button */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.backButton, getCursorStyle()]}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <ThemedText type="h2" style={[styles.headerTitle, { color: colors.text }]}>
            Profile Settings
          </ThemedText>
          <ThemedText type="caption" style={[styles.headerSubtitle, { color: colors.icon }]}>
            Your account information and preferences
          </ThemedText>
        </View>
      </View>

      {/* Profile Header */}
      <WebCard style={styles.profileCard}>
        <View style={styles.profileHeader}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <ThemedText type="h2" style={{ color: '#FFFFFF' }}>
              {userData.pseudonym[0]?.toUpperCase() || 'A'}
            </ThemedText>
          </View>
          <ThemedText type="h2" style={[styles.userName, { color: colors.text }]}>
            {userData.username || userData.pseudonym || 'User'}
          </ThemedText>
          <ThemedText type="caption" style={[styles.userRoleText, { color: colors.icon }]}>
            {userData.role.charAt(0).toUpperCase() + userData.role.slice(1).replace(/-/g, ' ')} at Chinhoyi University of Technology
          </ThemedText>
        </View>
      </WebCard>

      {/* Personal Information Section */}
      <WebCard style={styles.card}>
        <View style={styles.sectionHeader}>
          <Ionicons name="person-outline" size={24} color={colors.primary} />
          <ThemedText type="h3" style={[styles.sectionTitle, { color: colors.text }]}>
            Personal Information
          </ThemedText>
        </View>
        <View style={styles.infoGrid}>
          {userEmail && (
            <InfoRow
              label="Email"
              value={userEmail}
              icon="mail-outline"
              colors={colors}
            />
          )}
          {userData.student_number && (
            <InfoRow
              label="Student Number"
              value={userData.student_number}
              icon="school-outline"
              colors={colors}
            />
          )}
          {userData.username && (
            <InfoRow
              label="Username"
              value={userData.username}
              icon="at-outline"
              colors={colors}
            />
          )}
          {userData.pseudonym && (
            <InfoRow
              label="Pseudonym"
              value={userData.pseudonym}
              icon="key-outline"
              colors={colors}
            />
          )}
        </View>
      </WebCard>

      {/* Contact Information Section */}
      {(userData.phone || userData.emergency_contact_name || userData.location) && (
        <WebCard style={styles.card}>
          <View style={styles.sectionHeader}>
            <Ionicons name="call-outline" size={24} color={colors.secondary} />
            <ThemedText type="h3" style={[styles.sectionTitle, { color: colors.text }]}>
              Contact Information
            </ThemedText>
          </View>
          <View style={styles.infoGrid}>
            {userData.phone && (
              <InfoRow
                label="Phone Number"
                value={userData.phone}
                icon="phone-portrait-outline"
                colors={colors}
              />
            )}
            {userData.emergency_contact_name && (
              <InfoRow
                label="Emergency Contact Name"
                value={userData.emergency_contact_name}
                icon="person-add-outline"
                colors={colors}
              />
            )}
            {userData.emergency_contact_phone && (
              <InfoRow
                label="Emergency Contact Phone"
                value={userData.emergency_contact_phone}
                icon="call-outline"
                colors={colors}
              />
            )}
            {userData.location && (
              <InfoRow
                label="Location"
                value={userData.location}
                icon="location-outline"
                colors={colors}
              />
            )}
            {userData.preferred_contact_method && (
              <InfoRow
                label="Preferred Contact Method"
                value={userData.preferred_contact_method.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                icon="chatbubbles-outline"
                colors={colors}
              />
            )}
          </View>
        </WebCard>
      )}

      {/* Account Information Section */}
      <WebCard style={styles.card}>
        <View style={styles.sectionHeader}>
          <Ionicons name="information-circle-outline" size={24} color={colors.info} />
          <ThemedText type="h3" style={[styles.sectionTitle, { color: colors.text }]}>
            Account Information
          </ThemedText>
        </View>
        <View style={styles.infoGrid}>
          <InfoRow
            label="User ID"
            value={userData.id}
            icon="finger-print-outline"
            colors={colors}
          />
          <InfoRow
            label="Role"
            value={userData.role.charAt(0).toUpperCase() + userData.role.slice(1).replace(/-/g, ' ')}
            icon="shield-checkmark-outline"
            colors={colors}
          />
          <InfoRow
            label="Member Since"
            value={formatDate(userData.createdAt)}
            icon="calendar-outline"
            colors={colors}
          />
          <InfoRow
            label="Last Active"
            value={formatDate(userData.lastActive)}
            icon="time-outline"
            colors={colors}
          />
        </View>
      </WebCard>

      {/* Privacy Settings */}
      <WebCard style={styles.card}>
        <View style={styles.sectionHeader}>
          <Ionicons name="eye-outline" size={24} color={colors.warning} />
          <ThemedText type="h3" style={[styles.sectionTitle, { color: colors.text }]}>
            Privacy Settings
          </ThemedText>
        </View>
        <View style={styles.cardContent}>
          <View style={styles.cardText}>
            <ThemedText type="body" style={[styles.cardTitle, { color: colors.text }]}>
              Go Anonymous
            </ThemedText>
            <ThemedText type="small" style={[styles.cardDescription, { color: colors.icon }]}>
              Your name and profile picture will be hidden from others when posting
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
            saving && { opacity: 0.6 },
          ]}
          onPress={handleSaveChanges}
          disabled={saving}
          activeOpacity={0.8}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <MaterialIcons name="save" size={20} color="#FFFFFF" />
          )}
          <ThemedText type="body" style={[styles.saveButtonText, { color: '#FFFFFF', marginLeft: Spacing.sm }]}>
            {saving ? 'Saving...' : 'Save Changes'}
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
        <SafeAreaView style={styles.safeArea}>
          <WebContainer maxWidth={1200} padding={32}>
            {content}
          </WebContainer>
        </SafeAreaView>
      </ThemedView>
    );
  }

  // Mobile/Regular layout
  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {content}
      </SafeAreaView>
    </ThemedView>
  );
}

// InfoRow component for displaying user information
function InfoRow({ label, value, icon, colors }: { label: string; value: string; icon: string; colors: any }) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoRowLeft}>
        <Ionicons name={icon as any} size={20} color={colors.icon} style={styles.infoIcon} />
        <ThemedText type="small" style={[styles.infoLabel, { color: colors.icon }]}>
          {label}
        </ThemedText>
      </View>
      <ThemedText type="body" style={[styles.infoValue, { color: colors.text }]} numberOfLines={1}>
        {value}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    width: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: 16,
  },
  errorText: {
    fontSize: 16,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    gap: Spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.md,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontWeight: '700',
    fontSize: 20,
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  sectionTitle: {
    fontWeight: '700',
    fontSize: 18,
  },
  infoGrid: {
    gap: Spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  infoRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: Spacing.md,
  },
  infoIcon: {
    marginRight: Spacing.sm,
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: '500',
    opacity: 0.7,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
});




