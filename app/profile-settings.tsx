/**
 * Profile Settings Screen - Premium Glassmorphic Version
 */

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import {
  BorderRadius,
  Colors,
  PlatformStyles,
  Spacing,
} from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { UserRole } from "@/types";
import { getPseudonym } from "@/utils/storage";
import { useCurrentUser } from "@/hooks/use-auth-guard";
import { signOut } from "@/lib/auth";
import { getRoleMetadata } from "@/lib/permissions";
import { updateUser } from "@/lib/database";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
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
  ActivityIndicator
} from "react-native";
import Animated, { FadeInDown, FadeInUp, Layout } from "react-native-reanimated";
import { usePremiumTheme } from "@/hooks/use-premium-theme";
import { getUserPurchases } from "@/lib/shop";

export default function ProfileSettingsScreen() {
  const router = useRouter();
  const systemColorScheme = useColorScheme() ?? "light";
  const { isGoldThemeUnlocked } = usePremiumTheme();
  
  const activeColorScheme = isGoldThemeUnlocked ? "gold" : systemColorScheme;
  const colors = Colors[activeColorScheme as keyof typeof Colors] || Colors.light;
  const isDark = activeColorScheme === "dark" || activeColorScheme === "gold";

  const { user, loading: userLoading } = useCurrentUser();
  const [userName, setUserName] = useState("Student");

  const [isAnonymous, setIsAnonymous] = useState(false);
  const [saving, setSaving] = useState(false);
  const [purchases, setPurchases] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      setUserName(user.pseudonym || user.fullName || "Student");
      setIsAnonymous(user.isAnonymous ?? false);
      loadPurchases(user.id);
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

  const loadPurchases = async (uid: string) => {
    const p = await getUserPurchases(uid);
    setPurchases(p);
  };

  const roleMetadata = getRoleMetadata((user?.role as UserRole) || "student");

  const toggleAnonymous = async (value: boolean) => {
    if (!user) return;
    setIsAnonymous(value);
    setSaving(true);
    try {
      await updateUser(user.id, { isAnonymous: value });
    } catch (e) {
      Alert.alert("Error", "Failed to update privacy settings.");
      setIsAnonymous(!value);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert("Log Out", "Are you sure you want to log out of Lunavo?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          try {
            await signOut();
            await AsyncStorage.removeItem("@peaceclub:pseudonym");
            router.replace("/auth/login");
          } catch (e) {
            console.error("Logout failed:", e);
            router.replace("/auth/login");
          }
        },
      },
    ]);
  };

  const SettingRow = ({ icon, title, desc, action, type = "chevron", value, onValueChange, iconLib = "Ionicons" }: any) => {
    const IconComponent = iconLib === "MaterialIcons" ? MaterialIcons : Ionicons;
    
    return (
      <TouchableOpacity
        style={[styles.settingCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={action}
        activeOpacity={0.7}
      >
        <View
          style={[styles.settingIcon, { backgroundColor: colors.primary + "15" }]}
        >
          <IconComponent name={icon as any} size={20} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <ThemedText style={styles.settingTitle}>{title}</ThemedText>
          {desc && (
            <ThemedText style={styles.settingDesc}>
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
            thumbColor="#FFF"
          />
        )}
      </TouchableOpacity>
    );
  };

  if (userLoading && !user) {
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
        <ThemedText type="h2" style={styles.headerTitle}>Settings</ThemedText>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* User Identity Highlight */}
        <Animated.View entering={FadeInUp.springify()} layout={Layout.springify()}>
          <LinearGradient
            colors={isGoldThemeUnlocked ? ['#78350F', '#92400E'] : [colors.primary, colors.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.identityCard}
          >
            <View style={styles.identityMain}>
              <View style={[styles.avatarLarge, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                <ThemedText style={styles.avatarText}>
                  {userName[0]?.toUpperCase()}
                </ThemedText>
              </View>
              <View>
                <ThemedText style={styles.identityName}>{userName}</ThemedText>
                <View style={styles.roleBadge}>
                  <MaterialIcons name="verified" size={10} color="#FFF" />
                  <ThemedText style={styles.roleText}>
                    VERIFIED {user?.role?.toUpperCase() || "STUDENT"}
                  </ThemedText>
                </View>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Rewards & Premium Section */}
        {purchases.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
               <MaterialIcons name="auto-awesome" size={16} color={colors.primary} />
               <ThemedText style={styles.sectionLabel}>Active Rewards</ThemedText>
            </View>
            <View style={styles.rewardGrid}>
              {purchases.map((p, i) => (
                <View key={i} style={[styles.rewardChip, { backgroundColor: colors.primary + '10' }]}>
                  <MaterialIcons name={p.metadata?.icon || 'star'} size={14} color={colors.primary} />
                  <ThemedText style={[styles.rewardChipText, { color: colors.primary }]}>{p.item_name}</ThemedText>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.section}>
          <ThemedText type="h3" style={styles.sectionLabel}>Privacy & Appearance</ThemedText>
          <SettingRow
            icon="visibility-off"
            iconLib="MaterialIcons"
            title="Anonymous Mode"
            desc="Hide your real name in the forum"
            type="switch"
            value={isAnonymous}
            onValueChange={toggleAnonymous}
          />
          <SettingRow
            icon="palette"
            iconLib="MaterialIcons"
            title="Theme Aesthetics"
            desc={isGoldThemeUnlocked ? "Golden Premium Active" : "Default Blue Theme"}
            action={() => router.push("/rewards-shop")}
          />
        </View>

        <View style={styles.section}>
          <ThemedText type="h3" style={styles.sectionLabel}>Account Security</ThemedText>
          <SettingRow
            icon="person-outline"
            title="Edit Profile"
            desc="Username, bio, and interests"
            action={() => router.push("/edit-profile")}
          />
          <SettingRow
            icon="notifications-outline"
            title="Push Notifications"
            desc="Mention alerts and replies"
            action={() => router.push("/notification-settings")}
          />
          <SettingRow
            icon="lock-closed-outline"
            title="Password & Security"
            desc="Update your authentication"
            action={() => router.push("/security-settings")}
          />
        </View>

        <View style={styles.section}>
          <ThemedText type="h3" style={styles.sectionLabel}>Support</ThemedText>
          <SettingRow
            icon="help-circle-outline"
            title="Help Center"
            action={() => router.push("/help")}
          />
           <SettingRow
            icon="shield-checkmark-outline"
            title="Privacy Policy"
            action={() => router.push("/privacy")}
          />
        </View>

        <TouchableOpacity
          style={[styles.logoutBtn, { borderColor: colors.danger + '30' }]}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={20} color={colors.danger} />
          <ThemedText style={{ color: colors.danger, fontWeight: "800" }}>
            Sign Out
          </ThemedText>
        </TouchableOpacity>

        <View style={styles.footer}>
          <ThemedText style={[styles.versionText, { color: colors.icon }]}>LUNAVO v1.2.0 (Build 55)</ThemedText>
          <View style={styles.footerDots}>
             <View style={[styles.dot, { backgroundColor: colors.primary }]} />
             <View style={[styles.dot, { backgroundColor: colors.secondary }]} />
             <View style={styles.dot} />
          </View>
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
    fontSize: 22,
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
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  avatarText: {
    color: "#FFF",
    fontSize: 28,
    fontWeight: "800",
  },
  identityName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFF',
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 4,
  },
  roleText: {
    color: "#FFF",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: Spacing.md,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "900",
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: 1.2,
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
    fontSize: 16,
    fontWeight: "700",
  },
  settingDesc: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  rewardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: Spacing.sm,
  },
  rewardChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  rewardChipText: {
    fontSize: 11,
    fontWeight: '800',
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
    fontWeight: '800',
    letterSpacing: 2,
  },
  footerDots: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 12,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
  },
  centering: {
    justifyContent: 'center',
    alignItems: 'center',
  }
});
