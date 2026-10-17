import { nextSessionStart, getSessionTimeLabel } from '../utils/calendar';
import { reminderTime, REMINDER_MINUTES_BEFORE } from '../utils/reminders';

const S = require('../utils/schedule');
const { BLOCKS } = require('../constants');

// Fixed "now" so the rotation maths is deterministic.
const at = (iso) => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date(iso));
};
afterEach(() => jest.useRealTimers());
const hm = (d) => [d.getHours(), d.getMinutes()];

describe('8-day rotation', () => {
  test('each day meets five blocks in order', () => {
    expect(S.blocksOnDay(1)).toEqual([1, 2, 3, 4, 5]);
    expect(S.blocksOnDay(2)).toEqual([6, 7, 8, 1, 2]);
    expect(S.blocksOnDay(7)).toEqual([7, 8, 1, 2, 3]);
    expect(S.blocksOnDay(8)).toEqual([4, 5, 6, 7, 8]);
  });

  test('dates come from the school calendar', () => {
    expect(S.schoolDay('2026-10-20')).toEqual({ day: 7, order: 'regular' });
    expect(S.schoolDay('2026-10-26')).toEqual({ day: 2, order: 'lateStart' });
    expect(S.schoolDay('2026-10-21')).toEqual({ off: 'PSAT and Career Day' });
    expect(S.schoolDay('2026-11-25')).toEqual({ off: 'Thanksgiving Break' });
    expect(S.schoolDay('2026-10-24')).toBeNull(); // Saturday
  });

  test('past the published calendar the rotation keeps going on weekdays', () => {
    expect(S.schoolDay('2026-12-14')).toEqual({ day: 6, order: 'regular', guessed: true });
    expect(S.schoolDay('2026-12-18').day).toBe(2);
  });
});

describe('block times (from the real calendar)', () => {
  test('Regular Order: a block lands in its slot for the day', () => {
    // Tue Oct 20 is Day 7: B7 B8 B1 B2 B3
    expect(hm(S.blockStart('2026-10-20', 7))).toEqual([8, 0]);
    expect(hm(S.blockStart('2026-10-20', 1))).toEqual([11, 10]);
    expect(S.timeRange('2026-10-20', 3)).toBe('1:55 PM – 3:05 PM');
    expect(S.blockStart('2026-10-20', 5)).toBeNull(); // B5 doesn't meet on Day 7
  });

  test('Late Start, Morning Assembly and Early Dismissal times', () => {
    expect(S.timeRange('2026-10-26', 6)).toBe('9:15 AM – 10:19 AM');  // Day 2 late start
    expect(S.timeRange('2026-10-30', 7)).toBe('11:25 AM – 12:29 PM'); // Day 5 assembly
    expect(S.timeRange('2026-11-11', 4)).toBe('12:45 PM – 1:40 PM');  // Day 4 early dismissal
  });

  test('nothing meets on a day off', () => {
    expect(S.blockStart('2026-10-21', 1)).toBeNull();
    expect(S.blockStart('2026-10-21', S.CT_PERIOD)).toBeNull();
  });

  test('labels', () => {
    expect(getSessionTimeLabel('2026-10-22', 7)).toBe('Block 7 · 12:45 PM – 1:54 PM');
    expect(getSessionTimeLabel('2026-10-22', 1)).toBe(''); // B1 is off on Day 8
    expect(getSessionTimeLabel(null, 3)).toBe('');
  });
});

