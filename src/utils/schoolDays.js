/**
 * School-day helpers.
 *
 * A booking is a specific date plus a block, so everything that picks or shows
 * a session date goes through here. Dates are handled as local-time Date
 * objects and serialised as plain YYYY-MM-DD, which is what `sessions.session_date`
 * (a Postgres `date`) stores - no timezone, no drift.
 */

const WEEKDAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH   = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** YYYY-MM-DD in LOCAL time. toISOString() would shift the day in US timezones. */
export function toDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Parse YYYY-MM-DD back to a local-midnight Date (not UTC). */
export function fromDateKey(key) {
  if (!key) return null;
  const [y, m, d] = String(key).split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

/** The next `count` weekdays starting today, as Date objects. */
export function upcomingSchoolDays(count = 15) {
  const out = [];
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  while (out.length < count) {
    const dow = cursor.getDay();
    if (dow !== 0 && dow !== 6) out.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return out;
}

/** "Today", "Tomorrow", or "Tue, Oct 20". */
export function formatSessionDate(value) {
  const date = value instanceof Date ? value : fromDateKey(value);
  if (!date) return '';

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);

  const diffDays = Math.round((target - today) / 86400000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';

  return `${WEEKDAY[target.getDay()]}, ${MONTH[target.getMonth()]} ${target.getDate()}`;
}

/** Short two-line form for the date chips: { dow: 'Tue', day: '20' }. */
export function dateChipParts(date) {
  return { dow: WEEKDAY[date.getDay()], day: String(date.getDate()) };
}

/** True when the session date is in the past (used to sort/!filter upcoming). */
export function isPastDate(value) {
  const date = value instanceof Date ? value : fromDateKey(value);
  if (!date) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
}
