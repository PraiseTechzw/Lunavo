/**
 * Feedback Screen
 */

import { ThemedText } from '@/app/components/themed-text';
import { ThemedView } from '@/app/components/themed-view';
import { BorderRadius, Colors, Spacing } from '@/app/constants/theme';
import { useColorScheme } from '@/app/hooks/use-color-scheme';
import { createShadow } from '@/app/utils/platform-styles';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, TextInput, TouchableOpacity, View, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DrawerHeader } from '@/app/components/navigation/drawer-header';
import { useState } from 'react';

export default function FeedbackScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [feedbackType, setFeedbackType] = useState<'bug' | 'feature' | 'general' | null>(null);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const feedbackTypes = [
    { id: 'bug', label: 'Bug Report', icon: 'bug-report' as const, description: 'Report a problem or error' },
    { id: 'feature', label: 'Feature Request', icon: 'lightbulb' as const, description: 'Suggest a new feature' },
    { id: 'general', label: 'General Feedback', icon: 'feedback' as const, description: 'Share your thoughts' },
  ];

  const handleSubmit = async () => {
    if (!feedbackType) {
      Alert.alert('Select Type', 'Please select a feedback type');
      return;
    }
    if (!subject.trim()) {
      Alert.alert('Subject Required', 'Please enter a subject');
      return;
    }
    if (!message.trim()) {
      Alert.alert('Message Required', 'Please enter your feedback');
      return;
    }

    setSubmitting(true);
    try {
      // TODO: Implement actual feedback submission to backend
      // For now, just show success message
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      Alert.alert(
        'Thank You!',
        'Your feedback has been submitted. We appreciate your input!',
        [
          {
            text: 'OK',
            onPress: () => {
              setSubject('');
              setMessage('');
              setFeedbackType(null);
              router.back();
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to submit feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ThemedView style={styles.container}>
        {/* Drawer Header - Mobile Only */}
        <DrawerHeader
          title="Send Feedback"
          onMenuPress={() => setDrawerVisible(false)}
          rightAction={{
            icon: 'close',
            onPress: () => router.back(),
          }}
        />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
              <MaterialIcons name="feedback" size={48} color={colors.primary} />
            </View>
            <ThemedText type="h1" style={[styles.title, { color: colors.text }]}>
              We'd Love Your Feedback
            </ThemedText>
            <ThemedText type="body" style={[styles.subtitle, { color: colors.icon }]}>
              Help us improve Lunavo by sharing your thoughts, reporting bugs, or suggesting features
            </ThemedText>
          </View>

          {/* Feedback Type Selection */}
          <View style={styles.section}>
            <ThemedText type="h3" style={[styles.sectionTitle, { color: colors.text }]}>
              What type of feedback?
            </ThemedText>
            <View style={styles.typeGrid}>
              {feedbackTypes.map((type) => (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    styles.typeCard,
                    {
                      backgroundColor: feedbackType === type.id ? colors.primary + '15' : colors.card,
                      borderColor: feedbackType === type.id ? colors.primary : colors.border,
                      borderWidth: 2,
                    },
                    createShadow(1, '#000', 0.05),
                  ]}
                  onPress={() => setFeedbackType(type.id as any)}
                  activeOpacity={0.7}
                >
                  <MaterialIcons
                    name={type.icon}
                    size={32}
                    color={feedbackType === type.id ? colors.primary : colors.icon}
                  />
                  <ThemedText
                    type="body"
                    style={[
                      styles.typeLabel,
                      {
                        color: feedbackType === type.id ? colors.primary : colors.text,
                        fontWeight: feedbackType === type.id ? '600' : '500',
                      },
                    ]}
                  >
                    {type.label}
                  </ThemedText>
                  <ThemedText type="small" style={[styles.typeDescription, { color: colors.icon }]}>
                    {type.description}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Subject Input */}
          <View style={styles.section}>
            <ThemedText type="h3" style={[styles.sectionTitle, { color: colors.text }]}>
              Subject
            </ThemedText>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.card,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              placeholder="Brief description of your feedback"
              placeholderTextColor={colors.icon}
              value={subject}
              onChangeText={setSubject}
              maxLength={100}
            />
          </View>

          {/* Message Input */}
          <View style={styles.section}>
            <ThemedText type="h3" style={[styles.sectionTitle, { color: colors.text }]}>
              Your Feedback
            </ThemedText>
            <TextInput
              style={[
                styles.textArea,
                {
                  backgroundColor: colors.card,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              placeholder="Tell us more about your feedback, bug report, or feature request..."
              placeholderTextColor={colors.icon}
              value={message}
              onChangeText={setMessage}
              multiline
              numberOfLines={8}
              textAlignVertical="top"
              maxLength={2000}
            />
            <ThemedText type="small" style={[styles.charCount, { color: colors.icon }]}>
              {message.length} / 2000 characters
            </ThemedText>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              {
                backgroundColor: colors.primary,
                opacity: submitting ? 0.6 : 1,
              },
              createShadow(2, colors.primary, 0.3),
            ]}
            onPress={handleSubmit}
            disabled={submitting}
            activeOpacity={0.8}
          >
            <MaterialIcons name="send" size={20} color="#FFFFFF" />
            <ThemedText type="body" style={styles.submitButtonText}>
              {submitting ? 'Submitting...' : 'Submit Feedback'}
            </ThemedText>
          </TouchableOpacity>

          {/* Bottom Spacing */}
          <View style={{ height: Spacing.xl }} />
        </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
    paddingTop: Spacing.lg,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: Spacing.md,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  typeGrid: {
    gap: Spacing.md,
  },
  typeCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  typeLabel: {
    fontSize: 16,
    textAlign: 'center',
  },
  typeDescription: {
    fontSize: 12,
    textAlign: 'center',
  },
  input: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    fontSize: 16,
  },
  textArea: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    fontSize: 16,
    minHeight: 150,
  },
  charCount: {
    textAlign: 'right',
    marginTop: Spacing.xs,
    fontSize: 12,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
});
