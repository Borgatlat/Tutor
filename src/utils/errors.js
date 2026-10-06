/**
 * toUserMessage - turns any Supabase / PostgREST / network error into something
 * a student can actually read.
 *
 * THE RULE: never return error.message by default.
 *
 * Supabase errors are written for developers. Left alone they surface things
 * like `duplicate key value violates unique constraint "reviews_session_id_..."`
 * or a raw JSON blob inside a red banner, which tells a sixteen-year-old
 * nothing and looks broken. Anything this file does not recognise becomes the
 * caller's fallback, and the real text goes to the console in dev only.
 *
 * Usage:
 *   const { error } = await supabase.from('reviews').insert(row);
 *   if (error) { setReviewError(toUserMessage(error, "Couldn't save your review.")); return; }
 *
 * Pass a fallback that fits the action. The generic default is deliberately
 * vague because it covers cases we have not thought about yet.
 */

const GENERIC = 'Something went wrong. Please try again.';

/** Pull a comparable string out of whatever shape the caller caught. */
function textOf(error) {
  if (!error) return '';
  if (typeof error === 'string') return error;
  return [error.message, error.error_description, error.details, error.hint]
    .filter(Boolean)
    .join(' ');
}

/** PostgREST / Postgres put the useful part in `code`. */
function codeOf(error) {
  if (!error || typeof error === 'string') return '';
  return String(error.code ?? error.error_code ?? error.status ?? '');
}

export function toUserMessage(error, fallback = GENERIC) {
  const text = textOf(error);
  const code = codeOf(error);
  const t    = text.toLowerCase();

  // ── Network ───────────────────────────────────────────────────────────────
  // Checked first: offline looks like every other failure until you look.
  if (/failed to fetch|network request failed|networkerror|load failed/.test(t)) {
    return 'Cannot reach the server. Check your internet connection.';
  }

  // ── Auth ──────────────────────────────────────────────────────────────────
  if (/invalid login credentials/.test(t)) {
    return "That email or password isn't right.";
  }
  if (/email not confirmed/.test(t)) {
    return "Your email isn't confirmed yet. Check your inbox for the confirmation link.";
  }
  if (/error sending|sending.*email|smtp/.test(t)) {
    return "We couldn't send your email. That's a problem on our end, not yours. Please try again later.";
  }
  if (/user already registered|already been registered/.test(t)) {
    return 'An account with that email already exists. Try signing in instead.';
  }
  if (/password should be at least|password is too short/.test(t)) {
    return 'Please choose a password with at least 8 characters.';
  }
  if (/same password/.test(t)) {
    return 'That is already your password. Choose a different one.';
  }
  if (/token has expired|invalid token|token not found|expired/.test(t)) {
    return 'That link has expired. Please request a new one.';
  }
  if (/rate limit|too many requests/.test(t) || code === '429') {
    return 'Too many attempts. Please wait a minute and try again.';
  }

  // ── Postgres / PostgREST ──────────────────────────────────────────────────
  if (code === '23505' || /duplicate key|already exists/.test(t)) {
    return fallback === GENERIC ? "That's already been saved." : fallback;
  }
  if (code === '23502' || /not-null constraint|violates not-null/.test(t)) {
    return "Something's missing from that request. Please try again.";
  }
  if (code === '23503' || /foreign key constraint/.test(t)) {
    return "That's linked to something that no longer exists. Try refreshing.";
  }
  if (code === '23514' || /check constraint/.test(t)) {
    return "That value isn't allowed here.";
  }
  if (code === '42501' || /row-level security|permission denied|not authorized/.test(t)) {
    return "You don't have permission to do that.";
  }
  if (code === 'PGRST116' || /no rows|results contain 0 rows/.test(t)) {
    return "We couldn't find that.";
  }

  // ── Unknown ───────────────────────────────────────────────────────────────
  // The raw text stops here. It goes to the console so we can still debug,
  // and the student sees the caller's wording instead.
  if (__DEV__ && text) console.warn('[unmapped error]', code, text);
  return fallback;
}

export default toUserMessage;
