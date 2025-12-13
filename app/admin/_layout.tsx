/**
 * Admin Layout - Web-accessible admin interface
 * This layout ensures admin pages work well on both mobile and web
 */

import { Platform } from 'react-native';
import { Stack } from 'expo-router';
import { Colors } from '@/app/constants/theme';
import { useColorScheme } from '@/app/hooks/use-color-scheme';

export default function AdminLayout() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  return (
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
  );
}


