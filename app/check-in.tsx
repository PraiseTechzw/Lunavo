/**
 * Daily Check-In Screen
 */

import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Slider,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ThemedView } from '@/app/components/themed-view';
import { ThemedText } from '@/app/components/themed-text';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useColorScheme } from '@/app/hooks/use-color-scheme';
import { Colors, Spacing, BorderRadius } from '@/app/constants/theme';
import { getCursorStyle, createInputStyle } from '@/app/utils/platform-styles';
import { saveCheckIn } from '@/app/utils/storage';

const moods = [
  { id: 'awesome', iconName: 'sentiment-very-satisfied', iconFamily: 'MaterialIcons', label: 'Awesome', color: '#4CAF50' },
  { id: 'good', iconName: 'sentiment-very-satisfied', iconFamily: 'MaterialIcons', label: 'Good', color: '#8BC34A' },
  { id: 'okay', iconName: 'sentiment-neutral', iconFamily: 'MaterialIcons', label: 'Okay', color: '#FF9800' },
  { id: 'not-great', iconName: 'sentiment-dissatisfied', iconFamily: 'MaterialIcons', label: 'Not Great', color: '#FF5722' },
  { id: 'awful', iconName: 'sentiment-very-dissatisfied', iconFamily: 'MaterialIcons', label: 'Awful', color: '#F44336' },
];

const feelingStrengths = [
  'Not at all',
  'A little bit',
  'Somewhat',
  'Quite a bit',
  'Very much',
];

export default function CheckInScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [feelingStrength, setFeelingStrength] = useState(1);
  const [note, setNote] = useState('');

  const handleSave = async () => {
    if (!selectedMood) {
      Alert.alert('Select Mood', 'Please select how you are feeling today.');
      return;
    }

    try {
      const today = new Date();
      const dateString = today.toISOString().split('T')[0]; // YYYY-MM-DD format
      
      const checkIn = {
        id: `checkin-${Date.now()}`,
        mood: selectedMood,
        note: note.trim() || undefined,
        feelingStrength: Math.round(feelingStrength),
        date: dateString,
        timestamp: today.getTime(),
      };

      await saveCheckIn(checkIn);

      Alert.alert('Check-In Saved', 'Thank you for checking in. Your thoughts are private.', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to save check-in. Please try again.');
    }
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safeAreaTop}>
      <ThemedView style={styles.container}>
        <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <ThemedText type="h2" style={styles.title}>
            Daily Check-In
          </ThemedText>
          <TouchableOpacity onPress={() => router.back()} style={getCursorStyle()}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Mood Selection */}
        <View style={styles.section}>
          <ThemedText type="h3" style={styles.sectionTitle}>
            How are you feeling today?
          </ThemedText>
          <View style={styles.moodContainer}>
            {moods.map((mood) => (
              <TouchableOpacity
                key={mood.id}
                style={[
                  styles.moodOption,
                  {
                    borderColor:
                      selectedMood === mood.id ? colors.primary : colors.border,
                    borderWidth: selectedMood === mood.id ? 3 : 1,
                  },
                ]}
                onPress={() => setSelectedMood(mood.id)}
                activeOpacity={0.7}
              >
                <View style={[styles.moodIconContainer, { backgroundColor: mood.color + '20' }]}>
                  {mood.iconFamily === 'MaterialIcons' ? (
                    <MaterialIcons name={mood.iconName as any} size={32} color={mood.color} />
                  ) : (
                    <Ionicons name={mood.iconName as any} size={32} color={mood.color} />
                  )}
                </View>
                <ThemedText type="small" style={styles.moodLabel}>
                  {mood.label}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Feeling Strength */}
        {selectedMood && (
          <View style={styles.section}>
            <ThemedText type="h3" style={styles.sectionTitle}>
              How strong is this feeling?
            </ThemedText>
            <View style={styles.sliderContainer}>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={4}
                step={1}
                value={feelingStrength}
                onValueChange={setFeelingStrength}
                minimumTrackTintColor={colors.primary}
                maximumTrackTintColor={colors.border}
                thumbTintColor={colors.primary}
              />
              <ThemedText type="body" style={styles.sliderValue}>
                {feelingStrengths[Math.round(feelingStrength)]}
              </ThemedText>
            </View>
          </View>
        )}

        {/* Private Note */}
        <View style={styles.section}>
          <ThemedText type="h3" style={styles.sectionTitle}>
            Add a private note...
          </ThemedText>
          <TextInput
            style={[
              styles.noteInput,
              createInputStyle(),
              {
                backgroundColor: colors.surface,
                color: colors.text,
                borderColor: colors.border,
              },
            ]}
            placeholder="Want to share more? What's on your mind?"
            placeholderTextColor={colors.icon}
            value={note}
            onChangeText={setNote}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />
          <View style={styles.privacyNote}>
            <Ionicons name="lock-closed" size={16} color={colors.icon} />
            <ThemedText type="small" style={styles.privacyText}>
              Your thoughts are always private.
            </ThemedText>
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[
            styles.saveButton,
            {
              backgroundColor: colors.primary,
              opacity: selectedMood ? 1 : 0.5,
            },
          ]}
          onPress={handleSave}
          disabled={!selectedMood}
          activeOpacity={0.8}
        >
          <ThemedText type="body" style={[styles.saveButtonText, { color: '#FFFFFF' }]}>
            Save Check-In
          </ThemedText>
        </TouchableOpacity>
      </ScrollView>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeAreaTop: {
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  title: {
    fontWeight: '700',
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
    fontWeight: '600',
  },
  moodContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  moodOption: {
    flex: 1,
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.full,
    backgroundColor: '#FFFFFF',
  },
  moodIconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  moodLabel: {
    fontWeight: '500',
  },
  sliderContainer: {
    marginTop: Spacing.md,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderValue: {
    textAlign: 'right',
    marginTop: Spacing.sm,
    fontWeight: '600',
  },
  noteInput: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    minHeight: 120,
    marginBottom: Spacing.sm,
  },
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  privacyText: {
    opacity: 0.7,
  },
  saveButton: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.xl,
  },
  saveButtonText: {
    fontWeight: '600',
  },
});

