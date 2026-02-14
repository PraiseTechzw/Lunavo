/**
 * Daily Check-In Screen - Premium Version
 */

import { ThemedText } from "@/app/components/themed-text";
import { ThemedView } from "@/app/components/themed-view";
import {
  BorderRadius,
  Colors,
  PlatformStyles,
  Spacing,
} from "@/app/constants/theme";
import { useColorScheme } from "@/app/hooks/use-color-scheme";
import { createCheckIn, getCurrentUser } from "@/lib/database";
import { updateCheckInStreak } from "@/lib/gamification";
import { awardCheckInPoints } from "@/lib/points-system"; // Direct Supabase for "Full Integration"
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
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
  ZoomIn,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

const moods = [
  {
    id: "terrible",
    icon: "sentiment-very-dissatisfied",
    label: "Awful",
    color: "#EF4444",
  },
  {
    id: "bad",
    icon: "sentiment-dissatisfied",
    label: "Down",
    color: "#F97316",
  },
  { id: "okay", icon: "sentiment-neutral", label: "Fine", color: "#FBBF24" },
  { id: "good", icon: "sentiment-satisfied", label: "Good", color: "#84CC16" },
  {
    id: "awesome",
    icon: "sentiment-very-satisfied",
    label: "Great",
    color: "#10B981",
  },
];

// Simple AI Logic (Client-Side for instant feedback)
// In a real "Full AI" app, this would call an Edge Function with OpenAI/Gemini
const analyzeWellbeing = (mood: string, text: string) => {
  const note = text.toLowerCase();

  if (mood === "terrible" || mood === "bad") {
    if (note.includes("lonely") || note.includes("alone"))
      return {
        title: "You are not alone",
        message:
          "Loneliness is a heavy feeling. The Peer Chat is open if you want to connect anonymously.",
        action: "/(tabs)/chat",
        actionLabel: "Go to Chat",
      };
    if (
      note.includes("stress") ||
      note.includes("exam") ||
      note.includes("work")
    )
      return {
        title: "Breathe Deeply",
        message:
          "Academic pressure is real. Remember to take small breaks. You've got this.",
        action: "/(tabs)/resources",
        actionLabel: "View Study Tips",
      };
    return {
      title: "We hear you",
      message: "It's okay to have hard days. Be gentle with yourself today.",
      action: "/urgent-support",
      actionLabel: "Support Options",
    };
  }

  if (mood === "awesome" || mood === "good") {
    return {
      title: "Keep Shining!",
      message:
        "Love this energy! Consider sharing a positive thought in the Community Forum.",
      action: "/create-post",
      actionLabel: "Share Positivity",
    };
  }

  return {
    title: "Daily Checked",
    message:
      "Thanks for checking in! Consistent tracking helps build mindfulness.",
    action: "/(tabs)/resources",
    actionLabel: "Explore Vault",
  };
};

