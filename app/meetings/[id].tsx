/**
 * Meeting Detail Screen - View meeting info, agenda, attendees, RSVP
 */

import { ThemedText } from '@/app/components/themed-text';
import { ThemedView } from '@/app/components/themed-view';
import { BorderRadius, Colors, Spacing } from '@/app/constants/theme';
import { useColorScheme } from '@/app/hooks/use-color-scheme';
import { Meeting, MeetingAttendance } from '@/app/types';
import { createInputStyle, createShadow, getCursorStyle } from '@/app/utils/platform-styles';
import { useRoleGuard } from '@/hooks/use-auth-guard';
import {
    createOrUpdateAttendance,
    getMeeting,
    getMeetingAttendance,
    getUser
} from '@/lib/database';
import { MaterialIcons } from '@expo/vector-icons';
import { format, isPast } from 'date-fns';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

function AttendeesList({ attendance, colors }: { attendance: MeetingAttendance[]; colors: any }) {
  const [pseudonyms, setPseudonyms] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadPseudonyms = async () => {
      const pseudonymMap: Record<string, string> = {};
      await Promise.all(
        attendance.map(async (att) => {
          try {
            const user = await getUser(att.userId);
            pseudonymMap[att.userId] = user?.pseudonym || 'Anonymous';
          } catch (error) {
            pseudonymMap[att.userId] = 'Anonymous';
          }
        })
      );
      setPseudonyms(pseudonymMap);
    };
    loadPseudonyms();
  }, [attendance]);

  return (
    <View style={styles.attendeesList}>
      {attendance.map((att) => (
        <View key={att.id} style={styles.attendeeItem}>
          <MaterialIcons
            name={att.attended ? 'check-circle' : 'cancel'}
            size={20}
            color={att.attended ? colors.success : colors.icon}
          />
          <ThemedText type="body" style={{ color: colors.text, marginLeft: Spacing.sm, flex: 1 }}>
            {pseudonyms[att.userId] || 'Loading...'}
          </ThemedText>
        </View>
      ))}
    </View>
  );
}

