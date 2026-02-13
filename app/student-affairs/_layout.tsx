/**
 * Student Affairs Layout
 * Web-only layout with sidebar navigation
 */

import { SidebarNavigation } from "@/app/components/navigation/sidebar-navigation";
import { Colors } from "@/app/constants/theme";
import { useColorScheme } from "@/app/hooks/use-color-scheme";
import { getCurrentUser } from "@/lib/database";
import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import { Platform, StyleSheet, View } from "react-native";

export default function StudentAffairsLayout() {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const [userRole, setUserRole] = useState<"student-affairs" | null>(null);

  useEffect(() => {
    loadUserRole();
  }, []);

  const loadUserRole = async () => {
    try {
      const user = await getCurrentUser();
      if (user && user.role === "student-affairs") {
        setUserRole("student-affairs");
      }
    } catch (error) {
      console.error("Error loading user role:", error);
    }
  };

  return (
    <View style={styles.container}>
      {/* Sidebar Navigation - Web Only */}
      {Platform.OS === "web" && userRole === "student-affairs" && (
        <SidebarNavigation role="student-affairs" />
      )}

      {/* Main Content Area */}
      <View
        style={[styles.content, Platform.OS === "web" && styles.webContent]}
      >
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: {
              backgroundColor: colors.background,
            },
            // Web-specific optimizations
            ...(Platform.OS === "web" && {
              animation: "none", // Faster transitions on web
            }),
          }}
        >
          <Stack.Screen name="dashboard" options={{ headerShown: false }} />
          <Stack.Screen name="analytics" options={{ headerShown: false }} />
          <Stack.Screen name="trends" options={{ headerShown: false }} />
        </Stack>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: Platform.OS === "web" ? "row" : "column",
  },
  content: {
    flex: 1,
  },
  webContent: {
    marginLeft: 280, // Sidebar width
  },
});
