/**
 * Premium CUT Student Verification Screen
 */

import { PEACELogo } from '@/app/components/peace-logo';
import { ThemedText } from '@/app/components/themed-text';
import { ThemedView } from '@/app/components/themed-view';
import { BorderRadius, Colors, PlatformStyles, Spacing } from '@/app/constants/theme';
import { useColorScheme } from '@/app/hooks/use-color-scheme';
import { verifyStudent } from '@/lib/auth';
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
  FadeInDown,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

const DEPARTMENTS = [
  'Applied Sciences',
  'Business Management',
  'Engineering',
  'Information Technology',
  'Social Sciences',
  'Education',
];

export default function VerifyStudentScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const [formData, setFormData] = useState({
    studentNumber: '',
    name: '',
    department: '',
    year: 0,
  });
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);

  // Background animation
  const floatValue = useSharedValue(0);
  useEffect(() => {
    floatValue.value = withRepeat(
      withTiming(1, { duration: 18000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const blobStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(floatValue.value, [0, 1], [0, 100]) },
      { translateY: interpolate(floatValue.value, [0, 1], [0, 50]) }
    ]
  }));

  const handleVerify = async () => {
    if (!formData.studentNumber || !formData.name || !formData.department || !formData.year) {
      Alert.alert('Missing Info', 'Please complete the verification profile.');
      return;
    }

    setLoading(true);
    try {
      const { verified: isVerified, error } = await verifyStudent(
        formData.studentNumber,
        formData.name,
        formData.department,
        formData.year
      );
      if (error) throw error;
      if (isVerified) {
        setVerified(true);
        setTimeout(() => router.replace('/(tabs)'), 2000);
      }
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  if (verified) {
    return (
      <ThemedView style={styles.container}>
        {/* Particle-like success background */}
        <View style={styles.background}>
          <LinearGradient colors={[colors.success, colors.primary]} style={[styles.blob, { top: '30%', left: '10%', opacity: 0.15 }]} />
        </View>
        <View style={styles.verifiedCenter}>
          <Animated.View entering={FadeInDown.springify()} style={styles.successCircle}>
            <Ionicons name="checkmark-circle" size={120} color={colors.success} />
          </Animated.View>
          <ThemedText type="h1" style={styles.successTitle}>Access Granted</ThemedText>
          <ThemedText style={styles.successSubtitle}>Your academic status is verified. Welcome to the HUB.</ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {/* Animated Background Blobs */}
      <View style={styles.background}>
        <Animated.View style={[styles.blobWrapper, blobStyle, { top: -100, left: -100 }]}>
          <LinearGradient colors={[colors.primary, colors.secondary]} style={styles.blob} />
        </Animated.View>
      </View>

      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

            <Animated.View entering={FadeInDown.delay(200).duration(800)} style={styles.header}>
              <PEACELogo size={90} />
              <ThemedText type="h2" style={styles.title}>Academic Verification</ThemedText>
              <ThemedText style={styles.subtitle}>We need to verify you are a valid CUT student to maintain community integrity.</ThemedText>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(400).duration(800)} style={[styles.card, { backgroundColor: colors.card }]}>
              <View style={styles.inputGroup}>
                <ThemedText style={styles.label}>Full Name</ThemedText>
                <View style={[styles.inputWrapper, { borderColor: colors.border }]}>
                  <Ionicons name="person-outline" size={20} color={colors.icon} />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="As on student ID"
                    placeholderTextColor={colors.icon}
                    value={formData.name}
                    onChangeText={v => setFormData({ ...formData, name: v })}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <ThemedText style={styles.label}>Student ID Number</ThemedText>
                <View style={[styles.inputWrapper, { borderColor: colors.border }]}>
                  <Ionicons name="badge-outline" size={20} color={colors.icon} />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="C23XXXXX"
                    placeholderTextColor={colors.icon}
                    value={formData.studentNumber}
                    onChangeText={v => setFormData({ ...formData, studentNumber: v })}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <ThemedText style={styles.label}>Department</ThemedText>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                  {DEPARTMENTS.map(d => (
                    <TouchableOpacity
                      key={d}
                      onPress={() => setFormData({ ...formData, department: d })}
                      style={[styles.chip, {
                        borderColor: formData.department === d ? colors.primary : colors.border,
                        backgroundColor: formData.department === d ? colors.primary : 'transparent',
                        transform: [{ scale: formData.department === d ? 1.05 : 1 }]
                      }]}
                    >
                      <ThemedText style={{ color: formData.department === d ? '#FFF' : colors.text, fontSize: 12, fontWeight: '700' }}>{d}</ThemedText>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.inputGroup}>
                <ThemedText style={styles.label}>Year of Study</ThemedText>
                <View style={styles.yearRow}>
                  {[1, 2, 3, 4, 5].map(y => (
                    <TouchableOpacity
                      key={y}
                      onPress={() => setFormData({ ...formData, year: y })}
                      style={[styles.yearBox, {
                        borderColor: formData.year === y ? colors.primary : colors.border,
                        backgroundColor: formData.year === y ? colors.primary : 'transparent',
                        transform: [{ scale: formData.year === y ? 1.1 : 1 }]
                      }]}
                    >
                      <ThemedText style={{ color: formData.year === y ? '#FFF' : colors.text, fontWeight: '700' }}>{y}</ThemedText>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <TouchableOpacity
                onPress={handleVerify}
                disabled={loading}
                style={styles.verifyBtnWrapper}
              >
                <LinearGradient colors={colors.gradients.primary as any} style={styles.verifyBtn}>
                  {loading ? <ActivityIndicator color="#FFF" /> : <ThemedText style={styles.btnText}>VALIDATE ACADEMIC LINK</ThemedText>}
                </LinearGradient>
              </TouchableOpacity>

            </Animated.View>

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
  header: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    marginTop: 15,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.6,
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 20,
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
  chipScroll: {
    marginTop: 5,
  },
  chip: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 10,
  },
  yearRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
  },
  yearBox: {
    width: '18%',
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifyBtnWrapper: {
    ...PlatformStyles.premiumShadow,
    marginTop: 30,
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
  verifiedCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  successCircle: {
    marginBottom: 30,
  },
  successTitle: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 2,
  },
  successSubtitle: {
    textAlign: 'center',
    opacity: 0.6,
    marginTop: 10,
    lineHeight: 24,
  }
});
