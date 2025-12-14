/**
 * Admin Layout - Web-accessible admin interface
 * This layout ensures admin pages work well on both mobile and web
 * Uses sidebar navigation on web, stack navigation on mobile
 */

import { SidebarNavigation } from '@/components/navigation/sidebar-navigation';
import { WebHeader } from '@/components/web';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getCurrentUser } from '@/lib/database';
import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { Dimensions, Platform, StyleSheet, View } from 'react-native';

const { width } = Dimensions.get('window');
const isDesktop = Platform.OS === 'web' && width >= 1024;

export default function AdminLayout() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const [userRole, setUserRole] = useState<'admin' | null>(null);

  useEffect(() => {
    loadUserRole();
  }, []);

  const loadUserRole = async () => {
    try {
      const user = await getCurrentUser();
      if (user && user.role === 'admin') {
        setUserRole('admin');
      }
    } catch (error) {
      console.error('Error loading user role:', error);
    }
  };

  // Mobile layout
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
        <Stack.Screen 
          name="dashboard" 
          options={{ 
            headerShown: false,
          }} 
        />
        <Stack.Screen 
          name="analytics" 
          options={{ 
            headerShown: false,
          }} 
        />
        <Stack.Screen 
          name="escalations" 
          options={{ 
            headerShown: false,
          }} 
        />
        <Stack.Screen 
          name="reports" 
          options={{ 
            headerShown: false,
          }} 
        />
        <Stack.Screen 
          name="moderation" 
          options={{ 
            headerShown: false,
          }} 
        />
        <Stack.Screen 
          name="users" 
          options={{ 
            headerShown: false,
          }} 
        />
      </Stack>
    );
  }

  // Web layout
  return (
    <View style={styles.container}>
      {/* Header - Web Only */}
      <WebHeader />
      
      {/* Sidebar Navigation - Web Only */}
      {userRole === 'admin' && (
        <SidebarNavigation role="admin" />
      )}
      
      {/* Main Content Area */}
      <View style={[
        styles.content, 
        styles.webContent,
        { 
          marginTop: 70, // Account for header
          height: 'calc(100vh - 70px)', // Fixed height for scrolling
        }
      ]}>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: {
              backgroundColor: colors.background,
              height: '100%', // Ensure full height
            },
            // Web-specific optimizations
            animation: 'none', // Faster transitions on web
          }}
        >
      <Stack.Screen 
        name="dashboard" 
        options={{ 
          headerShown: false,
        }} 
      />
      <Stack.Screen 
        name="analytics" 
        options={{ 
          headerShown: false,
        }} 
      />
      <Stack.Screen 
        name="escalations" 
        options={{ 
          headerShown: false,
        }} 
      />
      <Stack.Screen 
        name="reports" 
        options={{ 
          headerShown: false,
        }} 
      />
      <Stack.Screen 
        name="moderation" 
        options={{ 
          headerShown: false,
        }} 
      />
      <Stack.Screen 
        name="users" 
        options={{ 
          headerShown: false,
        }} 
      />
        </Stack>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    ...(Platform.OS === 'web' ? {
      height: '100vh',
      overflow: 'hidden',
    } : {}),
  },
  content: {
    flex: 1,
    ...(Platform.OS === 'web' ? {
      overflow: 'hidden',
    } : {}),
  },
  webContent: {
    marginLeft: 280, // Sidebar width
  },
});


