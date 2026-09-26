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
    filter_day:     null,          // day dimension removed (block schedule)
    filter_period:  period        || null,
    student_id:     studentId     || null,
    match_schedule: matchSchedule || false,
  });
  if (error) throw error;
  return data ?? [];
}
