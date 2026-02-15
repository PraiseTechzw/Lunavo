/**
 * Web Required Screen - Premium Version
 * Shown when Student Affairs tries to access on mobile
 */

import { ThemedText } from '@/app/components/themed-text';
import { ThemedView } from '@/app/components/themed-view';
import { BorderRadius, Colors, PlatformStyles, Spacing } from '@/app/constants/theme';
import { useColorScheme } from '@/app/hooks/use-color-scheme';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function WebRequiredScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <ThemedView style={styles.container}>
        <Animated.View entering={FadeInDown.duration(800)} style={styles.content}>
          <LinearGradient
            colors={[colors.primary, colors.secondary]}
            style={styles.iconCircle}
          >
            <MaterialIcons name="desktop-mac" size={60} color="#FFF" />
          </LinearGradient>

          <ThemedText type="h1" style={styles.title}>Web Portal Only</ThemedText>

          <ThemedText type="body" style={styles.message}>
            The Student Affairs Command Center contains sensitive data and administrative tools requiring a desktop-class interface for security compliance.
          </ThemedText>

          <View style={[styles.instructionBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <ThemedText type="h3" style={{ marginBottom: Spacing.md, color: colors.primary }}>
              Access Protocol:
            </ThemedText>

            <View style={styles.step}>
              <View style={[styles.dot, { backgroundColor: colors.primary }]} />
              <ThemedText style={styles.stepText}>Open your authorized workstation browser.</ThemedText>
            </View>
            <View style={styles.step}>
              <View style={[styles.dot, { backgroundColor: colors.primary }]} />
              <ThemedText style={styles.stepText}>Visit the PEACE Web Portal.</ThemedText>
            </View>
            <View style={styles.step}>
              <View style={[styles.dot, { backgroundColor: colors.primary }]} />
              <ThemedText style={styles.stepText}>Authenticate with your SA credentials.</ThemedText>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.backBtn, { borderColor: colors.border }]}
            onPress={() => router.replace('/auth/login')}
          >
            <Ionicons name="arrow-back" size={20} color={colors.text} />
            <ThemedText style={{ fontWeight: '600' }}>Back to Login</ThemedText>
          </TouchableOpacity>

          <View style={styles.footer}>
            <ThemedText type="small" style={{ color: colors.icon }}>
              Encryption Status: ACTIVE (AES-256)
            </ThemedText>
          </View>
        </Animated.View>
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  content: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
    ...PlatformStyles.premiumShadow,
  },
  title: {
    fontSize: 28,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  message: {
    textAlign: 'center',
    opacity: 0.8,
    lineHeight: 24,
    marginBottom: Spacing.xl,
  },
  instructionBox: {
    width: '100%',
    padding: Spacing.lg,
    borderRadius: BorderRadius.xxl,
    borderWidth: 1,
    marginBottom: Spacing.xl,
    ...PlatformStyles.shadow,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    gap: Spacing.md,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  stepText: {
    fontSize: 14,
    lineHeight: 20,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  footer: {
    marginTop: Spacing.xxl,
    opacity: 0.5,
  },
});
