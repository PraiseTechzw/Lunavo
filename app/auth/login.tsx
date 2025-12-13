/**
 * Modern Login Screen - Dark blue header with wave pattern design
 */

import { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedView } from '@/app/components/themed-view';
import { ThemedText } from '@/app/components/themed-text';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/app/hooks/use-color-scheme';
import { Colors, Spacing, BorderRadius } from '@/app/constants/theme';
import { signIn } from '@/lib/auth';
import { createInputStyle, createShadow } from '@/app/utils/platform-styles';
import Svg, { Path } from 'react-native-svg';

// Beautiful Wave pattern component with elegant curves
const WavePattern = ({ color }: { color: string }) => (
  <Svg width="100%" height="160" viewBox="0 0 375 160" preserveAspectRatio="none">
    {/* Main wave - elegant flowing curve */}
    <Path
      d="M0,100 C93.75,60 140,70 187.5,80 C235,90 281.25,75 375,95 L375,160 L0,160 Z"
      fill={color}
      opacity="0.35"
    />
    {/* Secondary wave - subtle depth */}
    <Path
      d="M0,110 C100,85 150,90 187.5,95 C225,100 275,90 375,105 L375,160 L0,160 Z"
      fill={color}
      opacity="0.25"
    />
    {/* Accent wave - fine detail */}
    <Path
      d="M0,120 C80,105 130,108 187.5,110 C245,112 295,105 375,115 L375,160 L0,160 Z"
      fill={color}
      opacity="0.15"
    />
  </Svg>
);