describe('Community Time and lunch', () => {
  test('sit in the free-time row as CT (between B1 and B2), A Lunch and B Lunch', () => {
    expect(BLOCKS.map(S.blockLabel)).toEqual(['B1', 'CT', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8', 'A Lunch', 'B Lunch']);
    expect(S.blockName(S.CT_PERIOD)).toBe('Community Time');
    expect(S.blockName(S.LUNCH_B_PERIOD)).toBe('B Lunch');
    expect(S.blockName(3)).toBe('Block 3');
  });

  test('CT is 9:10 to 10:00 on Regular Order days only', () => {
    expect(S.timeRange('2026-10-20', S.CT_PERIOD)).toBe('9:10 AM – 10:00 AM');
    expect(S.blockStart('2026-10-26', S.CT_PERIOD)).toBeNull(); // late start
  });

  test('lunch times', () => {
    expect(S.timeRange('2026-10-20', S.LUNCH_A_PERIOD)).toBe('11:10 AM – 11:35 AM');
    expect(S.timeRange('2026-10-20', S.LUNCH_B_PERIOD)).toBe('12:20 PM – 12:45 PM');
  });

  test('service hours: an hour per block, 50 minutes for CT, 25 for lunch', () => {
    const { buildHoursCsv, summarizeHours } = require('../utils/hours');
    expect([S.blockMinutes(3), S.blockMinutes(S.CT_PERIOD), S.blockMinutes(S.LUNCH_A_PERIOD)]).toEqual([60, 50, 25]);
    const sessions = [
      { status: 'completed', tutor_id: 't', student_id: 's', period: 9, session_date: '2026-10-20' },
      { status: 'completed', tutor_id: 't', student_id: 's', period: 3, session_date: '2026-10-22' },
    ];
    expect(summarizeHours(sessions, 't').minutes).toBe(110);
    expect(buildHoursCsv(sessions, 't')).toContain('2026-10-20,Tue,CT,');
  });
});

describe('booking dates', () => {
  const NOW = new Date(2026, 9, 19, 12, 0); // Mon Oct 19 (Day 6), noon

  test('only school days the block meets, skipping one that already started', () => {
    // B3 meets Day 6 at 10:00 (already passed), then Day 7, Day 1 (Oct 23), Day 3 (Oct 27)…
    expect(S.bookableDays({ period: 3, count: 3, now: NOW })).toEqual(['2026-10-20', '2026-10-23', '2026-10-27']);
    // PSAT day (Oct 21) is never offered
    expect(S.bookableDays({ period: S.CT_PERIOD, count: 3, now: NOW })).toEqual(['2026-10-20', '2026-10-22', '2026-10-23']);
  });

  test('friendly labels', () => {
    expect(S.formatSessionDate('2026-10-19', NOW)).toBe('Today');
    expect(S.formatSessionDate('2026-10-20', NOW)).toBe('Tomorrow');
    expect(S.formatSessionDate('2026-10-22', NOW)).toBe('Thu, Oct 22');
    expect(S.chipLabel('2026-10-27', NOW)).toBe('Tue 27');
    expect(S.sessionWhen({ session_date: '2026-10-22', period: 9 }, NOW)).toBe('Thu, Oct 22 · Community Time');
    expect(S.sessionWhen({ period: 3 }, NOW)).toBe('Block 3');
  });

  test('done only on or after the date', () => {
    expect(S.canMarkDone({ session_date: '2026-10-19' }, NOW)).toBe(true);
    expect(S.canMarkDone({ session_date: '2026-10-20' }, NOW)).toBe(false);
    expect(S.canMarkDone({}, NOW)).toBe(true);
  });

  test('undated sessions use the next time the block meets', () => {
    at('2026-10-19T12:00:00');
    const d = nextSessionStart(3);
    expect([d.getDate(), ...hm(d)]).toEqual([20, 13, 55]);
    expect(nextSessionStart(42)).toBeNull();
  });
});

describe('reminders', () => {
  test(`fire ${REMINDER_MINUTES_BEFORE} minutes before the block on its date`, () => {
    const r = reminderTime({ session_date: '2026-10-20', period: 7 }, new Date(2026, 9, 19));
    expect([r.getDate(), ...hm(r)]).toEqual([20, 7, 50]);
  });

  test('none for an unknown block or a past one', () => {
    expect(reminderTime({ period: 42 })).toBeNull();
    expect(reminderTime(null)).toBeNull();
    expect(reminderTime({ session_date: '2026-10-20', period: 7 }, new Date(2026, 9, 21))).toBeNull();
  });
});
