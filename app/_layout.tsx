import { OfflineIndicator } from "@/app/components/offline-indicator";
import { Colors } from "@/app/constants/theme";
import { useColorScheme } from "@/app/hooks/use-color-scheme";
import { canAccessRoute, getDefaultRoute, isMobile, isStudentAffairsMobileBlocked } from "@/app/utils/navigation";
import { getSession, onAuthStateChange } from "@/lib/auth";
import { getCurrentUser } from "@/lib/database";
import { addNotificationResponseListener, registerForPushNotifications } from "@/lib/notifications";
import { UserRole } from "@/lib/permissions";
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
  const [userRole, setUserRole] = useState<UserRole | null>(null);

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
    const inWebRequired = segments[0] === 'web-required';
    const inVerifyEmail = segments[1] === 'verify-email';

    // Helper function to safely navigate
    const safeNavigate = (route: string | any, delay: number = 100) => {
      setTimeout(() => {
        try {
          if (typeof route === 'string') {
            router.replace(route as any);
          } else {
            router.replace(route);
          }
        } catch (error) {
          console.error('[Navigation] Router not ready, retrying...', error);
          // Retry once after a longer delay
          setTimeout(() => {
            try {
              if (typeof route === 'string') {
                router.replace(route as any);
              } else {
                router.replace(route);
              }
            } catch (retryError) {
              console.error('[Navigation] Navigation failed after retry:', retryError);
            }
          }, 500);
        }
      }, delay);
    };

    if (!isAuthenticated && !inAuthGroup && !inOnboarding) {
      // Redirect to login if not authenticated
      safeNavigate('/auth/login');
    } else if (isAuthenticated && (inAuthGroup || inOnboarding)) {
      // Check email verification status before redirecting
      const checkVerificationAndRedirect = async () => {
        try {
          // Wait for router to be ready
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // Check if email is confirmed in Supabase Auth
          const { supabase } = await import('@/lib/supabase');
          const { data: { user: authUser } } = await supabase.auth.getUser();
          
          const emailConfirmed = authUser?.email_confirmed_at || authUser?.confirmed_at;
          
          if (!emailConfirmed && !inVerifyEmail) {
            // Email not verified - redirect to verification
            const userEmail = authUser?.email;
            if (userEmail) {
              safeNavigate({
                pathname: '/auth/verify-email',
                params: { email: userEmail },
              });
              return;
            }
          }

          // Email is verified or already on verification page - proceed with normal redirect
          const user = await getCurrentUser();
          if (user) {
            const role = user.role as UserRole;
            const platform = isMobile ? 'mobile' : 'web';
            const defaultRoute = getDefaultRoute(role, platform);
            safeNavigate(defaultRoute);
          } else {
            safeNavigate('/(tabs)');
          }
        } catch (error) {
          console.error('Error checking verification:', error);
          safeNavigate('/(tabs)');
        }
      };

      checkVerificationAndRedirect();
    } else if (isAuthenticated && !inAuthGroup && !inOnboarding && !inWebRequired) {
      // User is authenticated and not in auth/onboarding - check verification
      const checkVerification = async () => {
        try {
          await new Promise(resolve => setTimeout(resolve, 100));
          
          const { supabase } = await import('@/lib/supabase');
          const { data: { user: authUser } } = await supabase.auth.getUser();
          
          const emailConfirmed = authUser?.email_confirmed_at || authUser?.confirmed_at;
          
          if (!emailConfirmed && !inVerifyEmail) {
            // Email not verified - redirect to verification
            const userEmail = authUser?.email;
            if (userEmail) {
              safeNavigate({
                pathname: '/auth/verify-email',
                params: { email: userEmail },
              });
            }
          }
        } catch (error) {
          console.error('Error checking verification status:', error);
        }
      };

      checkVerification();
    }
  }, [isAuthenticated, segments, isInitialized]);

  // Comprehensive role-based navigation protection
  useEffect(() => {
    if (!isAuthenticated || !isInitialized) return;
    
    // Wait for router to be ready - check if segments are available
    if (!segments || segments.length === 0) return;

    const checkRoleAccess = async () => {
      try {
        // Add a small delay to ensure router is fully mounted
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const currentUser = await getCurrentUser();
        if (!currentUser) return;

        const role = currentUser.role as UserRole;
        setUserRole(role);
        const currentRoute = segments.join('/');
        const platform = isMobile ? 'mobile' : 'web';

        // CRITICAL: Student Affairs mobile blocking
        if (isStudentAffairsMobileBlocked(role, platform)) {
          if (currentRoute !== 'web-required') {
            console.log('[Role Guard] Student Affairs detected on mobile - redirecting to web-required');
            try {
              router.replace('/web-required');
            } catch (navError) {
              console.error('[Role Guard] Navigation error:', navError);
            }
          }
          return;
        }

        // Skip route checking for auth and onboarding
        if (segments[0] === 'auth' || segments[0] === 'onboarding' || segments[0] === 'web-required') {
          return;
        }

        // Check if current route is accessible
        const routePath = '/' + currentRoute;
        if (!canAccessRoute(role, routePath, platform)) {
          // Redirect to default route for role
          const defaultRoute = getDefaultRoute(role, platform);
          console.log(`[Role Guard] Access denied for ${role} to ${routePath} on ${platform}. Redirecting to ${defaultRoute}`);
          try {
            router.replace(defaultRoute as any);
          } catch (navError) {
            console.error('[Role Guard] Navigation error:', navError);
          }
          return;
        }

        // Special case: Counselors should not access general forum
        if ((role === 'counselor' || role === 'life-coach') && currentRoute === '(tabs)/forum') {
          console.log('[Role Guard] Counselor/Life Coach accessing forum - redirecting to dashboard');
          try {
            router.replace('/counselor/dashboard');
          } catch (navError) {
            console.error('[Role Guard] Navigation error:', navError);
          }
          return;
        }

        // Special case: Student Affairs should not access forum/chat
        if (role === 'student-affairs' && (currentRoute === '(tabs)/forum' || currentRoute === '(tabs)/chat')) {
          console.log('[Role Guard] Student Affairs accessing forum/chat - redirecting to dashboard');
          try {
            router.replace('/student-affairs/dashboard');
          } catch (navError) {
            console.error('[Role Guard] Navigation error:', navError);
          }
          return;
        }
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

      // Wait a moment for Supabase to restore session from storage
      // This ensures AsyncStorage/localStorage session is properly loaded
      await new Promise(resolve => setTimeout(resolve, 100));

      // Check authentication status
      const session = await getSession();
      console.log('[initializeAuth] Session restored:', session ? 'Yes' : 'No');
      setIsAuthenticated(!!session);

      // Listen to auth state changes
      const { data: { subscription } } = onAuthStateChange((event, session) => {
        console.log('[initializeAuth] Auth state changed:', event, session ? 'Session present' : 'No session');
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
        name="web-required" 
        options={{ 
          headerShown: false,
          presentation: 'card',
        }} 
      />
      <Stack.Screen 
        name="peer-educator" 
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
        name="help" 
        options={{ 
          headerShown: false,
          presentation: 'card',
        }} 
      />
      <Stack.Screen 
        name="privacy" 
        options={{ 
          headerShown: false,
          presentation: 'card',
        }} 
      />
      <Stack.Screen 
        name="feedback" 
        options={{ 
          headerShown: false,
          presentation: 'card',
        }} 
      />
      <Stack.Screen 
        name="about" 
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
