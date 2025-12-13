/**
 * Registration Screen
 */

import { useState } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ThemedView } from '@/app/components/themed-view';
import { ThemedText } from '@/app/components/themed-text';
import { MaterialIcons } from '@expo/vector-icons';
import { useColorScheme } from '@/app/hooks/use-color-scheme';
import { Colors, Spacing, BorderRadius } from '@/app/constants/theme';
import { signUp } from '@/lib/auth';
import { getCursorStyle, createInputStyle } from '@/app/utils/platform-styles';

export default function RegisterScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [studentNumber, setStudentNumber] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

  const handleRegister = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    if (!acceptedTerms) {
      Alert.alert('Error', 'Please accept the terms and conditions');
      return;
    }

    setLoading(true);
    try {
      const { user, error } = await signUp({
        email: email.trim(),
        password,
        studentNumber: studentNumber.trim() || undefined,
        role: 'student',
      });

      if (error) {
        Alert.alert('Registration Failed', error.message || 'An error occurred. Please try again.');
        return;
      }

      if (user) {
        Alert.alert(
          'Registration Successful',
          'Your account has been created. You can now sign in.',
          [
            {
              text: 'OK',
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

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <ThemedView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity
                onPress={() => router.back()}
                style={[styles.backButton, getCursorStyle()]}
              >
                <MaterialIcons name="arrow-back" size={24} color={colors.text} />
              </TouchableOpacity>
              <View style={[styles.iconCircle, { backgroundColor: '#A2D2FF' + '20' }]}>
                <MaterialIcons name="person-add" size={48} color="#A2D2FF" />
              </View>
              <ThemedText type="h1" style={styles.title}>
                Create Account
              </ThemedText>
              <ThemedText type="body" style={[styles.subtitle, { color: colors.icon }]}>
                Join the Lunavo community
              </ThemedText>
            </View>

            {/* Form */}
            <View style={styles.form}>
              {/* Email Input */}
              <View style={styles.inputContainer}>
                <ThemedText type="small" style={[styles.label, { color: colors.text }]}>
                  Email *
                </ThemedText>
                <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <MaterialIcons name="email" size={20} color={colors.icon} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: colors.text }, createInputStyle()]}
                    placeholder="Enter your email"
                    placeholderTextColor={colors.icon}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!loading}
                  />
                </View>
              </View>

              {/* Student Number Input (Optional) */}
              <View style={styles.inputContainer}>
                <ThemedText type="small" style={[styles.label, { color: colors.text }]}>
                  Student Number (Optional)
                </ThemedText>
                <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <MaterialIcons name="badge" size={20} color={colors.icon} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: colors.text }, createInputStyle()]}
                    placeholder="Enter your student number"
                    placeholderTextColor={colors.icon}
                    value={studentNumber}
                    onChangeText={setStudentNumber}
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!loading}
                  />
                </View>
                <ThemedText type="small" style={[styles.hint, { color: colors.icon }]}>
                  Verify your CUT student status later
                </ThemedText>
              </View>

              {/* Password Input */}
              <View style={styles.inputContainer}>
                <ThemedText type="small" style={[styles.label, { color: colors.text }]}>
                  Password *
                </ThemedText>
                <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <MaterialIcons name="lock" size={20} color={colors.icon} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: colors.text }, createInputStyle()]}
                    placeholder="Create a password"
                    placeholderTextColor={colors.icon}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!loading}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeIcon}
                    disabled={loading}
                  >
                    <MaterialIcons
                      name={showPassword ? 'visibility' : 'visibility-off'}
                      size={20}
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
                    <ThemedText type="small" style={{ color: passwordStrength.color }}>
                      {passwordStrength.label}
                    </ThemedText>
                  </View>
                )}
              </View>

              {/* Confirm Password Input */}
              <View style={styles.inputContainer}>
                <ThemedText type="small" style={[styles.label, { color: colors.text }]}>
                  Confirm Password *
                </ThemedText>
                <View
                  style={[
                    styles.inputWrapper,
                    {
                      backgroundColor: colors.surface,
                      borderColor:
                        confirmPassword.length > 0 && password !== confirmPassword
                          ? colors.danger
                          : colors.border,
                    },
                  ]}
                >
                  <MaterialIcons name="lock-outline" size={20} color={colors.icon} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: colors.text }, createInputStyle()]}
                    placeholder="Confirm your password"
                    placeholderTextColor={colors.icon}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!loading}
                  />
                  <TouchableOpacity
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={styles.eyeIcon}
                    disabled={loading}
                  >
                    <MaterialIcons
                      name={showConfirmPassword ? 'visibility' : 'visibility-off'}
                      size={20}
                      color={colors.icon}
                    />
                  </TouchableOpacity>
                </View>
                {confirmPassword.length > 0 && password !== confirmPassword && (
                  <ThemedText type="small" style={{ color: colors.danger, marginTop: Spacing.xs }}>
                    Passwords do not match
                  </ThemedText>
                )}
              </View>

              {/* Terms & Conditions */}
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
                      backgroundColor: acceptedTerms ? colors.primary : 'transparent',
                      borderColor: acceptedTerms ? colors.primary : colors.border,
                    },
                  ]}
                >
                  {acceptedTerms && <MaterialIcons name="check" size={16} color="#FFFFFF" />}
                </View>
                <ThemedText type="small" style={[styles.termsText, { color: colors.text }]}>
                  I agree to the Terms & Conditions and Privacy Policy
                </ThemedText>
              </TouchableOpacity>

              {/* Register Button */}
              <TouchableOpacity
                style={[
                  styles.registerButton,
                  { backgroundColor: colors.primary },
                  (loading || !acceptedTerms) && styles.buttonDisabled,
                ]}
                onPress={handleRegister}
                disabled={loading || !acceptedTerms}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ThemedText type="body" style={{ color: '#FFFFFF', fontWeight: '600' }}>
                    Creating Account...
                  </ThemedText>
                ) : (
                  <ThemedText type="body" style={{ color: '#FFFFFF', fontWeight: '600' }}>
                    Create Account
                  </ThemedText>
                )}
              </TouchableOpacity>

              {/* Sign In Link */}
              <View style={styles.signInContainer}>
                <ThemedText type="body" style={{ color: colors.icon }}>
                  Already have an account?{' '}
                </ThemedText>
                <TouchableOpacity
                  onPress={() => router.push('/auth/login')}
                  disabled={loading}
                >
                  <ThemedText type="body" style={{ color: colors.primary, fontWeight: '600' }}>
                    Sign In
                  </ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: Spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
    marginTop: Spacing.md,
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: 0,
    padding: Spacing.sm,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    fontWeight: '700',
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: BorderRadius.md,
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
  },
  hint: {
    marginTop: Spacing.xs,
    fontStyle: 'italic',
  },
  strengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
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
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: BorderRadius.sm,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  termsText: {
    flex: 1,
    lineHeight: 20,
  },
  registerButton: {
    height: 56,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  signInContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

