/**
 * invite.js: share the app with a friend.
 *
 *  - iPhone / Android: the system share sheet (Messages, email, Instagram…)
 *  - Web: the browser share sheet where supported, otherwise copy the link
 *
 * Resolves to 'shared' | 'copied' | 'cancelled' | 'failed'.
 */
import { Platform, Share } from 'react-native';
import { school } from '../theme/school';

export function inviteLink() {
  if (Platform.OS === 'web' && typeof window !== 'undefined') return window.location.origin;
  return school.appUrl;
}

export function inviteMessage(isTutor) {
  return isTutor
    ? `I'm tutoring on ${school.appName}. Book a free block with me or find another ${school.memberName} who can help: ${inviteLink()}`
    : `I'm using ${school.appName} to get help from other ${school.memberPlural}. Join me: ${inviteLink()}`;
}

// For an empty search: ask someone who's good at a class to start tutoring.
export function recruitMessage(subject) {
  const what = subject ? `good at ${subject}` : 'good at a class';
  return `Are you ${what}? Tutor other ${school.memberPlural} on ${school.appName} during your free blocks and earn service hours: ${inviteLink()}`;
}

/**
 * kind: 'friend' (default) invites someone to use the app,
 *       'recruit' asks someone to sign up as a tutor (optionally for `subject`).
 */
export async function shareInvite(isTutor, { kind = 'friend', subject } = {}) {
  const message = kind === 'recruit' ? recruitMessage(subject) : inviteMessage(isTutor);
  try {
    if (Platform.OS !== 'web') {
      const r = await Share.share({ message });
      return r.action === Share.dismissedAction ? 'cancelled' : 'shared';
    }
    if (navigator.share) {
      await navigator.share({ title: `${school.appName}`, text: message });
      return 'shared';
    }
    await navigator.clipboard.writeText(message);
    return 'copied';
  } catch (e) {
    return e?.name === 'AbortError' ? 'cancelled' : 'failed';
  }
}