export default function MeetingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  
  const { user, loading: authLoading } = useRoleGuard(
    ['peer-educator', 'peer-educator-executive', 'admin'],
    '/(tabs)'
  );
  
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [attendance, setAttendance] = useState<MeetingAttendance[]>([]);
  const [myAttendance, setMyAttendance] = useState<boolean | null>(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (id && user) {
      loadMeetingData();
    }
  }, [id, user]);

  const loadMeetingData = async () => {
    try {
      const [meetingData, attendanceData] = await Promise.all([
        getMeeting(id!),
        getMeetingAttendance(id!),
      ]);

      if (!meetingData) {
        Alert.alert('Not Found', 'Meeting not found.', [
          { 
            text: 'OK', 
            onPress: () => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/(tabs)' as any);
              }
            }
          },
        ]);
        return;
      }

      setMeeting(meetingData);
      setAttendance(attendanceData);

      // Find my attendance
      const myAtt = attendanceData.find((a) => a.userId === user?.id);
      setMyAttendance(myAtt ? myAtt.attended : null);
      setNotes(myAtt?.notes || '');
    } catch (error) {
      console.error('Error loading meeting data:', error);
      Alert.alert('Error', 'Failed to load meeting details.');
    }
  };

  const handleRSVP = async (attending: boolean) => {
    if (!meeting || !user) return;

    setLoading(true);
    try {
      await createOrUpdateAttendance({
        meetingId: meeting.id,
        userId: user.id,
        attended: attending,
      });
      setMyAttendance(attending);
      
      // Schedule reminders if attending
      if (attending) {
        await scheduleRemindersForNewRSVP(user.id, meeting.id, attending);
      }
      
      loadMeetingData(); // Reload to get updated attendance list
    } catch (error) {
      console.error('Error updating RSVP:', error);
      Alert.alert('Error', 'Failed to update RSVP.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!meeting || !user || myAttendance === null) {
      Alert.alert('Error', 'Please RSVP first before adding notes.');
      return;
    }

    setLoading(true);
    try {
      await createOrUpdateAttendance({
        meetingId: meeting.id,
        userId: user.id,
        attended: myAttendance,
        notes,
      });
      Alert.alert('Success', 'Notes saved.');
    } catch (error) {
      console.error('Error saving notes:', error);
      Alert.alert('Error', 'Failed to save notes.');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || !meeting) {
    return (
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <ThemedView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ThemedText>Loading...</ThemedText>
        </ThemedView>
      </SafeAreaView>
    );
  }

  const isPastMeeting = isPast(new Date(meeting.scheduledDate));
  const attendingCount = attendance.filter((a) => a.attended).length;
  const notAttendingCount = attendance.filter((a) => !a.attended).length;

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ThemedView style={styles.container}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={getCursorStyle()}>
              <MaterialIcons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <ThemedText type="h2" style={styles.headerTitle}>
              Meeting Details
            </ThemedText>
            <View style={{ width: 24 }} />
          </View>

          {/* Meeting Info */}
          <View style={[styles.section, { backgroundColor: colors.card }, createShadow(2, '#000', 0.1)]}>
            <View style={styles.meetingHeader}>
              <MaterialIcons name="event" size={32} color={colors.primary} />
              <View style={styles.meetingTitleContainer}>
                <ThemedText type="h2" style={styles.meetingTitle}>
                  {meeting.title}
                </ThemedText>
                {meeting.meetingType === 'weekly' && (
                  <View style={[styles.weeklyBadge, { backgroundColor: colors.primary + '20' }]}>
                    <ThemedText type="small" style={{ color: colors.primary, fontWeight: '600' }}>
                      Weekly Meeting
                    </ThemedText>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.infoRow}>
              <MaterialIcons name="schedule" size={20} color={colors.icon} />
              <ThemedText type="body" style={{ color: colors.text, marginLeft: Spacing.sm }}>
                {format(new Date(meeting.scheduledDate), 'EEEE, MMMM dd, yyyy')}
              </ThemedText>
            </View>

            <View style={styles.infoRow}>
              <MaterialIcons name="access-time" size={20} color={colors.icon} />
              <ThemedText type="body" style={{ color: colors.text, marginLeft: Spacing.sm }}>
                {format(new Date(meeting.scheduledDate), 'HH:mm')} -{' '}
                {format(
                  new Date(new Date(meeting.scheduledDate).getTime() + meeting.durationMinutes * 60000),
                  'HH:mm'
                )}{' '}
                ({meeting.durationMinutes} minutes)
              </ThemedText>
            </View>

            {meeting.location && (
              <View style={styles.infoRow}>
                <MaterialIcons name="location-on" size={20} color={colors.icon} />
                <ThemedText type="body" style={{ color: colors.text, marginLeft: Spacing.sm }}>
                  {meeting.location}
                </ThemedText>
              </View>
            )}

            {meeting.description && (
              <View style={styles.descriptionContainer}>
                <ThemedText type="body" style={{ color: colors.text, lineHeight: 22 }}>
                  {meeting.description}
                </ThemedText>
              </View>
            )}
          </View>

          {/* RSVP Section */}
          {!isPastMeeting && (
            <View style={[styles.section, { backgroundColor: colors.card }, createShadow(2, '#000', 0.1)]}>
              <ThemedText type="h3" style={styles.sectionTitle}>
                RSVP
              </ThemedText>
              {myAttendance === null ? (
                <View style={styles.rsvpButtons}>
                  <TouchableOpacity
                    style={[styles.rsvpButton, { backgroundColor: colors.success }]}
                    onPress={() => handleRSVP(true)}
                    disabled={loading}
                  >
                    <MaterialIcons name="check-circle" size={24} color="#FFFFFF" />
                    <ThemedText type="body" style={{ color: '#FFFFFF', fontWeight: '600', marginLeft: Spacing.sm }}>
                      I'll Attend
                    </ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.rsvpButton, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }]}
                    onPress={() => handleRSVP(false)}
                    disabled={loading}
                  >
                    <MaterialIcons name="cancel" size={24} color={colors.text} />
                    <ThemedText type="body" style={{ color: colors.text, fontWeight: '600', marginLeft: Spacing.sm }}>
                      Can't Attend
                    </ThemedText>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.rsvpStatus}>
                  <MaterialIcons
                    name={myAttendance ? 'check-circle' : 'cancel'}
                    size={32}
                    color={myAttendance ? colors.success : colors.icon}
                  />
                  <ThemedText type="body" style={{ color: colors.text, fontWeight: '600', marginLeft: Spacing.md }}>
                    {myAttendance ? 'You are attending' : "You can't attend"}
                  </ThemedText>
                  <TouchableOpacity
                    style={[styles.changeButton, { borderColor: colors.border }]}
                    onPress={() => setMyAttendance(null)}
                  >
                    <ThemedText type="small" style={{ color: colors.primary }}>
                      Change
                    </ThemedText>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          {/* Attendees List */}
          <View style={[styles.section, { backgroundColor: colors.card }, createShadow(2, '#000', 0.1)]}>
            <ThemedText type="h3" style={styles.sectionTitle}>
              Attendance
            </ThemedText>
            <View style={styles.attendanceStats}>
              <View style={styles.statItem}>
                <ThemedText type="h2" style={{ color: colors.success }}>
                  {attendingCount}
                </ThemedText>
                <ThemedText type="small" style={{ color: colors.icon }}>
                  Attending
                </ThemedText>
              </View>
              <View style={styles.statItem}>
                <ThemedText type="h2" style={{ color: colors.icon }}>
                  {notAttendingCount}
                </ThemedText>
                <ThemedText type="small" style={{ color: colors.icon }}>
                  Not Attending
                </ThemedText>
              </View>
            </View>
            {attendance.length === 0 ? (
              <ThemedText type="body" style={{ color: colors.icon, fontStyle: 'italic', marginTop: Spacing.md }}>
                No RSVPs yet
              </ThemedText>
            ) : (
              <AttendeesList attendance={attendance} colors={colors} />
            )}
          </View>

          {/* Notes Section */}
          {myAttendance !== null && (
            <View style={[styles.section, { backgroundColor: colors.card }, createShadow(2, '#000', 0.1)]}>
              <ThemedText type="h3" style={styles.sectionTitle}>
                My Notes
              </ThemedText>
              <TextInput
                style={[
                  styles.notesInput,
                  createInputStyle(),
                  { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border },
                ]}
                placeholder="Add notes about this meeting..."
                placeholderTextColor={colors.icon}
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />
              <TouchableOpacity
                style={[styles.saveButton, { backgroundColor: colors.primary }]}
                onPress={handleSaveNotes}
                disabled={loading}
              >
                <ThemedText type="body" style={{ color: '#FFFFFF', fontWeight: '600' }}>
                  Save Notes
                </ThemedText>
              </TouchableOpacity>
            </View>
          )}
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
    paddingBottom: 80,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  headerTitle: {
    fontWeight: '700',
    fontSize: 20,
  },
  section: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  meetingHeader: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
  },
  meetingTitleContainer: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  meetingTitle: {
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  weeklyBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.xs,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  descriptionContainer: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  sectionTitle: {
    fontWeight: '700',
    marginBottom: Spacing.md,
  },
  rsvpButtons: {
    gap: Spacing.md,
  },
  rsvpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  rsvpStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  changeButton: {
    marginLeft: 'auto',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  attendanceStats: {
    flexDirection: 'row',
    gap: Spacing.xl,
    marginBottom: Spacing.md,
  },
  statItem: {
    alignItems: 'center',
  },
  attendeesList: {
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  attendeeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
    backgroundColor: '#F5F5F5',
    borderRadius: BorderRadius.sm,
  },
  notesInput: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    minHeight: 120,
    marginBottom: Spacing.md,
  },
  saveButton: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
});

