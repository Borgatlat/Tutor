-- ============================================================
-- STRAKE JESUIT TUTORS: migration 003
-- Private phone numbers, honest reviews, account deletion
-- ============================================================
-- Run after 001 and 002 (SQL Editor, or `supabase db push`).
-- Safe to run more than once.
--
--   1. Phone numbers are private in the database itself, not just hidden
--      by the app. Other students can read every profile column except
--      `phone`; a tutor's number is only handed out (by shared_phone) when
--      they switched on show_phone. Profiles are no longer readable
--      without signing in.
--   2. Reviews must come from the student of a completed session with
--      that tutor, so nobody can post fake reviews.
--   3. Sessions can only be booked with someone who is tutoring.
--   4. Students can delete their account and everything tied to it
--      (App Store rule 5.1.1(v)), including their profile photo.
-- ============================================================


-- ─────────────────────────────────────────────────────────────
-- 1. Private phone numbers
-- ─────────────────────────────────────────────────────────────
drop policy if exists "profiles: read all" on public.profiles;
create policy "profiles: read all"
  on public.profiles for select
  to authenticated
  using (true);

-- Column-level grant: every column except phone. If you add a column to
-- profiles later, add it to this list too so the app can read it.
revoke select on public.profiles from anon, authenticated;
grant select (
  id, email, full_name, role, bio, avatar_url,
  avg_rating, review_count, session_count, created_at,
  setup_complete, show_phone, is_moderator
) on public.profiles to authenticated;

-- The signed-in user's own row, phone included.
create or replace function public.get_my_profile()
returns setof public.profiles
language sql stable security definer set search_path = public as $$
  select * from public.profiles where id = auth.uid();
$$;

-- A tutor's phone number, only if they chose to share it and neither
-- person has blocked the other.
create or replace function public.shared_phone(uid uuid)
returns text
language sql stable security definer set search_path = public as $$
  select p.phone
  from public.profiles p
  where p.id = uid
    and auth.uid() is not null
    and (p.show_phone or p.id = auth.uid())
    and not exists (
      select 1 from public.blocked_users bu
      where (bu.blocker_id = uid and bu.blocked_id = auth.uid())
         or (bu.blocker_id = auth.uid() and bu.blocked_id = uid)
    );
$$;

revoke execute on function public.get_my_profile()   from public, anon;
revoke execute on function public.shared_phone(uuid) from public, anon;
grant  execute on function public.get_my_profile()   to authenticated;
grant  execute on function public.shared_phone(uuid) to authenticated;


-- ─────────────────────────────────────────────────────────────
-- 2. Honest reviews
-- ─────────────────────────────────────────────────────────────
drop policy if exists "reviews: insert own" on public.reviews;
create policy "reviews: insert own"
  on public.reviews for insert
  to authenticated
  with check (
    auth.uid() = reviewer_id
    and exists (
      select 1 from public.sessions s
      where s.id = reviews.session_id
        and s.student_id = auth.uid()
        and s.tutor_id = reviews.tutor_id
        and s.status = 'completed'
    )
  );


-- ─────────────────────────────────────────────────────────────
-- 3. Only book people who are tutoring
-- ─────────────────────────────────────────────────────────────
create or replace function public.check_session_tutor()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then return new; end if;   -- seed scripts / service role
  if not exists (select 1 from public.profiles p
                 where p.id = new.tutor_id and p.role in ('tutor', 'both')) then
    raise exception 'This student isn''t tutoring right now.';
  end if;
  return new;
end;
$$;

drop trigger if exists check_session_tutor on public.sessions;
create trigger check_session_tutor
  before insert on public.sessions
  for each row execute function public.check_session_tutor();


-- ─────────────────────────────────────────────────────────────
-- 4. Delete my account
--    Removing the auth user cascades to the profile and from there to
--    subjects, free blocks, sessions, reviews, messages, reports, blocks
--    and push tokens. The app removes the profile photo first (storage
--    files can't be deleted from SQL).
-- ─────────────────────────────────────────────────────────────
drop policy if exists "avatars: delete own" on storage.objects;
create policy "avatars: delete own"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

create or replace function public.delete_my_account()
returns void
language plpgsql security definer set search_path = public, auth as $$
declare
  me uuid := auth.uid();
begin
  if me is null then
    raise exception 'Sign in to delete your account.';
  end if;
  delete from auth.users where id = me;
end;
$$;

revoke execute on function public.delete_my_account() from public, anon;
grant  execute on function public.delete_my_account() to authenticated;
