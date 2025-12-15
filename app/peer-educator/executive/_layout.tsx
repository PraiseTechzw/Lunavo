/**
 * Peer Educator Executive Layout
 * Enhanced with web sidebar navigation and mobile drawer
 */

import { DrawerMenu } from '@/components/navigation/drawer-menu';
import { SidebarNavigation } from '@/components/navigation/sidebar-navigation';
import { WebHeader } from '@/components/web';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getCurrentUser } from '@/lib/database';
import { UserRole } from '@/lib/permissions';
import { Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Dimensions, Platform, StyleSheet, View } from 'react-native';

const { width } = Dimensions.get('window');
const isDesktop = Platform.OS === 'web' && width >= 1024;
const isMobile = Platform.OS !== 'web';

export default function ExecutiveLayout() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);

  useEffect(() => {
    loadUserRole();
  }, []);

  const loadUserRole = async () => {
    try {
      const user = await getCurrentUser();
      if (user && user.role === 'peer-educator-executive') {
        setUserRole('peer-educator-executive');
      }
    } catch (error) {
      console.error('Error loading user role:', error);
    }
  };

  // Mobile layout with drawer
  if (isMobile) {
    return (
      <View style={styles.container}>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: {
              backgroundColor: colors.background,
            },
          }}
        >
          <Stack.Screen name="dashboard" options={{ headerShown: false }} />
          <Stack.Screen name="flag-review" options={{ headerShown: false }} />
          <Stack.Screen name="peer-activity" options={{ headerShown: false }} />
          <Stack.Screen name="content-approval" options={{ headerShown: false }} />
          <Stack.Screen name="reports" options={{ headerShown: false }} />
          <Stack.Screen name="members" options={{ headerShown: false }} />
          <Stack.Screen name="analytics" options={{ headerShown: false }} />
          <Stack.Screen name="meetings" options={{ headerShown: false }} />
          <Stack.Screen name="announcements" options={{ headerShown: false }} />
        </Stack>
        <DrawerMenu
          visible={drawerVisible}
          onClose={() => setDrawerVisible(false)}
          role={userRole || undefined}
        />
      </View>
    );
  }

  // Web layout with sidebar
  return (
    <View style={styles.container}>
      {/* Header - Web Only */}
      <WebHeader />
      
      {/* Sidebar Navigation - Web Only */}
      {userRole === 'peer-educator-executive' && (
        <SidebarNavigation role="peer-educator-executive" />
      )}
      
      {/* Main Content Area */}
      <View style={[
        styles.content, 
        styles.webContent,
        { marginTop: 70 } // Account for header
      ]}>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: {
              backgroundColor: colors.background,
            },
            animation: 'none', // Faster transitions on web
          }}
        >
          <Stack.Screen name="dashboard" options={{ headerShown: false }} />
          <Stack.Screen name="flag-review" options={{ headerShown: false }} />
          <Stack.Screen name="peer-activity" options={{ headerShown: false }} />
          <Stack.Screen name="content-approval" options={{ headerShown: false }} />
          <Stack.Screen name="reports" options={{ headerShown: false }} />
          <Stack.Screen name="members" options={{ headerShown: false }} />
          <Stack.Screen name="analytics" options={{ headerShown: false }} />
          <Stack.Screen name="meetings" options={{ headerShown: false }} />
          <Stack.Screen name="announcements" options={{ headerShown: false }} />
        </Stack>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
  },
  content: {
    flex: 1,
  },
  webContent: {
    marginLeft: 280, // Sidebar width
  },
});
