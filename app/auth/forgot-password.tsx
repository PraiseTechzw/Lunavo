/**
 * Premium Forgot Password Screen
 */

import { PEACELogo } from '@/app/components/peace-logo';
import { ThemedText } from '@/app/components/themed-text';
import { ThemedView } from '@/app/components/themed-view';
import { BorderRadius, Colors, PlatformStyles, Spacing } from '@/app/constants/theme';
import { useColorScheme } from '@/app/hooks/use-color-scheme';
import { resetPassword } from '@/lib/auth';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
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
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleReset = async () => {
    if (!email.trim()) return;
    setLoading(true);
    try {
      const { error } = await resetPassword(email.trim());
      if (error) throw error;
      setSent(true);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.verifiedCenter}>
          <Animated.View entering={FadeInDown} style={styles.successCircle}>
            <Ionicons name="mail-unread-outline" size={100} color={colors.primary} />
          </Animated.View>
          <ThemedText type="h1">Protocol Initiated</ThemedText>
          <ThemedText style={styles.subtitle}>Check {email} for restoration steps.</ThemedText>
          <TouchableOpacity style={styles.backLink} onPress={() => router.replace('/auth/login')}>
            <ThemedText style={{ color: colors.primary, fontWeight: '700' }}>Back to Terminal</ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.background}>
        <LinearGradient colors={[colors.warning, colors.danger]} style={[styles.blob, { top: -200, right: -100, opacity: 0.1 }]} />
      </View>

      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>

            <View style={styles.header}>
              <PEACELogo size={80} />
              <ThemedText type="h1" style={styles.title}>Restore Link</ThemedText>
              <ThemedText style={styles.subtitle}>Lost your connection? Enter your academic email to restore your PEACE profile.</ThemedText>
            </View>

            <Animated.View entering={FadeInDown} style={[styles.card, { backgroundColor: colors.card }]}>
              <View style={styles.inputGroup}>
                <ThemedText style={styles.label}>Academic Email</ThemedText>
                <View style={[styles.inputWrapper, { borderColor: colors.border }]}>
                  <Ionicons name="mail-outline" size={20} color={colors.icon} />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="name@cut.ac.zw"
                    placeholderTextColor={colors.icon}
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                  />
                </View>
              </View>

              <TouchableOpacity
                onPress={handleReset}
                disabled={loading || !email}
                style={styles.btnWrapper}
              >
                <LinearGradient colors={colors.gradients.warm as any} style={styles.btn}>
                  {loading ? <ActivityIndicator color="#FFF" /> : <ThemedText style={styles.btnText}>SEND RESTORATION LINK</ThemedText>}
                </LinearGradient>
              </TouchableOpacity>
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
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  blob: {
    position: 'absolute',
    width: 600,
    height: 600,
    borderRadius: 300,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.xl,
    flexGrow: 1,
    justifyContent: 'center',
  },
  backBtn: {
    position: 'absolute',
    top: 20,
    left: 20,
    zIndex: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    marginTop: 20,
  },
  subtitle: {
    opacity: 0.6,
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 22,
  },
  card: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.xxl,
    ...PlatformStyles.shadow,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  inputGroup: {
    marginBottom: Spacing.xl,
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
  btnWrapper: {
    ...PlatformStyles.premiumShadow,
  },
  btn: {
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
  verifiedCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  successCircle: {
    marginBottom: 30,
  },
  backLink: {
    marginTop: 30,
  }
});
