/**
 * Modern Multi-Step Registration Screen - Dark blue header with wave pattern
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
import { signUp } from '@/lib/auth';
import { checkUsernameAvailability } from '@/lib/database';
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

type Step = 1 | 2 | 3;

export default function RegisterScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const [currentStep, setCurrentStep] = useState<Step>(1);
  
  // Step 1: Email & Password
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Step 2: Username
  const [username, setUsername] = useState('');
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle');
  const usernameCheckTimeout = useRef<NodeJS.Timeout | null>(null);
  
  // Step 3: Terms
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  
  const [loading, setLoading] = useState(false);
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

  // Real-time username availability check
  useEffect(() => {
    if (usernameCheckTimeout.current) {
      clearTimeout(usernameCheckTimeout.current);
    }

    if (!username || username.trim().length < 3) {
      setUsernameStatus('idle');
      return;
    }

    // Validate format
    const normalizedUsername = username.toLowerCase().trim();
    if (!/^[a-z0-9_-]{3,20}$/.test(normalizedUsername)) {
      setUsernameStatus('invalid');
      return;
    }

    setUsernameStatus('checking');
    usernameCheckTimeout.current = setTimeout(async () => {
      try {
        const isAvailable = await checkUsernameAvailability(normalizedUsername);
        setUsernameStatus(isAvailable ? 'available' : 'taken');
      } catch (error) {
        setUsernameStatus('idle');
      }
    }, 500);

    return () => {
      if (usernameCheckTimeout.current) {
        clearTimeout(usernameCheckTimeout.current);
      }
    };
  }, [username]);

  const getPasswordStrength = (pwd: string): { strength: number; label: string; color: string } => {
    if (pwd.length === 0) return { strength: 0, label: '', color: '#FFFFFF' };
    if (pwd.length < 6) return { strength: 1, label: 'Weak', color: '#EF4444' };
    if (pwd.length < 8) return { strength: 2, label: 'Fair', color: '#F59E0B' };
    if (pwd.length < 12 || !/[A-Z]/.test(pwd) || !/[0-9]/.test(pwd)) {
      return { strength: 3, label: 'Good', color: '#3B82F6' };
    }
    return { strength: 4, label: 'Strong', color: '#10B981' };
  };

  const passwordStrength = getPasswordStrength(password);

  const canProceedToStep2 = () => {
    return email.trim() && password.trim() && confirmPassword.trim() && 
           password === confirmPassword && password.length >= 6;
  };

  const canProceedToStep3 = () => {
    return username.trim().length >= 3 && usernameStatus === 'available';
  };

  const handleNext = () => {
    if (currentStep === 1 && canProceedToStep2()) {
      setCurrentStep(2);
    } else if (currentStep === 2 && canProceedToStep3()) {
      setCurrentStep(3);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as Step);
    } else {
      router.back();
    }
  };

  const handleRegister = async () => {
    if (!acceptedTerms) {
      Alert.alert('Terms Required', 'Please accept the terms and conditions');
      return;
    }

    setLoading(true);
    try {
      const { user, error } = await signUp({
        email: email.trim(),
        password,
        username: username.trim().toLowerCase(),
        role: 'student',
      });

      if (error) {
        Alert.alert('Registration Failed', error.message || 'An error occurred. Please try again.');
        return;
      }

      if (user) {
        Alert.alert(
          'Account Created!',
          'Your account has been created successfully. You can now sign in.',
          [
            {
              text: 'Sign In',
              onPress: () => router.replace('/auth/login'),
            },
          ]
        );
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
              Create Account
            </ThemedText>
            <ThemedText type="body" style={styles.headerSubtitle}>
              Create your anonymous account to join the support community
            </ThemedText>
          </View>
          <View style={styles.waveContainer}>
            <WavePattern color={waveColor} />
          </View>
        </View>

        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          {[1, 2, 3].map((step) => (
            <View key={step} style={styles.progressStep}>
              <View
                style={[
                  styles.progressDot,
                  {
                    backgroundColor: step <= currentStep ? '#8B5CF6' : '#FFFFFF40',
                  },
                ]}
              />
              {step < 3 && (
                <View
                  style={[
                    styles.progressLine,
                    {
                      backgroundColor: step < currentStep ? '#8B5CF6' : '#FFFFFF40',
                    },
                  ]}
                />
              )}
            </View>
          ))}
        </View>

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
              <View style={styles.mainContent}>
                <ThemedText type="h1" style={styles.title}>
                  Sign up
                </ThemedText>

                {/* Step 1: Email & Password */}
                {currentStep === 1 && (
                  <View style={styles.stepContent}>
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
                          name="mail-outline" 
                          size={20} 
                          color="#FFFFFF" 
                          style={styles.inputIcon} 
                        />
                        <TextInput
                          style={[styles.input, styles.inputText, createInputStyle()]}
                          placeholder="Enter your email"
                          placeholderTextColor="#FFFFFF80"
                          value={email}
                          onChangeText={setEmail}
                          keyboardType="email-address"
                          autoCapitalize="none"
                          autoCorrect={false}
                          editable={!loading}
                          onFocus={() => setFocusedInput('email')}
                          onBlur={() => setFocusedInput(null)}
                        />
                      </View>
                    </View>

                    <View style={styles.inputContainer}>
                      <View
                        style={[
                          styles.inputWrapper,
                          {
                            backgroundColor: '#2A2A3E',
                            borderColor: focusedInput === 'password' ? '#8B5CF6' : '#FFFFFF20',
                            borderWidth: focusedInput === 'password' ? 2 : 1,
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
                        >
                          <Ionicons
                            name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                            size={20}
                            color="#FFFFFF"
                          />
                        </TouchableOpacity>
                      </View>
                      {password.length > 0 && (
                        <View style={styles.strengthContainer}>
                          <View style={styles.strengthBar}>
                            {[1, 2, 3, 4].map((level) => (
                              <View
                                key={level}
                                style={[
                                  styles.strengthSegment,
                                  {
                                    backgroundColor:
                                      level <= passwordStrength.strength
                                        ? passwordStrength.color
                                        : colors.border,
                                  },
                                ]}
                              />
                            ))}
                          </View>
                          <ThemedText type="small" style={{ color: passwordStrength.color, fontWeight: '600' }}>
                            {passwordStrength.label}
                          </ThemedText>
                        </View>
                      )}
                    </View>

                    <View style={styles.inputContainer}>
                      <View
                        style={[
                          styles.inputWrapper,
                          {
                            backgroundColor: '#2A2A3E',
                            borderColor:
                              focusedInput === 'confirmPassword'
                                ? colors.primary
                                : confirmPassword.length > 0 && password !== confirmPassword
                                ? colors.danger
                                : colors.border,
                            borderWidth: focusedInput === 'confirmPassword' ? 2 : 1,
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
                          placeholder="Confirm your Password"
                          placeholderTextColor="#FFFFFF80"
                          value={confirmPassword}
                          onChangeText={setConfirmPassword}
                          secureTextEntry={!showConfirmPassword}
                          autoCapitalize="none"
                          autoCorrect={false}
                          editable={!loading}
                          onFocus={() => setFocusedInput('confirmPassword')}
                          onBlur={() => setFocusedInput(null)}
                        />
                        <TouchableOpacity
                          onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                          style={styles.eyeIcon}
                        >
                          <Ionicons
                            name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'}
                            size={20}
                            color="#FFFFFF"
                          />
                        </TouchableOpacity>
                      </View>
                      {confirmPassword.length > 0 && password !== confirmPassword && (
                        <ThemedText type="small" style={{ color: '#EF4444', marginTop: Spacing.xs }}>
                          Passwords do not match
                        </ThemedText>
                      )}
                    </View>
                  </View>
                )}

                {/* Step 2: Username */}
                {currentStep === 2 && (
                  <View style={styles.stepContent}>
                    <ThemedText type="body" style={styles.stepDescription}>
                      Choose a unique anonymous username. This will be how others see you on the platform.
                    </ThemedText>
                    <View style={styles.inputContainer}>
                      <View
                        style={[
                          styles.inputWrapper,
                          {
                            backgroundColor: '#2A2A3E',
                            borderColor:
                              focusedInput === 'username'
                                ? colors.primary
                                : usernameStatus === 'taken' || usernameStatus === 'invalid'
                                ? colors.danger
                                : usernameStatus === 'available'
                                ? '#10B981'
                                : colors.border,
                            borderWidth: focusedInput === 'username' ? 2 : 1,
                          },
                        ]}
                      >
                        <Ionicons 
                          name="person-outline" 
                          size={20} 
                          color="#FFFFFF" 
                          style={styles.inputIcon} 
                        />
                        <TextInput
                          style={[styles.input, styles.inputText, createInputStyle()]}
                          placeholder="Enter anonymous username"
                          placeholderTextColor="#FFFFFF80"
                          value={username}
                          onChangeText={setUsername}
                          autoCapitalize="none"
                          autoCorrect={false}
                          editable={!loading}
                          onFocus={() => setFocusedInput('username')}
                          onBlur={() => setFocusedInput(null)}
                        />
                        {usernameStatus === 'checking' && (
                          <ActivityIndicator size="small" color="#8B5CF6" style={styles.statusIcon} />
                        )}
                        {usernameStatus === 'available' && (
                          <Ionicons name="checkmark-circle" size={20} color="#10B981" style={styles.statusIcon} />
                        )}
                        {usernameStatus === 'taken' && (
                          <Ionicons name="close-circle" size={20} color="#EF4444" style={styles.statusIcon} />
                        )}
                        {usernameStatus === 'invalid' && (
                          <Ionicons name="alert-circle" size={20} color="#EF4444" style={styles.statusIcon} />
                        )}
                      </View>
                      {username.length > 0 && (
                        <View style={styles.usernameHint}>
                          {usernameStatus === 'checking' && (
                            <ThemedText type="small" style={{ color: colors.icon }}>
                              Checking availability...
                            </ThemedText>
                          )}
                          {usernameStatus === 'available' && (
                            <ThemedText type="small" style={{ color: '#10B981' }}>
                              ✓ Username is available!
                            </ThemedText>
                          )}
                          {usernameStatus === 'taken' && (
                            <ThemedText type="small" style={{ color: '#EF4444' }}>
                              ✗ Username is already taken
                            </ThemedText>
                          )}
                          {usernameStatus === 'invalid' && (
                            <ThemedText type="small" style={{ color: '#EF4444' }}>
                              Username must be 3-20 characters, alphanumeric, underscore, or hyphen only
                            </ThemedText>
                          )}
                          {usernameStatus === 'idle' && username.length < 3 && (
                            <ThemedText type="small" style={{ color: colors.icon }}>
                              Minimum 3 characters
                            </ThemedText>
                          )}
                        </View>
                      )}
                    </View>
                  </View>
                )}

                {/* Step 3: Terms */}
                {currentStep === 3 && (
                  <View style={styles.stepContent}>
                    <ThemedText type="body" style={styles.stepDescription}>
                      Review and accept the terms to complete your registration.
                    </ThemedText>
                    <TouchableOpacity
                      style={styles.termsContainer}
                      onPress={() => setAcceptedTerms(!acceptedTerms)}
                      disabled={loading}
                      activeOpacity={0.7}
                    >
                      <View
                        style={[
                          styles.checkbox,
                          {
                            backgroundColor: acceptedTerms ? '#8B5CF6' : 'transparent',
                            borderColor: acceptedTerms ? '#8B5CF6' : '#FFFFFF40',
                          },
                        ]}
                      >
                        {acceptedTerms && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
                      </View>
                      <ThemedText type="small" style={[styles.termsText, { color: colors.text }]}>
                        I agree to the{' '}
                        <ThemedText type="small" style={{ color: colors.primary, fontWeight: '600' }}>
                          Terms & Conditions
                        </ThemedText>
                        {' '}and{' '}
                        <ThemedText type="small" style={{ color: colors.primary, fontWeight: '600' }}>
                          Privacy Policy
                        </ThemedText>
                        . I understand that my anonymous username will be used throughout the platform and I will maintain respectful and supportive interactions.
                      </ThemedText>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Navigation Buttons */}
                <View style={styles.buttonRow}>
                  {currentStep > 1 && (
                    <TouchableOpacity
                      style={[styles.backButton, { borderColor: colors.border }]}
                      onPress={handleBack}
                      disabled={loading}
                    >
                      <Ionicons name="arrow-back" size={20} color={colors.text} />
                      <ThemedText type="body" style={[styles.backButtonText, { color: colors.text }]}>
                        Back
                      </ThemedText>
                    </TouchableOpacity>
                  )}

                  {currentStep < 3 ? (
                    <TouchableOpacity
                      style={[
                        styles.nextButton,
                        { backgroundColor: '#8B5CF6' },
                        (!canProceedToStep2() && currentStep === 1) || 
                        (!canProceedToStep3() && currentStep === 2) && styles.buttonDisabled,
                        createShadow(4, colors.primary, 0.3),
                      ]}
                      onPress={handleNext}
                      disabled={
                        loading ||
                        (currentStep === 1 && !canProceedToStep2()) ||
                        (currentStep === 2 && !canProceedToStep3())
                      }
                      activeOpacity={0.8}
                    >
                        <ThemedText type="body" style={styles.buttonText} numberOfLines={1}>
                        Next
                      </ThemedText>
                      <Ionicons name="arrow-forward" size={20} color="#FFFFFF" style={{ marginLeft: Spacing.xs }} />
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={[
                        styles.nextButton,
                        { backgroundColor: '#8B5CF6' },
                        (!acceptedTerms || loading) && styles.buttonDisabled,
                        createShadow(4, colors.primary, 0.3),
                      ]}
                      onPress={handleRegister}
                      disabled={loading || !acceptedTerms}
                      activeOpacity={0.8}
                    >
                      {loading ? (
                        <ActivityIndicator color="#FFFFFF" size="small" />
                      ) : (
                        <>
                          <ThemedText type="body" style={styles.buttonText} numberOfLines={1}>
                            Sign up
                          </ThemedText>
                          <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" style={{ marginLeft: Spacing.xs }} />
                        </>
                      )}
                    </TouchableOpacity>
                  )}
                </View>

                {/* Sign In Link */}
                <View style={styles.signInContainer}>
                  <ThemedText type="body" style={styles.signInText}>
                    Already have an account?{' '}
                  </ThemedText>
                  <TouchableOpacity
                    onPress={() => router.push('/auth/login')}
                    disabled={loading}
                  >
                    <ThemedText type="body" style={styles.signInLink}>
                      Sign in
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
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    backgroundColor: '#0F172A',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -32,
    zIndex: 1,
  },
  progressStep: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  progressLine: {
    flex: 1,
    height: 2,
    marginHorizontal: Spacing.xs,
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
  stepContent: {
    marginBottom: Spacing.xl,
  },
  stepDescription: {
    marginBottom: Spacing.lg,
    lineHeight: 22,
    color: '#FFFFFF',
  },
  inputContainer: {
    marginBottom: Spacing.lg,
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
  statusIcon: {
    marginLeft: Spacing.xs,
  },
  eyeIcon: {
    padding: Spacing.xs,
    marginLeft: Spacing.xs,
  },
  strengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
    gap: Spacing.sm,
  },
  strengthBar: {
    flexDirection: 'row',
    gap: 4,
    flex: 1,
  },
  strengthSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  usernameHint: {
    marginTop: Spacing.xs,
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: Spacing.md,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: BorderRadius.sm,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
    marginTop: 2,
  },
  termsText: {
    flex: 1,
    lineHeight: 20,
    fontSize: 13,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    flex: 1,
    gap: Spacing.xs,
  },
  backButtonText: {
    fontWeight: '600',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    flex: 2,
    height: 56,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 18,
    textAlign: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  signInContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.xl,
    flexWrap: 'wrap',
  },
  signInText: {
    color: '#FFFFFF',
  },
  signInLink: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
