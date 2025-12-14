/**
 * Modern Forgot Password Screen - Beautiful, polished design
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
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { resetPassword } from '@/lib/auth';
import { getCursorStyle, createInputStyle, createShadow } from '@/utils/platform-styles';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [focusedInput, setFocusedInput] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleReset = async () => {
    if (!email.trim()) {
      Alert.alert('Email Required', 'Please enter your email address');
      return;
    }

    setLoading(true);
    try {
      const { error } = await resetPassword(email.trim());

      if (error) {
        Alert.alert('Error', error.message || 'Failed to send reset email. Please try again.');
        return;
      }

      setSent(true);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <ThemedView style={styles.container}>
        <LinearGradient
          colors={colorScheme === 'dark' 
            ? ['#1a1a2e', '#16213e', '#0f3460']
            : ['#E8F5E9', '#FFFFFF', '#E3F2FD']
          }
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
          <View style={styles.sentContainer}>
            <Animated.View
              style={[
                styles.sentContent,
                {
                  opacity: fadeAnim,
                  transform: [{ scale: scaleAnim }],
                },
              ]}
            >
              <View style={[styles.successIconContainer, createShadow(12, '#10B981', 0.3)]}>
                <LinearGradient
                  colors={['#10B981', '#059669']}
                  style={styles.successIconGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Ionicons name="checkmark-circle" size={64} color="#FFFFFF" />
                </LinearGradient>
              </View>
              <ThemedText type="h1" style={styles.sentTitle}>
                Check Your Email
              </ThemedText>
              <ThemedText type="body" style={[styles.sentText, { color: colors.icon }]}>
                We've sent password reset instructions to
              </ThemedText>
              <ThemedText type="body" style={[styles.emailText, { color: colors.primary }]}>
                {email}
              </ThemedText>
              <ThemedText type="small" style={[styles.sentHint, { color: colors.icon }]}>
                Please check your inbox and follow the instructions to reset your password.
              </ThemedText>
              <TouchableOpacity
                style={[styles.backButton, createShadow(6, colors.primary, 0.3)]}
                onPress={() => router.back()}
              >
                <LinearGradient
                  colors={['#4A90E2', '#7B68EE']}
                  style={styles.buttonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <ThemedText type="body" style={styles.buttonText}>
                    Back to Login
                  </ThemedText>
                  <Ionicons name="arrow-back" size={20} color="#FFFFFF" style={{ marginLeft: Spacing.xs }} />
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </SafeAreaView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <LinearGradient
        colors={colorScheme === 'dark' 
          ? ['#1a1a2e', '#16213e', '#0f3460']
          : ['#FFF3E0', '#FFFFFF', '#FFE0B2']
        }
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
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
              {/* Header */}
              <View style={styles.header}>
                <TouchableOpacity
                  onPress={() => router.back()}
                  style={[styles.backButton, getCursorStyle()]}
                >
                  <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <View style={[styles.logoContainer, createShadow(8, '#000', 0.1)]}>
                  <LinearGradient
                    colors={['#F59E0B', '#EF4444']}
                    style={styles.logoGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Ionicons name="lock-closed" size={40} color="#FFFFFF" />
                  </LinearGradient>
                </View>
                <ThemedText type="h1" style={styles.title}>
                  Reset Password
                </ThemedText>
                <ThemedText type="body" style={[styles.subtitle, { color: colors.icon }]}>
                  Enter your email address and we'll send you instructions to reset your password
                </ThemedText>
              </View>

              {/* Form Card */}
              <View style={[styles.formCard, { backgroundColor: colors.card }, createShadow(12, '#000', 0.08)]}>
                <View style={styles.inputContainer}>
                  <ThemedText type="small" style={[styles.label, { color: colors.text }]}>
                    Email Address
                  </ThemedText>
                  <View
                    style={[
                      styles.inputWrapper,
                      {
                        backgroundColor: colors.surface,
                        borderColor: focusedInput ? colors.primary : colors.border,
                        borderWidth: focusedInput ? 2 : 1,
                      },
                      createShadow(focusedInput ? 4 : 0, colors.primary, 0.1),
                    ]}
                  >
                    <Ionicons 
                      name="mail-outline" 
                      size={22} 
                      color={focusedInput ? colors.primary : colors.icon} 
                      style={styles.inputIcon} 
                    />
                    <TextInput
                      style={[styles.input, { color: colors.text }, createInputStyle()]}
                      placeholder="your.email@cut.ac.zw"
                      placeholderTextColor={colors.icon}
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      editable={!loading}
                      onFocus={() => setFocusedInput(true)}
                      onBlur={() => setFocusedInput(false)}
                    />
                  </View>
                </View>

                <TouchableOpacity
                  style={[
                    styles.resetButton,
                    loading && styles.buttonDisabled,
                    createShadow(6, colors.primary, 0.3),
                  ]}
                  onPress={handleReset}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={loading ? [colors.border, colors.border] : ['#F59E0B', '#EF4444']}
                    style={styles.buttonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    {loading ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <>
                        <ThemedText type="body" style={styles.buttonText}>
                          Send Reset Link
                        </ThemedText>
                        <Ionicons name="send" size={20} color="#FFFFFF" style={{ marginLeft: Spacing.xs }} />
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                <View style={styles.infoContainer}>
                  <Ionicons name="information-circle-outline" size={20} color={colors.icon} />
                  <ThemedText type="small" style={[styles.infoText, { color: colors.icon }]}>
                    If an account exists with this email, you'll receive password reset instructions.
                  </ThemedText>
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
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: Spacing.lg,
    justifyContent: 'center',
  },
  content: {
    width: '100%',
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: 0,
    padding: Spacing.sm,
    zIndex: 1,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: BorderRadius.xl * 2,
    marginBottom: Spacing.lg,
    overflow: 'hidden',
  },
  logoGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontWeight: '800',
    marginBottom: Spacing.xs,
    textAlign: 'center',
    fontSize: 32,
    letterSpacing: -0.5,
  },
  subtitle: {
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 22,
    paddingHorizontal: Spacing.md,
  },
  formCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
  },
  inputContainer: {
    marginBottom: Spacing.xl,
  },
  label: {
    fontWeight: '600',
    marginBottom: Spacing.sm,
    fontSize: 14,
    letterSpacing: 0.2,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    height: 56,
  },
  inputIcon: {
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 0,
  },
  resetButton: {
    height: 56,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    marginBottom: Spacing.lg,
  },
  buttonGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: '#F0F9FF',
  },
  infoText: {
    flex: 1,
    lineHeight: 20,
    fontSize: 13,
  },
  sentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  sentContent: {
    alignItems: 'center',
    width: '100%',
  },
  successIconContainer: {
    width: 120,
    height: 120,
    borderRadius: BorderRadius.xl * 2,
    marginBottom: Spacing.xl,
    overflow: 'hidden',
  },
  successIconGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sentTitle: {
    fontWeight: '800',
    marginBottom: Spacing.md,
    textAlign: 'center',
    fontSize: 28,
  },
  sentText: {
    textAlign: 'center',
    marginBottom: Spacing.xs,
    fontSize: 16,
  },
  emailText: {
    textAlign: 'center',
    fontWeight: '700',
    marginBottom: Spacing.lg,
    fontSize: 16,
  },
  sentHint: {
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
});
