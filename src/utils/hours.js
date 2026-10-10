/**
 * hours.js — service-hours log for tutors.
 *
 * Many schools ask tutors to log volunteer / NHS hours. Every completed session
 * a tutor taught counts as one block. Blocks are 50 minutes (see BLOCK_TIMES in
 * calendar.js), so hours are always derived, never typed in, and can't drift
 * from the session history.
 *
 * Pure functions only — no Supabase or React here — so they are unit-tested.
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
 * @returns {{ sessions: number, minutes: number, hours: number, students: number }}
 */
export function summarizeHours(sessions, tutorId) {
  const taught   = taughtSessions(sessions, tutorId);
  const minutes  = taught.length * BLOCK_MINUTES;
  const students = new Set(taught.map((s) => s.student_id)).size;
  return { sessions: taught.length, minutes, hours: minutesToHours(minutes), students };
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
    .sort((a, b) => String(a.created_at ?? '').localeCompare(String(b.created_at ?? '')));

  const rows = [
    [`${school.name} peer tutoring — service hours`],
    ['Tutor', tutorName],
    [],
    ['Date booked', 'Day', 'Block', 'Subject', 'Student', 'Minutes'],
    ...taught.map((s) => [
      s.created_at ? String(s.created_at).slice(0, 10) : '',
      s.day ?? '',
      s.period ?? '',
      s.subject ?? '',
      s.student?.full_name ?? '',
      BLOCK_MINUTES,
    ]),
    [],
    ['Total sessions', taught.length],
    ['Total hours', minutesToHours(taught.length * BLOCK_MINUTES)],
    [],
    ['Moderator signature', ''],
  ];

  return rows.map((r) => r.map(csvCell).join(',')).join('\r\n');
}
