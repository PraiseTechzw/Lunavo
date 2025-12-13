/**
 * Meeting Reminder System
 * Handles scheduling and sending meeting reminders
 */

import { getMeetingAttendance, getMeetings } from './database';
import { scheduleMeetingReminder, scheduleMeetingReminder24h } from './notification-triggers';

/**
 * Schedule reminders for all upcoming meetings
 * This should be called periodically (e.g., daily cron job)
 */
export async function scheduleUpcomingMeetingReminders() {
  try {
    const allMeetings = await getMeetings();
    const now = new Date(); // Current time for filtering upcoming meetings
    const meetings = allMeetings.filter((m) => new Date(m.scheduledDate) >= now);

    for (const meeting of meetings) {
      const meetingDate = new Date(meeting.scheduledDate);
      const timeUntilMeeting = meetingDate.getTime() - now.getTime();

      // Get all attendees
      const attendance = await getMeetingAttendance(meeting.id);
      const attendeeIds = attendance
        .filter((a) => a.attended)
        .map((a) => a.userId);

      // Schedule 24h reminder if meeting is between 24-48 hours away
      const twentyFourHours = 24 * 60 * 60 * 1000;
      const fortyEightHours = 48 * 60 * 60 * 1000;
      if (timeUntilMeeting > twentyFourHours && timeUntilMeeting <= fortyEightHours) {
        for (const userId of attendeeIds) {
          await scheduleMeetingReminder24h(userId, meeting.id, meeting.title, meetingDate);
        }
      }

      // Schedule 1h reminder if meeting is between 1-2 hours away
      const oneHour = 60 * 60 * 1000;
      const twoHours = 2 * 60 * 60 * 1000;
      if (timeUntilMeeting > oneHour && timeUntilMeeting <= twoHours) {
        for (const userId of attendeeIds) {
          await scheduleMeetingReminder(userId, meeting.id, meeting.title, meetingDate);
        }
      }
    }
  } catch (error) {
    console.error('Error scheduling meeting reminders:', error);
  }
}

/**
 * Schedule reminders when a user RSVPs to a meeting
 */
export async function scheduleRemindersForNewRSVP(
  userId: string,
  meetingId: string,
  attending: boolean
) {
  if (!attending) return; // Only schedule for attendees

  try {
    const allMeetings = await getMeetings();
    const meeting = allMeetings.find((m) => m.id === meetingId);

    if (!meeting) return;

    const meetingDate = new Date(meeting.scheduledDate);
    const now = new Date(); // Current time for calculating time until meeting
    const timeUntilMeeting = meetingDate.getTime() - now.getTime();

    // Schedule 24h reminder if meeting is more than 24 hours away
    const twentyFourHours = 24 * 60 * 60 * 1000;
    if (timeUntilMeeting > twentyFourHours) {
      await scheduleMeetingReminder24h(userId, meetingId, meeting.title, meetingDate);
    }

    // Schedule 1h reminder if meeting is more than 1 hour away
    const oneHour = 60 * 60 * 1000;
    if (timeUntilMeeting > oneHour) {
      await scheduleMeetingReminder(userId, meetingId, meeting.title, meetingDate);
    }
  } catch (error) {
    console.error('Error scheduling reminders for new RSVP:', error);
  }
}

