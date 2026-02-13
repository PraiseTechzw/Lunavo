/**
 * Profile Settings Screen - Premium Version
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
import { UserRole } from "@/app/types";
import { getPseudonym } from "@/app/utils/storage";
import { useCurrentUser } from "@/hooks/use-auth-guard";
import { getRoleMetadata } from "@/lib/permissions";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    Alert,
    ScrollView,
    StyleSheet,
    Switch,
    TouchableOpacity,
    View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

export default function ProfileSettingsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const { user } = useCurrentUser();
  const [userName, setUserName] = useState("Alex");
  const [isAnonymous, setIsAnonymous] = useState(false);

  useEffect(() => {
    if (user) {
      setUserName(user.username || user.email.split("@")[0]);
    } else {
      loadUserInfo();
    }
  }, [user]);

  const loadUserInfo = async () => {
    const pseudonym = await getPseudonym();
    if (pseudonym) {
      setUserName(pseudonym.split(/(?=[A-Z])/)[0] || "Student");
    }
  };

  const roleMetadata = getRoleMetadata((user?.role as UserRole) || "student");

  const handleLogout = () => {
    Alert.alert("Log Out", "Are you sure you want to log out of Lunavo?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: () => router.replace("/onboarding"),
      },
    ]);
  };

  const SettingRow = ({ icon, title, desc, action, type = "chevron" }: any) => (
    <TouchableOpacity
      style={[styles.settingCard, { backgroundColor: colors.card }]}
      onPress={action}
      activeOpacity={0.7}
    >
      <View
        style={[styles.settingIcon, { backgroundColor: colors.primary + "10" }]}
      >
        <Ionicons name={icon} size={22} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <ThemedText style={{ fontWeight: "600" }}>{title}</ThemedText>
        {desc && (
          <ThemedText type="small" style={{ color: colors.icon }}>
            {desc}
          </ThemedText>
        )}
      </View>
      {type === "chevron" ? (
        <Ionicons name="chevron-forward" size={18} color={colors.border} />
      ) : (
        <Switch
          value={isAnonymous}
          onValueChange={setIsAnonymous}
          trackColor={{ false: colors.border, true: colors.primary }}
        />
      )}
    </TouchableOpacity>
  );

  return (
    <ThemedView style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <ThemedText type="h2">Settings</ThemedText>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Identity Card */}
        <Animated.View entering={FadeInDown.duration(600)}>
          <LinearGradient
            colors={[colors.surface, colors.background]}
            style={[styles.identityCard, { borderColor: colors.border }]}
          >
            <View
              style={[
                styles.avatarLarge,
                { backgroundColor: roleMetadata.accentColor },
              ]}
            >
              <ThemedText style={styles.avatarText}>
                {userName[0]?.toUpperCase()}
              </ThemedText>
            </View>
            <ThemedText type="h2">{userName}</ThemedText>
            <ThemedText type="small" style={{ color: colors.icon }}>
              {roleMetadata.label}
            </ThemedText>

            <View style={styles.badgeRow}>
              <View
                style={[
                  styles.roleLabel,
                  { backgroundColor: roleMetadata.accentColor + "20" },
                ]}
              >
                <ThemedText
                  style={{
                    color: roleMetadata.accentColor,
                    fontSize: 10,
                    fontWeight: "800",
                  }}
                >
                  VERIFIED {user?.role?.toUpperCase()}
                </ThemedText>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        <View style={styles.section}>
          <ThemedText type="h3" style={styles.sectionLabel}>
            Privacy & Safety
          </ThemedText>
          <SettingRow
            icon="eye-off-outline"
            title="Anonymous Mode"
            desc="Hide your identity in forum and chat"
            type="switch"
          />
          <SettingRow
            icon="shield-outline"
            title="Purpose & Role"
            desc={roleMetadata.description}
            action={() => {}}
          />
        </View>

        <View style={styles.section}>
          <ThemedText type="h3" style={styles.sectionLabel}>
            Account
          </ThemedText>
          <SettingRow
            icon="person-outline"
            title="Personal Info"
            action={() => router.push("/edit-profile")}
          />
          <SettingRow
            icon="notifications-outline"
            title="Notifications"
            action={() => {}}
          />
          <SettingRow
            icon="lock-closed-outline"
            title="Security"
            action={() => {}}
          />
        </View>

        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.logoutBtn, { borderColor: colors.danger }]}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={20} color={colors.danger} />
            <ThemedText style={{ color: colors.danger, fontWeight: "700" }}>
              Log Out
            </ThemedText>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <ThemedText style={styles.versionText}>Lunavo v1.0.0</ThemedText>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingTop: 60,
    paddingBottom: Spacing.md,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  identityCard: {
    alignItems: "center",
    padding: Spacing.xl,
    borderRadius: BorderRadius.xxl,
    borderWidth: 1,
    marginBottom: Spacing.xl,
    ...PlatformStyles.shadow,
  },
  avatarLarge: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  avatarText: {
    color: "#FFF",
    fontSize: 32,
    fontWeight: "800",
  },
  badgeRow: {
    marginTop: Spacing.md,
  },
  roleLabel: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionLabel: {
    fontSize: 14,
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: Spacing.md,
    fontWeight: "900",
  },
  settingCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.sm,
    ...PlatformStyles.shadow,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
    borderWidth: 2,
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  footer: {
    alignItems: "center",
    marginTop: Spacing.xl,
    opacity: 0.5,
  },
  versionText: {
    fontSize: 12,
    letterSpacing: 1,
  },
});
