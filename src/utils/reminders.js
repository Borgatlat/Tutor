/**
 * reminders.js — local "your session starts soon" notifications.
 *
 * Native only (iOS / Android); a no-op on web, where the .ics calendar file
 * carries its own alarms. Reminders are rebuilt from the confirmed-session
 * list each time it loads, so a cancelled or completed session never leaves a
 * stale reminder behind.
 */
import { Platform } from 'react-native';
import { nextSessionStart } from './calendar';

export const REMINDER_MINUTES_BEFORE = 10;
const KIND = 'session-reminder';

/** When to fire for a session, or null if that moment has already passed. */
export function reminderTime(session, now = new Date()) {
  const start = nextSessionStart(session?.period);
  if (!start) return null;
  const at = new Date(start.getTime() - REMINDER_MINUTES_BEFORE * 60 * 1000);
  return at > now ? at : null;
}

export async function syncSessionReminders(sessions = [], currentUserId) {
  if (Platform.OS === 'web') return { scheduled: 0 };

  const Notifications = await import('expo-notifications');

  // Show the banner even if the app is open when the reminder fires.
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true, shouldPlaySound: true, shouldSetBadge: false,
    }),
  });
  const confirmed = sessions.filter((s) => s?.status === 'confirmed');

  // Clear our own earlier reminders (leave anything else alone).
  const existing = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    existing
      .filter((n) => n.content?.data?.kind === KIND)
      .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
  );

  if (!confirmed.length) return { scheduled: 0 };

  // Only ask for permission once there's something worth reminding about.
  let { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') {
    ({ status } = await Notifications.requestPermissionsAsync());
  }
  if (status !== 'granted') return { scheduled: 0 };

  let scheduled = 0;
  for (const s of confirmed) {
    const at = reminderTime(s);
    if (!at) continue;
    const other = s.tutor_id === currentUserId ? s.student : s.tutor;
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `Tutoring in ${REMINDER_MINUTES_BEFORE} minutes`,
        body: `${s.subject} with ${other?.full_name ?? 'your partner'} · Block ${s.period}`,
        data: { kind: KIND, sessionId: s.id },
      },
      trigger: { date: at },
    });
    scheduled += 1;
  }
  return { scheduled };
}
