/**
 * Student Affairs Layout
 * Web-only layout with sidebar navigation
 */

import { SidebarNavigation } from '@/components/navigation/sidebar-navigation';
import { WebHeader } from '@/components/web';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { isStudentAffairsMobileBlocked } from '@/utils/navigation';
import { getCurrentUser } from '@/lib/database';
import { UserRole } from '@/lib/permissions';
import { Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Dimensions, Platform, StyleSheet, View } from 'react-native';

const { width } = Dimensions.get('window');
const isDesktop = Platform.OS === 'web' && width >= 1024;
const isMobile = Platform.OS !== 'web';

export default function StudentAffairsLayout() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const [userRole, setUserRole] = useState<UserRole | null>(null);

  useEffect(() => {
    loadUserRole();
  }, []);

  useEffect(() => {
    // Redirect mobile users to web-required screen
    if (userRole === 'student-affairs' && isMobile) {
      router.replace('/web-required');
    }
  }, [userRole]);

  const loadUserRole = async () => {
    try {
      const user = await getCurrentUser();
      if (user) {
        const role = user.role as UserRole;
        setUserRole(role);
        
        // Check if mobile access should be blocked
        if (isStudentAffairsMobileBlocked(role, isMobile ? 'mobile' : 'web')) {
          router.replace('/web-required');
          return;
        }
      }
    } catch (error) {
      console.error('Error loading user role:', error);
    }
  };

  // Early return for mobile - redirect handled in useEffect
  if (Platform.OS !== 'web') {
    return (
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: colors.background,
          },
        }}
      >
        <Stack.Screen name="dashboard" options={{ headerShown: false }} />
        <Stack.Screen name="analytics" options={{ headerShown: false }} />
        <Stack.Screen name="trends" options={{ headerShown: false }} />
      </Stack>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header - Web Only */}
      <WebHeader />
      
      {/* Sidebar Navigation - Web Only */}
      {userRole === 'student-affairs' && (
        <SidebarNavigation role="student-affairs" />
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
            // Web-specific optimizations
            animation: 'none', // Faster transitions on web
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
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
  },
  content: {
    flex: 1,
  },
  webContent: {
    marginLeft: 280, // Sidebar width
  },
});


