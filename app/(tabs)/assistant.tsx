import { ThemedText } from "@/app/components/themed-text";
import { ThemedView } from "@/app/components/themed-view";
import {
  BorderRadius,
  Colors,
  PlatformStyles,
  Spacing,
} from "@/app/constants/theme";
import { useColorScheme } from "@/app/hooks/use-color-scheme";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function AssistantScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);

  const suggestions = useMemo(
    () => [
      { label: "Create Post", route: "/create-post" },
      { label: "Report Issue", route: "/report" },
      { label: "Find Resources", route: "/(tabs)/resources" },
      { label: "Check In", route: "/check-in" },
      { label: "Book Counselor", route: "/book-counsellor" },
    ],
    [],
  );

  return (
    <ThemedView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <LinearGradient
        colors={[colors.primary, colors.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.hero, PlatformStyles.premiumShadow]}
      >
        <View style={styles.heroContent}>
          <MaterialCommunityIcons
            name="robot-happy-outline"
            size={32}
            color="#FFF"
          />
          <ThemedText type="h2" style={{ color: "#FFF", fontWeight: "900" }}>
            PEACE Assistant
          </ThemedText>
          <ThemedText style={{ color: "rgba(255,255,255,0.85)" }}>
            Find help, resources, and actions faster
          </ThemedText>
        </View>
      </LinearGradient>

      <View
        style={[
          styles.card,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <View
          style={[
            styles.inputRow,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <MaterialCommunityIcons
            name="message-text-outline"
            size={18}
            color={colors.icon}
          />
          <TextInput
            style={[styles.input, { color: colors.text }]}
            placeholder="Type what you need help with..."
            placeholderTextColor={colors.icon}
            value={prompt}
            onChangeText={setPrompt}
          />
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
            onPress={() => {
              setLoading(true);
              setTimeout(() => {
                setLoading(false);
                setPrompt("");
              }, 600);
            }}
            activeOpacity={0.9}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <MaterialCommunityIcons name="send" size={18} color="#FFF" />
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.tileGrid}>
          {[
            {
              label: "Create Post",
              icon: "pencil",
              color: colors.primary,
              route: "/create-post",
            },
            {
              label: "Report",
              icon: "flag-outline",
              color: colors.warning,
              route: "/report",
            },
            {
              label: "Resources",
              icon: "book-open-page-variant",
              color: colors.success,
              route: "/(tabs)/resources",
            },
            {
              label: "Check In",
              icon: "heart-pulse",
              color: colors.secondary,
              route: "/check-in",
            },
            {
              label: "Counseling",
              icon: "hand-heart-outline",
              color: colors.info,
              route: "/book-counsellor",
            },
          ].map((t, i) => (
            <TouchableOpacity
              key={i}
              style={[
                styles.tile,
                {
                  borderColor: t.color + "30",
                  backgroundColor: t.color + "10",
                },
              ]}
              onPress={() => router.push(t.route as any)}
              activeOpacity={0.9}
            >
              <View
                style={[styles.tileIcon, { backgroundColor: t.color + "20" }]}
              >
                <MaterialCommunityIcons
                  name={t.icon as any}
                  size={20}
                  color={t.color}
                />
              </View>
              <ThemedText style={{ color: colors.text, fontWeight: "700" }}>
                {t.label}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.infoRow}>
          <MaterialCommunityIcons
            name="shield-check-outline"
            size={18}
            color={colors.icon}
          />
          <ThemedText style={{ color: colors.icon }}>
            Private and anonymous. Your identity stays protected.
          </ThemedText>
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.lg,
  },
  hero: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  heroContent: {
    gap: Spacing.xs,
  },
  card: {
    borderWidth: 1,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  input: {
    flex: 1,
    height: 44,
  },
  primaryBtn: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
  },
  tileGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
  tile: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  tileIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.sm,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
});