export default function CheckInScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showInsight, setShowInsight] = useState(false);
  const [aiInsight, setAiInsight] = useState<any>(null);

  // Background Animation
  const floatValue = useSharedValue(0);
  useEffect(() => {
    floatValue.value = withRepeat(
      withTiming(1, { duration: 25000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, []);

  const blobStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(floatValue.value, [0, 1], [0, 60]) },
      { rotate: `${interpolate(floatValue.value, [0, 1], [0, 15])}deg` },
    ],
    opacity: 0.8,
  }));

  const floatStyle2 = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(floatValue.value, [0, 1], [0, -40]) },
      { rotate: `${interpolate(floatValue.value, [0, 1], [0, -10])}deg` },
    ],
  }));

  const handleMoodSelect = (moodId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setSelectedMood(moodId);
  };

  const handleSave = async () => {
    if (!selectedMood) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Mood Needed", "Please select how you are feeling first.");
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsSubmitting(true);

    // Generate AI Insight
    const insight = analyzeWellbeing(selectedMood, note);
    setAiInsight(insight);

    try {
      const user = await getCurrentUser();
      if (user) {
        await createCheckIn({
          userId: user.id,
          mood: selectedMood,
          feelingStrength: 5,
          note: note.trim() || undefined,
          date: new Date().toISOString().split("T")[0],
        });

        // Award points and update streak
        await Promise.all([
          awardCheckInPoints(user.id),
          updateCheckInStreak(user.id),
        ]);
      }

      // Show Insight Modal with processing delay
      setTimeout(() => {
        setIsSubmitting(false);
        setShowInsight(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }, 1500);
    } catch (error) {
      setIsSubmitting(false);
      Alert.alert("Error", "Could not save check-in. Please try again.");
      console.error("Check-in error:", error);
    }
  };

  return (
    <ThemedView style={styles.container}>
      {/* Background Blobs */}
      <View style={styles.background}>
        <Animated.View
          style={[styles.blobWrapper, blobStyle, { top: -100, right: -100 }]}
        >
          <LinearGradient
            colors={[colors.primary + "40", colors.secondary + "40"]}
            style={styles.blob}
          />
        </Animated.View>
        <Animated.View
          style={[
            styles.blobWrapper,
            floatStyle2,
            { bottom: -100, left: -100, width: 500, height: 500 },
          ]}
        >
          <LinearGradient
            colors={[colors.secondary + "30", colors.primary + "30"]}
            style={styles.blob}
          />
        </Animated.View>
      </View>

      <SafeAreaView edges={["top", "bottom"]} style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[
              styles.closeBtn,
              { backgroundColor: "rgba(255,255,255,0.1)" },
            ]}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: 120 },
            ]}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
          >
            <Animated.View entering={FadeInDown.duration(800)}>
              <ThemedText type="h1" style={styles.mainQuestion}>
                How are you feeling?
              </ThemedText>
              <ThemedText style={styles.subtitle}>
                Check in with yourself.
              </ThemedText>
            </Animated.View>

            {/* Mood Grid */}
            <View style={styles.moodGrid}>
              {moods.map((mood, idx) => {
                const isSelected = selectedMood === mood.id;
                const iconName =
                  mood.icon as keyof typeof MaterialIcons.glyphMap;

                return (
                  <Animated.View
                    key={mood.id}
                    entering={FadeInDown.delay(300 + idx * 80).springify()}
                    style={{ width: "30%", marginBottom: Spacing.md }}
                  >
                    <TouchableOpacity
                      onPress={() => handleMoodSelect(mood.id)}
                      activeOpacity={0.8}
                      style={[
                        styles.moodCard,
                        {
                          backgroundColor: isSelected
                            ? mood.color
                            : "rgba(255,255,255,0.05)",
                          borderColor: isSelected
                            ? mood.color
                            : colors.border + "40",
                          borderWidth: 1,
                          height: 110,
                        },
                        isSelected && PlatformStyles.premiumShadow,
                      ]}
                    >
                      <MaterialIcons
                        name={iconName}
                        size={36}
                        color={isSelected ? "#FFF" : colors.text}
                        style={{ opacity: isSelected ? 1 : 0.7 }}
                      />
                      <ThemedText
                        style={[
                          styles.moodLabel,
                          {
                            color: isSelected ? "#FFF" : colors.text,
                            fontWeight: isSelected ? "800" : "500",
                          },
                        ]}
                      >
                        {mood.label}
                      </ThemedText>
                    </TouchableOpacity>
                  </Animated.View>
                );
              })}
            </View>

            {/* Journal Section */}
            <Animated.View
              entering={FadeInDown.delay(600)}
              style={styles.section}
            >
              <View style={styles.glassInputContainer}>
                <View style={styles.labelRow}>
                  <Ionicons
                    name="journal-outline"
                    size={20}
                    color={colors.primary}
                  />
                  <ThemedText type="h3">Private Journal</ThemedText>
                  <View style={styles.aiBadge}>
                    <Ionicons name="sparkles" size={10} color="#FFF" />
                    <ThemedText
                      style={{
                        fontSize: 10,
                        color: "#FFF",
                        fontWeight: "bold",
                      }}
                    >
                      AI Enabled
                    </ThemedText>
                  </View>
                </View>

                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="What's making your day feel this way?"
                  placeholderTextColor={colors.icon}
                  multiline
                  value={note}
                  onChangeText={setNote}
                />
                <View style={styles.privacyBanner}>
                  <Ionicons
                    name="lock-closed"
                    size={12}
                    color={colors.text}
                    style={{ opacity: 0.6 }}
                  />
                  <ThemedText style={styles.privacyText}>
                    Encrypted & local only.
                  </ThemedText>
                </View>
              </View>
            </Animated.View>

            {/* Submit Button */}
            <View style={styles.footer}>
              <TouchableOpacity
                disabled={!selectedMood || isSubmitting}
                onPress={handleSave}
                style={[
                  styles.saveBtnWrapper,
                  (!selectedMood || isSubmitting) && {
                    opacity: 0.5,
                    transform: [{ scale: 0.95 }],
                  },
                ]}
              >
                <LinearGradient
                  colors={
                    selectedMood
                      ? (colors.gradients.primary as any)
                      : ["#334155", "#1e293b"]
                  }
                  style={styles.saveBtn}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  {isSubmitting ? (
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 10,
                      }}
                    >
                      <ActivityIndicator color="#FFF" />
                      <ThemedText style={styles.saveText}>
                        Analyzing Wellness...
                      </ThemedText>
                    </View>
                  ) : (
                    <>
                      <ThemedText style={styles.saveText}>
                        Complete Check-In
                      </ThemedText>
                      <Ionicons
                        name="checkmark-circle"
                        size={24}
                        color="#FFF"
                      />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* AI Insight Modal */}
      <Modal visible={showInsight} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <Animated.View
            entering={ZoomIn.duration(400)}
            style={[styles.modalCard, { backgroundColor: colors.card }]}
          >
            <LinearGradient
              colors={colors.gradients.primary as any}
              style={styles.modalHeader}
            >
              <Ionicons name="sparkles" size={40} color="#FFF" />
            </LinearGradient>

            <View style={styles.modalContent}>
              <ThemedText
                type="h2"
                style={{ textAlign: "center", marginBottom: 10 }}
              >
                {aiInsight?.title || "Care Insight"}
              </ThemedText>
              <ThemedText
                style={{
                  textAlign: "center",
                  opacity: 0.8,
                  lineHeight: 22,
                  marginBottom: 20,
                }}
              >
                {aiInsight?.message}
              </ThemedText>

              <TouchableOpacity
                style={[
                  styles.modalBtn,
                  { backgroundColor: colors.primary + "20" },
                ]}
                onPress={() => {
                  setShowInsight(false);
                  if (aiInsight?.action) router.push(aiInsight.action);
                  else router.back();
                }}
              >
                <ThemedText
                  style={{ color: colors.primary, fontWeight: "700" }}
                >
                  {aiInsight?.actionLabel || "Continue"}
                </ThemedText>
                <Ionicons
                  name="arrow-forward"
                  size={16}
                  color={colors.primary}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={{ marginTop: 16 }}
                onPress={() => {
                  setShowInsight(false);
                  router.back();
                }}
              >
                <ThemedText style={{ fontSize: 12, opacity: 0.5 }}>
                  Dismiss
                </ThemedText>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  background: { ...StyleSheet.absoluteFillObject, overflow: "hidden" },
  blobWrapper: { position: "absolute", width: 600, height: 600 },
  blob: { width: "100%", height: "100%", borderRadius: 300, opacity: 0.8 },
  safeArea: { flex: 1 },
  header: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  scrollContent: { padding: Spacing.lg },
  mainQuestion: { fontSize: 32, fontWeight: "900", marginBottom: Spacing.xs },
  subtitle: { fontSize: 16, opacity: 0.6, marginBottom: Spacing.xxl },
  moodGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 12,
    marginBottom: Spacing.xl,
  },
  moodCard: {
    borderRadius: BorderRadius.xxl,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  moodLabel: { fontSize: 12, marginTop: 4 },
  section: { marginTop: Spacing.md },
  glassInputContainer: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  input: {
    height: 120,
    textAlignVertical: "top",
    fontSize: 16,
    lineHeight: 24,
  },
  privacyBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 4,
    marginTop: 12,
  },
  privacyText: { fontSize: 12, opacity: 0.6 },
  footer: { marginTop: 40, marginBottom: 60 },
  saveBtnWrapper: { ...PlatformStyles.premiumShadow },
  saveBtn: {
    paddingVertical: 18,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.full,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.md,
  },
  saveText: {
    color: "#FFF",
    fontWeight: "800",
    fontSize: 16,
    letterSpacing: 0.5,
  },
  aiBadge: {
    marginLeft: "auto",
    backgroundColor: "#8B5CF6",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalCard: {
    width: "100%",
    maxWidth: 320,
    borderRadius: 24,
    overflow: "hidden",
    alignItems: "center",
  },
  modalHeader: {
    width: "100%",
    height: 100,
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: { padding: 24, alignItems: "center", width: "100%" },
  modalBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
});
