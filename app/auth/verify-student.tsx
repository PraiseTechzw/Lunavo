/**
 * CUT Student Verification Screen
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
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { MaterialIcons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { verifyStudent } from '@/lib/auth';
import { getCursorStyle, createInputStyle } from '@/utils/platform-styles';

const DEPARTMENTS = [
  'Applied Sciences',
  'Business Management',
  'Engineering',
  'Information Technology',
  'Social Sciences',
  'Education',
  'Other',
];

const YEARS = [1, 2, 3, 4, 5];

export default function VerifyStudentScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const [studentNumber, setStudentNumber] = useState('');
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('');
  const [year, setYear] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);

  const handleVerify = async () => {
    if (!studentNumber.trim() || !name.trim()) {
      Alert.alert('Error', 'Please enter your student number and name');
      return;
    }

    if (!department) {
      Alert.alert('Error', 'Please select your department');
      return;
    }

    if (!year) {
      Alert.alert('Error', 'Please select your year of study');
      return;
    }

    setLoading(true);
    try {
      const { verified: isVerified, error } = await verifyStudent(
        studentNumber.trim(),
        name.trim(),
        department,
        year
      );

      if (error) {
        Alert.alert('Verification Failed', error.message || 'Could not verify student. Please try again.');
        return;
      }

      if (isVerified) {
        setVerified(true);
        Alert.alert(
          'Verification Successful',
          'Your CUT student status has been verified.',
          [
            {
              text: 'OK',
              onPress: () => router.back(),
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

  if (verified) {
    return (
      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        <ThemedView style={styles.container}>
          <View style={styles.verifiedContainer}>
            <View style={[styles.iconCircle, { backgroundColor: '#10B981' + '20' }]}>
              <MaterialIcons name="check-circle" size={64} color="#10B981" />
            </View>
            <ThemedText type="h2" style={styles.verifiedTitle}>
              Verified!
            </ThemedText>
            <ThemedText type="body" style={[styles.verifiedText, { color: colors.icon }]}>
              Your CUT student status has been verified.
            </ThemedText>
          </View>
        </ThemedView>
      </SafeAreaView>
    );
  }

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
              <View style={[styles.iconCircle, { backgroundColor: '#3B82F6' + '20' }]}>
                <MaterialIcons name="school" size={48} color="#3B82F6" />
              </View>
              <ThemedText type="h1" style={styles.title}>
                Verify Student Status
              </ThemedText>
              <ThemedText type="body" style={[styles.subtitle, { color: colors.icon }]}>
                Verify your Chinhoyi University of Technology student status
              </ThemedText>
            </View>

            {/* Form */}
            <View style={styles.form}>
              {/* Student Number */}
              <View style={styles.inputContainer}>
                <ThemedText type="small" style={[styles.label, { color: colors.text }]}>
                  Student Number *
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
              </View>

              {/* Name */}
              <View style={styles.inputContainer}>
                <ThemedText type="small" style={[styles.label, { color: colors.text }]}>
                  Full Name *
                </ThemedText>
                <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <MaterialIcons name="person" size={20} color={colors.icon} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: colors.text }, createInputStyle()]}
                    placeholder="Enter your full name"
                    placeholderTextColor={colors.icon}
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                    editable={!loading}
                  />
                </View>
              </View>

              {/* Department */}
              <View style={styles.inputContainer}>
                <ThemedText type="small" style={[styles.label, { color: colors.text }]}>
                  Department/Faculty *
                </ThemedText>
                <View style={styles.pickerContainer}>
                  {DEPARTMENTS.map((dept) => (
                    <TouchableOpacity
                      key={dept}
                      style={[
                        styles.pickerOption,
                        {
                          backgroundColor: department === dept ? colors.primary + '20' : colors.surface,
                          borderColor: department === dept ? colors.primary : colors.border,
                        },
                      ]}
                      onPress={() => setDepartment(dept)}
                      disabled={loading}
                    >
                      <ThemedText
                        type="body"
                        style={{
                          color: department === dept ? colors.primary : colors.text,
                          fontWeight: department === dept ? '600' : '400',
                        }}
                      >
                        {dept}
                      </ThemedText>
                      {department === dept && (
                        <MaterialIcons name="check" size={20} color={colors.primary} />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Year of Study */}
              <View style={styles.inputContainer}>
                <ThemedText type="small" style={[styles.label, { color: colors.text }]}>
                  Year of Study *
                </ThemedText>
                <View style={styles.yearContainer}>
                  {YEARS.map((y) => (
                    <TouchableOpacity
                      key={y}
                      style={[
                        styles.yearOption,
                        {
                          backgroundColor: year === y ? colors.primary : colors.surface,
                          borderColor: year === y ? colors.primary : colors.border,
                        },
                      ]}
                      onPress={() => setYear(y)}
                      disabled={loading}
                    >
                      <ThemedText
                        type="body"
                        style={{
                          color: year === y ? '#FFFFFF' : colors.text,
                          fontWeight: '600',
                        }}
                      >
                        Year {y}
                      </ThemedText>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Verify Button */}
              <TouchableOpacity
                style={[
                  styles.verifyButton,
                  { backgroundColor: colors.primary },
                  loading && styles.buttonDisabled,
                ]}
                onPress={handleVerify}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ThemedText type="body" style={{ color: '#FFFFFF', fontWeight: '600' }}>
                    Verifying...
                  </ThemedText>
                ) : (
                  <ThemedText type="body" style={{ color: '#FFFFFF', fontWeight: '600' }}>
                    Verify Student Status
                  </ThemedText>
                )}
              </TouchableOpacity>

              <ThemedText type="small" style={[styles.note, { color: colors.icon }]}>
                * Verification helps us ensure only CUT students can access the platform.
                Your information is kept confidential and secure.
              </ThemedText>
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
  pickerContainer: {
    gap: Spacing.sm,
  },
  pickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  yearContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  yearOption: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    minWidth: 80,
    alignItems: 'center',
  },
  verifyButton: {
    height: 56,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  note: {
    textAlign: 'center',
    lineHeight: 20,
  },
  verifiedContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  verifiedTitle: {
    fontWeight: '700',
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  verifiedText: {
    textAlign: 'center',
  },
});

