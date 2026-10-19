/**
 * schedule.js: real session dates on the block schedule.
 *
 * Dates are plain 'YYYY-MM-DD' strings in the school's local time (what the
 * database stores in sessions.session_date), so there are no time-zone
 * surprises when a date travels between the phone and Supabase.
 *
 * Block times come from the bell schedule and rotation in
 * constants/schoolCalendar.js: Block 3 is at a different time on Day 1 than
 * on Day 7, and doesn't meet at all on some days.
 *
 * Pure functions; `now` can be passed in, which keeps them testable.
 */
import {
  ORDERS, SCHOOL_DAYS, NO_SCHOOL, CALENDAR_FROM, CALENDAR_THROUGH,
} from '../constants/schoolCalendar';

// ─── What can be booked ─────────────────────────────────────────────────────
// B1–B8 are stored as 1–8. Community Time and the two lunches get the next
// numbers so they fit the same `period` column; people only ever see the
// names below.
export const CT_PERIOD      = 9;
export const LUNCH_A_PERIOD = 10;
export const LUNCH_B_PERIOD = 11;

const NAMES = {
  [CT_PERIOD]:      ['CT', 'Community Time'],
  [LUNCH_A_PERIOD]: ['A Lunch', 'A Lunch'],
  [LUNCH_B_PERIOD]: ['B Lunch', 'B Lunch'],
};

/** Chip label: "B3", "CT", "A Lunch". */
export function blockLabel(period) {
  return NAMES[period]?.[0] ?? `B${period}`;
}

/** Spelled out: "Block 3", "Community Time", "A Lunch". */
export function blockName(period) {
  return NAMES[period]?.[1] ?? `Block ${period}`;
}

/**
 * Service-hour credit for one session: a block counts as an hour, Community
 * Time as 50 minutes and a lunch as 25.
 */
export function blockMinutes(period) {
  if (period === CT_PERIOD) return 50;
  if (period === LUNCH_A_PERIOD || period === LUNCH_B_PERIOD) return 25;
  return 60;
}

export const BOOKING_WINDOW_DAYS = 28;   // matches check_new_session() in SQL

const pad = (n) => String(n).padStart(2, '0');

