/**
 * New Meeting Screen - PE Executive Tool
 * Allows scheduling of team meetings or student-facing orientations.
 */

import { ThemedText } from '@/app/components/themed-text';
import { BorderRadius, Colors, PlatformStyles, Spacing } from '@/app/constants/theme';
import { useColorScheme } from '@/app/hooks/use-color-scheme';
import { MeetingType } from '@/app/types';
import { useRoleGuard } from '@/hooks/use-auth-guard';
import { createMeeting } from '@/lib/database';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const MEETING_TYPES: { id: MeetingType; label: string; icon: string }[] = [
    { id: 'weekly', label: 'Weekly Check-in', icon: 'calendar-sync' },
    { id: 'special', label: 'Special Session', icon: 'star-outline' },
    { id: 'training', label: 'Training Workshop', icon: 'school-outline' },
    { id: 'orientation', label: 'Orientation', icon: 'account-plus-outline' },
];

export default function NewMeetingScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];

    // Role Guard
    const { user, loading: authLoading } = useRoleGuard(['peer-educator-executive', 'admin'], '/peer-educator/dashboard');

    const [submitting, setSubmitting] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);

    const [form, setForm] = useState({
        title: '',
        description: '',
        scheduledDate: new Date(),
        durationMinutes: '30',
        location: '',
        meetingType: 'weekly' as MeetingType,
    });

    const handleSubmit = async () => {
        if (!form.title || !form.location) {
            Alert.alert('Incomplete Form', 'Please provide a title and location.');
            return;
        }

        try {
            setSubmitting(true);
            await createMeeting({
                title: form.title,
                description: form.description,
                scheduledDate: form.scheduledDate,
                durationMinutes: parseInt(form.durationMinutes) || 30,
                location: form.location,
                meetingType: form.meetingType,
                createdBy: user!.id,
            });

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert('Success', 'Meeting has been scheduled.', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (e) {
            console.error('Failed to create meeting:', e);
            Alert.alert('Error', 'Could not schedule meeting. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const onDateChange = (event: any, selectedDate?: Date) => {
        setShowDatePicker(false);
        if (selectedDate) {
            const newDate = new Date(selectedDate);
            newDate.setHours(form.scheduledDate.getHours());
            newDate.setMinutes(form.scheduledDate.getMinutes());
            setForm({ ...form, scheduledDate: newDate });
        }
    };

    const onTimeChange = (event: any, selectedTime?: Date) => {
        setShowTimePicker(false);
        if (selectedTime) {
            const newDate = new Date(form.scheduledDate);
            newDate.setHours(selectedTime.getHours());
            newDate.setMinutes(selectedTime.getMinutes());
            setForm({ ...form, scheduledDate: newDate });
        }
    };

    if (authLoading) return <ActivityIndicator style={{ flex: 1 }} />;

    return (
        <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.background }}>
            <ScrollView contentContainerStyle={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
                    </TouchableOpacity>
                    <ThemedText style={styles.title}>Schedule Meeting</ThemedText>
                </View>

                <View style={styles.formContainer}>
                    {/* Title */}
                    <ThemedText style={styles.label}>Meeting Title</ThemedText>
                    <TextInput
                        style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                        placeholder="e.g. Monthly Strategy Review"
                        placeholderTextColor={colors.icon}
                        value={form.title}
                        onChangeText={(t) => setForm({ ...form, title: t })}
                    />

                    {/* Meeting Type Selection */}
                    <ThemedText style={styles.label}>Type</ThemedText>
                    <View style={styles.typeGrid}>
                        {MEETING_TYPES.map((type) => (
                            <TouchableOpacity
                                key={type.id}
                                style={[
                                    styles.typeChip,
                                    { backgroundColor: colors.surface },
                                    form.meetingType === type.id && { backgroundColor: colors.primary }
                                ]}
                                onPress={() => setForm({ ...form, meetingType: type.id })}
                            >
                                <MaterialCommunityIcons
                                    name={type.icon as any}
                                    size={20}
                                    color={form.meetingType === type.id ? '#FFF' : colors.icon}
                                />
                                <ThemedText style={[styles.typeChipText, form.meetingType === type.id && { color: '#FFF' }]}>
                                    {type.label}
                                </ThemedText>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Date & Time Pickers */}
                    <View style={styles.dateTimeRow}>
                        <View style={{ flex: 1 }}>
                            <ThemedText style={styles.label}>Date</ThemedText>
                            <TouchableOpacity
                                style={[styles.pickerButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                                onPress={() => setShowDatePicker(true)}
                            >
                                <MaterialCommunityIcons name="calendar" size={20} color={colors.primary} />
                                <ThemedText>{form.scheduledDate.toLocaleDateString()}</ThemedText>
                            </TouchableOpacity>
                        </View>

                        <View style={{ flex: 1 }}>
                            <ThemedText style={styles.label}>Time</ThemedText>
                            <TouchableOpacity
                                style={[styles.pickerButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                                onPress={() => setShowTimePicker(true)}
                            >
                                <MaterialCommunityIcons name="clock-outline" size={20} color={colors.primary} />
                                <ThemedText>{form.scheduledDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</ThemedText>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {showDatePicker && (
                        <DateTimePicker
                            value={form.scheduledDate}
                            mode="date"
                            onChange={onDateChange}
                        />
                    )}

                    {showTimePicker && (
                        <DateTimePicker
                            value={form.scheduledDate}
                            mode="time"
                            onChange={onTimeChange}
                        />
                    )}

                    {/* Duration & Location */}
                    <View style={styles.dateTimeRow}>
                        <View style={{ flex: 0.5 }}>
                            <ThemedText style={styles.label}>Duration (min)</ThemedText>
                            <TextInput
                                style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                                keyboardType="numeric"
                                value={form.durationMinutes}
                                onChangeText={(t) => setForm({ ...form, durationMinutes: t })}
                            />
                        </View>
                        <View style={{ flex: 1 }}>
                            <ThemedText style={styles.label}>Location</ThemedText>
                            <TextInput
                                style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                                placeholder="Room 101 or Zoom Link"
                                placeholderTextColor={colors.icon}
                                value={form.location}
                                onChangeText={(t) => setForm({ ...form, location: t })}
                            />
                        </View>
                    </View>

                    {/* Description */}
                    <ThemedText style={styles.label}>Agenda / Description (Optional)</ThemedText>
                    <TextInput
                        style={[styles.input, styles.textArea, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                        placeholder="Discuss Q1 goals and team feedback..."
                        placeholderTextColor={colors.icon}
                        multiline
                        numberOfLines={4}
                        value={form.description}
                        onChangeText={(t) => setForm({ ...form, description: t })}
                    />

                    <TouchableOpacity
                        style={[styles.submitButton, { backgroundColor: colors.primary }]}
                        onPress={handleSubmit}
                        disabled={submitting}
                    >
                        {submitting ? (
                            <ActivityIndicator color="#FFF" />
                        ) : (
                            <ThemedText style={styles.submitText}>Schedule Now</ThemedText>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: Spacing.md,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.xl,
        gap: Spacing.md,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: '800',
    },
    formContainer: {
        gap: Spacing.md,
    },
    label: {
        fontSize: 14,
        fontWeight: '700',
        opacity: 0.8,
        marginBottom: 4,
    },
    input: {
        borderRadius: BorderRadius.lg,
        padding: Spacing.md,
        fontSize: 16,
        borderWidth: 1,
    },
    dateTimeRow: {
        flexDirection: 'row',
        gap: Spacing.md,
    },
    pickerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        padding: Spacing.md,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
    },
    typeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.sm,
        marginBottom: Spacing.sm,
    },
    typeChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.full,
    },
    typeChipText: {
        fontSize: 12,
        fontWeight: '600',
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    submitButton: {
        marginTop: Spacing.xl,
        padding: Spacing.lg,
        borderRadius: BorderRadius.xl,
        alignItems: 'center',
        ...PlatformStyles.shadow,
    },
    submitText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '800',
    }
});
