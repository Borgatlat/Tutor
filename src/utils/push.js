/**
 * push.js: register this phone for push notifications.
 *
 * The database sends the notifications itself (supabase migration 002:
 * send_push / notify_* triggers via Expo's push service). The app's only jobs
 * are to store this device's Expo push token for the signed-in user, remove it
 * on sign-out, and open the right screen when a notification is tapped.
 *
 * Needs an EAS project id (app.json → extra.eas.projectId, set by `eas init`).
 * Without one, or on web / a simulator, registration quietly does nothing.
 */
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { supabase } from '../lib/supabase';
import colors from '../theme/colors';

let currentToken = null;

const projectId = () =>
  Constants?.expoConfig?.extra?.eas?.projectId || Constants?.easConfig?.projectId || null;

export async function registerForPush(userId) {
  if (Platform.OS === 'web' || !userId || !projectId()) return null;
  try {
    const Notifications = await import('expo-notifications');

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Tutoring',
        importance: Notifications.AndroidImportance.HIGH,
        lightColor: colors.gold,
      });
    }

    let { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') ({ status } = await Notifications.requestPermissionsAsync());
    if (status !== 'granted') return null;

    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId: projectId() });
    if (!token) return null;
    currentToken = token;
    await supabase.from('push_tokens').upsert(
      { user_id: userId, token, platform: Platform.OS, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,token' },
    );
    return token;
  } catch (e) {
    if (__DEV__) console.warn('[push] register:', e?.message);
    return null;
  }
}

/** Call before signing out so this phone stops getting that account's pushes. */
export async function unregisterPush(userId) {
  if (!currentToken || !userId) return;
  try {
    await supabase.from('push_tokens').delete().eq('user_id', userId).eq('token', currentToken);
  } catch (e) {
    if (__DEV__) console.warn('[push] unregister:', e?.message);
  }
  currentToken = null;
}

/**
 * Open the right screen when a notification is tapped:
 * a message → that session's chat, anything else → Sessions.
 * Returns an unsubscribe function.
 */
export function onNotificationTap(navigate) {
  if (Platform.OS === 'web') return () => {};
  let sub;
  import('expo-notifications').then((Notifications) => {
    sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response?.notification?.request?.content?.data ?? {};
      if (data.type === 'message' && data.sessionId) {
        navigate('Sessions', { screen: 'Chat', params: { sessionId: data.sessionId } });
      } else {
        navigate('Sessions', { screen: 'SessionsMain' });
      }
    });
  }).catch(() => {});
  return () => sub?.remove?.();
}
