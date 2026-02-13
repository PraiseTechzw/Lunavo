import { OfflineIndicator } from "@/app/components/offline-indicator";
import { ThemedText } from "@/app/components/themed-text";
import { ThemedView } from "@/app/components/themed-view";
import { FAB } from "@/app/components/navigation";
import { Colors } from "@/app/constants/theme";
import { useColorScheme } from "@/app/hooks/use-color-scheme";
import { UserRole } from "@/app/types";
import { canAccessRoute, getDefaultRoute, isMobile, isStudentAffairsMobileBlocked } from "@/app/utils/navigation";
import { getSession, onAuthStateChange } from "@/lib/auth";
import { getCurrentUser } from "@/lib/database";
import { addNotificationResponseListener, registerForPushNotifications } from "@/lib/notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useState } from "react";
import { Modal, Platform, StyleSheet, TextInput, TouchableOpacity, View } from "react-native";

const ONBOARDING_KEY = "@peaceclub:onboarding_complete";

export default function RootLayout() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const router = useRouter();
  const segments = useSegments();
  const [isOnboardingComplete, setIsOnboardingComplete] = useState<boolean | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [assistantPrompt, setAssistantPrompt] = useState("");

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
        if (subscription) {
          subscription.remove();
        }
      };
    } catch (error) {
      console.error('Error initializing notifications:', error);
    }
  };

  useEffect(() => {
    if (!isInitialized) return;

    const navGroup = segments[0];

    // Define public routes that don't require authentication
    // 'auth' covers login, register, verify-email
    // 'onboarding' covers the initial intro
    // 'web-required' is a utility screen
    const isPublicRoute =
      navGroup === 'auth' ||
      navGroup === 'onboarding' ||
      navGroup === 'web-required' ||
      navGroup === 'privacy' ||
      navGroup === 'help';

    // 1. Mandatory Onboarding Check
    if (isOnboardingComplete === false && navGroup !== 'onboarding') {
      AsyncStorage.getItem(ONBOARDING_KEY).then(val => {
        if (val === 'true') {
          setIsOnboardingComplete(true);
        } else {
          console.log('[Auth Guard] Onboarding incomplete - redirecting');
          router.replace('/onboarding');
        }
      });
      return;
    }

    // 2. Strict Authentication Guard
    // If user is NOT authenticated and trying to access a protected route (non-public)
    if (!isAuthenticated && !isPublicRoute) {
      console.log(`[Auth Guard] Unauthenticated user attempted to access protected route: /${segments.join('/')}`);
      console.log('[Auth Guard] Redirecting to Login');

      // Use replace to prevent going back to the protected route
      router.replace('/auth/login');
      return;
    }

    // 3. Authenticated User Redirection
    // If user IS authenticated but is on a public auth page (like login), send them to dashboard
    if (isAuthenticated && navGroup === 'auth') {
      console.log('[Auth Guard] Authenticated user on auth page - redirecting to dashboard');
      getCurrentUser().then(user => {
        if (user) {
          const role = user.role as UserRole;
          const platform = isMobile ? 'mobile' : 'web';
          const defaultRoute = getDefaultRoute(role, platform);
          router.replace(defaultRoute as any);
        } else {
          // Fallback if user data fetch fails but auth session exists
          router.replace('/(tabs)');
        }
      }).catch((err) => {
        console.error('[Auth Guard] Error directing user:', err);
        router.replace('/(tabs)');
      });
    }
  }, [isAuthenticated, segments, isInitialized, isOnboardingComplete]);

  // Comprehensive role-based navigation protection
  useEffect(() => {
    if (!isAuthenticated || !isInitialized) return;

    const checkRoleAccess = async () => {
      try {
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
            router.replace('/web-required');
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
          router.replace(defaultRoute as any);
          return;
        }

        // Special case: Counselors should not access general forum
        if ((role === 'counselor' || role === 'life-coach') && currentRoute === '(tabs)/forum') {
          console.log('[Role Guard] Counselor/Life Coach accessing forum - redirecting to dashboard');
          router.replace('/counselor/dashboard');
          return;
        }

        // Special case: Student Affairs should not access forum/chat
        if (role === 'student-affairs' && (currentRoute === '(tabs)/forum' || currentRoute === '(tabs)/chat')) {
          console.log('[Role Guard] Student Affairs accessing forum/chat - redirecting to dashboard');
          router.replace('/student-affairs/dashboard');
          return;
        }
      } catch (error) {
        console.error('Error checking role access:', error);
      }
    };

    checkRoleAccess();
  }, [isAuthenticated, segments, isInitialized]);

  const assistantSuggestions = useMemo(() => {
    const current = segments.join("/");
    const list: { label: string; action: () => void }[] = [];
    list.push({
      label: "Create Post",
      action: () => router.push("/create-post"),
    });
    list.push({
      label: "Report Issue",
      action: () => router.push("/report"),
    });
    list.push({
      label: "Find Resources",
      action: () => router.push("/(tabs)/forum"),
    });
    if (current.startsWith("counselor")) {
      list.push({
        label: "Go to Dashboard",
        action: () => router.push("/counselor/dashboard"),
      });
    }
    if (current.startsWith("(tabs)/profile")) {
      list.push({
        label: "Edit Profile",
        action: () => router.push("/edit-profile"),
      });
    }
    return list;
  }, [segments]);

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
          <Stack.Screen
          <Stack.Screen
            name="onboarding"
            options={{ headerShown: false }}
          />
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
            name="create-channel"
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
            name="edit-profile"
            options={{
              headerShown: false,
              presentation: 'modal',
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
        {Platform.OS !== "web" && (
          <FAB
            icon="smart-toy"
            label="AI Assist"
            onPress={() => setAssistantOpen(true)}
            position="bottom-right"
            color={colors.primary}
          />
        )}
        {Platform.OS === "web" && (
          <TouchableOpacity
            style={[styles.webAssistantButton, { backgroundColor: colors.primary }]}
            onPress={() => setAssistantOpen(true)}
            activeOpacity={0.8}
          >
            <ThemedText style={{ color: "#FFF", fontWeight: "700" }}>AI</ThemedText>
          </TouchableOpacity>
        )}
        <Modal
          visible={assistantOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setAssistantOpen(false)}
        >
          <View style={styles.overlay}>
            <ThemedView style={[styles.assistantCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <ThemedText type="h2" style={{ marginBottom: 12, color: colors.text }}>AI Assistant</ThemedText>
              <View style={[styles.inputRow, { borderColor: colors.border }]}>
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Ask for help, find resources, or suggest actions"
                  placeholderTextColor={colors.icon}
                  value={assistantPrompt}
                  onChangeText={setAssistantPrompt}
                />
                <TouchableOpacity
                  style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
                  onPress={() => {
                    setAssistantPrompt("");
                    setAssistantOpen(false);
                  }}
                >
                  <ThemedText style={{ color: "#FFF", fontWeight: "700" }}>Send</ThemedText>
                </TouchableOpacity>
              </View>
              <View style={styles.suggestionRow}>
                {assistantSuggestions.map((s, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[styles.suggestionChip, { borderColor: colors.border, backgroundColor: colors.surface }]}
                    onPress={() => {
                      setAssistantOpen(false);
                      s.action();
                    }}
                  >
                    <ThemedText style={{ color: colors.text }}>{s.label}</ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity
                style={[styles.closeBtn, { borderColor: colors.border }]}
                onPress={() => setAssistantOpen(false)}
              >
                <ThemedText style={{ color: colors.text }}>Close</ThemedText>
              </TouchableOpacity>
            </ThemedView>
          </View>
        </Modal>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  assistantCard: {
    width: "100%",
    maxWidth: 560,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 8,
    marginBottom: 12,
  },
  input: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 8,
  },
  primaryBtn: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
  },
  suggestionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  suggestionChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  closeBtn: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
  },
  webAssistantButton: {
    position: "absolute",
    right: 20,
    bottom: 20,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
});
