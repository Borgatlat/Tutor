/**
 * hours.js: service-hours log for tutors.
 *
 * Many schools ask tutors to log volunteer / NHS hours. Every completed session
 * a tutor taught counts as one block. Blocks are 50 minutes (see BLOCK_TIMES in
 * calendar.js), so hours are always derived, never typed in, and can't drift
 * from the session history.
 *
 * Pure functions only: no Supabase or React here, so they are unit-tested.
 */
import { school } from '../theme/school';

export const BLOCK_MINUTES = 50;

/** Completed sessions this user taught (not ones they attended as a student). */
export function taughtSessions(sessions = [], tutorId) {
  return sessions.filter((s) => s && s.status === 'completed' && s.tutor_id === tutorId);
}

/** Total minutes → hours, rounded to one decimal place (e.g. 4.2). */
export function minutesToHours(minutes) {
  return Math.round((minutes / 60) * 10) / 10;
}

/**
 * Summary for the Profile card.
 * @returns {{ sessions, minutes, hours, students, verifiedSessions, verifiedHours }}
 */
export function summarizeHours(sessions, tutorId) {
  const taught   = taughtSessions(sessions, tutorId);
  const minutes  = taught.length * BLOCK_MINUTES;
  const students = new Set(taught.map((s) => s.student_id)).size;
  const verified = taught.filter((s) => s.verified_at).length;
  return {
    sessions: taught.length, minutes, hours: minutesToHours(minutes), students,
    verifiedSessions: verified, verifiedHours: minutesToHours(verified * BLOCK_MINUTES),
  };
}

/** The session's date (older rows without one use the day they were booked). */
function sessionDay(s) {
  return s.session_date ?? (s.created_at ? String(s.created_at).slice(0, 10) : '');
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
function weekday(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return DAYS[new Date(y, m - 1, d).getDay()];
}

/** Quote a CSV cell when it contains a comma, quote or newline. */
function csvCell(value) {
  const s = String(value ?? '');
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/**
 * The downloadable log a moderator can check and sign: one row per completed
 * session, then a total row.
 */
export function buildHoursCsv(sessions, tutorId, tutorName = '') {
  const taught = taughtSessions(sessions, tutorId)
    .slice()
    .sort((a, b) => sessionDay(a).localeCompare(sessionDay(b)));

  const rows = [
    [`${school.name} peer tutoring: service hours`],
    ['Tutor', tutorName],
    [],
    ['Date', 'Day', 'Block', 'Subject', 'Student', 'Minutes', 'Verified'],
    ...taught.map((s) => [
      sessionDay(s),
      s.session_date ? weekday(s.session_date) : (s.day ?? ''),
      s.period ?? '',
      s.subject ?? '',
      s.student?.full_name ?? '',
      BLOCK_MINUTES,
      s.verified_at ? 'Yes' : '',
    ]),
    [],
    ['Total sessions', taught.length],
    ['Total hours', minutesToHours(taught.length * BLOCK_MINUTES)],
    ['Verified hours', minutesToHours(taught.filter((s) => s.verified_at).length * BLOCK_MINUTES)],
    [],
    ['Moderator signature', ''],
  ];

  return rows.map((r) => r.map(csvCell).join(',')).join('\r\n');
}
