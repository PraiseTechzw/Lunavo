/**
 * Daily Check-In Screen - Premium Version
 */

import { ThemedText } from '@/app/components/themed-text';
import { ThemedView } from '@/app/components/themed-view';
import { BorderRadius, Colors, PlatformStyles, Spacing } from '@/app/constants/theme';
import { useColorScheme } from '@/app/hooks/use-color-scheme';
import { saveCheckIn } from '@/app/utils/storage';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

const moods = [
  { id: 'terrible', emoji: '😫', label: 'Awful', color: '#EF4444' },
  { id: 'bad', emoji: '😔', label: 'Down', color: '#F97316' },
  { id: 'okay', emoji: '😐', label: 'Fine', color: '#FBBF24' },
  { id: 'good', emoji: '😊', label: 'Good', color: '#84CC16' },
  { id: 'awesome', emoji: '🤩', label: 'Great', color: '#10B981' },
];

export default function CheckInScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [note, setNote] = useState('');

  const handleSave = async () => {
    if (!selectedMood) {
      Alert.alert('Mood Needed', 'Please tell us how you are feeling.');
      return;
    }

    try {
      const today = new Date();
      await saveCheckIn({
        id: `checkin-${Date.now()}`,
        mood: selectedMood,
        note: note.trim() || undefined,
        date: today.toISOString().split('T')[0],
        timestamp: today.getTime(),
      });

      router.back();
    } catch (error) {
      Alert.alert('Error', 'Could not save check-in.');
    }
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <ThemedText type="h1">How are you?</ThemedText>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <ThemedText style={styles.subtitle}>Checking in daily helps track your wellbeing journey.</ThemedText>

          <View style={styles.moodGrid}>
            {moods.map((mood, idx) => {
              const isSelected = selectedMood === mood.id;
              return (
                <Animated.View key={mood.id} entering={FadeInDown.delay(100 + idx * 100)}>
                  <TouchableOpacity
                    onPress={() => setSelectedMood(mood.id)}
                    style={[
                      styles.moodCard,
                      { backgroundColor: colors.card, borderColor: isSelected ? mood.color : colors.border },
                      isSelected && { ...PlatformStyles.shadow, borderTransform: [{ scale: 1.05 }] }
                    ]}
                  >
                    <ThemedText style={styles.moodEmoji}>{mood.emoji}</ThemedText>
                    <ThemedText style={[styles.moodLabel, isSelected && { color: mood.color, fontWeight: '800' }]}>{mood.label}</ThemedText>
                    {isSelected && (
                      <View style={[styles.checkBadge, { backgroundColor: mood.color }]}>
                        <Ionicons name="checkmark" size={10} color="#FFF" />
                      </View>
                    )}
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
          </View>

          <Animated.View entering={FadeInDown.delay(700)} style={styles.section}>
            <ThemedText type="h2" style={styles.sectionTitle}>Add a private note</ThemedText>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
              placeholder="What's making your day feel this way? (Optional)"
              placeholderTextColor={colors.icon}
              multiline
              value={note}
              onChangeText={setNote}
            />
            <View style={styles.privacyBanner}>
              <Ionicons name="shield-checkmark" size={16} color={colors.success} />
              <ThemedText style={styles.privacyText}>This note is only visible to you.</ThemedText>
            </View>
          </Animated.View>

          <View style={styles.footer}>
            <TouchableOpacity
              disabled={!selectedMood}
              onPress={handleSave}
              style={styles.saveBtnWrapper}
            >
              <LinearGradient
                colors={selectedMood ? (colors.gradients.primary as any) : ['#94A3B8', '#64748B']}
                style={styles.saveBtn}
              >
                <ThemedText style={styles.saveText}>FINISH CHECK-IN</ThemedText>
              </LinearGradient>
            </TouchableOpacity>
          </View>
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
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  subtitle: {
    textAlign: 'center',
    opacity: 0.6,
    marginBottom: Spacing.xxl,
  },
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.xxl,
  },
  moodCard: {
    width: 100,
    height: 120,
    borderRadius: BorderRadius.xxl,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  moodEmoji: {
    fontSize: 40,
    marginBottom: 8,
  },
  moodLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  checkBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  section: {
    marginTop: Spacing.xl,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  input: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    height: 150,
    borderWidth: 1,
    textAlignVertical: 'top',
    fontSize: 16,
  },
  privacyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    opacity: 0.6,
  },
  privacyText: {
    fontSize: 12,
  },
  footer: {
    marginTop: 40,
    marginBottom: 60,
  },
  saveBtnWrapper: {
    ...PlatformStyles.premiumShadow,
  },
  saveBtn: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
  },
  saveText: {
    color: '#FFF',
    fontWeight: '900',
    letterSpacing: 2,
  },
});
