/**
 * Meeting Calendar - Peer Educator view
 * Weekly view (Wednesdays 16:00-16:30)
 */

import { ThemedText } from "@/app/components/themed-text";
import { ThemedView } from "@/app/components/themed-view";
import { BorderRadius, Colors, Spacing } from "@/app/constants/theme";
import { useColorScheme } from "@/app/hooks/use-color-scheme";
import { Meeting } from "@/app/types";
import { createShadow, getCursorStyle } from "@/app/utils/platform-styles";
import { useRoleGuard } from "@/hooks/use-auth-guard";
import { createOrUpdateAttendance, getMeetings, getUserAttendance } from "@/lib/database";
import { scheduleRemindersForNewRSVP } from "@/lib/meeting-reminders";
import { MaterialIcons } from "@expo/vector-icons";
import { format, isPast } from "date-fns";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
    RefreshControl,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function MeetingCalendarScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];

  const { user, loading: authLoading } = useRoleGuard(
    ["peer-educator", "peer-educator-executive", "admin"],
    "/(tabs)",
  );

  const [refreshing, setRefreshing] = useState(false);
  const [upcomingMeetings, setUpcomingMeetings] = useState<Meeting[]>([]);
  const [pastMeetings, setPastMeetings] = useState<Meeting[]>([]);
  const [attendanceMap, setAttendanceMap] = useState<Record<string, boolean>>(
    {},
  );
  const [viewMode, setViewMode] = useState<"upcoming" | "past">("upcoming");

  useEffect(() => {
    if (user) {
      loadMeetings();
    }
  }, [user, loadMeetings]);

  const loadMeetings = useCallback(async () => {
    try {
      const [meetings, myAttendance] = await Promise.all([
        getMeetings(),
        user ? getUserAttendance(user.id) : Promise.resolve([]),
      ]);

      const now = new Date();
      const upcoming = meetings
        .filter((m) => new Date(m.scheduledDate) >= now)
        .sort(
          (a, b) =>
            new Date(a.scheduledDate).getTime() -
            new Date(b.scheduledDate).getTime(),
        );

      const past = meetings
        .filter((m) => new Date(m.scheduledDate) < now)
        .sort(
          (a, b) =>
            new Date(b.scheduledDate).getTime() -
            new Date(a.scheduledDate).getTime(),
        );

      setUpcomingMeetings(upcoming);
      setPastMeetings(past);

      // Build attendance map
      const attendance: Record<string, boolean> = {};
      myAttendance.forEach((a) => {
        attendance[a.meetingId] = a.attended;
      });
      setAttendanceMap(attendance);
    } catch (error) {
      console.error("Error loading meetings:", error);
    }
  }, [user]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadMeetings();
    setRefreshing(false);
  };

  const handleRSVP = async (meetingId: string, attending: boolean) => {
    if (!user) return;

    try {
      await createOrUpdateAttendance({
        meetingId,
        userId: user.id,
        attended: attending,
      });
      setAttendanceMap((prev) => ({ ...prev, [meetingId]: attending }));

      // Schedule reminders if attending
      if (attending) {
        await scheduleRemindersForNewRSVP(user.id, meetingId, attending);
      }
    } catch (error) {
      console.error("Error updating RSVP:", error);
    }
  };

  const getNextWednesday = (): Date => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const daysUntilWednesday = (3 - dayOfWeek + 7) % 7 || 7;
    const nextWednesday = new Date(now);
    nextWednesday.setDate(now.getDate() + daysUntilWednesday);
    nextWednesday.setHours(16, 0, 0, 0);
    return nextWednesday;
  };

  const renderMeeting = (meeting: Meeting) => {
    const isAttending = attendanceMap[meeting.id] === true;
    const hasRSVPed = meeting.id in attendanceMap;
    const isPastMeeting = isPast(new Date(meeting.scheduledDate));

    return (
      <TouchableOpacity
        key={meeting.id}
        style={[
          styles.meetingCard,
          { backgroundColor: colors.card },
          createShadow(2, "#000", 0.1),
        ]}
        onPress={() => router.push(`/meetings/${meeting.id}`)}
        activeOpacity={0.7}
      >
        <View style={styles.meetingHeader}>
          <View style={styles.meetingInfo}>
            <MaterialIcons name="event" size={24} color={colors.primary} />
            <View style={styles.meetingDetails}>
              <ThemedText
                type="body"
                style={{ fontWeight: "600", color: colors.text }}
              >
                {meeting.title}
              </ThemedText>
              <ThemedText type="small" style={{ color: colors.icon }}>
                {format(
                  new Date(meeting.scheduledDate),
                  "EEE, MMM dd, yyyy • HH:mm",
                )}
              </ThemedText>
              {meeting.location && (
                <ThemedText type="small" style={{ color: colors.icon }}>
                  📍 {meeting.location}
                </ThemedText>
              )}
            </View>
          </View>
          {meeting.meetingType === "weekly" && (
            <View
              style={[
                styles.weeklyBadge,
                { backgroundColor: colors.primary + "20" },
              ]}
            >
              <ThemedText
                type="small"
                style={{ color: colors.primary, fontWeight: "600" }}
              >
                Weekly
              </ThemedText>
            </View>
          )}
        </View>

        {meeting.description && (
          <ThemedText
            type="small"
            style={{ color: colors.text, marginTop: Spacing.sm }}
            numberOfLines={2}
          >
            {meeting.description}
          </ThemedText>
        )}

        {!isPastMeeting && (
          <View style={styles.rsvpContainer}>
            {hasRSVPed ? (
              <View style={styles.rsvpStatus}>
                <MaterialIcons
                  name={isAttending ? "check-circle" : "cancel"}
                  size={20}
                  color={isAttending ? colors.success : colors.icon}
                />
                <ThemedText
                  type="small"
                  style={{
                    color: isAttending ? colors.success : colors.icon,
                    marginLeft: Spacing.xs,
                  }}
                >
                  {isAttending ? "Attending" : "Not Attending"}
                </ThemedText>
              </View>
            ) : (
              <ThemedText type="small" style={{ color: colors.icon }}>
                No RSVP yet
              </ThemedText>
            )}
            <View style={styles.rsvpButtons}>
              <TouchableOpacity
                style={[
                  styles.rsvpButton,
                  {
                    backgroundColor: isAttending
                      ? colors.success
                      : colors.surface,
                    borderWidth: 1,
                    borderColor: isAttending ? colors.success : colors.border,
                  },
                ]}
                onPress={() => handleRSVP(meeting.id, true)}
              >
                <ThemedText
                  type="small"
                  style={{
                    color: isAttending ? "#FFFFFF" : colors.text,
                    fontWeight: "600",
                  }}
                >
                  Yes
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.rsvpButton,
                  {
                    backgroundColor:
                      !isAttending && hasRSVPed
                        ? colors.danger
                        : colors.surface,
                    borderWidth: 1,
                    borderColor:
                      !isAttending && hasRSVPed ? colors.danger : colors.border,
                  },
                ]}
                onPress={() => handleRSVP(meeting.id, false)}
              >
                <ThemedText
                  type="small"
                  style={{
                    color: !isAttending && hasRSVPed ? "#FFFFFF" : colors.text,
                    fontWeight: "600",
                  }}
                >
                  No
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (authLoading) {
    return (
      <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
        <ThemedView
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <ThemedText>Loading...</ThemedText>
        </ThemedView>
      </SafeAreaView>
    );
  }

  const nextWeeklyMeeting = getNextWednesday();
  const displayedMeetings =
    viewMode === "upcoming" ? upcomingMeetings : pastMeetings;

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <ThemedView style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
            />
          }
        >
          {/* Header */}
          <View style={[styles.header, { backgroundColor: colors.background }]}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={getCursorStyle()}
            >
              <MaterialIcons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <ThemedText type="h2" style={styles.headerTitle}>
              Meetings
            </ThemedText>
            <View style={{ width: 24 }} />
          </View>

          {/* Next Weekly Meeting Info */}
          <View
            style={[
              styles.nextMeetingCard,
              { backgroundColor: colors.primary + "20" },
            ]}
          >
            <MaterialIcons name="event" size={32} color={colors.primary} />
            <View style={styles.nextMeetingInfo}>
              <ThemedText
                type="body"
                style={{ fontWeight: "600", color: colors.text }}
              >
                Next Weekly Meeting
              </ThemedText>
              <ThemedText type="small" style={{ color: colors.icon }}>
                {format(
                  nextWeeklyMeeting,
                  "EEEE, MMMM dd, yyyy • 16:00 - 16:30",
                )}
              </ThemedText>
            </View>
          </View>

          {/* View Toggle */}
          <View style={styles.viewToggle}>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                {
                  backgroundColor:
                    viewMode === "upcoming" ? colors.primary : colors.surface,
                },
              ]}
              onPress={() => setViewMode("upcoming")}
            >
              <ThemedText
                type="body"
                style={{
                  color: viewMode === "upcoming" ? "#FFFFFF" : colors.text,
                  fontWeight: "600",
                }}
              >
                Upcoming ({upcomingMeetings.length})
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                {
                  backgroundColor:
                    viewMode === "past" ? colors.primary : colors.surface,
                },
              ]}
              onPress={() => setViewMode("past")}
            >
              <ThemedText
                type="body"
                style={{
                  color: viewMode === "past" ? "#FFFFFF" : colors.text,
                  fontWeight: "600",
                }}
              >
                Past ({pastMeetings.length})
              </ThemedText>
            </TouchableOpacity>
          </View>

          {/* Meetings List */}
          {displayedMeetings.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="event-busy" size={64} color={colors.icon} />
              <ThemedText
                type="body"
                style={[styles.emptyText, { color: colors.icon }]}
              >
                No {viewMode === "upcoming" ? "upcoming" : "past"} meetings
              </ThemedText>
            </View>
          ) : (
            displayedMeetings.map(renderMeeting)
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  headerTitle: {
    fontWeight: "700",
    fontSize: 20,
  },
  nextMeetingCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  nextMeetingInfo: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  viewToggle: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  toggleButton: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: "center",
  },
  meetingCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  meetingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  meetingInfo: {
    flexDirection: "row",
    flex: 1,
  },
  meetingDetails: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  weeklyBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  rsvpContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  rsvpStatus: {
    flexDirection: "row",
    alignItems: "center",
  },
  rsvpButtons: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  rsvpButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xxl,
    marginTop: Spacing.xxl,
  },
  emptyText: {
    marginTop: Spacing.md,
    textAlign: "center",
  },
});