export function toISODate(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function fromISODate(iso) {
  const [y, m, d] = String(iso).split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

const isWeekday = (d) => d.getDay() >= 1 && d.getDay() <= 5;

// ─── The school day ─────────────────────────────────────────────────────────

/** Weekdays from `a` to `b` (both ISO dates, a <= b), counting b but not a. */
function weekdaysBetween(a, b) {
  let n = 0;
  const d = fromISODate(a);
  const end = fromISODate(b);
  while (d < end) { d.setDate(d.getDate() + 1); if (isWeekday(d)) n += 1; }
  return n;
}

/**
 * What kind of day a date is:
 *   { day: 1–8, order: 'regular' | …, guessed? }  a school day
 *   { off: 'Fall Break' }                           a weekday with no classes
 *   null                                            a weekend
 * Outside the published calendar the rotation keeps going on weekdays
 * (marked `guessed`).
 */
export function schoolDay(iso) {
  if (!iso) return null;
  const d = fromISODate(iso);
  if (!isWeekday(d)) return null;
  if (NO_SCHOOL[iso]) return { off: NO_SCHOOL[iso] };
  if (SCHOOL_DAYS[iso]) { const [day, order] = SCHOOL_DAYS[iso]; return { day, order }; }
  if (iso > CALENDAR_THROUGH) {
    const day = ((SCHOOL_DAYS[CALENDAR_THROUGH][0] - 1 + weekdaysBetween(CALENDAR_THROUGH, iso)) % 8) + 1;
    return { day, order: 'regular', guessed: true };
  }
  if (iso < CALENDAR_FROM) {
    const back = weekdaysBetween(iso, CALENDAR_FROM);
    const day = ((((SCHOOL_DAYS[CALENDAR_FROM][0] - 1 - back) % 8) + 8) % 8) + 1;
    return { day, order: 'regular', guessed: true };
  }
  return { off: 'No classes' };
}

/** The blocks that meet on a rotation day, in order (Day 2 → [6, 7, 8, 1, 2]). */
export function blocksOnDay(day) {
  return [0, 1, 2, 3, 4].map((s) => (((day - 1) * 5 + s) % 8) + 1);
}

/** [start, end] in minutes after midnight, or null when it doesn't meet that day. */
function minutesOn(iso, period) {
  const info = schoolDay(iso);
  if (!info || info.off) return null;
  const order = ORDERS[info.order] ?? ORDERS.regular;
  if (period === CT_PERIOD)      return order.ct;
  if (period === LUNCH_A_PERIOD) return order.lunchA;
  if (period === LUNCH_B_PERIOD) return order.lunchB;
  const slot = blocksOnDay(info.day).indexOf(period);
  return slot === -1 ? null : order.slots[slot];
}

const at = (iso, minutes) => {
  const d = fromISODate(iso);
  d.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
  return d;
};

/** { start, end } Dates for a block on a date, or null when it doesn't meet. */
export function blockTimes(iso, period) {
  const m = minutesOn(iso, period);
  return m ? { start: at(iso, m[0]), end: at(iso, m[1]) } : null;
}

/** When a block starts on a given date, or null when it doesn't meet then. */
export function blockStart(iso, period) {
  return blockTimes(iso, period)?.start ?? null;
}

// Formatted by hand: toLocaleTimeString spacing differs between phones and browsers.
const clock = (d) => {
  const h = d.getHours();
  return `${h % 12 || 12}:${pad(d.getMinutes())} ${h >= 12 ? 'PM' : 'AM'}`;
};

/** "10:00 AM – 11:09 AM", or '' when the block doesn't meet that day. */
export function timeRange(iso, period) {
  const t = blockTimes(iso, period);
  return t ? `${clock(t.start)} – ${clock(t.end)}` : '';
}

/**
 * The next `count` school days a session in this block could be booked on,
 * starting today: days the block actually meets, skipping today once it has
 * started.
 */
export function bookableDays({ period, count = 10, now = new Date() } = {}) {
  const days = [];
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  for (let i = 0; i <= BOOKING_WINDOW_DAYS && days.length < count; i += 1) {
    const iso = toISODate(d);
    const start = blockStart(iso, period);
    if (start && start > now) days.push(iso);
    d.setDate(d.getDate() + 1);
  }
  return days;
}

/** When this block next meets, or null if it doesn't in the next 4 weeks. */
export function nextBlockStart(period, now = new Date()) {
  const [iso] = bookableDays({ period, count: 1, now });
  return iso ? blockStart(iso, period) : null;
}

/** "Today", "Tomorrow", or "Thu, Oct 15". */
export function formatSessionDate(iso, now = new Date()) {
  if (!iso) return '';
  const today = toISODate(now);
  const t = new Date(now); t.setDate(t.getDate() + 1);
  if (iso === today) return 'Today';
  if (iso === toISODate(t)) return 'Tomorrow';
  return fromISODate(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

/** Short chip label: "Today", "Tue 14". */
export function chipLabel(iso, now = new Date()) {
  const rel = formatSessionDate(iso, now);
  if (rel === 'Today' || rel === 'Tomorrow') return rel;
  const d = fromISODate(iso);
  return `${d.toLocaleDateString('en-US', { weekday: 'short' })} ${d.getDate()}`;
}

/** "Thu, Oct 15 · Block 3" (or just "Block 3" for older undated sessions). */
export function sessionWhen(session, now = new Date()) {
  const date = session?.session_date ? formatSessionDate(session.session_date, now) : '';
  return [date, blockName(session?.period)].filter(Boolean).join(' · ');
}

/** A tutor can mark a session done on or after its date. */
export function canMarkDone(session, now = new Date()) {
  if (!session?.session_date) return true;
  return session.session_date <= toISODate(now);
}
