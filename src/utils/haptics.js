/**
 * haptics.js: small, consistent vibration feedback on iPhone and Android.
 * Every call is fire-and-forget and a no-op on web (and on devices without a
 * haptic engine), so callers never need to guard or await it.
 */
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

const native = Platform.OS === 'ios' || Platform.OS === 'android';
const quiet = (p) => { p?.catch?.(() => {}); };

/** A light tick for ordinary taps (buttons, chips, tabs). */
export function tap() {
  if (native) quiet(Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
}

/** Selection changed (switches, segmented controls). */
export function select() {
  if (native) quiet(Haptics.selectionAsync());
}

/** Something good happened (booked, confirmed, marked done). */
export function success() {
  if (native) quiet(Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
}

/** Something failed. */
export function warn() {
  if (native) quiet(Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error));
}
