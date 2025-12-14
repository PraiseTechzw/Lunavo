/**
 * Web Required Screen
 * Shown when Student Affairs tries to access on mobile
 */

import { ThemedText } from '@/app/components/themed-text';
import { ThemedView } from '@/app/components/themed-view';
import { Colors, Spacing } from '@/app/constants/theme';
import { useColorScheme } from '@/app/hooks/use-color-scheme';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function WebRequiredScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <ThemedView style={styles.container}>
        <View style={styles.content}>
          <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
            <MaterialIcons name="computer" size={64} color={colors.primary} />
          </View>
          
          <ThemedText type="h1" style={[styles.title, { color: colors.text }]}>
            Web Access Required
          </ThemedText>
          
          <ThemedText type="body" style={[styles.message, { color: colors.icon }]}>
            The Student Affairs dashboard is only available on web browsers for security and data management purposes.
          </ThemedText>
          
          <View style={styles.instructionsContainer}>
            <ThemedText type="h3" style={[styles.instructionsTitle, { color: colors.text }]}>
              How to Access:
            </ThemedText>
            
            <View style={styles.step}>
              <View style={[styles.stepNumber, { backgroundColor: colors.primary }]}>
                <ThemedText type="body" style={styles.stepNumberText}>1</ThemedText>
              </View>
              <ThemedText type="body" style={[styles.stepText, { color: colors.text }]}>
                Open a web browser on your computer
              </ThemedText>
            </View>
            
            <View style={styles.step}>
              <View style={[styles.stepNumber, { backgroundColor: colors.primary }]}>
                <ThemedText type="body" style={styles.stepNumberText}>2</ThemedText>
              </View>
              <ThemedText type="body" style={[styles.stepText, { color: colors.text }]}>
                Navigate to the Lunavo web portal
              </ThemedText>
            </View>
            
            <View style={styles.step}>
              <View style={[styles.stepNumber, { backgroundColor: colors.primary }]}>
                <ThemedText type="body" style={styles.stepNumberText}>3</ThemedText>
              </View>
              <ThemedText type="body" style={[styles.stepText, { color: colors.text }]}>
                Log in with your Student Affairs credentials
              </ThemedText>
            </View>
          </View>
          
          <ThemedText type="small" style={[styles.footer, { color: colors.icon }]}>
            For assistance, please contact the IT support team.
          </ThemedText>
        </View>
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
    maxWidth: 500,
    width: '100%',
    alignItems: 'center',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: Spacing.xl,
  },
  instructionsContainer: {
    width: '100%',
    marginBottom: Spacing.xl,
  },
  instructionsTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
    marginTop: 2,
  },
  stepNumberText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  stepText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
  },
  footer: {
    textAlign: 'center',
    marginTop: Spacing.lg,
    fontSize: 14,
  },
});
