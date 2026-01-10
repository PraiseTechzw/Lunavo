/**
 * Premium Multi-Step Registration Screen
 * Overhauled with PEACE branding, Glassmorphism, and Blobs
 */

import { PEACELogo } from '@/app/components/peace-logo';
import { ThemedText } from '@/app/components/themed-text';
import { ThemedView } from '@/app/components/themed-view';
import { BorderRadius, Colors, PlatformStyles, Spacing } from '@/app/constants/theme';
import { useColorScheme } from '@/app/hooks/use-color-scheme';
import { signUp } from '@/lib/auth';
import { checkEmailAvailability } from '@/lib/database';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  Easing,
  FadeInRight,
  FadeOutLeft,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

type RegisterStep = 1 | 2 | 3 | 4;

export default function RegisterScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const [step, setStep] = useState<RegisterStep>(1);
  const [loading, setLoading] = useState(false);

  // Background animation
  const floatValue = useSharedValue(0);
  useEffect(() => {
    floatValue.value = withRepeat(
      withTiming(1, { duration: 12000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const blob1Style = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(floatValue.value, [0, 1], [0, 60]) },
      { translateX: interpolate(floatValue.value, [0, 1], [0, 30]) }
    ]
  }));

  const blob2Style = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(floatValue.value, [0, 1], [0, -50]) },
      { translateX: interpolate(floatValue.value, [0, 1], [0, -20]) }
    ]
  }));

  // Form State
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    studentNumber: '',
    username: '',
    phone: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    acceptedTerms: false,
  });

  const [emailStatus, setEmailStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');

  // Logic for Email validation
  useEffect(() => {
    if (formData.email.includes('@')) {
      setEmailStatus('checking');
      const t = setTimeout(async () => {
        const avVal = await checkEmailAvailability(formData.email);
        setEmailStatus(avVal ? 'available' : 'taken');
      }, 500);
      return () => clearTimeout(t);
    }
  }, [formData.email]);

  const handleRegister = async () => {
    if (!formData.acceptedTerms) {
      Alert.alert('Required', 'Accept terms to proceed.');
      return;
    }
    setLoading(true);
    try {
      const { user, error } = await signUp({
        ...formData,
        role: 'student',
      } as any);
      if (error) throw error;
      router.replace({ pathname: '/auth/verify-email', params: { email: formData.email } });
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  const InputField = ({ label, icon, value, onChange, placeholder, secure = false, statusIcon }: any) => (
    <View style={styles.inputGroup}>
      <ThemedText style={styles.label}>{label}</ThemedText>
      <View style={[styles.inputWrapper, { borderColor: colors.border }]}>
        <Ionicons name={icon} size={20} color={colors.icon} />
        <TextInput
          style={[styles.input, { color: colors.text }]}
          placeholder={placeholder}
          placeholderTextColor={colors.icon}
          value={value}
          onChangeText={onChange}
          secureTextEntry={secure}
          autoCapitalize="none"
        />
        {statusIcon}
      </View>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      {/* Animated Background Blobs */}
      <View style={styles.background}>
        <Animated.View style={[styles.blobWrapper, blob1Style, { top: -200, left: -100 }]}>
          <LinearGradient colors={[colors.primary, colors.secondary]} style={styles.blob} />
        </Animated.View>
        <Animated.View style={[styles.blobWrapper, blob2Style, { bottom: -200, right: -100 }]}>
          <LinearGradient colors={[colors.success, colors.primary]} style={styles.blob} />
        </Animated.View>
      </View>

      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

            <View style={styles.fixedHeader}>
              <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                <Ionicons name="arrow-back" size={24} color={colors.text} />
              </TouchableOpacity>
              <View style={styles.progressTrack}>
                {[1, 2, 3, 4].map(s => (
                  <View key={s} style={[styles.progressDot, {
                    backgroundColor: s <= step ? colors.primary : colors.border,
                    width: s === step ? 30 : 20
                  }]} />
                ))}
              </View>
            </View>

            <View style={styles.logoSection}>
              <PEACELogo size={80} />
              <ThemedText type="h2" style={styles.stepTitle}>
                {step === 1 ? 'Academic ID' : step === 2 ? 'Identity' : step === 3 ? 'Contact' : 'Protocol'}
              </ThemedText>
            </View>

            <Animated.View
              key={step}
              entering={FadeInRight.duration(400)}
              exiting={FadeOutLeft.duration(400)}
              style={[styles.card, { backgroundColor: colors.card }]}
            >
              {step === 1 && (
                <View>
                  <InputField
                    label="University Email"
                    icon="mail-outline"
                    value={formData.email}
                    onChange={(v: string) => setFormData({ ...formData, email: v })}
                    placeholder="name@cut.ac.zw"
                    statusIcon={emailStatus === 'checking' ? <ActivityIndicator size="small" /> : emailStatus === 'available' ? <Ionicons name="checkmark-circle" color={colors.success} size={20} /> : null}
                  />
                  <InputField label="Student ID" icon="card-outline" value={formData.studentNumber} onChange={(v: string) => setFormData({ ...formData, studentNumber: v })} placeholder="C23XXXXX" />
                  <InputField label="Password" icon="lock-closed-outline" secure value={formData.password} onChange={(v: string) => setFormData({ ...formData, password: v })} placeholder="••••••••" />
                  <InputField label="Confirm" icon="lock-closed-outline" secure value={formData.confirmPassword} onChange={(v: string) => setFormData({ ...formData, confirmPassword: v })} placeholder="••••••••" />
                </View>
              )}

              {step === 2 && (
                <View>
                  <InputField label="Community Alias" icon="person-outline" value={formData.username} onChange={(v: string) => setFormData({ ...formData, username: v })} placeholder="choose_a_nickname" />
                  <ThemedText style={styles.hintText}>This name is visible to peers. It can be different from your real name.</ThemedText>
                </View>
              )}

              {step === 3 && (
                <View>
                  <InputField label="Your Phone" icon="phone-portrait-outline" value={formData.phone} onChange={(v: string) => setFormData({ ...formData, phone: v })} placeholder="+263..." />
                  <InputField label="Emergency Name" icon="people-outline" value={formData.emergencyContactName} onChange={(v: string) => setFormData({ ...formData, emergencyContactName: v })} placeholder="Full Name" />
                  <InputField label="Emergency Phone" icon="call-outline" value={formData.emergencyContactPhone} onChange={(v: string) => setFormData({ ...formData, emergencyContactPhone: v })} placeholder="+263..." />
                </View>
              )}

              {step === 4 && (
                <View>
                  <ThemedText type="h3">Community Protocols</ThemedText>
                  <ThemedText style={styles.termsText}>
                    By joining PEACE, you agree to uphold our values of anonymity, mutual respect, and
                    institutional oversight. Your identity is shared ONLY with professional responders
                    during critical escalations.
                  </ThemedText>
                  <TouchableOpacity
                    style={styles.checkboxRow}
                    onPress={() => setFormData({ ...formData, acceptedTerms: !formData.acceptedTerms })}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.checkbox, { borderColor: colors.primary, backgroundColor: formData.acceptedTerms ? colors.primary : 'transparent' }]}>
                      {formData.acceptedTerms && <Ionicons name="checkmark" size={14} color="#FFF" />}
                    </View>
                    <ThemedText>I uphold the PEACE protocol</ThemedText>
                  </TouchableOpacity>
                </View>
              )}

              <View style={styles.actionRow}>
                {step > 1 && (
                  <TouchableOpacity style={[styles.navBtn, { borderColor: colors.border }]} onPress={() => setStep((step - 1) as any)}>
                    <ThemedText>Back</ThemedText>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[styles.primaryBtnWrapper, { flex: 1 }]}
                  onPress={step === 4 ? handleRegister : () => setStep((step + 1) as any)}
                >
                  <LinearGradient colors={colors.gradients.primary as any} style={styles.primaryBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                    {loading ? <ActivityIndicator color="#FFF" /> : <ThemedText style={styles.btnText}>{step === 4 ? 'ESTABLISH LINK' : 'CONTINUE'}</ThemedText>}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </Animated.View>

            <View style={styles.footer}>
              <ThemedText style={{ opacity: 0.6 }}>Already connected? </ThemedText>
              <TouchableOpacity onPress={() => router.push('/auth/login')}>
                <ThemedText style={{ color: colors.primary, fontWeight: '700' }}>Sign In</ThemedText>
              </TouchableOpacity>
            </View>

            <View style={{ height: 40 }} />
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
  },
  fixedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressTrack: {
    flexDirection: 'row',
    gap: 8,
  },
  progressDot: {
    height: 6,
    borderRadius: 3,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  stepTitle: {
    marginTop: 10,
    letterSpacing: 2,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  card: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.xxl,
    ...PlatformStyles.premiumShadow,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: Spacing.xs,
    marginLeft: 4,
    opacity: 0.7,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    height: 60,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    gap: Spacing.md,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  hintText: {
    fontSize: 12,
    opacity: 0.6,
    textAlign: 'center',
  },
  termsText: {
    marginTop: Spacing.md,
    lineHeight: 22,
    opacity: 0.8,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 30,
    marginBottom: 20,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: 20,
  },
  navBtn: {
    paddingHorizontal: 25,
    height: 60,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryBtnWrapper: {
    ...PlatformStyles.premiumShadow,
  },
  primaryBtn: {
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
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 30,
  },
});
