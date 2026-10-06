/**
 * shareInvite - hand someone a link to the app.
 *
 * Web is the primary target here and react-native-web does NOT implement RN's
 * Share, so this branches on platform the same way utils/calendar.js does:
 *
 *   native  -> Share.share, the real OS share sheet
 *   web     -> navigator.share when the browser has it (phones), otherwise
 *              copy to the clipboard
 *
 * Returns { ok, method } so the caller can say the right thing:
 *   method 'shared' -> the share sheet handled it, no toast needed
 *   method 'copied' -> nothing visible happened, so the caller MUST toast
 */
import { Platform, Share } from 'react-native';
import { APP_URL } from '../constants/legal';

const MESSAGE = 'Come tutor on Strake Jesuit Tutors - peer tutoring for Crusaders, by Crusaders.';

/** The address to hand out. On web that is wherever the app is actually served. */
export function inviteUrl() {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  return APP_URL;
}

/** Last resort for browsers without the async clipboard API (and non-secure origins). */
function legacyCopy(text) {
  try {
    const el = document.createElement('textarea');
    el.value = text;
    el.setAttribute('readonly', '');
    el.style.position = 'fixed';
    el.style.opacity = '0';
    document.body.appendChild(el);
    el.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(el);
    return ok;
  } catch {
    return false;
  }
}

export async function shareInvite() {
  const url  = inviteUrl();
  const text = `${MESSAGE} ${url}`;

  if (Platform.OS !== 'web') {
    try {
      const res = await Share.share({ message: text, url });
      return { ok: res.action !== Share.dismissedAction, method: 'shared' };
    } catch {
      return { ok: false, method: 'shared' };
    }
  }

  // ── Web ───────────────────────────────────────────────────────────────────
  // navigator.share only exists on most mobile browsers, and only over https.
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({ title: 'Strake Jesuit Tutors', text: MESSAGE, url });
      return { ok: true, method: 'shared' };
    } catch (e) {
      // AbortError just means they closed the sheet; that is not a failure.
      if (e?.name === 'AbortError') return { ok: false, method: 'shared' };
      // Anything else: fall through and copy instead.
    }
  }

  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(url);
      return { ok: true, method: 'copied' };
    } catch {
      // Permission denied or insecure origin - fall through.
    }
  }

  return { ok: legacyCopy(url), method: 'copied' };
}

export default shareInvite;
