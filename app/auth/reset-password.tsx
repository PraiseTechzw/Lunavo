/**
 * Modern Reset Password Screen - Beautiful, polished design
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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { updatePassword } from '@/lib/auth';
import { getCursorStyle, createInputStyle, createShadow } from '@/utils/platform-styles';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    if (!params.token) {
      Alert.alert('Invalid Link', 'This reset link is invalid or has expired.', [
        {
          text: 'OK',
          onPress: () => router.replace('/auth/forgot-password'),
        },
      ]);
    }

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
    ]).start();
  }, []);

  const getPasswordStrength = (pwd: string): { strength: number; label: string; color: string } => {
    if (pwd.length === 0) return { strength: 0, label: '', color: colors.icon };
    if (pwd.length < 6) return { strength: 1, label: 'Weak', color: '#EF4444' };
    if (pwd.length < 8) return { strength: 2, label: 'Fair', color: '#F59E0B' };
    if (pwd.length < 12 || !/[A-Z]/.test(pwd) || !/[0-9]/.test(pwd)) {
      return { strength: 3, label: 'Good', color: '#3B82F6' };
    }
    return { strength: 4, label: 'Strong', color: '#10B981' };
  };

  const passwordStrength = getPasswordStrength(password);

  const handleReset = async () => {
    if (!password.trim() || !confirmPassword.trim()) {
      Alert.alert('Missing Information', 'Please enter both password fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Password Mismatch', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    try {
      const { error } = await updatePassword(password);

      if (error) {
        Alert.alert('Error', error.message || 'Failed to reset password. Please try again.');
        return;
      }

      Alert.alert(
        'Password Reset!',
        'Your password has been successfully reset. You can now sign in with your new password.',
        [
          {
            text: 'Sign In',
            onPress: () => router.replace('/auth/login'),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <LinearGradient
        colors={colorScheme === 'dark' 
          ? ['#1a1a2e', '#16213e', '#0f3460']
          : ['#E8F5E9', '#FFFFFF', '#C8E6C9']
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
                <View style={[styles.logoContainer, createShadow(8, '#000', 0.1)]}>
                  <LinearGradient
                    colors={['#10B981', '#059669']}
                    style={styles.logoGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Ionicons name="lock-closed" size={40} color="#FFFFFF" />
                  </LinearGradient>
                </View>
                <ThemedText type="h1" style={styles.title}>
                  New Password
                </ThemedText>
                <ThemedText type="body" style={[styles.subtitle, { color: colors.icon }]}>
                  Create a strong password for your account
                </ThemedText>
              </View>

              {/* Form Card */}
              <View style={[styles.formCard, { backgroundColor: colors.card }, createShadow(12, '#000', 0.08)]}>
                {/* Password Input */}
                <View style={styles.inputContainer}>
                  <ThemedText type="small" style={[styles.label, { color: colors.text }]}>
                    New Password
                  </ThemedText>
                  <View
                    style={[
                      styles.inputWrapper,
                      {
                        backgroundColor: colors.surface,
                        borderColor: focusedInput === 'password' ? colors.primary : colors.border,
                        borderWidth: focusedInput === 'password' ? 2 : 1,
                      },
                      createShadow(focusedInput === 'password' ? 4 : 0, colors.primary, 0.1),
                    ]}
                  >
                    <Ionicons 
                      name="lock-closed-outline" 
                      size={22} 
                      color={focusedInput === 'password' ? colors.primary : colors.icon} 
                      style={styles.inputIcon} 
                    />
                    <TextInput
                      style={[styles.input, { color: colors.text }, createInputStyle()]}
                      placeholder="Enter new password"
                      placeholderTextColor={colors.icon}
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
                        size={22}
                        color={colors.icon}
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

                {/* Confirm Password Input */}
                <View style={styles.inputContainer}>
                  <ThemedText type="small" style={[styles.label, { color: colors.text }]}>
                    Confirm Password
                  </ThemedText>
                  <View
                    style={[
                      styles.inputWrapper,
                      {
                        backgroundColor: colors.surface,
                        borderColor:
                          focusedInput === 'confirmPassword'
                            ? colors.primary
                            : confirmPassword.length > 0 && password !== confirmPassword
                            ? colors.danger
                            : colors.border,
                        borderWidth: focusedInput === 'confirmPassword' ? 2 : 1,
                      },
                      createShadow(focusedInput === 'confirmPassword' ? 4 : 0, colors.primary, 0.1),
                    ]}
                  >
                    <Ionicons 
                      name="lock-closed-outline" 
                      size={22} 
                      color={focusedInput === 'confirmPassword' ? colors.primary : colors.icon} 
                      style={styles.inputIcon} 
                    />
                    <TextInput
                      style={[styles.input, { color: colors.text }, createInputStyle()]}
                      placeholder="Confirm new password"
                      placeholderTextColor={colors.icon}
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
                      disabled={loading}
                    >
                      <Ionicons
                        name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'}
                        size={22}
                        color={colors.icon}
                      />
                    </TouchableOpacity>
                  </View>
                  {confirmPassword.length > 0 && password !== confirmPassword && (
                    <View style={styles.errorContainer}>
                      <Ionicons name="close-circle" size={16} color={colors.danger} />
                      <ThemedText type="small" style={{ color: colors.danger, marginLeft: Spacing.xs }}>
                        Passwords do not match
                      </ThemedText>
                    </View>
                  )}
                  {confirmPassword.length > 0 && password === confirmPassword && (
                    <View style={styles.successContainer}>
                      <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                      <ThemedText type="small" style={{ color: '#10B981', marginLeft: Spacing.xs }}>
                        Passwords match
                      </ThemedText>
                    </View>
                  )}
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
                    colors={loading ? [colors.border, colors.border] : ['#10B981', '#059669']}
                    style={styles.buttonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    {loading ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <>
                        <ThemedText type="body" style={styles.buttonText}>
                          Reset Password
                        </ThemedText>
                        <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" style={{ marginLeft: Spacing.xs }} />
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
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
  },
  formCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
  },
  inputContainer: {
    marginBottom: Spacing.lg,
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
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  successContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  resetButton: {
    height: 56,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    marginTop: Spacing.md,
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
});
