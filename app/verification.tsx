/**
 * Account Verification & Pending Status Screen
 */

import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import {
  BorderRadius,
  Colors,
  PlatformStyles,
  Spacing,
} from "@/constants/theme";
import { useSettings } from "@/context/settings-context";
import { useCurrentUser } from "@/hooks/use-auth-guard";
import { supabase } from "@/lib/supabase";
import { useColorScheme } from "@/hooks/use-color-scheme";

export default function VerificationScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? "light";
  const { settings } = useSettings();
  const activeColorScheme = settings.theme === 'auto' ? colorScheme : settings.theme;
  const colors = Colors[activeColorScheme as keyof typeof Colors] || Colors.light;

  const { user, loading: userLoading } = useCurrentUser();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"none" | "pending" | "verified">("none");

  useEffect(() => {
    if (user) {
      // Logic: if verified true -> verified. 
      // If profile_data has verification_requested -> pending.
      if (user.verified) {
        setStatus("verified");
      } else if (user.profile_data?.verification_status === "pending") {
        setStatus("pending");
      } else {
        setStatus("none");
      }
    }
  }, [user]);

  const handleRequestVerification = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from("users")
        .update({
          profile_data: {
            ...user.profile_data,
            verification_status: "pending",
            verification_requested_at: new Date().toISOString(),
          },
        })
        .eq("id", user.id);

      if (error) throw error;

      setStatus("pending");
      Alert.alert(
        "Request Sent",
        "Your verification request has been submitted to the Student Affairs office. This usually takes 24-48 hours."
      );
    } catch (e) {
      Alert.alert("Error", "Failed to submit request. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const StatusIcon = () => {
    switch (status) {
      case "verified":
        return <MaterialIcons name="verified" size={80} color={colors.success} />;
      case "pending":
        return <MaterialIcons name="pending-actions" size={80} color={colors.warning} />;
      default:
        return <MaterialIcons name="domain-verification" size={80} color={colors.primary} />;
    }
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <ThemedText type="h2">Account Verification</ThemedText>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Animated.View entering={FadeInDown.duration(600)} style={styles.statusCard}>
          <StatusIcon />
          <ThemedText type="h1" style={styles.statusTitle}>
            {status === "verified" ? "Officially Verified" : status === "pending" ? "Review in Progress" : "Get Verified"}
          </ThemedText>
          <ThemedText style={[styles.statusDesc, { color: colors.icon }]}>
            {status === "verified" 
              ? "Your account is linked to your official Student ID. You have full access to all institutional features." 
              : status === "pending" 
              ? "We are currently verifying your details with the university registry. You will receive a notification once approved." 
              : "Verify your account to access exclusive student resources, premium badges, and official support sessions."}
          </ThemedText>
        </Animated.View>

        {status === "none" && (
          <Animated.View entering={FadeInUp.delay(200)} style={styles.infoSection}>
            <View style={[styles.bullet, { backgroundColor: colors.card }]}>
              <Ionicons name="checkmark-circle" size={20} color={colors.success} />
              <View style={{ flex: 1 }}>
                <ThemedText style={styles.bulletTitle}>Official Student Badge</ThemedText>
                <ThemedText style={[styles.bulletText, { color: colors.icon }]}>Displays next to your name in discussions.</ThemedText>
              </View>
            </View>
            <View style={[styles.bullet, { backgroundColor: colors.card }]}>
              <Ionicons name="shield-checkmark" size={20} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <ThemedText style={styles.bulletTitle}>Trust & Safety</ThemedText>
                <ThemedText style={[styles.bulletText, { color: colors.icon }]}>Priority access to counseling and emergency services.</ThemedText>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.primary }]}
              onPress={handleRequestVerification}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <ThemedText style={styles.btnText}>Apply for Verification</ThemedText>
              )}
            </TouchableOpacity>
          </Animated.View>
        )}

        {status === "pending" && (
          <View style={[styles.pendingBox, { borderColor: colors.warning }]}>
            <MaterialIcons name="info-outline" size={20} color={colors.warning} />
            <ThemedText style={{ color: colors.warning, fontWeight: "600", flex: 1 }}>
              Submitted on {new Date(user?.profile_data?.verification_requested_at).toLocaleDateString()}
            </ThemedText>
          </View>
        )}

        <View style={styles.footer}>
           <ThemedText style={{ color: colors.icon, fontSize: 12, textAlign: 'center' }}>
             All verification requests are manually reviewed by the Student Affairs team to ensure a safe community environment.
           </ThemedText>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingTop: 50,
    paddingBottom: Spacing.md,
  },
  backBtn: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  statusCard: {
    alignItems: "center",
    marginBottom: 40,
    paddingTop: 20,
  },
  statusTitle: {
    marginTop: 20,
    textAlign: "center",
  },
  statusDesc: {
    textAlign: "center",
    marginTop: 12,
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  infoSection: {
    gap: 16,
  },
  bullet: {
    flexDirection: "row",
    gap: 12,
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
  },
  bulletTitle: {
    fontWeight: "700",
    fontSize: 15,
  },
  bulletText: {
    fontSize: 13,
    marginTop: 2,
  },
  actionBtn: {
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
    ...PlatformStyles.premiumShadow,
  },
  btnText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "800",
  },
  pendingBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: "dashed",
    marginTop: 20,
  },
  footer: {
    marginTop: 60,
    opacity: 0.6,
  },
});
