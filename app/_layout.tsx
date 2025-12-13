import { Colors } from "@/app/constants/theme";
import { useColorScheme } from "@/app/hooks/use-color-scheme";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState, useRef } from "react";
import { onAuthStateChange, getSession } from "@/lib/auth";
import * as Notifications from 'expo-notifications';
import { registerForPushNotifications, addNotificationResponseListener } from "@/lib/notifications";

const ONBOARDING_KEY = "@lunavo:onboarding_complete";

export default function RootLayout() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const router = useRouter();
  const segments = useSegments();
  const [isOnboardingComplete, setIsOnboardingComplete] = useState<boolean | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    initializeAuth();
    initializeNotifications();
  }, []);

  const initializeNotifications = async () => {
    try {
      // Register for push notifications
      await registerForPushNotifications();

      // Handle notification taps
      const subscription = addNotificationResponseListener((response) => {
        const data = response.notification.request.content.data;
        
        // Navigate based on notification data
        if (data?.postId) {
          router.push(`/post/${data.postId}`);
        } else if (data?.meetingId) {
          router.push(`/meetings/${data.meetingId}`);
        } else if (data?.screen) {
          router.push(data.screen);
        }
      });

      return () => {
        subscription.remove();
      };
    } catch (error) {
      console.error('Error initializing notifications:', error);
    }
  };

  useEffect(() => {
    if (!isInitialized) return;

    const inAuthGroup = segments[0] === 'auth';
    const inOnboarding = segments[0] === 'onboarding';

    if (!isAuthenticated && !inAuthGroup && !inOnboarding) {
      // Redirect to login if not authenticated
      router.replace('/auth/login');
    } else if (isAuthenticated && (inAuthGroup || inOnboarding)) {
      // Redirect to home if authenticated and in auth/onboarding
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, segments, isInitialized]);

  const initializeAuth = async () => {
    try {
      // Check onboarding status
      const onboardingValue = await AsyncStorage.getItem(ONBOARDING_KEY);
      setIsOnboardingComplete(onboardingValue === 'true');

      // Check authentication status
      const session = await getSession();
      setIsAuthenticated(!!session);

      // Listen to auth state changes
      const { data: { subscription } } = onAuthStateChange((event, session) => {
        setIsAuthenticated(!!session);
      });

      setIsInitialized(true);

      return () => {
        subscription.unsubscribe();
      };
    } catch (error) {
      console.error('Error initializing auth:', error);
      setIsAuthenticated(false);
      setIsOnboardingComplete(false);
      setIsInitialized(true);
    }
  };

  if (!isInitialized || isOnboardingComplete === null) {
    return null; // Loading state
  }

  return (
    <>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: colors.background,
          },
        }}
      >
      {!isOnboardingComplete && (
        <Stack.Screen 
          name="onboarding" 
          options={{ headerShown: false }} 
        />
      )}
      <Stack.Screen 
        name="auth" 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="(tabs)" 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="post/[id]" 
        options={{ 
          headerShown: false,
          presentation: 'card',
        }} 
      />
      <Stack.Screen 
        name="create-post" 
        options={{ 
          headerShown: false,
          presentation: 'modal',
        }} 
      />
      <Stack.Screen 
        name="check-in" 
        options={{ 
          headerShown: false,
          presentation: 'modal',
        }} 
      />
      <Stack.Screen 
        name="chat/[id]" 
        options={{ 
          headerShown: false,
        }} 
      />
      <Stack.Screen 
        name="book-counsellor" 
        options={{ 
          headerShown: false,
        }} 
      />
      <Stack.Screen 
        name="profile-settings" 
        options={{ 
          headerShown: false,
        }} 
      />
      <Stack.Screen 
        name="admin" 
        options={{ 
          headerShown: false,
        }} 
      />
      <Stack.Screen 
        name="mentorship" 
        options={{ 
          headerShown: false,
        }} 
      />
      <Stack.Screen 
        name="academic-help" 
        options={{ 
          headerShown: false,
        }} 
      />
      <Stack.Screen 
        name="urgent-support" 
        options={{ 
          headerShown: false,
        }} 
      />
      <Stack.Screen 
        name="volunteer/dashboard" 
        options={{ 
          headerShown: false,
        }} 
      />
      <Stack.Screen 
        name="report" 
        options={{ 
          headerShown: false,
          presentation: 'modal',
        }} 
      />
      <Stack.Screen 
        name="notifications" 
        options={{ 
          headerShown: false,
          presentation: 'card',
        }} 
      />
      <Stack.Screen 
        name="counselor" 
        options={{ 
          headerShown: false,
        }} 
      />
      <Stack.Screen 
        name="student-affairs" 
        options={{ 
          headerShown: false,
        }} 
      />
      </Stack>
    </>
  );
}
