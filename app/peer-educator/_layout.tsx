/**
 * Peer Educator Layout with Bottom Tab Navigation
 * Fixed: Only major tabs are visible to prevent overcrowding
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
          bottom: 25,
          left: 20,
          right: 20,
          backgroundColor: colorScheme === 'dark' ? 'rgba(15, 23, 42, 0.98)' : 'rgba(255, 255, 255, 0.95)',
          borderRadius: 24,
          height: 68,
          borderTopWidth: 0,
          paddingBottom: 10,
          paddingTop: 8,
          ...PlatformStyles.premiumShadow,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons name={focused ? "view-dashboard" : "view-dashboard-outline"} size={22} color={color} />
          ),
        }}
        listeners={{ tabPress: () => Haptics.selectionAsync() }}
      />

      <Tabs.Screen
        name="queue"
        options={{
          title: 'Queue',
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons name={focused ? "account-group" : "account-group-outline"} size={22} color={color} />
          ),
        }}
        listeners={{ tabPress: () => Haptics.selectionAsync() }}
      />

      <Tabs.Screen
        name="posts"
        options={{
          title: 'Forum',
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons name={focused ? "message-text" : "message-text-outline"} size={22} color={color} />
          ),
        }}
        listeners={{ tabPress: () => Haptics.selectionAsync() }}
      />

      <Tabs.Screen
        name="activity-log"
        options={{
          title: 'Logs',
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons name={focused ? "clipboard-list" : "clipboard-list-outline"} size={22} color={color} />
          ),
        }}
        listeners={{ tabPress: () => Haptics.selectionAsync() }}
      />

      <Tabs.Screen
        name="meetings"
        options={{
          title: 'Events',
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons name={focused ? "calendar-star" : "calendar-star-outline"} size={22} color={color} />
          ),
        }}
        listeners={{ tabPress: () => Haptics.selectionAsync() }}
      />

      {/* Hidden Screens - These will not appear in the tab bar */}
      <Tabs.Screen name="training" options={{ href: null }} />
      <Tabs.Screen name="resources" options={{ href: null }} />
      <Tabs.Screen name="profile" options={{ href: null }} />
      <Tabs.Screen name="club-info" options={{ href: null }} />
      <Tabs.Screen name="orientation" options={{ href: null }} />
      <Tabs.Screen name="session/[id]" options={{ href: null }} />
    </Tabs>
  );
}
