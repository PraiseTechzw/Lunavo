/**
 * Privacy Policy Screen
 */

import { DrawerHeader } from '@/app/components/navigation/drawer-header';
import { ThemedText } from '@/app/components/themed-text';
import { ThemedView } from '@/app/components/themed-view';
import { BorderRadius, Colors, Spacing } from '@/app/constants/theme';
import { useColorScheme } from '@/app/hooks/use-color-scheme';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function PrivacyScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const [drawerVisible, setDrawerVisible] = useState(false);

  const sections = [
    {
      title: 'Information We Collect',
      content: `We collect information that you provide directly to us, including:
• Account information (email, username, student number)
• Profile information (pseudonym, preferences)
• Content you post (posts, replies, messages)
• Usage data (how you interact with the platform)

We use this information to provide, maintain, and improve our services.`,
    },
    {
      title: 'How We Use Your Information',
      content: `Your information is used to:
• Provide mental health support services
• Facilitate peer-to-peer connections
• Ensure platform safety and security
• Improve user experience
• Comply with legal obligations

We never sell your personal information to third parties.`,
    },
    {
      title: 'Anonymous Posting',
      content: `You can post anonymously on the platform. When posting anonymously:
• Your identity is protected from other users
• Your posts are not linked to your profile
• You can still receive support and responses
• Administrators may access your identity for safety purposes only

Anonymous posts are still subject to community guidelines.`,
    },
    {
      title: 'Data Security',
      content: `We implement industry-standard security measures:
• Encrypted data transmission (SSL/TLS)
• Secure database storage
• Regular security audits
• Access controls and authentication

However, no method of transmission over the internet is 100% secure.`,
    },
    {
      title: 'Your Rights',
      content: `You have the right to:
• Access your personal data
• Correct inaccurate information
• Request deletion of your account
• Export your data
• Opt-out of certain data processing

Contact us at privacy@lunavo.edu to exercise these rights.`,
    },
    {
      title: 'Third-Party Services',
      content: `We may use third-party services for:
• Analytics and performance monitoring
• Cloud storage and hosting
• Authentication services

These services are bound by their own privacy policies and data protection agreements.`,
    },
    {
      title: 'Children\'s Privacy',
      content: `Our platform is designed for students aged 13 and above. We comply with:
• COPPA (Children's Online Privacy Protection Act)
• FERPA (Family Educational Rights and Privacy Act)
• Local data protection regulations

We do not knowingly collect information from children under 13.`,
    },
    {
      title: 'Changes to This Policy',
      content: `We may update this privacy policy from time to time. We will:
• Notify you of significant changes
• Post the updated policy on this page
• Update the "Last Updated" date

Continued use of the platform after changes constitutes acceptance.`,
    },
  ];

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ThemedView style={styles.container}>
        {/* Drawer Header - Mobile Only */}
        <DrawerHeader
          title="Privacy Policy"
          onMenuPress={() => setDrawerVisible(false)}
          rightAction={{
            icon: 'close',
            onPress: () => router.back(),
          }}
        />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
              <MaterialIcons name="privacy-tip" size={48} color={colors.primary} />
            </View>
            <ThemedText type="h1" style={[styles.title, { color: colors.text }]}>
              Privacy Policy
            </ThemedText>
            <ThemedText type="small" style={[styles.lastUpdated, { color: colors.icon }]}>
              Last Updated: {new Date().toLocaleDateString()}
            </ThemedText>
          </View>

          {/* Introduction */}
          <View style={[styles.introCard, { backgroundColor: colors.card }]}>
            <ThemedText type="body" style={[styles.introText, { color: colors.text }]}>
              At Lunavo, we are committed to protecting your privacy and ensuring the security of your personal information. This policy explains how we collect, use, and safeguard your data when you use our platform.
            </ThemedText>
          </View>

          {/* Sections */}
          {sections.map((section, index) => (
            <View key={index} style={styles.section}>
              <ThemedText type="h3" style={[styles.sectionTitle, { color: colors.text }]}>
                {section.title}
              </ThemedText>
              <ThemedText type="body" style={[styles.sectionContent, { color: colors.icon }]}>
                {section.content}
              </ThemedText>
            </View>
          ))}

          {/* Contact */}
          <View style={[styles.contactCard, { backgroundColor: colors.card }]}>
            <MaterialIcons name="email" size={24} color={colors.primary} />
            <ThemedText type="body" style={[styles.contactText, { color: colors.text }]}>
              Questions about privacy? Contact us at{' '}
              <ThemedText style={{ color: colors.primary, fontWeight: '600' }}>
                privacy@lunavo.edu
              </ThemedText>
            </ThemedText>
          </View>

          {/* Bottom Spacing */}
          <View style={{ height: Spacing.xl }} />
        </ScrollView>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
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
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
    paddingTop: Spacing.lg,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  lastUpdated: {
    fontSize: 14,
    textAlign: 'center',
  },
  introCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xl,
  },
  introText: {
    fontSize: 16,
    lineHeight: 24,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  sectionContent: {
    fontSize: 16,
    lineHeight: 24,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  contactText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
  },
});
