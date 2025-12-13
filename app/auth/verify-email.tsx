/**
 * Email Verification Screen - OTP Entry
 * Users enter the 6-digit code sent to their email
 */

import { ThemedText } from '@/app/components/themed-text';
import { ThemedView } from '@/app/components/themed-view';
import { BorderRadius, Colors, Spacing } from '@/app/constants/theme';
import { useColorScheme } from '@/app/hooks/use-color-scheme';
import { createShadow } from '@/app/utils/platform-styles';
import { useToast } from '@/app/utils/useToast';
import { resendOTP, verifyOTP } from '@/lib/auth';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

// Beautiful Wave pattern component
const WavePattern = ({ color }: { color: string }) => (
  <Svg width="100%" height="160" viewBox="0 0 375 160" preserveAspectRatio="none">
    <Path
      d="M0,100 C93.75,60 140,70 187.5,80 C235,90 281.25,75 375,95 L375,160 L0,160 Z"
      fill={color}
      opacity="0.35"
    />
    <Path
      d="M0,110 C100,85 150,90 187.5,95 C225,100 275,90 375,105 L375,160 L0,160 Z"
      fill={color}
      opacity="0.25"
    />
    <Path
      d="M0,120 C80,105 130,108 187.5,110 C245,112 295,105 375,115 L375,160 L0,160 Z"
      fill={color}
      opacity="0.15"
    />
  </Svg>
);

