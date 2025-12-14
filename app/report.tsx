/**
 * Enhanced Report Screen - Submit detailed reports
 */

import { ThemedText } from '@/app/components/themed-text';
import { ThemedView } from '@/app/components/themed-view';
import { BorderRadius, Colors, Spacing } from '@/app/constants/theme';
import { useColorScheme } from '@/app/hooks/use-color-scheme';
import { Report } from '@/app/types';
import { createShadow, getCursorStyle } from '@/app/utils/platform-styles';
import { addReport, getPseudonym } from '@/app/utils/storage';
import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const reportReasons = [
  { id: 'inappropriate', label: 'Inappropriate Content', icon: 'block' as const },
  { id: 'harassment', label: 'Harassment or Bullying', icon: 'report-problem' as const },
  { id: 'spam', label: 'Spam or Misleading', icon: 'close' as const },
  { id: 'offensive', label: 'Offensive Language', icon: 'warning' as const },
  { id: 'other', label: 'Other', icon: 'more-horiz' as const },
];

export default function ReportScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ targetType: string | string[]; targetId: string | string[] }>();
  // Handle array values from useLocalSearchParams (expo-router can return arrays)
  const targetType = Array.isArray(params.targetType) 
    ? (params.targetType[0] || 'post') 
    : (typeof params.targetType === 'string' ? params.targetType : 'post');
  const targetId = Array.isArray(params.targetId) 
    ? (params.targetId[0] || '') 
    : (typeof params.targetId === 'string' ? params.targetId : '');
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedReason) {
      Alert.alert('Missing Information', 'Please select a reason for reporting.');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Missing Information', 'Please provide additional details about the issue.');
      return;
    }

    setIsSubmitting(true);
    try {
      const pseudonym = await getPseudonym();
      const newReport: Report = {
        id: `report_${Date.now()}`,
        targetType: (targetType || 'post') as 'post' | 'reply' | 'user',
        targetId: targetId || '',
        reporterId: pseudonym || 'anonymous',
        reason: reportReasons.find(r => r.id === selectedReason)?.label || selectedReason || 'Other',
        description: description.trim(),
        status: 'pending',
        createdAt: new Date(),
      };

      await addReport(newReport);

      Alert.alert(
        'Report Submitted',
        'Thank you for reporting. Our moderation team will review this content and take appropriate action.',
        [
          {
            text: 'OK',
            onPress: () => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/(tabs)' as any);
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error submitting report:', error);
      Alert.alert('Error', 'Failed to submit report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ThemedView style={styles.container}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.background }]}>
          <TouchableOpacity onPress={() => router.back()} style={getCursorStyle()}>
            <MaterialIcons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <ThemedText type="h2" style={styles.headerTitle}>
            Report Content
          </ThemedText>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <View style={[styles.infoCard, { backgroundColor: colors.info + '20' }, createShadow(2, '#000', 0.1)]}>
            <MaterialIcons name="info" size={24} color={colors.info} />
            <View style={styles.infoContent}>
              <ThemedText type="body" style={[styles.infoTitle, { color: colors.info }]}>
                Help Keep Our Community Safe
              </ThemedText>
              <ThemedText type="small" style={[styles.infoText, { color: colors.icon }]}>
                Your report will be reviewed by our moderation team. All reports are confidential and help us maintain a safe environment.
              </ThemedText>
            </View>
          </View>

          <View style={styles.section}>
            <ThemedText type="h3" style={styles.sectionTitle}>
              Why are you reporting this?
            </ThemedText>
            <ThemedText type="body" style={[styles.sectionDescription, { color: colors.icon }]}>
              Select the reason that best describes the issue
            </ThemedText>

            {reportReasons.map((reason) => (
              <TouchableOpacity
                key={reason.id}
                style={[
                  styles.reasonCard,
                  {
                    backgroundColor: selectedReason === reason.id ? colors.primary + '20' : colors.card,
                    borderColor: selectedReason === reason.id ? colors.primary : colors.border,
                    borderWidth: selectedReason === reason.id ? 2 : 1,
                  },
                  createShadow(selectedReason === reason.id ? 3 : 1, '#000', 0.1),
                ]}
                onPress={() => setSelectedReason(reason.id)}
                activeOpacity={0.7}
              >
                <MaterialIcons
                  name={reason.icon}
                  size={24}
                  color={selectedReason === reason.id ? colors.primary : colors.icon}
                />
                <ThemedText
                  type="body"
                  style={[
                    styles.reasonLabel,
                    { color: selectedReason === reason.id ? colors.primary : colors.text, fontWeight: selectedReason === reason.id ? '600' : '400' },
                  ]}
                >
                  {reason.label}
                </ThemedText>
                {selectedReason === reason.id && (
                  <MaterialIcons name="check-circle" size={24} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.section}>
            <ThemedText type="h3" style={styles.sectionTitle}>
              Additional Details
            </ThemedText>
            <ThemedText type="body" style={[styles.sectionDescription, { color: colors.icon }]}>
              Please provide more information to help us understand the issue
            </ThemedText>

            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: colors.surface,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              placeholder="Describe the issue in detail..."
              placeholderTextColor={colors.icon}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.noteBox}>
            <MaterialIcons name="security" size={20} color={colors.warning} />
            <ThemedText type="small" style={[styles.noteText, { color: colors.icon }]}>
              Your report is anonymous. The reported user will not know who reported them.
            </ThemedText>
          </View>

          <TouchableOpacity
            style={[
              styles.submitButton,
              {
                backgroundColor: isSubmitting || !selectedReason || !description.trim() ? colors.surface : colors.danger,
                opacity: isSubmitting || !selectedReason || !description.trim() ? 0.5 : 1,
              },
              createShadow(3, colors.danger, 0.3),
            ]}
            onPress={handleSubmit}
            disabled={isSubmitting || !selectedReason || !description.trim()}
            activeOpacity={0.8}
          >
            <MaterialIcons name="send" size={20} color="#FFFFFF" />
            <ThemedText type="body" style={{ color: '#FFFFFF', fontWeight: '700', marginLeft: Spacing.xs }}>
              {isSubmitting ? 'Submitting...' : 'Submit Report'}
            </ThemedText>
          </TouchableOpacity>

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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
  },
  infoCard: {
    flexDirection: 'row',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xl,
    gap: Spacing.md,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  infoText: {
    fontSize: 13,
    lineHeight: 18,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  sectionDescription: {
    fontSize: 14,
    marginBottom: Spacing.md,
  },
  reasonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  reasonLabel: {
    flex: 1,
    fontSize: 15,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: 16,
    minHeight: 120,
    marginTop: Spacing.sm,
  },
  noteBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: '#FFF9E6',
    marginBottom: Spacing.xl,
    gap: Spacing.sm,
  },
  noteText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
});



