/**
 * Daily Check-In Screen - Premium Version
 */

import { ThemedText } from '@/app/components/themed-text';
import { ThemedView } from '@/app/components/themed-view';
import { BorderRadius, Colors, PlatformStyles, Spacing } from '@/app/constants/theme';
import { useColorScheme } from '@/app/hooks/use-color-scheme';
import { saveCheckIn } from '@/app/utils/storage';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
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

const moods = [
  { id: 'terrible', icon: 'sentiment-very-dissatisfied', label: 'Awful', color: '#EF4444' }, // Red
  { id: 'bad', icon: 'sentiment-dissatisfied', label: 'Down', color: '#F97316' },      // Orange
  { id: 'okay', icon: 'sentiment-neutral', label: 'Fine', color: '#FBBF24' },           // Amber
  { id: 'good', icon: 'sentiment-satisfied', label: 'Good', color: '#84CC16' },         // Lime
  { id: 'awesome', icon: 'sentiment-very-satisfied', label: 'Great', color: '#10B981' }, // Emerald
];

export default function CheckInScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [note, setNote] = useState('');

  // Background Animation
  const floatValue = useSharedValue(0);
  useEffect(() => {
    floatValue.value = withRepeat(
      withTiming(1, { duration: 25000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const blobStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(floatValue.value, [0, 1], [0, 60]) },
      { rotate: `${interpolate(floatValue.value, [0, 1], [0, 15])}deg` }
    ],
    opacity: 0.8
  }));

  const floatStyle2 = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(floatValue.value, [0, 1], [0, -40]) },
      { rotate: `${interpolate(floatValue.value, [0, 1], [0, -10])}deg` }
    ],
  }));

  const handleMoodSelect = (moodId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setSelectedMood(moodId);
  };

  const handleSave = async () => {
    if (!selectedMood) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Mood Needed', 'Please select how you are feeling first.');
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

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
    <ThemedView style={styles.container}>
      {/* Animated Background Blobs */}
      <View style={styles.background}>
        <Animated.View style={[styles.blobWrapper, blobStyle, { top: -100, right: -100 }]}>
          <LinearGradient colors={[colors.primary + '40', colors.secondary + '40']} style={styles.blob} />
        </Animated.View>
        <Animated.View style={[styles.blobWrapper, floatStyle2, { bottom: -100, left: -100, width: 500, height: 500 }]}>
          <LinearGradient colors={[colors.secondary + '30', colors.primary + '30']} style={styles.blob} />
        </Animated.View>
      </View>

      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.closeBtn, { backgroundColor: 'rgba(255,255,255,0.1)' }]}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <Animated.View entering={FadeInDown.duration(800)}>
            <ThemedText type="h1" style={styles.mainQuestion}>How are you feeling?</ThemedText>
            <ThemedText style={styles.subtitle}>Check in with yourself.</ThemedText>
          </Animated.View>

          <View style={styles.moodGrid}>
            {moods.map((mood, idx) => {
              const isSelected = selectedMood === mood.id;
              const iconName = mood.icon as keyof typeof MaterialIcons.glyphMap;

              return (
                <Animated.View
                  key={mood.id}
                  entering={FadeInDown.delay(300 + idx * 80).springify()}
                  style={{ width: '30%', marginBottom: Spacing.md }}
                >
                  <TouchableOpacity
                    onPress={() => handleMoodSelect(mood.id)}
                    activeOpacity={0.8}
                    style={[
                      styles.moodCard,
                      {
                        backgroundColor: isSelected ? mood.color : 'rgba(255,255,255,0.05)',
                        borderColor: isSelected ? mood.color : colors.border + '40',
                        borderWidth: 1,
                        height: 110,
                      },
                      isSelected && PlatformStyles.premiumShadow
                    ]}
                  >
                    <MaterialIcons
                      name={iconName}
                      size={36}
                      color={isSelected ? '#FFF' : colors.text}
                      style={{ opacity: isSelected ? 1 : 0.7 }}
                    />

                    <ThemedText
                      style={[
                        styles.moodLabel,
                        { color: isSelected ? '#FFF' : colors.text, fontWeight: isSelected ? '800' : '500' }
                      ]}
                    >
                      {mood.label}
                    </ThemedText>
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
          </View>

          <Animated.View entering={FadeInDown.delay(600)} style={styles.section}>
            <View style={styles.glassInputContainer}>
              <View style={styles.labelRow}>
                <Ionicons name="journal-outline" size={20} color={colors.primary} />
                <ThemedText type="h3">Private Journal</ThemedText>
              </View>

              <TextInput
                style={[
                  styles.input,
                  {
                    color: colors.text,
                  }
                ]}
                placeholder="What's making your day feel this way?"
                placeholderTextColor={colors.icon}
                multiline
                value={note}
                onChangeText={setNote}
              />
              <View style={styles.privacyBanner}>
                <Ionicons name="lock-closed" size={12} color={colors.text} style={{ opacity: 0.6 }} />
                <ThemedText style={styles.privacyText}>Encrypted & local only.</ThemedText>
              </View>
            </View>
          </Animated.View>

          <View style={styles.footer}>
            <TouchableOpacity
              disabled={!selectedMood}
              onPress={handleSave}
              style={[
                styles.saveBtnWrapper,
                !selectedMood && { opacity: 0.5, transform: [{ scale: 0.95 }] }
              ]}
            >
              <LinearGradient
                colors={selectedMood ? (colors.gradients.primary as any) : ['#334155', '#1e293b']}
                style={styles.saveBtn}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <ThemedText style={styles.saveText}>Complete Check-In</ThemedText>
                <Ionicons name="checkmark-circle" size={24} color="#FFF" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
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
    opacity: 0.8,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  mainQuestion: {
    fontSize: 32,
    fontWeight: '900',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.6,
    marginBottom: Spacing.xxl,
  },
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    marginBottom: Spacing.xl,
  },
  moodCard: {
    borderRadius: BorderRadius.xxl,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  moodLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  section: {
    marginTop: Spacing.md,
  },
  glassInputContainer: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  input: {
    height: 120,
    textAlignVertical: 'top',
    fontSize: 16,
    lineHeight: 24,
  },
  privacyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: 12,
  },
  privacyText: {
    fontSize: 12,
    opacity: 0.6,
  },
  footer: {
    marginTop: 40,
    marginBottom: 60,
  },
  saveBtnWrapper: {
    ...PlatformStyles.premiumShadow,
  },
  saveBtn: {
    paddingVertical: 18,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.full,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
  },
  saveText: {
    color: '#FFF',
    fontWeight: '800',
    fontSize: 16,
    letterSpacing: 0.5,
  },
});
