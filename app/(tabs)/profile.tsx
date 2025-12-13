/**
 * Profile Tab - Navigates to Profile Settings
 */

import { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ThemedView } from '@/app/components/themed-view';
import { ThemedText } from '@/app/components/themed-text';
import { getPseudonym } from '@/app/utils/storage';
import { useColorScheme } from '@/app/hooks/use-color-scheme';
import { Colors, Spacing, BorderRadius } from '@/app/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { getCursorStyle, createShadow } from '@/app/utils/platform-styles';

export default function ProfileScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const [userName, setUserName] = useState('Alex');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const savedPseudonym = await getPseudonym();
    if (savedPseudonym) {
      setUserName(savedPseudonym.split(/(?=[A-Z])/)[0] || 'Student');
    }
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safeAreaTop}>
      <ThemedView style={styles.container}>
        <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
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

        {/* Quick Actions */}
        <View style={styles.actionsSection}>
          <TouchableOpacity
            style={[
              styles.actionCard,
              { backgroundColor: colors.card },
              createShadow(2, '#000', 0.1),
            ]}
            onPress={() => router.push('/profile-settings')}
            activeOpacity={0.7}
          >
            <Ionicons name="settings-outline" size={24} color={colors.primary} />
            <ThemedText type="body" style={styles.actionText}>
              Profile Settings
            </ThemedText>
            <Ionicons name="chevron-forward" size={20} color={colors.icon} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionCard,
              { backgroundColor: colors.card },
              createShadow(2, '#000', 0.1),
            ]}
            onPress={() => router.push('/check-in')}
            activeOpacity={0.7}
          >
            <Ionicons name="calendar-outline" size={24} color={colors.primary} />
            <ThemedText type="body" style={styles.actionText}>
              Daily Check-In
            </ThemedText>
            <Ionicons name="chevron-forward" size={20} color={colors.icon} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionCard,
              { backgroundColor: colors.card },
              createShadow(2, '#000', 0.1),
            ]}
            onPress={() => router.push('/book-counsellor')}
            activeOpacity={0.7}
          >
            <Ionicons name="medical-outline" size={24} color={colors.primary} />
            <ThemedText type="body" style={styles.actionText}>
              Book a Counsellor
            </ThemedText>
            <Ionicons name="chevron-forward" size={20} color={colors.icon} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionCard,
              { backgroundColor: colors.card },
              createShadow(2, '#000', 0.1),
            ]}
            onPress={() => router.push('/mentorship')}
            activeOpacity={0.7}
          >
            <Ionicons name="people-outline" size={24} color={colors.primary} />
            <ThemedText type="body" style={styles.actionText}>
              Peer Mentorship
            </ThemedText>
            <Ionicons name="chevron-forward" size={20} color={colors.icon} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionCard,
              { backgroundColor: colors.card },
              createShadow(2, '#000', 0.1),
            ]}
            onPress={() => router.push('/academic-help')}
            activeOpacity={0.7}
          >
            <Ionicons name="library-outline" size={24} color={colors.primary} />
            <ThemedText type="body" style={styles.actionText}>
              Academic Help Spaces
            </ThemedText>
            <Ionicons name="chevron-forward" size={20} color={colors.icon} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionCard,
              { backgroundColor: colors.card },
              createShadow(2, '#000', 0.1),
            ]}
            onPress={() => router.push('/volunteer/dashboard')}
            activeOpacity={0.7}
          >
            <Ionicons name="heart-outline" size={24} color={colors.primary} />
            <ThemedText type="body" style={styles.actionText}>
              Volunteer Dashboard
            </ThemedText>
            <Ionicons name="chevron-forward" size={20} color={colors.icon} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionCard,
              { backgroundColor: colors.card },
              createShadow(2, '#000', 0.1),
            ]}
            onPress={() => router.push('/admin/dashboard')}
            activeOpacity={0.7}
          >
            <Ionicons name="shield-checkmark-outline" size={24} color={colors.primary} />
            <ThemedText type="body" style={styles.actionText}>
              Admin Dashboard
            </ThemedText>
            <Ionicons name="chevron-forward" size={20} color={colors.icon} />
          </TouchableOpacity>
        </View>

        {/* About Section */}
        <View style={styles.aboutSection}>
          <ThemedText type="h3" style={styles.sectionTitle}>
            About Lunavo
          </ThemedText>
          <ThemedText type="body" style={styles.aboutText}>
            Lunavo is a safe, anonymous peer support and early intervention platform for Chinhoyi University of Technology (CUT) students. Share your
            concerns, seek guidance, and support others without fear of judgment.
          </ThemedText>
        </View>
      </ScrollView>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeAreaTop: {
    flex: 1,
  },
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
  actionsSection: {
    marginBottom: Spacing.xl,
    gap: Spacing.md,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.md,
  },
  actionText: {
    flex: 1,
    fontWeight: '500',
  },
  aboutSection: {
    marginTop: Spacing.md,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
    fontWeight: '600',
  },
  aboutText: {
    opacity: 0.8,
    lineHeight: 22,
  },
});
