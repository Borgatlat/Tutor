/**
 * schedule.js: real session dates on the block schedule.
 *
 * Dates are plain 'YYYY-MM-DD' strings in the school's local time (what the
 * database stores in sessions.session_date), so there are no time-zone
 * surprises when a date travels between the phone and Supabase.
 *
 * Pure functions; `now` can be passed in, which keeps them testable.
 */
// ─── Block start/end times (24-hour, Strake Jesuit block schedule) ───────────
export const BLOCK_TIMES = {
  1: { startH: 8,  startM: 0,  endH: 8,  endM: 50 },
  2: { startH: 9,  startM: 0,  endH: 9,  endM: 50 },
  3: { startH: 10, startM: 0,  endH: 10, endM: 50 },
  4: { startH: 11, startM: 0,  endH: 11, endM: 50 },
  5: { startH: 12, startM: 0,  endH: 12, endM: 50 },
  6: { startH: 13, startM: 0,  endH: 13, endM: 50 },
  7: { startH: 14, startM: 0,  endH: 14, endM: 50 },
  8: { startH: 15, startM: 0,  endH: 15, endM: 50 },
};

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

/** When a block starts on a given date, or null for an unknown block. */
export function blockStart(iso, period) {
  const t = BLOCK_TIMES[period];
  if (!t || !iso) return null;
  const d = fromISODate(iso);
  d.setHours(t.startH, t.startM, 0, 0);
  return d;
}

/**
 * The next `count` school days (Mon–Fri) a session could be booked on,
 * starting today. Today is skipped once the block has already started.
 */
export function bookableDays({ period, count = 10, now = new Date() } = {}) {
  const days = [];
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  for (let i = 0; i <= BOOKING_WINDOW_DAYS && days.length < count; i += 1) {
    const iso = toISODate(d);
    const start = blockStart(iso, period);
    if (isWeekday(d) && !(i === 0 && start && start <= now)) days.push(iso);
    d.setDate(d.getDate() + 1);
  }
  return days;
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
  return [date, `Block ${session?.period}`].filter(Boolean).join(' · ');
}

/** A tutor can mark a session done on or after its date. */
export function canMarkDone(session, now = new Date()) {
  if (!session?.session_date) return true;
  return session.session_date <= toISODate(now);
}
