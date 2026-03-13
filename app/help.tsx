/**
 * Help & Support Screen
 */

import { DrawerHeader } from "@/app/_components/navigation/drawer-header";
import { ThemedText } from "@/app/_components/themed-text";
import { ThemedView } from "@/app/_components/themed-view";
import { BorderRadius, Colors, Spacing } from "@/app/_constants/theme";
import { useColorScheme } from "@/app/_hooks/use-color-scheme";
import { createShadow } from "@/app/_utils/platform-styles";
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
      title: "Navigation & Basics",
      icon: "rocket-launch" as const,
      items: [
        {
          title: "How the Pseudonym works",
          description: "Your safe identity for sharing in the forum and joining meetings",
        },
        {
          title: "Earning Peace Points",
          description: "Login daily (+10), help peers (+20), and attend meetings (+25)",
        },
        {
          title: "The Mood Check-in",
          description: "Track your wellbeing daily to see trends in your Insights",
        },
      ],
    },
    {
      id: "counseling",
      title: "Professional Support",
      icon: "psychology" as const,
      items: [
        {
          title: "Booking a Session",
          description: "Steps to schedule a confidential talk with a CUT counselor",
        },
        {
          title: "Anonymous Counseling",
          description: "How to talk to a professional without sharing your real name",
        },
        {
          title: "Crisis Intervention",
          description: "What to do if you need immediate psychological support",
        },
      ],
    },
    {
      id: "emergency",
      title: "Campus Safety",
      icon: "local-police" as const,
      items: [
        {
          title: "Campus Security",
          description: "Immediate assistance for on-campus physical safety concerns",
        },
        {
          title: "First Aid & Medical",
          description: "Accessing the CUT Clinic for health-related issues",
        },
        {
          title: "Abuse & Harassment",
          description: "The official protocol for reporting harassment on campus",
        },
      ],
    },
  ];

  const contactOptions = [
    {
      title: "PEACE Club Support",
      description: "support@peaceclub.cut.ac.zw",
      icon: "email" as const,
      action: () => Linking.openURL("mailto:support@peaceclub.cut.ac.zw"),
    },
    {
      title: "CUT Crisis Hotline",
      description: "Call the 24/7 dedicated support line",
      icon: "phone" as const,
      action: () => Linking.openURL("tel:+263777000000"), // Placeholder but formatted
    },
    {
      title: "PEACE Hub",
      description: "Visit us at the Student Affairs building",
      icon: "location-on" as const,
      action: () => Linking.openURL("https://maps.google.com/?q=Chinhoyi+University+Student+Affairs"),
    },
  ];

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <ThemedView style={styles.container}>
        {/* Drawer Header - Mobile Only */}
        <DrawerHeader
          title="Help & Support"
          onMenuPress={() => { }}
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
