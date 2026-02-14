/**
 * Premium Floating Tab Navigation
 */

import { Colors, PlatformStyles } from "@/app/constants/theme";
import { useColorScheme } from "@/app/hooks/use-color-scheme";
import { UserRole } from "@/app/types";
import { getCurrentUser } from "@/lib/database";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Tabs } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";

export default function TabLayout() {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const [userRole, setUserRole] = useState<UserRole | null>(null);

  useEffect(() => {
    loadUserRole();
  }, []);

  const loadUserRole = async () => {
    try {
      const user = await getCurrentUser();
      if (user) {
        setUserRole(user.role as UserRole);
      }
    } catch (error) {
      console.error("Error loading user role:", error);
    }
  };

  const shouldShowTab = (tabName: string): boolean => {
    if (!userRole) return true;
    if (
      tabName === "forum" &&
      (userRole === "counselor" || userRole === "life-coach")
    )
      return false;
    if (
      (tabName === "forum" || tabName === "chat") &&
      userRole === "student-affairs"
    )
      return false;
    return true;
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false, // Cleaner look
        tabBarActiveTintColor: colors.primary, // Use theme primary color
        tabBarInactiveTintColor: colors.icon, // Use theme icon color
        tabBarStyle: {
          position: "absolute",
          bottom: 25,
          left: 20,
          right: 20,
          backgroundColor:
            colorScheme === "dark"
              ? "rgba(30, 41, 59, 0.95)"
              : "rgba(255, 255, 255, 0.95)",
          borderRadius: 24,
          height: 64,
          borderTopWidth: 0,
          borderWidth: 1,
          borderColor:
            colorScheme === "dark"
              ? "rgba(255,255,255,0.1)"
              : "rgba(0,0,0,0.05)",
          ...PlatformStyles.premiumShadow, // Strong shadow for floating effect
          elevation: 10,
        },
        tabBarItemStyle: {
          height: 64,
          paddingTop: 0,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.activeTabContainer : null}>
              <MaterialCommunityIcons
                name={focused ? "home-variant" : "home-variant-outline"}
                size={28}
                color={color}
              />
              {focused && (
                <View style={[styles.activeDot, { backgroundColor: color }]} />
              )}
            </View>
          ),
        }}
        listeners={{
          tabPress: () => Haptics.selectionAsync(),
        }}
      />
      <Tabs.Screen
      />
      <Tabs.Screen
        name="forum"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.activeTabContainer : null}>
              <MaterialCommunityIcons
                name={focused ? "account-group" : "account-group-outline"}
                size={28}
                color={color}
              />
              {focused && (
                <View style={[styles.activeDot, { backgroundColor: color }]} />
              )}
            </View>
          ),
          ...(shouldShowTab("forum") ? {} : { href: null }),
        }}
        listeners={{
          tabPress: () => Haptics.selectionAsync(),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.activeTabContainer : null}>
              <MaterialCommunityIcons
                name={focused ? "forum" : "forum-outline"} // Speech bubbles
                size={26}
                color={color}
              />
              {focused && (
                <View style={[styles.activeDot, { backgroundColor: color }]} />
              )}
            </View>
          ),
          ...(shouldShowTab("chat") ? {} : { href: null }),
        }}
        listeners={{
          tabPress: () => Haptics.selectionAsync(),
        }}
      />
      <Tabs.Screen
        name="resources"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.activeTabContainer : null}>
              <MaterialCommunityIcons
                name={
                  focused ? "book-open-page-variant" : "book-open-blank-variant"
                } // Detailed book
                size={26}
                color={color}
              />
              {focused && (
                <View style={[styles.activeDot, { backgroundColor: color }]} />
              )}
            </View>
          ),
        }}
        listeners={{
          tabPress: () => Haptics.selectionAsync(),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.activeTabContainer : null}>
              <MaterialCommunityIcons
                name={focused ? "account-circle" : "account-circle-outline"}
                size={28}
                color={color}
              />
              {focused && (
                <View style={[styles.activeDot, { backgroundColor: color }]} />
              )}
            </View>
          ),
        }}
        listeners={{
          tabPress: () => Haptics.selectionAsync(),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  activeTabContainer: {
    alignItems: "center",
    justifyContent: "center",
    top: 2,
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 4,
  },
});
