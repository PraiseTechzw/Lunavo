/**
 * Student Affairs Layout
 */

import { Stack } from 'expo-router';
import { useColorScheme } from '@/app/hooks/use-color-scheme';
import { Colors } from '@/app/constants/theme';

export default function StudentAffairsLayout() {
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
      <Stack.Screen name="analytics" options={{ headerShown: false }} />
      <Stack.Screen name="trends" options={{ headerShown: false }} />
    </Stack>
  );
}

