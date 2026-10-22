/**
 * googleSignIn.js: "Continue with Google" for school Google accounts.
 *
 *  - Web: Supabase sends the page to Google and back to the site, which
 *    signs in from the link (detectSessionInUrl).
 *  - iPhone / Android: Google opens in an in-app browser and hands back a
 *    link with the sign-in tokens, which we pass to setSession.
 *
 * `hd` asks Google to show only school accounts, but that's just a hint. The
 * database refuses any account that isn't a school email (migration 005), so
 * a personal Gmail can't get in even if someone edits the request.
 */
import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { supabase, SUPABASE_URL, SUPABASE_ANON_KEY } from './supabase';
import { authEmailRedirectTo, authTokensFromUrl } from './authRedirect';
import { SCHOOL_EMAIL_DOMAIN } from '../constants';

const SCHOOL_DOMAIN = SCHOOL_EMAIL_DOMAIN.replace(/^@/, '');

/** Turn what Supabase or Google sends back into something a student can act on. */
export function friendlyGoogleError(message) {
  if (!message) return null;
  if (/database error|school email/i.test(message)) {
    return `Use your ${SCHOOL_EMAIL_DOMAIN} Google account. Personal Gmail accounts can't sign in.`;
  }
  if (/access_denied|denied/i.test(message)) return null;   // they closed Google's page
  if (/provider is not enabled|unsupported provider/i.test(message)) {
    return "Google sign-in isn't turned on yet. Use your email and password for now.";
  }
  return message;
}

/** Whether Google sign-in is switched on in Supabase, so the button only shows when it works. */
export async function googleSignInEnabled() {
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/settings`, { headers: { apikey: SUPABASE_ANON_KEY } });
    const settings = await res.json();
    return !!settings?.external?.google;
  } catch {
    return false;
  }
}

/** Starts Google sign-in. Resolves to { error } (null when it worked or was cancelled). */
export async function signInWithGoogle() {
  const redirectTo = authEmailRedirectTo();
  const options = { redirectTo, queryParams: { hd: SCHOOL_DOMAIN, prompt: 'select_account' } };

  if (Platform.OS === 'web') {
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options });
    return { error: friendlyGoogleError(error?.message) };
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google', options: { ...options, skipBrowserRedirect: true },
  });
  if (error) return { error: friendlyGoogleError(error.message) };

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type !== 'success') return { error: null };

  const tokens = authTokensFromUrl(result.url);
  if (!tokens) return { error: "Google sign-in didn't finish. Try again." };
  if (tokens.error) return { error: friendlyGoogleError(tokens.error) };
  const { error: sessionError } = await supabase.auth.setSession(tokens);
  return { error: sessionError?.message ?? null };
}

/**
 * Web: when Google sign-in is refused (say, a personal Gmail), Supabase sends
 * the student back with the reason in the address bar. Read it once, clear it.
 */
export function takeAuthErrorFromUrl() {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return null;
  const parsed = authTokensFromUrl(window.location.href);
  if (!parsed?.error) return null;
  window.history.replaceState(null, '', window.location.pathname);
  return friendlyGoogleError(parsed.error);
}
