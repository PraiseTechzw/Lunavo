/**
 * Peer Educator Layout
 */

import { Stack } from 'expo-router';
import { useColorScheme } from '@/app/hooks/use-color-scheme';
import { Colors } from '@/app/constants/theme';

export default function PeerEducatorLayout() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

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
      <Stack.Screen name="posts" options={{ headerShown: false }} />
      <Stack.Screen name="profile" options={{ headerShown: false }} />
      <Stack.Screen name="meetings" options={{ headerShown: false }} />
      <Stack.Screen name="executive" options={{ headerShown: false }} />
    </Stack>
  );
}


