/**
 * About Lunavo Screen
 */

import { DrawerHeader } from '@/components/navigation/drawer-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { createShadow } from '@/utils/platform-styles';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Linking, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AboutScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const [drawerVisible, setDrawerVisible] = useState(false);

  const features = [
    { icon: 'forum' as const, title: 'Peer Support Forum', description: 'Connect with peers and share experiences' },
    { icon: 'chat' as const, title: 'Anonymous Chat', description: 'Private conversations with peer educators' },
    { icon: 'mood' as const, title: 'Mood Tracking', description: 'Track your daily mood and build healthy habits' },
    { icon: 'school' as const, title: 'Academic Resources', description: 'Access study materials and academic support' },
    { icon: 'volunteer-activism' as const, title: 'Peer Educators', description: 'Trained students ready to help' },
    { icon: 'psychology' as const, title: 'Professional Support', description: 'Access to counselors and life coaches' },
  ];

  const links = [
    {
      title: 'Visit Website',
      url: 'https://lunavo.edu',
      icon: 'language' as const,
    },
    {
      title: 'Follow on Social Media',
      url: 'https://social.lunavo.edu',
      icon: 'share' as const,
    },
    {
      title: 'Contact Support',
      url: 'tel:+263786223289',
      icon: 'phone' as const,
      subtitle: 'Praise Masunga - +263 786 223 289',
    },
  ];

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ThemedView style={styles.container}>
        {/* Drawer Header - Mobile Only */}
        <DrawerHeader
          title="About Lunavo"
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
            <View style={[styles.logoContainer, { backgroundColor: colors.primary + '20' }]}>
              <MaterialIcons name="support-agent" size={64} color={colors.primary} />
            </View>
            <ThemedText type="h1" style={[styles.title, { color: colors.text }]}>
              Lunavo
            </ThemedText>
            <ThemedText type="body" style={[styles.tagline, { color: colors.icon }]}>
              Your Mental Health & Academic Support Platform
            </ThemedText>
            <ThemedText type="small" style={[styles.version, { color: colors.icon }]}>
              Version 1.0.0
            </ThemedText>
          </View>

          {/* Mission */}
          <View style={[styles.missionCard, { backgroundColor: colors.card }]}>
            <ThemedText type="h3" style={[styles.missionTitle, { color: colors.text }]}>
              Our Mission
            </ThemedText>
            <ThemedText type="body" style={[styles.missionText, { color: colors.icon }]}>
              Lunavo is dedicated to providing accessible, anonymous, and comprehensive mental health and academic support for students. We believe that every student deserves a safe space to seek help, share experiences, and grow.
            </ThemedText>
          </View>

          {/* Features */}
          <View style={styles.section}>
            <ThemedText type="h3" style={[styles.sectionTitle, { color: colors.text }]}>
              Key Features
            </ThemedText>
            <View style={styles.featuresGrid}>
              {features.map((feature, index) => (
                <View
                  key={index}
                  style={[
                    styles.featureCard,
                    { backgroundColor: colors.card },
                    createShadow(1, '#000', 0.05),
                  ]}
                >
                  <MaterialIcons name={feature.icon} size={32} color={colors.primary} />
                  <ThemedText type="body" style={[styles.featureTitle, { color: colors.text }]}>
                    {feature.title}
                  </ThemedText>
                  <ThemedText type="small" style={[styles.featureDescription, { color: colors.icon }]}>
                    {feature.description}
                  </ThemedText>
                </View>
              ))}
            </View>
          </View>

          {/* Values */}
          <View style={styles.section}>
            <ThemedText type="h3" style={[styles.sectionTitle, { color: colors.text }]}>
              Our Values
            </ThemedText>
            <View style={styles.valuesList}>
              {[
                'Privacy & Anonymity',
                'Peer Support & Community',
                'Professional Excellence',
                'Accessibility for All',
                'Evidence-Based Practices',
              ].map((value, index) => (
                <View key={index} style={styles.valueItem}>
                  <MaterialIcons name="check-circle" size={20} color={colors.primary} />
                  <ThemedText type="body" style={[styles.valueText, { color: colors.text }]}>
                    {value}
                  </ThemedText>
                </View>
              ))}
            </View>
          </View>

          {/* Links */}
          <View style={styles.section}>
            <ThemedText type="h3" style={[styles.sectionTitle, { color: colors.text }]}>
              Connect With Us
            </ThemedText>
            {links.map((link, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.linkCard,
                  { backgroundColor: colors.card },
                  createShadow(1, '#000', 0.05),
                ]}
                onPress={() => Linking.openURL(link.url)}
                activeOpacity={0.7}
              >
                <MaterialIcons name={link.icon} size={24} color={colors.primary} />
                <ThemedText type="body" style={[styles.linkTitle, { color: colors.text }]}>
                  {link.title}
                </ThemedText>
                <MaterialIcons name="chevron-right" size={20} color={colors.icon} />
              </TouchableOpacity>
            ))}
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <ThemedText type="small" style={[styles.footerText, { color: colors.icon }]}>
              © {new Date().getFullYear()} Lunavo. All rights reserved.
            </ThemedText>
            <ThemedText type="small" style={[styles.footerText, { color: colors.icon }]}>
              Built with ❤️ for students
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
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  tagline: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  version: {
    fontSize: 14,
  },
  missionCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xl,
  },
  missionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  missionText: {
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
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  featureCard: {
    width: '48%',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  featureTitle: {
    fontWeight: '600',
    textAlign: 'center',
  },
  featureDescription: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  valuesList: {
    gap: Spacing.md,
  },
  valueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  valueText: {
    fontSize: 16,
  },
  linkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
  },
  linkTitle: {
    flex: 1,
    fontWeight: '500',
  },
  footer: {
    alignItems: 'center',
    marginTop: Spacing.xl,
    gap: Spacing.xs,
  },
  footerText: {
    fontSize: 12,
    textAlign: 'center',
  },
});
