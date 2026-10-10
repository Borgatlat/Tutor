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
    expect(nextSessionStart(9)).toBeNull();
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
