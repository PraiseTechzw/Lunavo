/**
 * Help & Support Screen
 */

import { DrawerHeader } from "@/app/components/navigation/drawer-header";
import { ThemedText } from "@/app/components/themed-text";
import { ThemedView } from "@/app/components/themed-view";
import { BorderRadius, Colors, Spacing } from "@/app/constants/theme";
import { useColorScheme } from "@/app/hooks/use-color-scheme";
import { createShadow } from "@/app/utils/platform-styles";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
// no local state needed
import {
    Linking,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HelpScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];

  const helpSections = [
    {
      id: "getting-started",
      title: "Getting Started",
      icon: "rocket-launch" as const,
      items: [
        {
          title: "How to create a post",
          description: "Learn how to ask for help or share your thoughts",
        },
        {
          title: "Using the forum",
          description: "Navigate and interact with the community",
        },
        {
          title: "Setting up your profile",
          description: "Customize your profile and privacy settings",
        },
      ],
    },
    {
      id: "support",
      title: "Support Resources",
      icon: "support" as const,
      items: [
        {
          title: "Urgent Support",
          description: "Access crisis lines and immediate help",
        },
        {
          title: "Peer Support",
          description: "Connect with peer educators and volunteers",
        },
        {
          title: "Professional Counseling",
          description: "Book sessions with counselors",
        },
      ],
    },
    {
      id: "features",
      title: "Features",
      icon: "apps" as const,
      items: [
        {
          title: "Mood Check-in",
          description: "Track your daily mood and build streaks",
        },
        {
          title: "Badges & Rewards",
          description: "Earn points and unlock achievements",
        },
        {
          title: "Resources Library",
          description: "Access mental health and academic resources",
        },
      ],
    },
    {
      id: "safety",
      title: "Safety & Privacy",
      icon: "security" as const,
      items: [
        {
          title: "Anonymous posting",
          description: "Post anonymously to protect your privacy",
        },
        {
          title: "Reporting content",
          description: "Report inappropriate or harmful content",
        },
        {
          title: "Privacy settings",
          description: "Control who can see your information",
        },
      ],
    },
  ];

  const contactOptions = [
    {
      title: "Email Support",
      description: "support@lunavo.app",
      icon: "email" as const,
      action: () => Linking.openURL("mailto:support@lunavo.app"),
    },
    {
      title: "Emergency Hotline",
      description: "Call 24/7 crisis support",
      icon: "phone" as const,
      action: () => Linking.openURL("tel:+1234567890"),
    },
    {
      title: "Visit Website",
      description: "lunavo.app",
      icon: "language" as const,
      action: () => Linking.openURL("https://lunavo.app"),
    },
  ];

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <ThemedView style={styles.container}>
        {/* Drawer Header - Mobile Only */}
        <DrawerHeader
          title="Help & Support"
          onMenuPress={() => {}}
          rightAction={{
            icon: "close",
            onPress: () => router.back(),
          }}
        />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Section */}
          <View style={styles.headerSection}>
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: colors.primary + "20" },
              ]}
            >
              <MaterialIcons
                name="help-outline"
                size={48}
                color={colors.primary}
              />
            </View>
            <ThemedText
              type="h1"
              style={[styles.title, { color: colors.text }]}
            >
              How can we help?
            </ThemedText>
            <ThemedText
              type="body"
              style={[styles.subtitle, { color: colors.icon }]}
            >
              Find answers to common questions and get the support you need
            </ThemedText>
          </View>

          {/* Help Sections */}
          {helpSections.map((section) => (
            <View key={section.id} style={styles.section}>
              <View style={styles.sectionHeader}>
                <MaterialIcons
                  name={section.icon}
                  size={24}
                  color={colors.primary}
                />
                <ThemedText
                  type="h3"
                  style={[styles.sectionTitle, { color: colors.text }]}
                >
                  {section.title}
                </ThemedText>
              </View>
              {section.items.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.helpItem,
                    { backgroundColor: colors.card },
                    createShadow(1, "#000", 0.05),
                  ]}
                  activeOpacity={0.7}
                >
                  <View style={styles.helpItemContent}>
                    <ThemedText
                      type="body"
                      style={[styles.helpItemTitle, { color: colors.text }]}
                    >
                      {item.title}
                    </ThemedText>
                    <ThemedText
                      type="small"
                      style={[
                        styles.helpItemDescription,
                        { color: colors.icon },
                      ]}
                    >
                      {item.description}
                    </ThemedText>
                  </View>
                  <MaterialIcons
                    name="chevron-right"
                    size={20}
                    color={colors.icon}
                  />
                </TouchableOpacity>
              ))}
            </View>
          ))}

          {/* Contact Section */}
          <View style={styles.section}>
            <ThemedText
              type="h3"
              style={[
                styles.sectionTitle,
                { color: colors.text, marginBottom: Spacing.md },
              ]}
            >
              Contact Us
            </ThemedText>
            {contactOptions.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.contactItem,
                  { backgroundColor: colors.card },
                  createShadow(1, "#000", 0.05),
                ]}
                onPress={option.action}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.contactIcon,
                    { backgroundColor: colors.primary + "20" },
                  ]}
                >
                  <MaterialIcons
                    name={option.icon}
                    size={24}
                    color={colors.primary}
                  />
                </View>
                <View style={styles.contactContent}>
                  <ThemedText
                    type="body"
                    style={[styles.contactTitle, { color: colors.text }]}
                  >
                    {option.title}
                  </ThemedText>
                  <ThemedText
                    type="small"
                    style={[styles.contactDescription, { color: colors.icon }]}
                  >
                    {option.description}
                  </ThemedText>
                </View>
                <MaterialIcons
                  name="chevron-right"
                  size={20}
                  color={colors.icon}
                />
              </TouchableOpacity>
            ))}
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
  headerSection: {
    alignItems: "center",
    marginBottom: Spacing.xl,
    paddingTop: Spacing.lg,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
  },
  helpItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  helpItemContent: {
    flex: 1,
  },
  helpItemTitle: {
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  helpItemDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
  },
  contactIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  contactContent: {
    flex: 1,
  },
  contactTitle: {
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  contactDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
});
