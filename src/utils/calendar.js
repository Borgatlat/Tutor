/**
 * calendar.js
 * Handles adding confirmed tutoring sessions to the device's native calendar.
 *
 * Platform strategy:
 *  - iOS / Android  →  expo-calendar (native system calendar)
 *  - Web            →  generates and downloads a .ics file, which opens in
 *                      Google Calendar, Apple Calendar, Outlook, etc.
 *
 * Period times are based on a standard Strake Jesuit school day.
 * Users can edit the event after it's created if the times differ.
 */
import { Platform } from 'react-native';
import { fromDateKey, formatSessionDate } from './schoolDays';

// ─── Block start/end times (24-hour, based on Strake Jesuit block schedule) ──
const BLOCK_TIMES = {
  1: { startH: 8,  startM: 0,  endH: 8,  endM: 50 },
  2: { startH: 9,  startM: 0,  endH: 9,  endM: 50 },
  3: { startH: 10, startM: 0,  endH: 10, endM: 50 },
  4: { startH: 11, startM: 0,  endH: 11, endM: 50 },
  5: { startH: 12, startM: 0,  endH: 12, endM: 50 },
  6: { startH: 13, startM: 0,  endH: 13, endM: 50 },
  7: { startH: 14, startM: 0,  endH: 14, endM: 50 },
  8: { startH: 15, startM: 0,  endH: 15, endM: 50 },
};

/** The booked date at hour:minute. Falls back to the next weekday if absent. */
function sessionDateAtTime(sessionDate, hour, minute) {
  const base = fromDateKey(sessionDate);
  if (base) {
    const d = new Date(base);
    d.setHours(hour, minute, 0, 0);
    return d;
  }
  return nextWeekdayAtTime(hour, minute);
}

/**
 * Returns a Date for the next weekday (Mon-Fri) at hour:minute.
 * Only a fallback now that sessions carry a real date.
 */
function nextWeekdayAtTime(hour, minute) {
  const now    = new Date();
  const result = new Date(now);
  result.setHours(hour, minute, 0, 0);

  // If today is Sat(6) or Sun(0), or the time has already passed, advance
  const day = now.getDay();
  if (day === 0) {
    result.setDate(result.getDate() + 1); // → Monday
  } else if (day === 6) {
    result.setDate(result.getDate() + 2); // → Monday
  } else if (result <= now) {
    // Weekday but time has passed - move to next weekday
    const daysToAdd = day === 5 ? 3 : 1; // Friday → Monday, else +1
    result.setDate(result.getDate() + daysToAdd);
  }
  return result;
}

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

async function addToNativeCalendar(session, otherName, times, startDate, endDate) {
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
    `Block ${session.period}`,
    'Strake Jesuit Tutor Marketplace',
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
    `Block ${session.period}`,
    'Strake Jesuit Tutor Marketplace',
  ].filter(Boolean).join('\\n');

  const uid = `session-${session.id ?? Date.now()}@strakejesuit.tutors`;
  const now  = toICSDate(new Date());

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Strake Jesuit Tutors//EN',
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
  const times = BLOCK_TIMES[session.period];
  if (!times) {
    return { success: false, error: `Unknown block: ${session.period}` };
  }

  // The session carries its own date now, so the calendar entry lands on the
  // day that was actually booked.
  const startDate = sessionDateAtTime(session.session_date, times.startH, times.startM);
  const endDate   = sessionDateAtTime(session.session_date, times.endH,   times.endM);

  if (Platform.OS === 'web') {
    return addToWebCalendar(session, otherName, startDate, endDate);
  }

  return addToNativeCalendar(session, otherName, times, startDate, endDate);
}

/**
 * Returns a human-readable summary of when the next occurrence will be.
 * e.g. "Next Monday, Oct 14 · 9:00 – 9:50 AM"
 */
export function getSessionTimeLabel(sessionDate, period) {
  const times = BLOCK_TIMES[period];
  if (!times) return '';

  const fmt = (h, m) => {
    const suffix = h >= 12 ? 'PM' : 'AM';
    const h12    = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return `${h12}:${String(m).padStart(2, '0')} ${suffix}`;
  };

  const when = formatSessionDate(sessionDate);
  const time = `${fmt(times.startH, times.startM)} - ${fmt(times.endH, times.endM)}`;
  return when ? `${when} · Block ${period} · ${time}` : `Block ${period} · ${time}`;
}
