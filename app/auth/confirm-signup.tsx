import { LunavoLogo } from '@/app/components/lunavo-logo';
import { ThemedText } from '@/app/components/themed-text';
import { ThemedView } from '@/app/components/themed-view';
import { BorderRadius, Colors, PlatformStyles, Spacing } from '@/app/constants/theme';
import { useColorScheme } from '@/app/hooks/use-color-scheme';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ConfirmSignup() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const router = useRouter();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
          >
            <Animated.View entering={FadeInDown.delay(100).duration(800)} style={styles.logoSection}>
              <LunavoLogo size={88} />
              <ThemedText type="h1" style={styles.title}>LUNAVO</ThemedText>
              <ThemedText style={styles.subtitle}>Peer Education & Wellness</ThemedText>
            </Animated.View>

            <Animated.View
              entering={FadeInDown.delay(300).duration(800)}
              style={[styles.card, { backgroundColor: colors.card }]}
            >
              <ThemedText type="h2" style={styles.cardTitle}>Email Confirmed</ThemedText>
              <View style={{ gap: Spacing.md }}>
                <ThemedText>
                  Your email has been verified successfully. You can now sign in and start using the app.
                </ThemedText>
              </View>

              <TouchableOpacity
                onPress={() => router.replace('/auth/login')}
                style={styles.btnWrapper}
              >
                <LinearGradient colors={colors.gradients.primary as any} style={styles.btn}>
                  <ThemedText style={styles.btnText}>GO TO SIGN IN</ThemedText>
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
  container: { flex: 1 },
  safeArea: { flex: 1 },
  scrollContent: {
    padding: Spacing.xl,
    flexGrow: 1,
    justifyContent: 'center',
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    marginTop: Spacing.md,
    letterSpacing: 4,
  },
  subtitle: {
    fontSize: 12,
    opacity: 0.6,
    textTransform: 'uppercase',
    letterSpacing: 3,
    fontWeight: '700',
  },
  card: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.xxl,
    ...PlatformStyles.premiumShadow,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  cardTitle: {
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  btnWrapper: {
    ...PlatformStyles.premiumShadow,
    marginTop: Spacing.lg,
  },
  btn: {
    height: 56,
    borderRadius: BorderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnText: {
    color: '#FFF',
    fontWeight: '900',
    letterSpacing: 1,
    fontSize: 16,
  },
})
