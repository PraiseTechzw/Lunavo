/**
 * Premium Reset Password Screen
 */

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
import { verifyPasswordResetCode } from "@/lib/auth";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ResetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const email = typeof params.email === "string" ? params.email : "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (password !== confirmPassword) {
      Alert.alert("Mismatch", "Passwords do not match.");
      return;
    }
    if (!email || !code || code.length !== 8) {
      Alert.alert("Invalid", "Enter the 8-digit code sent to your email.");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await verifyPasswordResetCode(
        email,
        code.trim(),
        password,
      );
      if (error) throw error;
      Alert.alert("Success", "Password restored. Access re-established.", [
        { text: "Login", onPress: () => router.replace("/auth/login") },
      ]);
    } catch (e: any) {
      console.error("reset-password verify error", {
        error: e,
        status: e?.status,
        message: e?.message,
      });
      const msg = String(e?.message || "Reset failed");
      const lower = msg.toLowerCase();
      if (lower.includes("invalid or expired code") || lower.includes("code")) {
        Alert.alert(
          "Invalid Code",
          "The code is incorrect or expired. Request a new code and try again.",
        );
      } else if (lower.includes("not found") || lower.includes("user")) {
        Alert.alert(
          "Account Not Found",
          "No account matches this email. Check your email address or sign up.",
        );
      } else if (lower.includes("server") || lower.includes("unavailable")) {
        Alert.alert(
          "Server Error",
          "Password reset service is temporarily unavailable. Try again later.",
        );
      } else {
        Alert.alert("Error", msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.background}>
        <LinearGradient
          colors={[colors.success, colors.primary]}
          style={[styles.blob, { top: -200, left: -100, opacity: 0.1 }]}
        />
      </View>

      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            scrollEnabled={false}
          >
            <View style={styles.header}>
              <PEACELogo size={80} />
              <ThemedText type="h1" style={styles.title}>
                New Protocol
              </ThemedText>
              <ThemedText style={styles.subtitle}>
                Enter the 8-digit code sent to {email || "your email"} and set a
                new password.
              </ThemedText>
            </View>

            <Animated.View
              entering={FadeInDown}
              style={[styles.card, { backgroundColor: colors.card }]}
            >
              <View style={styles.inputGroup}>
                <ThemedText style={styles.label}>8-Digit Code</ThemedText>
                <View
                  style={[styles.inputWrapper, { borderColor: colors.border }]}
                >
                  <Ionicons name="key-outline" size={20} color={colors.icon} />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="00000000"
                    placeholderTextColor={colors.icon}
                    keyboardType="number-pad"
                    maxLength={8}
                    value={code}
                    onChangeText={setCode}
                  />
                </View>
              </View>
              <View style={styles.inputGroup}>
                <ThemedText style={styles.label}>
                  New Access Key (Password)
                </ThemedText>
                <View
                  style={[styles.inputWrapper, { borderColor: colors.border }]}
                >
                  <Ionicons
                    name="lock-open-outline"
                    size={20}
                    color={colors.icon}
                  />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="••••••••"
                    placeholderTextColor={colors.icon}
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <ThemedText style={styles.label}>Confirm Access Key</ThemedText>
                <View
                  style={[styles.inputWrapper, { borderColor: colors.border }]}
                >
                  <Ionicons
                    name="lock-closed-outline"
                    size={20}
                    color={colors.icon}
                  />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="••••••••"
                    placeholderTextColor={colors.icon}
                    secureTextEntry
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                  />
                </View>
              </View>

              <TouchableOpacity
                onPress={handleReset}
                disabled={loading || !password || !code}
                style={styles.btnWrapper}
              >
                <LinearGradient
                  colors={colors.gradients.primary as any}
                  style={styles.btn}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <ThemedText style={styles.btnText}>
                      ESTABLISH NEW KEY
                    </ThemedText>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  blob: {
    position: "absolute",
    width: 600,
    height: 600,
    borderRadius: 300,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.xl,
    flexGrow: 1,
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: "900",
    marginTop: 20,
  },
  subtitle: {
    opacity: 0.6,
    textAlign: "center",
    marginTop: 10,
    lineHeight: 22,
  },
  card: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.xxl,
    ...PlatformStyles.shadow,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    marginBottom: Spacing.xs,
    marginLeft: 4,
    opacity: 0.7,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    height: 60,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    gap: Spacing.md,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  btnWrapper: {
    ...PlatformStyles.premiumShadow,
    marginTop: 20,
  },
  btn: {
    height: 60,
    borderRadius: BorderRadius.xl,
    justifyContent: "center",
    alignItems: "center",
  },
  btnText: {
    color: "#FFF",
    fontWeight: "900",
    letterSpacing: 1,
  },
});
