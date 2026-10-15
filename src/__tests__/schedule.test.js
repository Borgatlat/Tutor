import { nextSessionStart, getSessionTimeLabel } from '../utils/calendar';
import { reminderTime, REMINDER_MINUTES_BEFORE } from '../utils/reminders';

// Fixed "now" so weekday maths is deterministic.
const at = (iso) => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date(iso));
};
afterEach(() => jest.useRealTimers());

describe('block schedule', () => {
  test('next start is later today when the block has not begun', () => {
    at('2026-10-07T08:30:00'); // Wednesday 8:30
    const d = nextSessionStart(3); // block 3 starts 10:00
    expect([d.getDay(), d.getHours(), d.getMinutes()]).toEqual([3, 10, 0]);
  });

  test('a block already passed moves to the next weekday', () => {
    at('2026-10-07T11:00:00'); // Wednesday 11:00
    const d = nextSessionStart(3);
    expect([d.getDay(), d.getHours()]).toEqual([4, 10]); // Thursday
  });

  test('Friday afternoon and weekends roll to Monday', () => {
    at('2026-10-09T16:00:00'); // Friday 16:00
    expect(nextSessionStart(1).getDay()).toBe(1);
    at('2026-10-10T09:00:00'); // Saturday
    expect(nextSessionStart(1).getDay()).toBe(1);
  });

  test('unknown blocks give null / empty label', () => {
    expect(nextSessionStart(10)).toBeNull();
    expect(getSessionTimeLabel('Mon', 0)).toBe('');
  });

  test('time label for a block', () => {
    expect(getSessionTimeLabel('Mon', 6)).toBe('Block 6 · 1:00 PM – 1:50 PM');
  });
});

describe('reminders', () => {
  test(`fire ${REMINDER_MINUTES_BEFORE} minutes before the block`, () => {
    at('2026-10-07T08:00:00');
    const r = reminderTime({ period: 2 }); // 9:00 start
    expect([r.getHours(), r.getMinutes()]).toEqual([8, 50]);
  });

  test('none for an unknown block', () => {
    expect(reminderTime({ period: 42 })).toBeNull();
    expect(reminderTime(null)).toBeNull();
  });
});

describe('real session dates', () => {
  const S = require('../utils/schedule');
  const NOW = new Date(2026, 9, 9, 11, 0); // Friday Oct 9, 11:00

  test('bookable days skip weekends and a block that already started today', () => {
    expect(S.bookableDays({ period: 3, count: 3, now: NOW })).toEqual(['2026-10-12', '2026-10-13', '2026-10-14']);
    expect(S.bookableDays({ period: 6, count: 2, now: NOW })).toEqual(['2026-10-09', '2026-10-12']);
  });

  test('never offers more than the booking window', () => {
    expect(S.bookableDays({ period: 1, count: 100, now: NOW }).length).toBe(20); // 4 weeks of school days
  });

  test('friendly labels', () => {
    expect(S.formatSessionDate('2026-10-09', NOW)).toBe('Today');
    expect(S.formatSessionDate('2026-10-10', NOW)).toBe('Tomorrow');
    expect(S.formatSessionDate('2026-10-15', NOW)).toBe('Thu, Oct 15');
    expect(S.chipLabel('2026-10-13', NOW)).toBe('Tue 13');
    expect(S.sessionWhen({ session_date: '2026-10-15', period: 3 }, NOW)).toBe('Thu, Oct 15 · Block 3');
    expect(S.sessionWhen({ period: 3 }, NOW)).toBe('Block 3');
  });

  test('block start uses the real date', () => {
    const d = S.blockStart('2026-10-15', 2);
    expect([d.getMonth(), d.getDate(), d.getHours()]).toEqual([9, 15, 9]);
  });

  test('done only on or after the date', () => {
    expect(S.canMarkDone({ session_date: '2026-10-09' }, NOW)).toBe(true);
    expect(S.canMarkDone({ session_date: '2026-10-12' }, NOW)).toBe(false);
    expect(S.canMarkDone({}, NOW)).toBe(true);
  });
});

describe('reminders use the real date', () => {
  const { reminderTime } = require('../utils/reminders');
  test('10 minutes before the dated block', () => {
    const r = reminderTime({ session_date: '2099-03-02', period: 4 }, new Date(2099, 2, 1));
    expect([r.getDate(), r.getHours(), r.getMinutes()]).toEqual([2, 10, 50]);
  });
});

describe('Community Time (CT)', () => {
  const S = require('../utils/schedule');
  const { buildHoursCsv, summarizeHours } = require('../utils/hours');
  const { BLOCKS } = require('../constants');

  test('is a free block between B1 and B2, labelled CT', () => {
    expect(BLOCKS).toContain(S.CT_PERIOD);
    expect(BLOCKS.map(S.blockLabel)).toEqual(['B1', 'CT', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8']);
    expect(S.blockName(S.CT_PERIOD)).toBe('Community Time');
    expect(S.blockName(3)).toBe('Block 3');
  });

  test('runs 9:10 to 9:50 on weekdays', () => {
    expect(getSessionTimeLabel(null, S.CT_PERIOD)).toBe('Community Time · 9:10 AM – 9:50 AM');
    const d = S.blockStart('2026-10-15', S.CT_PERIOD);
    expect([d.getHours(), d.getMinutes()]).toEqual([9, 10]);
    at('2026-10-09T16:00:00'); // Friday afternoon
    const next = nextSessionStart(S.CT_PERIOD);
    expect([next.getDay(), next.getHours(), next.getMinutes()]).toEqual([1, 9, 10]);
  });

  test('shows as CT in session labels and counts 40 minutes of service', () => {
    expect(S.sessionWhen({ session_date: '2026-10-15', period: 9 }, new Date(2026, 9, 9))).toBe('Thu, Oct 15 · Community Time');
    expect(S.blockMinutes(S.CT_PERIOD)).toBe(40);
    const sessions = [
      { status: 'completed', tutor_id: 't', student_id: 's', period: 9, session_date: '2026-10-14' },
      { status: 'completed', tutor_id: 't', student_id: 's', period: 3, session_date: '2026-10-15' },
    ];
    expect(summarizeHours(sessions, 't').minutes).toBe(90);
    expect(buildHoursCsv(sessions, 't')).toContain('2026-10-14,Wed,CT,');
  });
});
