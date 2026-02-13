/**
 * Admin Layout - Web-accessible admin interface
 * This layout ensures admin pages work well on both mobile and web
 * Uses sidebar navigation on web, stack navigation on mobile
 */

import { SidebarNavigation } from '@/app/components/navigation/sidebar-navigation';
import { Colors } from '@/app/constants/theme';
import { useColorScheme } from '@/app/hooks/use-color-scheme';
import { getCurrentUser } from '@/lib/database';
import { Stack } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

export default function AdminLayout() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const [userRole, setUserRole] = useState<'admin' | null>(null);

  const loadUserRole = useCallback(async () => {
    try {
      const user = await getCurrentUser();
      if (user && user.role === 'admin') {
        setUserRole('admin');
      }
    } catch (error) {
      console.error('Error loading user role:', error);
    }
  }, []);

  useEffect(() => {
    loadUserRole();
  }, [loadUserRole]);

  return (
    <View style={styles.container}>
      {/* Sidebar Navigation - Web Only */}
      {Platform.OS === 'web' && userRole === 'admin' && (
        <SidebarNavigation role="admin" />
      )}
      
      {/* Main Content Area */}
      <View style={[styles.content, Platform.OS === 'web' && styles.webContent]}>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: {
              backgroundColor: colors.background,
            },
            // Web-specific optimizations
            ...(Platform.OS === 'web' && {
              animation: 'none', // Faster transitions on web
            }),
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

