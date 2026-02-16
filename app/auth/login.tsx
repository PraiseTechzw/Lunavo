/**
 * Premium Login Screen
 * Uses Glassmorphism, Reanimated, and LinearGradients
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
import { signIn } from "@/lib/auth";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import Animated, {
  Easing,
  FadeInDown,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

export default function LoginScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const { height, width } = useWindowDimensions();
  const isSmall = height < 700 || width < 360;
  const tinySmall = height < 640 || width < 320;
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const canSignIn = useMemo(
    () => !!emailOrUsername.trim() && !!password.trim(),
    [emailOrUsername, password],
  );

  // Background animation values
  const floatValue = useSharedValue(0);

  useEffect(() => {
    floatValue.value = withRepeat(
      withTiming(1, { duration: 10000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, []);

  const blob1Style = useAnimatedStyle(() => {
    const translateY = interpolate(floatValue.value, [0, 1], [0, 50]);
    const translateX = interpolate(floatValue.value, [0, 1], [0, 20]);
    return { transform: [{ translateY }, { translateX }] };
  });

  const blob2Style = useAnimatedStyle(() => {
    const translateY = interpolate(floatValue.value, [0, 1], [0, -40]);
    const translateX = interpolate(floatValue.value, [0, 1], [0, -30]);
    return { transform: [{ translateY }, { translateX }] };
  });

  const handleLogin = async () => {
    if (!emailOrUsername.trim() || !password.trim()) {
      Alert.alert("Missing Information", "Please fill in all fields.");
      return;
    }

    setLoading(true);
    try {
      const { user, error } = await signIn({ emailOrUsername, password });
      if (error) throw error;
      if (user) router.replace("/(tabs)");
    } catch (error: any) {
      Alert.alert("Login Failed", error.message || "Check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      {/* Animated Background Blobs */}
      <View style={styles.background}>
        <Animated.View
          style={[styles.blobWrapper, blob1Style, { top: -100, right: -100 }]}
        >
          <LinearGradient
            colors={[colors.primary, colors.secondary]}
            style={styles.blob}
          />
        </Animated.View>
        <Animated.View
          style={[styles.blobWrapper, blob2Style, { bottom: -100, left: -100 }]}
        >
          <LinearGradient
            colors={[colors.secondary, colors.primary]}
            style={styles.blob}
          />
        </Animated.View>
      </View>

      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
          <ScrollView
            contentContainerStyle={[
              styles.scrollContent,
              isSmall ? { padding: Spacing.lg } : null,
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            scrollEnabled={false}
          >
            <Animated.View
              entering={FadeInDown.delay(200).duration(800)}
              style={[
                styles.logoSection,
                tinySmall
                  ? { marginBottom: 16 }
                  : isSmall
                    ? { marginBottom: 24 }
                    : null,
              ]}
            >
              <PEACELogo size={tinySmall ? 72 : isSmall ? 88 : 140} />
              <ThemedText
                type="h1"
                style={[
                  styles.title,
                  tinySmall
                    ? { fontSize: 26, letterSpacing: 2, marginTop: Spacing.sm }
                    : isSmall
                      ? { fontSize: 32, letterSpacing: 4 }
                      : null,
                ]}
              >
                PEACE
              </ThemedText>
              {!tinySmall && (
                <ThemedText
                  style={[
                    styles.subtitle,
                    isSmall ? { letterSpacing: 2 } : null,
                  ]}
                >
                  Peer Education Club
                </ThemedText>
              )}
            </Animated.View>

            <Animated.View
              entering={FadeInDown.delay(400).duration(800)}
              style={[
                styles.card,
                { backgroundColor: colors.card },
                tinySmall
                  ? { padding: Spacing.md }
                  : isSmall
                    ? { padding: Spacing.lg }
                    : null,
              ]}
            >
              <ThemedText type="h2" style={styles.cardTitle}>
                Sign In
              </ThemedText>

              <View style={styles.inputGroup}>
                <ThemedText style={styles.label}>Email or Username</ThemedText>
                <View
                  style={[
                    styles.inputWrapper,
                    { borderColor: colors.border },
                    tinySmall
                      ? { height: 48 }
                      : isSmall
                        ? { height: 52 }
                        : null,
                  ]}
                >
                  <Ionicons name="mail-outline" size={20} color={colors.icon} />
                  <TextInput
                    style={[
                      styles.input,
                      { color: colors.text },
                      tinySmall ? { fontSize: 15 } : null,
                    ]}
                    placeholder="yourname@cut.ac.zw"
                    placeholderTextColor={colors.icon}
                    value={emailOrUsername}
                    onChangeText={setEmailOrUsername}
                    autoCapitalize="none"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <ThemedText style={styles.label}>Password</ThemedText>
                <View
                  style={[
                    styles.inputWrapper,
                    { borderColor: colors.border },
                    tinySmall
                      ? { height: 48 }
                      : isSmall
                        ? { height: 52 }
                        : null,
                  ]}
                >
                  <Ionicons
                    name="lock-closed-outline"
                    size={20}
                    color={colors.icon}
                  />
                  <TextInput
                    style={[
                      styles.input,
                      { color: colors.text },
                      tinySmall ? { fontSize: 15 } : null,
                    ]}
                    placeholder="••••••••"
                    placeholderTextColor={colors.icon}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Ionicons
                      name={showPassword ? "eye-off-outline" : "eye-outline"}
                      size={20}
                      color={colors.icon}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                style={[
                  styles.forgotBtn,
                  tinySmall
                    ? { marginBottom: Spacing.sm }
                    : isSmall
                      ? { marginBottom: Spacing.md }
                      : null,
                ]}
                onPress={() => router.push("/auth/forgot-password")}
              >
                <ThemedText
                  style={{ color: colors.primary, fontWeight: "600" }}
                >
                  Forgot Password?
                </ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleLogin}
                disabled={loading || !canSignIn}
                style={[
                  styles.loginBtnWrapper,
                  tinySmall
                    ? { marginBottom: Spacing.sm }
                    : isSmall
                      ? { marginBottom: Spacing.md }
                      : null,
                ]}
              >
                <LinearGradient
                  colors={colors.gradients.primary as any}
                  style={[
                    styles.loginBtn,
                    tinySmall
                      ? { height: 52 }
                      : isSmall
                        ? { height: 56 }
                        : null,
                    !canSignIn || loading ? { opacity: 0.6 } : null,
                  ]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <ThemedText style={styles.loginBtnText}>Sign In</ThemedText>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              <View
                style={[
                  styles.footer,
                  tinySmall ? { marginTop: Spacing.sm } : null,
                ]}
              >
                <ThemedText style={{ opacity: 0.6 }}>
                  Don&apos;t have an account?{" "}
                </ThemedText>
                <TouchableOpacity onPress={() => router.push("/auth/register")}>
                  <ThemedText
                    style={{ color: colors.primary, fontWeight: "700" }}
                  >
                    Register Now
                  </ThemedText>
                </TouchableOpacity>
              </View>
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
    overflow: "hidden",
  },
  blobWrapper: {
    position: "absolute",
    width: 600,
    height: 600,
  },
  blob: {
    width: "100%",
    height: "100%",
    borderRadius: 300,
    opacity: 0.15,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.xl,
    flexGrow: 1,
    justifyContent: "center",
  },
  logoSection: {
    alignItems: "center",
    marginBottom: 40,
  },
  title: {
    fontSize: 48,
    fontWeight: "900",
    marginTop: Spacing.md,
    letterSpacing: 8,
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.6,
    textTransform: "uppercase",
    letterSpacing: 4,
    fontWeight: "700",
  },
  card: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.xxl,
    ...PlatformStyles.premiumShadow,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  cardTitle: {
    marginBottom: Spacing.lg,
    textAlign: "center",
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
    height: 56,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    gap: Spacing.md,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  forgotBtn: {
    alignSelf: "flex-end",
    marginBottom: Spacing.xl,
  },
  loginBtnWrapper: {
    ...PlatformStyles.premiumShadow,
    marginBottom: Spacing.xl,
  },
  loginBtn: {
    height: 60,
    borderRadius: BorderRadius.xl,
    justifyContent: "center",
    alignItems: "center",
  },
  loginBtnText: {
    color: "#FFF",
    fontWeight: "900",
    letterSpacing: 1,
    fontSize: 16,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: Spacing.md,
  },
});
