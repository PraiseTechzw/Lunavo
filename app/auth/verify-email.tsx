/**
 * Premium Email Verification Screen
 */

import { PEACELogo } from '@/app/components/peace-logo';
import { ThemedText } from '@/app/components/themed-text';
import { ThemedView } from '@/app/components/themed-view';
import { BorderRadius, Colors, PlatformStyles, Spacing } from '@/app/constants/theme';
import { useColorScheme } from '@/app/hooks/use-color-scheme';
import { resendOTP, verifyOTP } from '@/lib/auth';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function VerifyEmailScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  // 8-digit OTP state
  const [otp, setOtp] = useState(['', '', '', '', '', '', '', '']);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  // Background animation
  const floatValue = useSharedValue(0);
  useEffect(() => {
    floatValue.value = withRepeat(
      withTiming(1, { duration: 15000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const blobStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(floatValue.value, [0, 1], [0, 80]) },
      { rotate: `${interpolate(floatValue.value, [0, 1], [0, 10])}deg` }
    ]
  }));

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleOtpChange = (value: string, index: number) => {
    // Handle Paste (length > 1)
    if (value.length > 1) {
      const pastedDigits = value.replace(/[^0-9]/g, '').split('').slice(0, 8);
      if (pastedDigits.length === 0) return;

      const newOtp = [...otp];
      pastedDigits.forEach((digit, i) => {
        const targetIndex = index + i;
        if (targetIndex < 8) {
          newOtp[targetIndex] = digit;
        }
      });
      setOtp(newOtp);

      // Auto-focus the next empty slot or the last pasted slot
      const nextIndex = Math.min(index + pastedDigits.length, 7);
      inputRefs.current[nextIndex]?.focus();
      return;
    }

    // Handle Single Input - allow digits only
    if (value && !/^\d$/.test(value)) return;

    // Take last char if multiple (edge case)
    const char = value.slice(-1);

    const newOtp = [...otp];
    newOtp[index] = char;
    setOtp(newOtp);

    // Auto-advance
    if (char && index < 7) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length < 8) return;

    setLoading(true);
    try {
      const { verified, error } = await verifyOTP(email || '', code, 'signup');
      if (error) throw error;
      router.replace('/auth/verify-student');
    } catch (e: any) {
      Alert.alert('Verification Failed', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      {/* Animated Background Blobs */}
      <View style={styles.background}>
        <Animated.View style={[styles.blobWrapper, blobStyle, { top: -150, right: -100 }]}>
          <LinearGradient colors={[colors.primary, colors.secondary]} style={styles.blob} />
        </Animated.View>
        <Animated.View style={[styles.blobWrapper, blobStyle, { bottom: -150, left: -100, transform: [{ scale: 0.8 }] }]}>
          <LinearGradient colors={[colors.secondary, colors.primary]} style={styles.blob} />
        </Animated.View>
      </View>

      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

            <Animated.View entering={FadeInDown.delay(200).duration(800)} style={styles.header}>
              <PEACELogo size={100} />
              <ThemedText type="h1" style={styles.title}>Secure Link</ThemedText>
              <ThemedText style={styles.subtitle}>Enter the 8-digit security protocol sent to</ThemedText>
              <ThemedText style={styles.emailText}>{email}</ThemedText>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(400).duration(800)} style={[styles.card, { backgroundColor: colors.card }]}>
              <View style={styles.otpRoot}>
                {otp.map((digit, i) => (
                  <Animated.View
                    key={i}
                    entering={FadeInDown.delay(400 + (i * 50)).springify()}
                    style={{ width: '11%' }}
                  >
                    <TextInput
                      ref={el => { inputRefs.current[i] = el; }}
                      style={[styles.otpBox, {
                        color: colors.text,
                        backgroundColor: digit ? colors.primary + '10' : 'rgba(255,255,255,0.03)',
                        borderColor: focusedIndex === i ? colors.primary : digit ? colors.primary + '50' : colors.border,
                        borderWidth: focusedIndex === i ? 2 : digit ? 1.5 : 1,
                        ...PlatformStyles.shadow,
                        shadowColor: focusedIndex === i ? colors.primary : '#000',
                        shadowOpacity: focusedIndex === i ? 0.3 : 0.1,
                      }]}
                      onFocus={() => setFocusedIndex(i)}
                      onBlur={() => setFocusedIndex(null)}
                      maxLength={8} // Allow enough length for paste detection
                      keyboardType="number-pad"
                      textContentType="oneTimeCode" // Help iOS autofill
                      value={digit}
                      onChangeText={v => handleOtpChange(v, i)}
                      onKeyPress={({ nativeEvent }) => {
                        if (nativeEvent.key === 'Backspace' && !otp[i] && i > 0) {
                          inputRefs.current[i - 1]?.focus();
                        }
                      }}
                    />
                  </Animated.View>
                ))}
              </View>

              <TouchableOpacity
                onPress={handleVerify}
                disabled={loading || otp.some(d => !d)}
                style={styles.verifyBtnWrapper}
              >
                <LinearGradient colors={colors.gradients.primary as any} style={styles.verifyBtn}>
                  {loading ? <ActivityIndicator color="#FFF" /> : <ThemedText style={styles.btnText}>VERIFY CONNECTION</ThemedText>}
                </LinearGradient>
              </TouchableOpacity>

              <View style={styles.resendRow}>
                <ThemedText style={{ opacity: 0.6 }}>Didn't receive it? </ThemedText>
                <TouchableOpacity disabled={countdown > 0} onPress={async () => {
                  setResending(true);
                  await resendOTP(email || '');
                  setCountdown(60);
                  setResending(false);
                }}>
                  <ThemedText style={{ color: colors.primary, fontWeight: '700' }}>
                    {countdown > 0 ? `Resend in ${countdown}s` : 'Resend Code'}
                  </ThemedText>
                </TouchableOpacity>
              </View>
            </Animated.View>

            <TouchableOpacity onPress={() => router.back()} style={styles.backLink}>
              <ThemedText style={{ opacity: 0.6 }}>Wrong email? Go back</ThemedText>
            </TouchableOpacity>

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
  background: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  blobWrapper: {
    position: 'absolute',
    width: 600,
    height: 600,
  },
  blob: {
    width: '100%',
    height: '100%',
    borderRadius: 300,
    opacity: 0.1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.xl,
    flexGrow: 1,
    paddingTop: 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    marginTop: 20,
    letterSpacing: 2,
  },
  subtitle: {
    opacity: 0.6,
    marginTop: 8,
  },
  emailText: {
    fontWeight: '700',
    fontSize: 16,
  },
  card: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.xxl,
    ...PlatformStyles.premiumShadow,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  otpRoot: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  otpBox: {
    height: 60,
    borderRadius: BorderRadius.lg,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '700',
  },
  verifyBtnWrapper: {
    ...PlatformStyles.premiumShadow,
    marginBottom: 20,
    marginTop: 20,
  },
  verifyBtn: {
    height: 60,
    borderRadius: BorderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnText: {
    color: '#FFF',
    fontWeight: '900',
    letterSpacing: 1,
  },
  resendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  backLink: {
    marginTop: 40,
    alignItems: 'center',
  },
});
