/**
 * Privacy Policy Screen
 */

import { DrawerHeader } from "@/app/_components/navigation/drawer-header";
import { ThemedText } from "@/app/_components/themed-text";
import { ThemedView } from "@/app/_components/themed-view";
import { BorderRadius, Colors, Spacing } from "@/app/_constants/theme";
import { useColorScheme } from "@/app/_hooks/use-color-scheme";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function PrivacyScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];

  const sections = [
    {
      title: "PEACE Platform Commitment",
      content: `The Lunavo (PEACE Platform) is designed as a safe harbor for Chinhoyi University of Technology (CUT) students. We operate under a strict "Confidentiality First" mandate. Our goal is to provide mental health support while ensuring your data remains your own.`,
    },
    {
      title: "Data and Information Collection",
      content: `We collect minimal data to provide our services:
• Identity Verification: Email and student number are used for authentication only and are stored separately from your social interactions.
• Community Engagement: Posts, replies, and messages are stored to facilitate peer support.
• Wellbeing Data: Mood check-ins and session bookings are treated as sensitive health data and are encrypted.
• Technical Logs: IP addresses are logged for security and abuse prevention but are automatically purged after 30 days.`,
    },
    {
      title: "The Pseudonym System",
      content: `To ensure true privacy, Lunavo uses a pseudonym system for all public interactions. When you post or reply:
• Your real name is never shown to other students.
• Even if you are logged in, you can choose to be "Completely Anonymous" for specific high-sensitivity posts.
• Counselors and Peer Educators only see your pseudonym unless you explicitly agree to share your identity during a private session.`,
    },
    {
      title: "Counseling Confidentiality",
      content: `Sessions booked through Lunavo are governed by the CUT Student Counseling Services ethics code. Counselors will maintain absolute confidentiality except in cases where:
• There is a clear and immediate danger to yourself or others.
• Disclosure is required by a court order.
• You have provided written consent for information sharing.`,
    },
    {
      title: "Data Protection & Security",
      content: `We employ multiple layers of security to protect your wellbeing:
• End-to-End Encryption: Sensitive messages and health check-ins are encrypted.
• Database Isolation: User identity data is kept in a separate secure schema from community content.
• Access Control: Only authorized staff with specific roles (Admin, Head Counselor) can view non-anonymized reports.`,
    },
    {
      title: "Your Rights & Control",
      content: `As a CUT student, you remain in control:
• Right to Delete: You can delete your account and all associated data at any time.
• Right to Export: You can request a copy of your session history and check-in logs.
• Right to Correction: You can update your pseudonym and interests whenever you wish.

For inquiries regarding your data, contact the PEACE Club Privacy Officer at peace-privacy@cut.ac.zw.`,
    },
    {
      title: "Compliance & Governance",
      content: `Lunavo complies with the Data Protection Act of Zimbabwe and the university's internal IT and Student Affairs policies. We regularly review our practices with the CUT ICT department to ensure the highest standards of digital safety.`,
    },
  ];

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <ThemedView style={styles.container}>
        {/* Drawer Header - Mobile Only */}
        <DrawerHeader
          title="Privacy Policy"
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
          {/* Header */}
          <View style={styles.header}>
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: colors.primary + "20" },
              ]}
            >
              <MaterialIcons
                name="privacy-tip"
                size={48}
                color={colors.primary}
              />
            </View>
            <ThemedText
              type="h1"
              style={[styles.title, { color: colors.text }]}
            >
              Privacy Policy
            </ThemedText>
            <ThemedText
              type="small"
              style={[styles.lastUpdated, { color: colors.icon }]}
            >
              Last Updated: {new Date().toLocaleDateString()}
            </ThemedText>
          </View>

          {/* Introduction */}
          <View style={[styles.introCard, { backgroundColor: colors.card }]}>
            <ThemedText
              type="body"
              style={[styles.introText, { color: colors.text }]}
            >
              Lunavo is committed to protecting your privacy and ensuring the
              security of your personal information. As a student-centric
              support ecosystem for CUT, this policy explains how we collect,
              use, and safeguard your data when you use our platform.
            </ThemedText>
          </View>

          {/* Sections */}
          {sections.map((section, index) => (
            <View key={index} style={styles.section}>
              <ThemedText
                type="h3"
                style={[styles.sectionTitle, { color: colors.text }]}
              >
                {section.title}
              </ThemedText>
              <ThemedText
                type="body"
                style={[styles.sectionContent, { color: colors.icon }]}
              >
                {section.content}
              </ThemedText>
            </View>
          ))}

          {/* Contact */}
          <View style={[styles.contactCard, { backgroundColor: colors.card }]}>
            <MaterialIcons name="email" size={24} color={colors.primary} />
            <ThemedText
              type="body"
              style={[styles.contactText, { color: colors.text }]}
            >
              Questions about privacy? Contact us at{" "}
              <ThemedText style={{ color: colors.primary, fontWeight: "600" }}>
                privacy@lunavo.app
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
    marginBottom: Spacing.xs,
  },
  lastUpdated: {
    fontSize: 14,
    textAlign: "center",
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
    fontWeight: "600",
    marginBottom: Spacing.md,
  },
  sectionContent: {
    fontSize: 16,
    lineHeight: 24,
  },
  contactCard: {
    flexDirection: "row",
    alignItems: "center",
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
