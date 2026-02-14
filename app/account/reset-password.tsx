import { ThemedText } from "@/app/components/themed-text";
import { ThemedView } from "@/app/components/themed-view";
import { BorderRadius, Colors, Spacing } from "@/app/constants/theme";
import { useColorScheme } from "@/app/hooks/use-color-scheme";
import { supabase } from "@/lib/supabase";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
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

export default function WebResetRequest() {
  const router = useRouter();
  const scheme = useColorScheme() ?? "light";
  const colors = Colors[scheme];
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!email.trim()) return;
    setLoading(true);
    try {
      const origin =
        typeof window !== "undefined" && window.location
          ? window.location.origin
          : "";
      const redirectTo = `${origin}/account/update-password`;
      const { error } = await supabase.auth.resetPasswordForEmail(
        email.toLowerCase().trim(),
        { redirectTo },
      );
      if (error) throw error;
      Alert.alert(
        "Email Sent",
        "Open the link in your email to continue. After changing your password, open the mobile app and sign in.",
      );
      router.replace("/account/update-password");
    } catch (e: any) {
      const msg = String(e?.message || "Request failed");
      if (msg.toLowerCase().includes("not found")) {
        Alert.alert(
          "Account Not Found",
          "No account matches this email. Check your email or sign up.",
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
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <ThemedText type="h1" style={styles.title}>
            Reset Password (Web)
          </ThemedText>

          <View style={styles.group}>
            <ThemedText style={styles.label}>Email</ThemedText>
            <View style={[styles.inputWrap, { borderColor: colors.border }]}>
              <TextInput
                style={[styles.input]}
                placeholder="name@cut.ac.zw"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
              />
            </View>
          </View>

          <TouchableOpacity
            onPress={handleSend}
            disabled={loading || !email}
            style={styles.btnWrap}
          >
            <LinearGradient
              colors={colors.gradients.primary as any}
              style={styles.btn}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <ThemedText style={styles.btnText}>Send Reset Email</ThemedText>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: Spacing.lg },
  content: { paddingVertical: Spacing.xl, gap: Spacing.lg },
  title: { textAlign: "center", marginBottom: Spacing.md },
  group: { gap: Spacing.xs },
  label: { opacity: 0.7 },
  inputWrap: {
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  input: {
    minHeight: 40,
  },
  btnWrap: { marginTop: Spacing.md },
  btn: {
    height: 48,
    borderRadius: BorderRadius.xl,
    justifyContent: "center",
    alignItems: "center",
  },
  btnText: { color: "#FFF", fontWeight: "900", letterSpacing: 1 },
});
