/**
 * schoolCalendar.js: Strake Jesuit's bell schedule and rotation.
 *
 * Strake runs an 8-day rotation. Each school day is "Day 1" … "Day 8" and
 * meets 5 of the 8 blocks, in this order:
 *
 *   Day 1: B1 B2 B3 B4 B5      Day 5: B5 B6 B7 B8 B1
 *   Day 2: B6 B7 B8 B1 B2      Day 6: B2 B3 B4 B5 B6
 *   Day 3: B3 B4 B5 B6 B7      Day 7: B7 B8 B1 B2 B3
 *   Day 4: B8 B1 B2 B3 B4      Day 8: B4 B5 B6 B7 B8
 *
 * (block in slot s on day d = ((d - 1) * 5 + s - 1) % 8 + 1)
 *
 * Holidays and service days don't use up a day number, so the actual dates are
 * listed below from the school calendar. To add next semester, add its dates
 * to SCHOOL_DAYS and NO_SCHOOL and move CALENDAR_THROUGH forward. Past that
 * date the app keeps the rotation going on weekdays (Regular Order) as a guess.
 */

const t = (h, m) => h * 60 + m;   // minutes after midnight

/**
 * Times for each kind of day. `slots` are the five class slots in order.
 * `ct` is Community Time (only on Regular Order days). A Lunch is the start of
 * the third slot and B Lunch the gap after it; students with A Lunch have
 * their third class after lunch.
 */
export const ORDERS = {
  regular: {
    label: 'Regular Order',
    slots: [[t(8, 0), t(9, 9)], [t(10, 0), t(11, 9)], [t(11, 10), t(12, 20)], [t(12, 45), t(13, 54)], [t(13, 55), t(15, 5)]],
    ct: [t(9, 10), t(10, 0)],
    lunchA: [t(11, 10), t(11, 35)],
    lunchB: [t(12, 20), t(12, 45)],
  },
  lateStart: {
    label: 'Late Start Order',
    slots: [[t(9, 15), t(10, 19)], [t(10, 20), t(11, 24)], [t(11, 25), t(12, 29)], [t(12, 55), t(13, 59)], [t(14, 0), t(15, 5)]],
    ct: null,
    lunchA: [t(11, 25), t(11, 50)],
    lunchB: [t(12, 30), t(12, 55)],
  },
  assembly: {
    label: 'Morning Assembly Order',
    slots: [[t(8, 0), t(9, 4)], [t(10, 20), t(11, 24)], [t(11, 25), t(12, 29)], [t(12, 55), t(13, 59)], [t(14, 0), t(15, 5)]],
    ct: null,
    lunchA: [t(11, 25), t(11, 50)],
    lunchB: [t(12, 30), t(12, 55)],
  },
  earlyDismissal: {
    label: 'Early Dismissal Order',
    slots: [[t(8, 0), t(9, 4)], [t(9, 5), t(10, 9)], [t(10, 10), t(11, 14)], [t(11, 40), t(12, 44)], [t(12, 45), t(13, 40)]],
    ct: null,
    lunchA: [t(10, 10), t(10, 35)],
    lunchB: [t(11, 15), t(11, 40)],
  },
};

/** Rotation day and kind of day for every school day on the calendar. */
const R = 'regular', L = 'lateStart', A = 'assembly', E = 'earlyDismissal';
export const SCHOOL_DAYS = {
  '2026-10-05': [1, R], '2026-10-06': [2, R], '2026-10-07': [3, A], '2026-10-08': [4, R], '2026-10-09': [5, R],
  '2026-10-19': [6, R], '2026-10-20': [7, R], '2026-10-22': [8, R], '2026-10-23': [1, R],
  '2026-10-26': [2, L], '2026-10-27': [3, R], '2026-10-29': [4, R], '2026-10-30': [5, A],
  '2026-11-02': [6, A], '2026-11-03': [7, R], '2026-11-04': [8, R], '2026-11-05': [1, R], '2026-11-06': [2, R],
  '2026-11-09': [3, R], '2026-11-11': [4, E], '2026-11-12': [5, R], '2026-11-13': [6, L],
  '2026-11-16': [7, R], '2026-11-17': [8, R], '2026-11-18': [1, A], '2026-11-19': [2, R], '2026-11-20': [3, E],
  '2026-11-30': [4, R], '2026-12-01': [5, R], '2026-12-02': [6, R], '2026-12-03': [7, E], '2026-12-04': [8, L],
  '2026-12-07': [1, R], '2026-12-08': [2, A], '2026-12-09': [3, R], '2026-12-10': [4, R],
  '2026-12-11': [5, R],   // "Special Order": exact times not published yet, Regular used
};

/** Weekdays with no in-person classes. */
export const NO_SCHOOL = {
  '2026-10-12': 'Fall Break', '2026-10-13': 'Fall Break', '2026-10-14': 'Fall Break',
  '2026-10-15': 'Fall Break', '2026-10-16': 'Fall Break',
  '2026-10-21': 'PSAT and Career Day',
  '2026-10-28': 'Asynchronous day (Regis Service Day)',
  '2026-11-10': 'Asynchronous day (Xavier Service Day)',
  '2026-11-23': 'Thanksgiving Break', '2026-11-24': 'Thanksgiving Break', '2026-11-25': 'Thanksgiving Break',
  '2026-11-26': 'Thanksgiving Break', '2026-11-27': 'Thanksgiving Break',
};

export const CALENDAR_FROM    = '2026-10-05';
export const CALENDAR_THROUGH = '2026-12-11';
