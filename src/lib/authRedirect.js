import { Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * Where Supabase should send the user after they tap a confirm / reset link.
 *
 * Think of this like a "return address" stamped on the email:
 * - On the website, we send them back to the same origin they signed up from
 *   (e.g. https://tutor-delta-one.vercel.app/).
 * - On iPhone/Android, we use the app's custom URL scheme from app.json
 *   (strakejesuittutors://…) so the OS can open our app instead of a browser.
 *
 * If you changed this to a random URL that is NOT on the Supabase
 * "Redirect URLs" allowlist, Auth would refuse to put that URL in the email
 * (or the link would fail after click). Always keep dashboard allowlist in sync.
 */
export function authEmailRedirectTo() {
  // Platform.OS === 'web' means we are running in a browser (react-native-web).
  // typeof window !== 'undefined' guards Node/test environments with no DOM.
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location?.origin) {
    // Trailing slash keeps the path stable for SPA rewrites (vercel.json).
    return `${window.location.origin}/`;
  }

  // expoConfig.scheme comes from app.json → "scheme": "strakejesuittutors"
  // The ?? operator means: use the left side if it is not null/undefined,
  // otherwise fall back to the hardcoded string.
  const scheme = Constants.expoConfig?.scheme ?? 'strakejesuittutors';
  return `${scheme}://auth/callback`;
}

/**
 * Turn raw Auth/mailer failures into a sentence a student can act on.
 * Returns null when the message is unrelated, so callers can keep the original.
 */
export function friendlyAuthEmailError(message) {
  if (!message) return null;
  // /i makes the regex case-insensitive ("Error" and "error" both match).
  if (/confirmation email|sending confirmation|error sending/i.test(message)) {
    return (
      'We could not send the confirmation email from the server. '
      + 'Please try again in a few minutes. If it keeps failing, an admin needs to '
      + 'fix Supabase Auth SMTP / email settings (this is not your password).'
    );
  }
  return null;
}
