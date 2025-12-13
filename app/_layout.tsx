import { OfflineIndicator } from "@/app/components/offline-indicator";
import { Colors } from "@/app/constants/theme";
import { useColorScheme } from "@/app/hooks/use-color-scheme";
import { getSession, onAuthStateChange } from "@/lib/auth";
import { getCurrentUser } from "@/lib/database";
import { addNotificationResponseListener, registerForPushNotifications } from "@/lib/notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { View } from "react-native";

const ONBOARDING_KEY = "@lunavo:onboarding_complete";

export default function RootLayout() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const router = useRouter();
  const segments = useSegments();
  const [isOnboardingComplete, setIsOnboardingComplete] = useState<boolean | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

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
          router.push(`/post/${data.postId}` as any);
        } else if (data?.meetingId) {
          router.push(`/meetings/${data.meetingId}` as any);
        } else if (data?.screen && typeof data.screen === 'string') {
          router.push(data.screen as any);
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

  // Role-based navigation protection
  useEffect(() => {
    if (!isAuthenticated || !isInitialized) return;

    const checkRoleAccess = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (!currentUser) return;

        const role = currentUser.role;
        setUserRole(role);
        const currentRoute = segments[0];

        // Redirect students away from role-specific screens
        if (role === 'student') {
          const restrictedRoutes = ['admin', 'peer-educator', 'counselor', 'student-affairs', 'volunteer'];
          if (restrictedRoutes.includes(currentRoute)) {
            router.replace('/(tabs)');
          }
        }
        // Add similar checks for other roles if needed
      } catch (error) {
        console.error('Error checking role access:', error);
      }
    };

    checkRoleAccess();
  }, [isAuthenticated, segments, isInitialized]);

  const initializeAuth = async () => {
    try {
      // Check onboarding status
      const onboardingValue = await AsyncStorage.getItem(ONBOARDING_KEY);
      setIsOnboardingComplete(onboardingValue === 'true');

      // Check authentication status - getSession() will retrieve from AsyncStorage
      const session = await getSession();
      console.log('[initializeAuth] Session check:', session ? 'Session found' : 'No session');
      setIsAuthenticated(!!session);
      
      // Load user role if authenticated
      if (session) {
        try {
          const currentUser = await getCurrentUser();
          if (currentUser) {
            setUserRole(currentUser.role);
            console.log('[initializeAuth] User role loaded:', currentUser.role);
          }
        } catch (userError) {
          console.error('[initializeAuth] Error loading user:', userError);
          // If user can't be loaded, session might be invalid
          setIsAuthenticated(false);
        }
      }

      // Listen to auth state changes
      const { data: { subscription } } = onAuthStateChange((event, session) => {
        console.log('[initializeAuth] Auth state changed:', event, session ? 'Session present' : 'No session');
        setIsAuthenticated(!!session);
        
        // Update user role when session changes
        if (session) {
          getCurrentUser().then(user => {
            if (user) {
              setUserRole(user.role);
            }
          }).catch(err => console.error('Error loading user on auth change:', err));
        } else {
          setUserRole(null);
        }
      });

      setIsInitialized(true);

      return () => {
        subscription.unsubscribe();
      };
    } catch (error) {
      console.error('[initializeAuth] Error initializing auth:', error);
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
      <View style={{ flex: 1 }}>
        <OfflineIndicator />
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
        name="topic/[category]" 
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
      <Stack.Screen 
        name="peer-educator" 
        options={{ 
          headerShown: false,
        }} 
      />
      <Stack.Screen 
        name="meetings" 
        options={{ 
          headerShown: false,
        }} 
      />
      <Stack.Screen 
        name="accessibility-settings" 
        options={{ 
          headerShown: false,
          presentation: 'card',
        }} 
      />
      <Stack.Screen 
        name="badges" 
        options={{ 
          headerShown: false,
          presentation: 'card',
        }} 
      />
      <Stack.Screen 
        name="rewards" 
        options={{ 
          headerShown: false,
          presentation: 'card',
        }} 
      />
      <Stack.Screen 
        name="leaderboard" 
        options={{ 
          headerShown: false,
          presentation: 'card',
        }} 
      />
      <Stack.Screen 
        name="search" 
        options={{ 
          headerShown: false,
          presentation: 'card',
        }} 
      />
      <Stack.Screen 
        name="resource/[id]" 
        options={{ 
          headerShown: false,
          presentation: 'card',
        }} 
      />
      </Stack>
      </View>
    </>
  );
}