export default function VerifyEmailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const email = (params.email as string) || '';
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { showToast, ToastComponent } = useToast();
  
  const [otp, setOtp] = useState(['', '', '', '', '', '', '', '']); // Support 8 digits
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  
  const inputRefs = useRef<(TextInput | null)[]>([]);
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

    // Auto-focus first input
    inputRefs.current[0]?.focus();
  }, []);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);


  const handleOtpChange = (value: string, index: number) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-verify when all 6 digits are entered
    if (newOtp.every(digit => digit !== '') && newOtp.length === 6) {
      handleVerify(newOtp.join(''));
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (code?: string) => {
    const otpCode = code || otp.filter(d => d !== '').join('');
    
    // Accept both 6 and 8 digit codes
    if (otpCode.length !== 6 && otpCode.length !== 8) {
      showToast('Please enter the complete verification code (6 or 8 digits)', 'warning', 2000);
      return;
    }

    if (!email || !email.trim()) {
      showToast('Email address is required', 'error', 3000);
      return;
    }

    setLoading(true);
    try {
      console.log('[handleVerify] Verifying OTP for:', email, 'Code:', otpCode);
      
      // Use Supabase's built-in OTP verification with type 'signup'
      const { verified, error, session } = await verifyOTP(email, otpCode, 'signup');

      console.log('[handleVerify] Response:', { 
        verified, 
        errorMessage: error?.message, 
        hasSession: !!session,
        errorCode: error?.status 
      });

      if (error || !verified) {
        const errorMessage = error?.message || 'Invalid or expired code. Please try again or request a new code.';
        console.error('[handleVerify] Verification failed:', errorMessage);
        console.log('[handleVerify] Showing error toast:', errorMessage);
        showToast(errorMessage, 'error', 5000);
        // Clear OTP on error
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
        setLoading(false);
        return;
      }

      // Success - email is verified and user is authenticated
      console.log('[handleVerify] Email verified successfully!');
      showToast('Email verified successfully! Redirecting...', 'success', 2000);
      setTimeout(() => {
        router.replace('/auth/verify-student');
      }, 1500);
    } catch (error: any) {
      console.error('[handleVerify] Exception caught:', error);
      const errorMessage = error?.message || 'An error occurred. Please try again.';
      console.log('[handleVerify] Showing exception toast:', errorMessage);
      showToast(errorMessage, 'error', 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) {
      showToast(`Please wait ${countdown} seconds before requesting a new code`, 'info', 2000);
      return;
    }

    if (!email || !email.trim()) {
      showToast('Email address is required', 'error', 3000);
      return;
    }

    setResending(true);
    try {
      console.log('[handleResend] Requesting OTP resend for:', email);
      
      // Resend OTP using Supabase's built-in resend functionality
      const { error } = await resendOTP(email);

      if (error) {
        console.error('[handleResend] Error received:', error);
        const errorMessage = error?.message || 'Failed to resend code. Please try again.';
        console.log('[handleResend] Showing error toast:', errorMessage);
        showToast(errorMessage, 'error', 5000);
        setResending(false);
        return;
      }

      console.log('[handleResend] Resend successful');
      
      // Set countdown to 60 seconds
      setCountdown(60);

      // Show success message - Supabase sends the code via email
      const successMessage = `A new verification code has been sent to ${email}`;
      console.log('[handleResend] Showing success toast:', successMessage);
      showToast(successMessage, 'success', 5000);

      // Clear OTP inputs
      setOtp(['', '', '', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (error: any) {
      console.error('[handleResend] Exception caught:', error);
      const errorMessage = error?.message || 'An error occurred. Please try again.';
      console.log('[handleResend] Showing exception toast:', errorMessage);
      showToast(errorMessage, 'error', 5000);
    } finally {
      setResending(false);
    }
  };

  const headerColor = '#1E40AF';
  const waveColor = '#60A5FA';

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        {/* Header with Wave Pattern */}
        <View style={[styles.header, { backgroundColor: headerColor }]}>
          <View style={styles.headerContent}>
            <ThemedText type="h1" style={styles.headerTitle}>
              Verify Email
            </ThemedText>
            <ThemedText type="body" style={styles.headerSubtitle}>
              Enter the 6-digit code sent to{'\n'}
              <ThemedText type="body" style={styles.emailText}>{email}</ThemedText>
            </ThemedText>
          </View>
          <View style={styles.waveContainer}>
            <WavePattern color={waveColor} />
          </View>
        </View>

        {/* Curved separator */}
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
              <View style={styles.mainContent}>
                <ThemedText type="body" style={styles.description}>
                  We've sent a verification code to your email. Please enter it below to verify your account.
                </ThemedText>

                {/* OTP Input Fields */}
                <View style={styles.otpContainer}>
                  {otp.map((digit, index) => (
                    <TextInput
                      key={index}
                      ref={(ref) => (inputRefs.current[index] = ref)}
                      style={[
                        styles.otpInput,
                        {
                          backgroundColor: '#2A2A3E',
                          borderColor: digit ? '#8B5CF6' : '#FFFFFF20',
                          borderWidth: digit ? 2 : 1,
                        },
                      ]}
                      value={digit}
                      onChangeText={(value) => handleOtpChange(value, index)}
                      onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                      keyboardType="number-pad"
                      maxLength={1}
                      selectTextOnFocus
                      editable={!loading}
                    />
                  ))}
                </View>

                {/* Resend Code */}
                <View style={styles.resendContainer}>
                  <ThemedText type="body" style={styles.resendText}>
                    Didn't receive the code?
                  </ThemedText>
                  <TouchableOpacity
                    onPress={handleResend}
                    disabled={resending || countdown > 0}
                    style={styles.resendButton}
                  >
                    {resending ? (
                      <ActivityIndicator size="small" color={colors.primary} />
                    ) : (
                      <ThemedText
                        type="body"
                        style={[
                          styles.resendButtonText,
                          { color: countdown > 0 ? '#FFFFFF60' : colors.primary },
                        ]}
                      >
                        {countdown > 0 ? `Resend in ${countdown}s` : 'Resend Code'}
                      </ThemedText>
                    )}
                  </TouchableOpacity>
                </View>

                {/* Verify Button */}
                <TouchableOpacity
                  style={[
                    styles.verifyButton,
                    { backgroundColor: '#8B5CF6' },
                    (loading) && styles.buttonDisabled,
                    createShadow(4, colors.primary, 0.3),
                  ]}
                  onPress={() => handleVerify()}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <ThemedText type="body" style={styles.buttonText}>
                      Verify Email
                    </ThemedText>
                  )}
                </TouchableOpacity>

                {/* Back to Login */}
                <TouchableOpacity
                  onPress={() => router.back()}
                  disabled={loading}
                  style={styles.backLink}
                >
                  <Ionicons name="arrow-back" size={16} color={colors.text} />
                  <ThemedText type="body" style={[styles.backLinkText, { color: colors.text }]}>
                    Back to registration
                  </ThemedText>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
        <ToastComponent />
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
  emailText: {
    fontWeight: '700',
    color: '#FFFFFF',
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
  devCodeContainer: {
    backgroundColor: '#1E3A8A',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
    alignItems: 'center',
  },
  devCodeLabel: {
    color: '#E0E7FF',
    marginBottom: Spacing.xs,
  },
  devCode: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: 8,
  },
  description: {
    marginBottom: Spacing.xl,
    lineHeight: 22,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xl,
    gap: Spacing.sm,
  },
  otpInput: {
    flex: 1,
    height: 64,
    borderRadius: BorderRadius.lg,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
    gap: Spacing.xs,
  },
  resendText: {
    color: '#FFFFFF',
  },
  resendButton: {
    padding: Spacing.xs,
  },
  resendButtonText: {
    fontWeight: '600',
  },
  verifyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    height: 56,
    marginBottom: Spacing.lg,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 18,
    textAlign: 'center',
    textShadowColor: '#000000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.md,
  },
  backLinkText: {
    fontSize: 14,
  },
});

