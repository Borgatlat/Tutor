import 'react-native-url-polyfill/auto';
import { Platform } from 'react-native';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─────────────────────────────────────────────────────────────────────────────
// 🔧 SETUP: Replace these with your Supabase project credentials.
//    1. Go to https://supabase.com → your project → Settings → API
//    2. Copy "Project URL" and "anon public" key and paste below.
// ─────────────────────────────────────────────────────────────────────────────
const SUPABASE_URL = 'https://lmavnypvqdomdefpjbok.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_60WBbWrItrbVbGGzawkjxw_r18uzLzr';

const IS_WEB = Platform.OS === 'web';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    // Must be true on web. Confirmation and password-reset links come back to
    // the site with the token in the URL; with this off the client never reads
    // it, so the user lands signed-out and the flow reports a confirmation
    // error. There is no URL to read on native, so it stays off there.
    detectSessionInUrl: IS_WEB,
  },
});

/**
 * Where Supabase should send someone after they click an emailed link.
 * Uses the live origin so it works on localhost and on the deployed site
 * without hardcoding either. The value must also be listed under
 * Authentication -> URL Configuration -> Redirect URLs in Supabase.
 */
export function emailRedirectTo() {
  if (IS_WEB && typeof window !== 'undefined') return window.location.origin;
  return undefined;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Upload a profile picture and return the public URL */
export async function uploadAvatar(userId, uri) {
  const ext = uri.split('.').pop();
  const path = `${userId}/avatar.${ext}`;
  const response = await fetch(uri);
  const blob = await response.blob();

  const { error } = await supabase.storage
    .from('avatars')
    .upload(path, blob, { upsert: true, contentType: `image/${ext}` });

  if (error) throw error;

  const { data } = supabase.storage.from('avatars').getPublicUrl(path);
  return data.publicUrl;
}

/** Fetch a full profile + subjects + availability for the signed-in user */
export async function fetchMyProfile(userId) {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) throw error;

  // All roles store blocks in tutor_availability (student_availability doesn't exist)
  const [subjectsRes, availRes] = await Promise.all([
    supabase.from('tutor_subjects').select('subject, grade').eq('tutor_id', userId),
    supabase.from('tutor_availability').select('period').eq('tutor_id', userId),
  ]);

  const availability = availRes.data ?? [];

  return {
    ...profile,
    subjects: subjectsRes.data ?? [],
    availability,
  };
}

/** Run the custom search RPC */
export async function searchTutors({
  query = '',
  subject = null,
  period = null,   // block number (B1=1 … B8=8)
  studentId = null,
  matchSchedule = false,
}) {
  const { data, error } = await supabase.rpc('search_tutors', {
    query_name:     query         || '',
    filter_subject: subject       || null,
    filter_period:  period        || null,
    student_id:     studentId     || null,
    match_schedule: matchSchedule || false,
  });

  if (!error) return data ?? [];

  // PGRST202 = "no function with these parameters". That means the database is
  // still on the pre-migration signature (filter_day, filter_period,
  // filter_subject, query_name) while this build already speaks the new one.
  // Retry with the old shape so search keeps working until
  // supabase/migrations/0001_sessions_date.sql has been run. Schedule matching
  // is unavailable on that path - the old function joins a table that was never
  // created - so it degrades to a plain search rather than failing outright.
  if (error.code === 'PGRST202') {
    const legacy = await supabase.rpc('search_tutors', {
      query_name:     query   || '',
      filter_subject: subject || null,
      filter_day:     null,
      filter_period:  period  || null,
    });
    if (!legacy.error) return legacy.data ?? [];
  }

  throw error;
}

/**
 * How many tutors are free in each block, for the pre-login hero.
 *
 * Runs anonymously, so it depends on tutor_availability and profiles being
 * readable without a session (they are - the embedded join below was verified
 * against the live project). Returns { 1: 3, 2: 0, ... } keyed by block.
 *
 * Counts distinct people, not rows, and only those who actually tutor: every
 * role stores free blocks in tutor_availability, so students are in there too.
 */
export async function fetchBlockAvailability() {
  const { data, error } = await supabase
    .from('tutor_availability')
    .select('period, tutor_id, profiles!inner(role)');

  if (error) throw error;

  const byBlock = {};
  const seen    = new Set();

  for (const row of data ?? []) {
    const role = row.profiles?.role;
    if (role !== 'tutor' && role !== 'both') continue;

    const key = `${row.period}:${row.tutor_id}`;
    if (seen.has(key)) continue;
    seen.add(key);

    byBlock[row.period] = (byBlock[row.period] ?? 0) + 1;
  }
  return byBlock;
}
