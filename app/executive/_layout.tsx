import { Colors } from '@/app/constants/theme';
import { useColorScheme } from '@/app/hooks/use-color-scheme';
import { useRoleGuard } from '@/hooks/use-auth-guard';
import { Stack } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

export default function ExecutiveLayout() {
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];

    // Strict Role Guard for the entire /executive suite
    const { loading } = useRoleGuard(['peer-educator-executive', 'admin'], '/(tabs)');

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" options={{ title: 'Executive Console' }} />
            <Stack.Screen name="analytics" options={{ title: 'Analytics' }} />
            <Stack.Screen name="announcements" options={{ title: 'Announcements' }} />
            <Stack.Screen name="events" options={{ title: 'Events' }} />
            <Stack.Screen name="members" options={{ title: 'Members' }} />
            <Stack.Screen name="new-resource" options={{ presentation: 'modal' }} />
            <Stack.Screen name="new-meeting" options={{ presentation: 'modal' }} />
        </Stack>
    );
}
