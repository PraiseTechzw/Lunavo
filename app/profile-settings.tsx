/**
 * PEACE Profile Settings - Production Level
 * Implements global settings synchronization and reactive UI
 */

import React, { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Platform
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInUp, Layout } from "react-native-reanimated";
import Constants from 'expo-constants';

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
import { signOut } from "@/lib/auth";
import { getRoleMetadata } from "@/lib/permissions";
import { usePremiumTheme } from "@/hooks/use-premium-theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

export default function ProfileSettingsScreen() {
  const router = useRouter();
  const systemColorScheme = useColorScheme() ?? "light";
  const { isGoldThemeUnlocked } = usePremiumTheme();
  const { settings, updateNotification, updatePrivacy, updateSettings } = useSettings();
  
  // Theme calculation matching Root (Dynamic)
  const activeColorScheme = settings.theme === 'auto' ? systemColorScheme : settings.theme;
  const colors = Colors[activeColorScheme as keyof typeof Colors] || Colors.light;

  const { user, loading: userLoading } = useCurrentUser();
  const appVersion = Constants.expoConfig?.version || "1.0.0";
  const appName = "PEACE CLUB";

  const handleLogout = () => {
    Alert.alert("Sign Out", `Are you sure you want to sign out of ${appName}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          try {
            await signOut();
            router.replace("/auth/login");
          } catch (e) {
            router.replace("/auth/login");
          }
        },
      },
    ]);
  };

  const SettingRow = ({ icon, title, desc, action, type = "chevron", value, onValueChange, iconLib = "Ionicons", colorOverride }: any) => {
    const IconComponent = iconLib === "MaterialIcons" ? MaterialIcons : Ionicons;
    
    return (
      <TouchableOpacity
        style={[styles.settingCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={action}
        activeOpacity={0.7}
      >
        <View
          style={[styles.settingIcon, { backgroundColor: (colorOverride || colors.primary) + "15" }]}
        >
          <IconComponent name={icon as any} size={20} color={colorOverride || colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <ThemedText style={styles.settingTitle}>{title}</ThemedText>
          {desc && (
            <ThemedText style={[styles.settingDesc, { color: colors.icon }]}>
              {desc}
            </ThemedText>
          )}
        </View>
        {type === "chevron" ? (
          <Ionicons name="chevron-forward" size={18} color={colors.icon} />
        ) : (
          <Switch
            value={value}
            onValueChange={onValueChange}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={Platform.OS === 'ios' ? undefined : (value ? colors.primary : '#f4f3f4')}
          />
        )}
      </TouchableOpacity>
    );
  };

  if (userLoading) {
    return (
      <View style={[styles.container, styles.centering, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <ThemedText type="h2" style={styles.headerTitle}>Account Settings</ThemedText>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <Animated.View entering={FadeInUp.springify()} layout={Layout.springify()}>
          <LinearGradient
            colors={activeColorScheme === 'gold' ? ['#78350F', '#92400E'] : [colors.primary, colors.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.identityCard}
          >
            <View style={styles.identityMain}>
              <View style={styles.avatarLarge}>
                <ThemedText style={styles.avatarText}>
                   {(user?.pseudonym || user?.fullName || "S")[0].toUpperCase()}
                </ThemedText>
              </View>
              <View>
                <ThemedText style={styles.identityName}>{user?.pseudonym || user?.fullName || "Student"}</ThemedText>
                <ThemedText style={styles.identitySub}>{user?.email}</ThemedText>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        <View style={styles.section}>
          <ThemedText type="h3" style={[styles.sectionLabel, { color: colors.icon }]}>Customization</ThemedText>
          <SettingRow
            icon="palette"
            iconLib="MaterialIcons"
            title="App Theme"
            desc={`Current: ${settings.theme.toUpperCase()}`}
            action={() => {
              Alert.alert("Select Theme", "Choose your visual preference", [
                { text: "System Default", onPress: () => updateSettings({ theme: 'auto' }) },
                { text: "Light", onPress: () => updateSettings({ theme: 'light' }) },
                { text: "Dark", onPress: () => updateSettings({ theme: 'dark' }) },
                ...(isGoldThemeUnlocked ? [{ text: "Premium Gold", onPress: () => updateSettings({ theme: 'gold' }) }] : []),
                { text: "Cancel", style: "cancel" }
              ]);
            }}
          />
        </View>

        <View style={styles.section}>
          <ThemedText type="h3" style={[styles.sectionLabel, { color: colors.icon }]}>Privacy & Safety</ThemedText>
          <SettingRow
            icon="visibility-off"
            iconLib="MaterialIcons"
            title="Anonymous Mode"
            desc="Use pseudonym in community discussions"
            type="switch"
            value={settings.privacy.isAnonymous}
            onValueChange={(val) => updatePrivacy('isAnonymous', val)}
          />
          <SettingRow
             icon="shield-outline"
             title="Verified Status"
             desc={user?.verified ? "Institution Verified" : "Verification Pending"}
             colorOverride={user?.verified ? colors.success : colors.warning}
             action={() => !user?.verified && router.push('/verification')}
          />
        </View>

        <View style={styles.section}>
          <ThemedText type="h3" style={[styles.sectionLabel, { color: colors.icon }]}>Notifications</ThemedText>
          <SettingRow
            icon="notifications-outline"
            title="Push Notifications"
            desc="Global alert preference"
            type="switch"
            value={settings.notifications.mentions}
            onValueChange={(val) => updateNotification('mentions', val)}
          />
        </View>

        <View style={styles.section}>
          <ThemedText type="h3" style={[styles.sectionLabel, { color: colors.icon }]}>Account</ThemedText>
          <SettingRow
            icon="person-outline"
            title="Edit Identity"
            action={() => router.push("/edit-profile")}
          />
          <SettingRow
            icon="lock-closed-outline"
            title="Security"
            action={() => router.push("/security-settings")}
          />
        </View>

        <TouchableOpacity
          style={[styles.logoutBtn, { borderColor: colors.danger + '40' }]}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={20} color={colors.danger} />
          <ThemedText style={{ color: colors.danger, fontWeight: "800" }}>
            Sign Out
          </ThemedText>
        </TouchableOpacity>

        <View style={styles.footer}>
          <ThemedText style={[styles.versionText, { color: colors.icon }]}>
             {appName} v{appVersion}
          </ThemedText>
          <ThemedText style={{ fontSize: 10, color: colors.icon, marginTop: 4 }}>
             Handcrafted for Student Wellness
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
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
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
    paddingBottom: 60,
  },
  identityCard: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.xxl,
    marginBottom: Spacing.xl,
    ...PlatformStyles.premiumShadow,
  },
  identityMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatarLarge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  avatarText: {
    color: "#FFF",
    fontSize: 24,
    fontWeight: "800",
  },
  identityName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFF',
  },
  identitySub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: Spacing.md,
    marginLeft: 4,
  },
  settingCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.sm,
    borderWidth: 1,
  },
  settingIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: "700",
  },
  settingDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderStyle: 'dashed',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
  footer: {
    alignItems: "center",
    marginTop: 40,
    opacity: 0.6,
  },
  versionText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
  },
  centering: {
    justifyContent: 'center',
    alignItems: 'center',
  }
});
