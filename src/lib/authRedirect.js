/**
 * authRedirect.js: where confirm and password-reset emails send people back.
 *
 *  - Web: the site they signed up on (e.g. https://tutor-delta-one.vercel.app/).
 *  - iPhone / Android: the app's own link scheme (strakejesuittutors://), so
 *    the link opens the app, and App.js signs them in from it.
 *
 * Both addresses must be listed under Supabase → Authentication → URL
 * Configuration → Redirect URLs, or Supabase falls back to the Site URL.
 */
import { Platform } from 'react-native';
import Constants from 'expo-constants';

export function authEmailRedirectTo() {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}/`;
  }
  const scheme = Constants.expoConfig?.scheme ?? 'strakejesuittutors';
  return `${scheme}://auth/callback`;
}

/**
 * The sign-in tokens Supabase puts on a confirm/reset link
 * (…#access_token=…&refresh_token=…), or { error } when the link was
 * rejected (expired or already used), or null when the URL isn't an auth link.
 */
export function authTokensFromUrl(url) {
  if (!url) return null;
  const params = new URLSearchParams();
  const [, query = ''] = url.split('?');
  const [, hash = ''] = url.split('#');
  for (const part of [query.split('#')[0], hash]) {
    new URLSearchParams(part).forEach((v, k) => params.set(k, v));
  }
  if (params.get('error_description') || params.get('error')) {
    return { error: (params.get('error_description') || params.get('error')).replace(/\+/g, ' ') };
  }
  const access_token = params.get('access_token');
  const refresh_token = params.get('refresh_token');
  if (access_token && refresh_token) return { access_token, refresh_token };
  return null;
}

/** Turn a failed confirmation email into something a student can act on. */
export function friendlyAuthEmailError(message) {
  if (!message) return null;
  if (/confirmation email|sending confirmation|error sending/i.test(message)) {
    return "We couldn't send the confirmation email. Try again in a few minutes, "
      + 'and if it keeps happening, let a teacher or moderator know.';
  }
  return null;
}
