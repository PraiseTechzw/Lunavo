/**
 * Book a Counsellor Screen
 */

import { ThemedText } from '@/app/components/themed-text';
import { ThemedView } from '@/app/components/themed-view';
import { BorderRadius, Colors, Spacing } from '@/app/constants/theme';
import { useColorScheme } from '@/app/hooks/use-color-scheme';
import { createShadow } from '@/app/utils/platform-styles';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';

const counsellors = [
  {
    id: '1',
    name: 'Dr. Anna Freud',
    specialty: 'Anxiety Specialist',
    iconName: 'medical-outline',
    color: '#4A90E2',
  },
  {
    id: '2',
    name: 'Dr. Carl Rogers',
    specialty: 'Academic Stress',
    iconName: 'school',
    color: '#7B68EE',
  },
  {
    id: '3',
    name: 'Dr. Sarah Johnson',
    specialty: 'Relationship Issues',
    iconName: 'people',
    color: '#E74C3C',
  },
];

const timeSlots = [
  '10:00 AM',
  '11:30 AM',
  '01:00 PM',
  '02:30 PM',
  '04:00 PM',
  '05:30 PM',
];

export default function BookCounsellorScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const [meetingType, setMeetingType] = useState<'online' | 'in-person'>('in-person');
  const [selectedCounsellor, setSelectedCounsellor] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(9);
  const [selectedTime, setSelectedTime] = useState('11:30 AM');

  const handleConfirm = () => {
    if (!selectedCounsellor) {
      Alert.alert('Select Counsellor', 'Please select a counsellor first.');
      return;
    }

    Alert.alert(
      'Booking Confirmed',
      `Your appointment with ${counsellors.find((c) => c.id === selectedCounsellor)?.name} is confirmed for ${selectedTime}.`,
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
  };

  const renderCounsellor = (counsellor: typeof counsellors[0]) => {
    const isSelected = selectedCounsellor === counsellor.id;
    return (
      <TouchableOpacity
        key={counsellor.id}
        style={[
          styles.counsellorCard,
          {
            backgroundColor: colors.card,
            borderColor: isSelected ? colors.primary : colors.border,
            borderWidth: isSelected ? 2 : 1,
          },
          createShadow(1, '#000', 0.05),
        ]}
        onPress={() => setSelectedCounsellor(counsellor.id)}
        activeOpacity={0.7}
      >
        <View style={[styles.counsellorAvatar, { backgroundColor: counsellor.color + '20' }]}>
          <Ionicons name={counsellor.iconName as any} size={32} color={counsellor.color} />
        </View>
        <View style={styles.counsellorInfo}>
          <ThemedText type="body" style={styles.counsellorName}>
            {counsellor.name}
          </ThemedText>
          <ThemedText type="small" style={styles.counsellorSpecialty}>
            {counsellor.specialty}
          </ThemedText>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Meeting Type */}
        <View style={styles.section}>
          <ThemedText type="h3" style={styles.sectionTitle}>
            How would you like to meet?
          </ThemedText>
          <View style={styles.segmentedControl}>
            <TouchableOpacity
              style={[
                styles.segment,
                {
                  backgroundColor: meetingType === 'online' ? colors.primary : colors.surface,
                },
              ]}
              onPress={() => setMeetingType('online')}
              activeOpacity={0.7}
            >
              <ThemedText
                type="body"
                style={{
                  color: meetingType === 'online' ? '#FFFFFF' : colors.text,
                  fontWeight: '600',
                }}
              >
                Online
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.segment,
                {
                  backgroundColor: meetingType === 'in-person' ? colors.primary : colors.surface,
                },
              ]}
              onPress={() => setMeetingType('in-person')}
              activeOpacity={0.7}
            >
              <ThemedText
                type="body"
                style={{
                  color: meetingType === 'in-person' ? '#FFFFFF' : colors.text,
                  fontWeight: '600',
                }}
              >
                In-person
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>

        {/* Choose Counsellor */}
        <View style={styles.section}>
          <ThemedText type="h3" style={styles.sectionTitle}>
            Choose a Counsellor
          </ThemedText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.counsellorsContainer}>
              {counsellors.map(renderCounsellor)}
            </View>
          </ScrollView>
        </View>

        {/* Date & Time */}
        <View style={styles.section}>
          <ThemedText type="h3" style={styles.sectionTitle}>
            Select a Date & Time
          </ThemedText>

          {/* Calendar */}
          <View style={[styles.calendar, { backgroundColor: colors.surface }]}>
            <View style={styles.calendarHeader}>
              <TouchableOpacity>
                <Ionicons name="chevron-back" size={20} color={colors.text} />
              </TouchableOpacity>
              <ThemedText type="body" style={styles.calendarMonth}>
                October 2024
              </ThemedText>
              <TouchableOpacity>
                <Ionicons name="chevron-forward" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>
            <View style={styles.calendarGrid}>
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                <ThemedText key={day} type="small" style={styles.calendarDay}>
                  {day}
                </ThemedText>
              ))}
              {Array.from({ length: 31 }, (_, i) => i + 1).map((date) => {
                const isSelected = selectedDate === date;
                const isDisabled = date < 9;
                return (
                  <TouchableOpacity
                    key={date}
                    style={[
                      styles.calendarDate,
                      {
                        backgroundColor: isSelected ? colors.primary : 'transparent',
                        opacity: isDisabled ? 0.3 : 1,
                      },
                    ]}
                    onPress={() => !isDisabled && setSelectedDate(date)}
                    disabled={isDisabled}
                    activeOpacity={0.7}
                  >
                    <ThemedText
                      type="small"
                      style={{
                        color: isSelected ? '#FFFFFF' : colors.text,
                        fontWeight: isSelected ? '600' : '400',
                      }}
                    >
                      {date}
                    </ThemedText>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Time Slots */}
          <View style={styles.timeSlots}>
            {timeSlots.map((time) => {
              const isSelected = selectedTime === time;
              const isUnavailable = time === '04:00 PM';
              return (
                <TouchableOpacity
                  key={time}
                  style={[
                    styles.timeSlot,
                    {
                      backgroundColor: isSelected
                        ? colors.primary
                        : isUnavailable
                        ? colors.surface
                        : colors.card,
                      },
                      createShadow(1, '#000', 0.05),
                    ]}
                  onPress={() => !isUnavailable && setSelectedTime(time)}
                  disabled={isUnavailable}
                  activeOpacity={0.7}
                >
                  <ThemedText
                    type="small"
                    style={{
                      color: isSelected
                        ? '#FFFFFF'
                        : isUnavailable
                        ? colors.icon
                        : colors.text,
                      fontWeight: isSelected ? '600' : '400',
                    }}
                  >
                    {time}
                  </ThemedText>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Confirm Button */}
        <TouchableOpacity
          style={[
            styles.confirmButton,
            { backgroundColor: colors.primary },
            createShadow(3, colors.primary, 0.3),
          ]}
          onPress={handleConfirm}
          activeOpacity={0.8}
        >
          <ThemedText type="body" style={[styles.confirmButtonText, { color: '#FFFFFF' }]}>
            Confirm Booking
          </ThemedText>
        </TouchableOpacity>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
    fontWeight: '600',
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderRadius: BorderRadius.md,
    padding: 4,
    gap: 4,
  },
  segment: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
  },
  counsellorsContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  counsellorCard: {
    width: 180,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  counsellorAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  counsellorInfo: {
    alignItems: 'center',
  },
  counsellorName: {
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  counsellorSpecialty: {
    opacity: 0.7,
  },
  calendar: {
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  calendarMonth: {
    fontWeight: '600',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  calendarDay: {
    width: '13%',
    textAlign: 'center',
    fontWeight: '600',
    opacity: 0.6,
    marginBottom: Spacing.xs,
  },
  calendarDate: {
    width: '13%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.sm,
  },
  timeSlots: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  timeSlot: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    minWidth: 100,
    alignItems: 'center',
  },
  confirmButton: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  confirmButtonText: {
    fontWeight: '600',
  },
});

