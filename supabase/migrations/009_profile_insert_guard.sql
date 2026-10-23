-- ============================================================
-- STRAKE JESUIT TUTORS: migration 009
-- Close two gaps found in a security review
-- ============================================================
-- Run after 001–008. Safe to run more than once.
--
-- 1. guard_profile_update (002) only ran on UPDATE. A new user creating
--    their profile row could send is_moderator = true, a 5.0 rating, a fake
--    session count, or someone else's email address. Now the same rules
--    apply on INSERT, and a profile's email always matches the sign-in email.
-- 2. A student booking a session could pre-fill student_confirmed_at, so a
--    session looked "confirmed by both" without a check-in. New sessions now
--    always start unconfirmed.
-- ============================================================

create or replace function public.guard_profile_update()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  -- SQL editor / service role (no signed-in user) and internal triggers may change anything.
  if auth.uid() is null or current_setting('app.internal', true) = 'on' then
    return new;
  end if;

  if tg_op = 'INSERT' then
    -- Nobody signs up as a moderator, and stats start at zero.
    new.is_moderator  := false;
    new.avg_rating    := 0;
    new.review_count  := 0;
    new.session_count := 0;
  else
    if new.is_moderator is distinct from old.is_moderator and not public.is_moderator(auth.uid()) then
      raise exception 'Only a moderator can change moderator status.';
    end if;
    -- Stats are computed, never typed in.
    new.avg_rating    := old.avg_rating;
    new.review_count  := old.review_count;
    new.session_count := old.session_count;
  end if;

  -- The email is always the one the person signs in with (a school address),
  -- so emails and the tutor contact link can't be pointed somewhere else.
  new.email := coalesce((select u.email from auth.users u where u.id = new.id),
                        case when tg_op = 'UPDATE' then old.email end);
  return new;
end;
$$;

drop trigger if exists guard_profile_update on public.profiles;
create trigger guard_profile_update
  before insert or update on public.profiles
  for each row execute function public.guard_profile_update();


create or replace function public.clear_new_session_confirmation()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then return new; end if;   -- seed scripts / service role
  new.student_confirmed_at := null;                 -- only check-in sets this
  return new;
end;
$$;

drop trigger if exists clear_new_session_confirmation on public.sessions;
create trigger clear_new_session_confirmation
  before insert on public.sessions
  for each row execute function public.clear_new_session_confirmation();