export default function LoginScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleLogin = async () => {
    if (!emailOrUsername.trim() || !password.trim()) {
      Alert.alert('Missing Information', 'Please enter your email/username and password');
      return;
    }

    setLoading(true);
    try {
      const { user, error } = await signIn({ 
        emailOrUsername: emailOrUsername.trim(), 
        password 
      });

      if (error) {
        Alert.alert('Login Failed', error.message || 'Invalid credentials. Please try again.');
        return;
      }

      if (user) {
        router.replace('/(tabs)');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const headerColor = '#1E40AF'; // Always dark blue
  const waveColor = '#60A5FA'; // Always light blue

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        {/* Header with Wave Pattern */}
        <View style={[styles.header, { backgroundColor: headerColor }]}>
          <View style={styles.headerContent}>
            <ThemedText type="h1" style={styles.headerTitle}>
              Welcome Back
            </ThemedText>
            <ThemedText type="body" style={styles.headerSubtitle}>
              Sign in with your email or anonymous username to continue
            </ThemedText>
          </View>
          <View style={styles.waveContainer}>
            <WavePattern color={waveColor} />
          </View>
        </View>

        {/* Curved separator for visual effect */}
        <View style={styles.curveSeparator} />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Animated.View
              style={[
                styles.content,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              {/* Main Content */}
              <View style={styles.mainContent}>
                <ThemedText type="h1" style={styles.title}>
                  Sign in
                </ThemedText>

                {/* Email/Username Input */}
                <View style={styles.inputContainer}>
                  <View
                    style={[
                      styles.inputWrapper,
                      {
                        backgroundColor: '#2A2A3E',
                        borderColor: focusedInput === 'email' ? '#8B5CF6' : '#FFFFFF20',
                        borderWidth: 1,
                      },
                    ]}
                  >
                    <Ionicons 
                      name={emailOrUsername.includes('@') ? "mail-outline" : "person-outline"} 
                      size={22} 
                      color="#FFFFFF" 
                      style={styles.inputIcon} 
                    />
                    <TextInput
                      style={[styles.input, styles.inputText, createInputStyle()]}
                      placeholder="Email or anonymous username"
                      placeholderTextColor="#FFFFFF80"
                      value={emailOrUsername}
                      onChangeText={setEmailOrUsername}
                      keyboardType="default"
                      autoCapitalize="none"
                      autoCorrect={false}
                      editable={!loading}
                      onFocus={() => setFocusedInput('email')}
                      onBlur={() => setFocusedInput(null)}
                    />
                  </View>
                  <ThemedText type="small" style={styles.inputHint}>
                    You can sign in with your email address or your anonymous username
                  </ThemedText>
                </View>

                {/* Password Input */}
                <View style={styles.inputContainer}>
                  <View
                    style={[
                      styles.inputWrapper,
                      {
                        backgroundColor: '#2A2A3E',
                        borderColor: focusedInput === 'password' ? '#8B5CF6' : '#FFFFFF20',
                        borderWidth: 1,
                      },
                    ]}
                  >
                    <Ionicons 
                      name="lock-closed-outline" 
                      size={20} 
                      color="#FFFFFF" 
                      style={styles.inputIcon} 
                    />
                    <TextInput
                      style={[styles.input, styles.inputText, createInputStyle()]}
                      placeholder="Enter your Password"
                      placeholderTextColor="#FFFFFF80"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      autoCorrect={false}
                      editable={!loading}
                      onFocus={() => setFocusedInput('password')}
                      onBlur={() => setFocusedInput(null)}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      style={styles.eyeIcon}
                      disabled={loading}
                    >
                      <Ionicons
                        name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                        size={20}
                        color="#FFFFFF"
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Remember Me & Forgot Password */}
                <View style={styles.optionsRow}>
                  <TouchableOpacity
                    style={styles.rememberMeContainer}
                    onPress={() => setRememberMe(!rememberMe)}
                    disabled={loading}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.checkbox,
                        {
                          backgroundColor: rememberMe ? '#8B5CF6' : 'transparent',
                          borderColor: rememberMe ? '#8B5CF6' : '#FFFFFF40',
                        },
                      ]}
                    >
                      {rememberMe && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
                    </View>
                    <ThemedText type="small" style={styles.rememberMeText}>
                      Remember me
                    </ThemedText>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => router.push('/auth/forgot-password')}
                    disabled={loading}
                  >
                    <ThemedText type="small" style={styles.forgotPasswordText}>
                      Forgot password?
                    </ThemedText>
                  </TouchableOpacity>
                </View>

                {/* Login Button */}
                <TouchableOpacity
                  style={[
                    styles.loginButton,
                    { backgroundColor: '#8B5CF6' },
                    loading && styles.buttonDisabled,
                  ]}
                  onPress={handleLogin}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <ThemedText type="body" style={styles.buttonText} numberOfLines={1}>
                      Sign in
                    </ThemedText>
                  )}
                </TouchableOpacity>

                {/* Sign Up Link */}
                <View style={styles.signUpContainer}>
                  <ThemedText type="body" style={styles.signUpText}>
                    Don't have an account?
                  </ThemedText>
                  <TouchableOpacity
                    onPress={() => router.push('/auth/register')}
                    disabled={loading}
                    style={styles.signUpLinkContainer}
                  >
                     <ThemedText type="body" style={styles.signUpLink}>
                       Sign up
                     </ThemedText>
                  </TouchableOpacity>
                </View>
              </View>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingTop: Spacing.xl + 10,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl + 20,
    position: 'relative',
    overflow: 'hidden',
  },
  headerContent: {
    zIndex: 1,
  },
  headerTitle: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: Spacing.sm,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#E0E7FF',
    lineHeight: 24,
    opacity: 0.95,
  },
  waveContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 160,
  },
  curveSeparator: {
    height: 32,
    backgroundColor: '#0F172A',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -32,
    zIndex: 2,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
  },
  mainContent: {
    padding: Spacing.xl,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -32,
    minHeight: '100%',
    backgroundColor: '#0F172A',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: Spacing.xl,
    color: '#FFFFFF',
  },
  inputContainer: {
    marginBottom: Spacing.lg,
  },
  inputHint: {
    marginTop: Spacing.xs,
    fontSize: 12,
    lineHeight: 16,
    color: '#FFFFFF',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    height: 56,
  },
  inputText: {
    color: '#FFFFFF',
  },
  inputIcon: {
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 0,
  },
  eyeIcon: {
    padding: Spacing.xs,
    marginLeft: Spacing.xs,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.xs,
  },
  rememberMeText: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  forgotPasswordText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  loginButton: {
    height: 56,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 20,
    textAlign: 'center',
    textShadowColor: '#000000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    fontStyle: 'italic',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.sm,
  },
  signUpText: {
    color: '#FFFFFF',
    fontSize: 16,
    flex: 1,
  },
  signUpLinkContainer: {
    alignItems: 'flex-end',
  },
  signUpLink: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 18,
    textAlign: 'right',
  },
});
