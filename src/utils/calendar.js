/**
 * calendar.js
 * Handles adding confirmed tutoring sessions to the device's native calendar.
 *
 * Platform strategy:
 *  - iOS / Android  →  expo-calendar (native system calendar)
 *  - Web            →  generates and downloads a .ics file, which opens in
 *                      Google Calendar, Apple Calendar, Outlook, etc.
 *
 * Times come from the bell schedule and rotation (utils/schedule.js), so the
 * event lands when the block actually meets on that date.
 */
import { Platform } from 'react-native';
import { school } from '../theme/school';

import {
  blockName, blockTimes, bookableDays, nextBlockStart, timeRange,
} from './schedule';

// ─── Native helpers (iOS / Android) ──────────────────────────────────────────

async function getBestCalendarId(Calendar) {
  if (Platform.OS === 'ios') {
    const cal = await Calendar.getDefaultCalendarAsync();
    return cal?.id ?? null;
  }
  const cals = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
  const owned = cals.find(
    (c) => c.allowsModifications && c.accessLevel === Calendar.CalendarAccessLevel.OWNER,
  );
  const writable = cals.find((c) => c.allowsModifications);
  return (owned ?? writable ?? cals[0])?.id ?? null;
}

async function addToNativeCalendar(session, otherName, startDate, endDate) {
  // Lazy-load expo-calendar so web bundles never pull it in
  const Calendar = await import('expo-calendar');

  const { status } = await Calendar.requestCalendarPermissionsAsync();
  if (status !== 'granted') {
    return { success: false, error: 'Calendar access was denied. You can enable it in Settings.' };
  }

  let calendarId;
  try {
    calendarId = await getBestCalendarId(Calendar);
  } catch {
    return { success: false, error: 'Could not access your calendars.' };
  }
  if (!calendarId) {
    return { success: false, error: 'No writable calendar found on this device.' };
  }

  const title = `Tutoring: ${session.subject} with ${otherName}`;
  const notes = [
    session.notes ?? null,
    `Subject: ${session.subject}`,
    blockName(session.period),
    `${school.appName}`,
  ].filter(Boolean).join('\n');

  try {
    const eventId = await Calendar.createEventAsync(calendarId, {
      title,
      startDate,
      endDate,
      notes,
      timeZone: 'America/Chicago',
      alarms: [
        { relativeOffset: -15 }, // 15-minute reminder
        { relativeOffset: -60 }, // 1-hour reminder
      ],
    });
    return { success: true, eventId };
  } catch (e) {
    return { success: false, error: e?.message ?? 'Failed to create calendar event.' };
  }
}

// ─── Web helper (.ics download) ───────────────────────────────────────────────

/**
 * Format a Date as a local iCalendar datetime string: YYYYMMDDTHHmmss
 * We use floating (no Z suffix) so the event appears at the correct
 * local time regardless of the user's timezone.
 */
function toICSDate(date) {
  const pad = (n) => String(n).padStart(2, '0');
  return (
    `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}` +
    `T${pad(date.getHours())}${pad(date.getMinutes())}00`
  );
}

/** Escape special characters in iCal text fields */
function escapeICS(str) {
  return String(str ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

function addToWebCalendar(session, otherName, startDate, endDate) {
  const title = `Tutoring: ${session.subject} with ${otherName}`;
  const description = [
    session.notes ?? null,
    `Subject: ${session.subject}`,
    blockName(session.period),
    `${school.appName}`,
  ].filter(Boolean).join('\\n');

  const uid = `session-${session.id ?? Date.now()}@strakejesuit.tutors`;
  const now  = toICSDate(new Date());

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Tutors for Others//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART:${toICSDate(startDate)}`,
    `DTEND:${toICSDate(endDate)}`,
    `SUMMARY:${escapeICS(title)}`,
    `DESCRIPTION:${escapeICS(description)}`,
    'BEGIN:VALARM',
    'TRIGGER:-PT15M',
    'ACTION:DISPLAY',
    `DESCRIPTION:${escapeICS(title)} starts in 15 minutes`,
    'END:VALARM',
    'BEGIN:VALARM',
    'TRIGGER:-PT1H',
    'ACTION:DISPLAY',
    `DESCRIPTION:${escapeICS(title)} starts in 1 hour`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  try {
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `tutoring-${session.subject.replace(/\s+/g, '-').toLowerCase()}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return { success: true };
  } catch (e) {
    return { success: false, error: e?.message ?? 'Could not download calendar file.' };
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Add the session to the user's calendar.
 * On native: writes directly to the system calendar via expo-calendar.
 * On web:    downloads a .ics file the user can open in any calendar app.
 *
 * @param {object} session   – the session row (day, period, subject, notes, id)
 * @param {string} otherName – display name of the other participant
 * @returns {{ success: boolean, error?: string }}
 */
export async function addSessionToCalendar(session, otherName) {
  // Booked sessions have a real date. Older undated ones use the next time
  // the block meets so the entry is still useful.
  const iso = session.session_date ?? bookableDays({ period: session.period, count: 1 })[0];
  const times = iso ? blockTimes(iso, session.period) : null;
  if (!times) {
    return { success: false, error: `${blockName(session.period)} doesn't meet that day.` };
  }

  if (Platform.OS === 'web') {
    return addToWebCalendar(session, otherName, times.start, times.end);
  }

  return addToNativeCalendar(session, otherName, times.start, times.end);
}

/**
 * When the session's block next meets, or null if it doesn't in the next four
 * weeks. Shared with reminders.js.
 */
export function nextSessionStart(period) {
  return nextBlockStart(period);
}

/**
 * "Block 6 · 1:55 PM – 3:05 PM" for a session date, or '' when the block
 * doesn't meet that day.
 */
export function getSessionTimeLabel(iso, period) {
  const range = timeRange(iso, period);
  return range ? `${blockName(period)} · ${range}` : '';
}
