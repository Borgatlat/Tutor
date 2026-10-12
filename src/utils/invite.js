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
    ? `I'm tutoring on ${school.name} Tutors. Book a free block with me or find another ${school.memberName} who can help: ${inviteLink()}`
    : `I'm using ${school.name} Tutors to get help from other ${school.memberPlural}. Join me: ${inviteLink()}`;
}

export async function shareInvite(isTutor) {
  const message = inviteMessage(isTutor);
  try {
    if (Platform.OS !== 'web') {
      const r = await Share.share({ message });
      return r.action === Share.dismissedAction ? 'cancelled' : 'shared';
    }
    if (navigator.share) {
      await navigator.share({ title: `${school.name} Tutors`, text: message });
      return 'shared';
    }
    await navigator.clipboard.writeText(message);
    return 'copied';
  } catch (e) {
    return e?.name === 'AbortError' ? 'cancelled' : 'failed';
  }
}
