/**
 * Peer Educator Layout with Bottom Tab Navigation
 * Intelligent navigation system for PE tools
 */

import { Colors, PlatformStyles } from '@/app/constants/theme';
import { useColorScheme } from '@/app/hooks/use-color-scheme';
import { UserRole } from '@/app/types';
import { getCurrentUser } from '@/lib/database';
import { getRoleAccentColor } from '@/lib/permissions';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Tabs, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

export default function PeerEducatorLayout() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const router = useRouter();
  const [userRole, setUserRole] = useState<UserRole | null>(null);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const user = await getCurrentUser();
    if (user) {
      setUserRole(user.role as UserRole);
      // Redirect non-PE users
      if (!['peer-educator', 'peer-educator-executive', 'admin'].includes(user.role)) {
        router.replace('/(tabs)');
      }
    }
  };

  const roleColor = userRole ? getRoleAccentColor(userRole) : colors.primary;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: roleColor,
        tabBarInactiveTintColor: colors.icon,
        tabBarStyle: {
          position: 'absolute',
          bottom: 20,
          left: 16,
          right: 16,
          backgroundColor: colorScheme === 'dark' ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)',
          borderRadius: 20,
          height: 70,
          borderTopWidth: 0,
          borderWidth: 1,
          borderColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
          paddingBottom: 8,
          paddingTop: 8,
          ...PlatformStyles.premiumShadow,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.activeTab : null}>
              <MaterialCommunityIcons name={focused ? "view-dashboard" : "view-dashboard-outline"} size={24} color={color} />
            </View>
          ),
        }}
        listeners={{ tabPress: () => Haptics.selectionAsync() }}
      />
      <Tabs.Screen
        name="queue"
        options={{
          title: 'Queue',
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.activeTab : null}>
              <MaterialCommunityIcons name={focused ? "account-multiple-plus" : "account-multiple-plus-outline"} size={24} color={color} />
            </View>
          ),
        }}
        listeners={{ tabPress: () => Haptics.selectionAsync() }}
      />
      <Tabs.Screen
        name="posts"
        options={{
          title: 'Posts',
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.activeTab : null}>
              <MaterialCommunityIcons name={focused ? "message-text" : "message-text-outline"} size={24} color={color} />
            </View>
          ),
        }}
        listeners={{ tabPress: () => Haptics.selectionAsync() }}
      />
      <Tabs.Screen
        name="activity-log"
        options={{
          title: 'Log',
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.activeTab : null}>
              <MaterialCommunityIcons name={focused ? "clipboard-check" : "clipboard-check-outline"} size={24} color={color} />
            </View>
          ),
        }}
        listeners={{ tabPress: () => Haptics.selectionAsync() }}
      />
      <Tabs.Screen
        name="meetings"
        options={{
          title: 'Meetings',
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.activeTab : null}>
              <MaterialCommunityIcons name={focused ? "calendar-clock" : "calendar-clock-outline"} size={24} color={color} />
            </View>
          ),
        }}
        listeners={{ tabPress: () => Haptics.selectionAsync() }}
      />
      {/* Hidden screens */}
      <Tabs.Screen name="training" options={{ href: null }} />
      <Tabs.Screen name="resources" options={{ href: null }} />
      <Tabs.Screen name="profile" options={{ href: null }} />
      <Tabs.Screen name="club-info" options={{ href: null }} />
      <Tabs.Screen name="orientation" options={{ href: null }} />
      <Tabs.Screen name="executive" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  activeTab: {
    alignItems: 'center',
  },
});
