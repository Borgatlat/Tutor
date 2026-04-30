import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─────────────────────────────────────────────────────────────────────────────
// 🔧 SETUP: Replace these with your Supabase project credentials.
//    1. Go to https://supabase.com → your project → Settings → API
//    2. Copy "Project URL" and "anon public" key and paste below.
// ─────────────────────────────────────────────────────────────────────────────
const SUPABASE_URL = 'https://lmavnypvqdomdefpjbok.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_60WBbWrItrbVbGGzawkjxw_r18uzLzr';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

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

  const isTutor   = profile.role === 'tutor' || profile.role === 'both';
  const isStudent = profile.role === 'student' || profile.role === 'both';

  const [subjectsRes, tutorAvailRes, studentAvailRes] = await Promise.all([
    supabase.from('tutor_subjects').select('subject, grade').eq('tutor_id', userId),
    isTutor
      ? supabase.from('tutor_availability').select('day, period').eq('tutor_id', userId)
      : Promise.resolve({ data: [] }),
    isStudent
      ? supabase.from('student_availability').select('day, period').eq('student_id', userId)
      : Promise.resolve({ data: [] }),
  ]);

  // Merge and deduplicate (relevant for "both" role users)
  const seen = new Set();
  const availability = [
    ...(tutorAvailRes.data ?? []),
    ...(studentAvailRes.data ?? []),
  ].filter(({ day, period }) => {
    const key = `${day}-${period}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

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
  day = null,
  period = null,
  studentId = null,
  matchSchedule = false,
}) {
  const { data, error } = await supabase.rpc('search_tutors', {
    query_name:     query         || '',
    filter_subject: subject       || null,
    filter_day:     day           || null,
    filter_period:  period        || null,
    student_id:     studentId     || null,
    match_schedule: matchSchedule || false,
  });
  if (error) throw error;
  return data ?? [];
}
