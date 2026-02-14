import { PEACELogo } from "@/app/components/peace-logo";
import { ThemedText } from "@/app/components/themed-text";
import { ThemedView } from "@/app/components/themed-view";
import {
  BorderRadius,
  Colors,
  PlatformStyles,
  Spacing,
} from "@/app/constants/theme";
import { useColorScheme } from "@/app/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Linking, StyleSheet, TouchableOpacity, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ResetSentScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email?: string }>();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];

  return (
    <ThemedView style={styles.container}>
      <View style={styles.background}>
        <LinearGradient
          colors={[colors.primary, colors.success]}
          style={[styles.blob, { top: -220, left: -120, opacity: 0.12 }]}
        />
        <LinearGradient
          colors={[colors.warning, colors.danger]}
          style={[styles.blob, { bottom: -240, right: -120, opacity: 0.08 }]}
        />
      </View>

      <SafeAreaView style={styles.safeArea}>
        <Animated.View
          entering={FadeInDown.duration(800)}
          style={styles.logoSection}
        >
          <PEACELogo size={88} />
          <ThemedText type="h1" style={styles.title}>
            Protocol Sent
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            We have sent a recovery link to{" "}
            {email ? String(email) : "your email"}. Use the web link to change
            your password, then return to PEACE to sign in.
          </ThemedText>
          {email ? (
            <View style={styles.emailPill}>
              <Ionicons name="mail-outline" size={18} color={colors.icon} />
              <ThemedText style={styles.emailText}>{String(email)}</ThemedText>
            </View>
          ) : null}
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(200).duration(800)}
          style={[styles.card, { backgroundColor: colors.card }]}
        >
          <View style={{ gap: Spacing.md }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "flex-start",
                gap: Spacing.md,
              }}
            >
              <Ionicons
                name="checkmark-circle"
                size={20}
                color={colors.success}
              />
              <ThemedText style={{ flex: 1, lineHeight: 22 }}>
                Check inbox and spam for “PEACE Password Recovery”.
              </ThemedText>
            </View>
            <View
              style={{
                flexDirection: "row",
                alignItems: "flex-start",
                gap: Spacing.md,
              }}
            >
              <Ionicons
                name="checkmark-circle"
                size={20}
                color={colors.success}
              />
              <ThemedText style={{ flex: 1, lineHeight: 22 }}>
                Open the link on this device to set a new password.
              </ThemedText>
            </View>
            <View
              style={{
                flexDirection: "row",
                alignItems: "flex-start",
                gap: Spacing.md,
              }}
            >
              <Ionicons
                name="checkmark-circle"
                size={20}
                color={colors.success}
              />
              <ThemedText style={{ flex: 1, lineHeight: 22 }}>
                Return to the PEACE app and sign in with the new password.
              </ThemedText>
            </View>
          </View>

          <TouchableOpacity
            onPress={() =>
              Linking.openURL("https://peace-club.praisetech.tech/reset")
            }
            style={{ marginTop: 20 }}
          >
            <LinearGradient
              colors={colors.gradients.primary as any}
              style={{
                height: 56,
                borderRadius: BorderRadius.xl,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <ThemedText
                style={{ color: "#FFF", fontWeight: "900", letterSpacing: 1 }}
              >
                OPEN WEB RESET
              </ThemedText>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        <TouchableOpacity
          onPress={() => router.replace("/auth/login")}
          style={styles.backLink}
        >
          <ThemedText style={{ opacity: 0.7 }}>Return to login</ThemedText>
        </TouchableOpacity>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  background: { ...StyleSheet.absoluteFillObject },
  blob: { position: "absolute", width: 640, height: 640, borderRadius: 320 },
  safeArea: { flex: 1, justifyContent: "center", padding: Spacing.xl },
  logoSection: { alignItems: "center", marginBottom: 36 },
  title: { fontSize: 32, fontWeight: "900", marginTop: 18 },
  subtitle: {
    opacity: 0.7,
    textAlign: "center",
    marginTop: 10,
    lineHeight: 22,
  },
  emailPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    borderRadius: BorderRadius.xl,
    marginTop: Spacing.md,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  emailText: { fontWeight: "600" },
  card: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.xxl,
    ...PlatformStyles.shadow,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  secondaryBtnWrapper: { alignItems: "center", marginTop: 16 },
  backLink: { alignItems: "center", marginTop: Spacing.xl },
});
