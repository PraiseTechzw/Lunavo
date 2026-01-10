/**
 * Executive Meeting Management - Create, edit, delete meetings
 */

import { ThemedText } from '@/app/components/themed-text';
import { ThemedView } from '@/app/components/themed-view';
import { BorderRadius, Colors, Spacing } from '@/app/constants/theme';
import { useColorScheme } from '@/app/hooks/use-color-scheme';
import { Meeting, MeetingType } from '@/app/types';
import { createInputStyle, createShadow, getCursorStyle } from '@/app/utils/platform-styles';
import { useRoleGuard } from '@/hooks/use-auth-guard';
import {
  createMeeting,
  deleteMeeting,
  getMeetings,
  updateMeeting
} from '@/lib/database';
import { scheduleAllMeetingReminders } from '@/lib/notification-triggers';
import { MaterialIcons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
// Note: DateTimePicker requires @react-native-community/datetimepicker package
// For now, using a simple date input. Install the package for full date picker functionality.

export default function ExecutiveMeetingsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const { user, loading: authLoading } = useRoleGuard(
    ['peer-educator-executive', 'admin'],
    '/peer-educator/dashboard'
  );

  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [scheduledDate, setScheduledDate] = useState(new Date());
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [location, setLocation] = useState('');
  const [meetingType, setMeetingType] = useState<MeetingType>('weekly');

  useEffect(() => {
    if (user) {
      loadMeetings();
    }
  }, [user]);

  const loadMeetings = async () => {
    try {
      const allMeetings = await getMeetings();
      setMeetings(allMeetings.sort((a, b) =>
        new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime()
      ));
    } catch (error) {
      console.error('Error loading meetings:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadMeetings();
    setRefreshing(false);
  };

  const handleCreate = () => {
    setEditingMeeting(null);
    setTitle('');
    setDescription('');
    setScheduledDate(new Date());
    setDurationMinutes(30);
    setLocation('');
    setMeetingType('weekly');
    setShowCreateModal(true);
  };

  const handleEdit = (meeting: Meeting) => {
    setEditingMeeting(meeting);
    setTitle(meeting.title);
    setDescription(meeting.description || '');
    setScheduledDate(new Date(meeting.scheduledDate));
    setDurationMinutes(meeting.durationMinutes);
    setLocation(meeting.location || '');
    setMeetingType(meeting.meetingType);
    setShowCreateModal(true);
  };

  const handleDelete = (meeting: Meeting) => {
    Alert.alert(
      'Delete Meeting',
      `Are you sure you want to delete "${meeting.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMeeting(meeting.id);
              Alert.alert('Success', 'Meeting deleted.');
              loadMeetings();
            } catch (error) {
              console.error('Error deleting meeting:', error);
              Alert.alert('Error', 'Failed to delete meeting.');
            }
          },
        },
      ]
    );
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a meeting title.');
      return;
    }

    if (!user) return;

    try {
      if (editingMeeting) {
        await updateMeeting(editingMeeting.id, {
          title,
          description: description || undefined,
          scheduledDate,
          durationMinutes,
          location: location || undefined,
          meetingType,
        });
        Alert.alert('Success', 'Meeting updated.');
      } else {
        const newMeeting = await createMeeting({
          title,
          description: description || undefined,
          scheduledDate,
          durationMinutes,
          location: location || undefined,
          meetingType,
          createdBy: user.id,
        });

        // Schedule reminders for all peer educators
        await scheduleAllMeetingReminders(newMeeting.id, newMeeting.title, newMeeting.scheduledDate);

        Alert.alert('Success', 'Meeting created and reminders scheduled.');
      }
      setShowCreateModal(false);
      loadMeetings();
    } catch (error) {
      console.error('Error saving meeting:', error);
      Alert.alert('Error', 'Failed to save meeting.');
    }
  };

  if (authLoading) {
    return (
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <ThemedView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ThemedText>Loading...</ThemedText>
        </ThemedView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ThemedView style={styles.container}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={[styles.header, { backgroundColor: colors.background }]}>
            <TouchableOpacity onPress={() => router.back()} style={getCursorStyle()}>
              <MaterialIcons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <ThemedText type="h2" style={styles.headerTitle}>
              Manage Meetings
            </ThemedText>
            <TouchableOpacity onPress={handleCreate} style={getCursorStyle()}>
              <MaterialIcons name="add" size={24} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {/* Meetings List */}
          {meetings.map((meeting) => (
            <View
              key={meeting.id}
              style={[styles.meetingCard, { backgroundColor: colors.card }, createShadow(2, '#000', 0.1)]}
            >
              <View style={styles.meetingHeader}>
                <View style={styles.meetingInfo}>
                  <ThemedText type="body" style={{ fontWeight: '600', color: colors.text }}>
                    {meeting.title}
                  </ThemedText>
                  <ThemedText type="small" style={{ color: colors.icon, marginTop: Spacing.xs }}>
                    {format(new Date(meeting.scheduledDate), 'EEE, MMM dd, yyyy • HH:mm')}
                  </ThemedText>
                </View>
                <View style={styles.meetingActions}>
                  <TouchableOpacity
                    onPress={() => router.push(`/meetings/${meeting.id}`)}
                    style={getCursorStyle()}
                  >
                    <MaterialIcons name="visibility" size={20} color={colors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleEdit(meeting)}
                    style={[getCursorStyle(), { marginLeft: Spacing.md }]}
                  >
                    <MaterialIcons name="edit" size={20} color={colors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDelete(meeting)}
                    style={[getCursorStyle(), { marginLeft: Spacing.md }]}
                  >
                    <MaterialIcons name="delete" size={20} color={colors.danger} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}

          {meetings.length === 0 && (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="event-busy" size={64} color={colors.icon} />
              <ThemedText type="body" style={[styles.emptyText, { color: colors.icon }]}>
                No meetings yet. Create one to get started!
              </ThemedText>
            </View>
          )}
        </ScrollView>

        {/* Create/Edit Modal */}
        {showCreateModal && (
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
              <View style={styles.modalHeader}>
                <ThemedText type="h2" style={styles.modalTitle}>
                  {editingMeeting ? 'Edit Meeting' : 'Create Meeting'}
                </ThemedText>
                <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                  <MaterialIcons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalScroll}>
                <TextInput
                  style={[
                    styles.input,
                    createInputStyle(),
                    { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border },
                  ]}
                  placeholder="Meeting Title"
                  placeholderTextColor={colors.icon}
                  value={title}
                  onChangeText={setTitle}
                />

                <TextInput
                  style={[
                    styles.input,
                    createInputStyle(),
                    { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border },
                    styles.textArea,
                  ]}
                  placeholder="Description (optional)"
                  placeholderTextColor={colors.icon}
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={4}
                />

                <TouchableOpacity
                  style={[
                    styles.input,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                  ]}
                  onPress={() => setShowDatePicker(true)}
                >
                  <ThemedText type="body" style={{ color: colors.text }}>
                    {format(scheduledDate, 'EEE, MMM dd, yyyy • HH:mm')}
                  </ThemedText>
                </TouchableOpacity>

                {/* Date picker - install @react-native-community/datetimepicker for full functionality */}
                <ThemedText type="small" style={{ color: colors.icon, marginBottom: Spacing.sm }}>
                  Date: {format(scheduledDate, 'EEE, MMM dd, yyyy • HH:mm')}
                </ThemedText>
                <ThemedText type="small" style={{ color: colors.icon, fontStyle: 'italic' }}>
                  Full date picker requires @react-native-community/datetimepicker package
                </ThemedText>

                <TextInput
                  style={[
                    styles.input,
                    createInputStyle(),
                    { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border },
                  ]}
                  placeholder="Duration (minutes)"
                  placeholderTextColor={colors.icon}
                  value={durationMinutes.toString()}
                  onChangeText={(text) => setDurationMinutes(parseInt(text) || 30)}
                  keyboardType="numeric"
                />

                <TextInput
                  style={[
                    styles.input,
                    createInputStyle(),
                    { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border },
                  ]}
                  placeholder="Location (optional)"
                  placeholderTextColor={colors.icon}
                  value={location}
                  onChangeText={setLocation}
                />

                <View style={styles.typeSelector}>
                  {(['weekly', 'special', 'training', 'orientation'] as MeetingType[]).map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.typeButton,
                        {
                          backgroundColor: meetingType === type ? colors.primary : colors.surface,
                        },
                      ]}
                      onPress={() => setMeetingType(type)}
                    >
                      <ThemedText
                        type="small"
                        style={{
                          color: meetingType === type ? '#FFFFFF' : colors.text,
                          fontWeight: '600',
                        }}
                      >
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </ThemedText>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  onPress={() => setShowCreateModal(false)}
                >
                  <ThemedText type="body" style={{ color: colors.text, fontWeight: '600' }}>
                    Cancel
                  </ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: colors.primary }]}
                  onPress={handleSave}
                >
                  <ThemedText type="body" style={{ color: '#FFFFFF', fontWeight: '600' }}>
                    {editingMeeting ? 'Update' : 'Create'}
                  </ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
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
    paddingBottom: 80,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  headerTitle: {
    fontWeight: '700',
    fontSize: 20,
  },
  meetingCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  meetingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  meetingInfo: {
    flex: 1,
  },
  meetingActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xxl,
    marginTop: Spacing.xxl,
  },
  emptyText: {
    marginTop: Spacing.md,
    textAlign: 'center',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...createShadow(8, '#000', 0.3),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    fontWeight: '700',
  },
  modalScroll: {
    maxHeight: 400,
  },
  input: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  typeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  typeButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  modalButton: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
  },
});

