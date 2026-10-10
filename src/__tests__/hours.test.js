import {
  BLOCK_MINUTES, buildHoursCsv, minutesToHours, summarizeHours, taughtSessions,
} from '../utils/hours';

const ME = 'me';
const sessions = [
  { id: 'a', tutor_id: ME,      student_id: 's1', status: 'completed', subject: 'Calculus', day: 'Mon', period: 2, created_at: '2026-10-02T10:00:00Z', student: { full_name: 'Luke Patel' } },
  { id: 'b', tutor_id: ME,      student_id: 's1', status: 'completed', subject: 'SAT Math', day: 'Tue', period: 3, created_at: '2026-10-01T10:00:00Z', student: { full_name: 'Luke Patel' } },
  { id: 'c', tutor_id: ME,      student_id: 's2', status: 'completed', subject: 'Spanish, 2', period: 5, created_at: '2026-10-03T10:00:00Z', student: { full_name: 'Ana "AJ" Ruiz' } },
  { id: 'd', tutor_id: ME,      student_id: 's3', status: 'confirmed', subject: 'Biology',   period: 1 },
  { id: 'e', tutor_id: 'other', student_id: ME,   status: 'completed', subject: 'Chemistry', period: 4 },
];

describe('service hours', () => {
  test('only completed sessions this user taught count', () => {
    expect(taughtSessions(sessions, ME).map((s) => s.id)).toEqual(['a', 'b', 'c']);
  });

  test('ignores missing rows and empty input', () => {
    expect(taughtSessions([null, undefined], ME)).toEqual([]);
    expect(summarizeHours(undefined, ME)).toEqual({ sessions: 0, minutes: 0, hours: 0, students: 0 });
  });

  test('summary uses 50-minute blocks and counts distinct students', () => {
    expect(BLOCK_MINUTES).toBe(50);
    expect(summarizeHours(sessions, ME)).toEqual({ sessions: 3, minutes: 150, hours: 2.5, students: 2 });
  });

  test('minutesToHours rounds to one decimal', () => {
    expect(minutesToHours(50)).toBe(0.8);
    expect(minutesToHours(100)).toBe(1.7);
    expect(minutesToHours(0)).toBe(0);
  });

  test('CSV lists sessions oldest first with a total and escapes cells', () => {
    const csv  = buildHoursCsv(sessions, ME, 'James Smith');
    const rows = csv.split('\r\n');

    expect(rows[1]).toBe('Tutor,James Smith');
    expect(rows[3]).toBe('Date booked,Day,Block,Subject,Student,Minutes');
    expect(rows[4]).toBe('2026-10-01,Tue,3,SAT Math,Luke Patel,50');
    expect(rows[5]).toBe('2026-10-02,Mon,2,Calculus,Luke Patel,50');
    expect(rows[6]).toBe('2026-10-03,,5,"Spanish, 2","Ana ""AJ"" Ruiz",50');
    expect(csv).toContain('Total sessions,3');
    expect(csv).toContain('Total hours,2.5');
    expect(csv).not.toContain('Chemistry');
    expect(csv).not.toContain('Biology');
  });
});
