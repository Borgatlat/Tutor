-- ============================================================================
-- 002: Real scheduling, push notifications, in-app messages, moderation
-- ============================================================================
-- Run once in: Supabase Dashboard → SQL Editor → New query → paste → Run.
--
-- Safe to run more than once, and safe on a database that has drifted from
-- supabase_schema.sql: every step checks before it changes anything.
--
-- What it does
--   1. Profiles: setup_complete, show_phone (private by default), is_moderator,
--      and a guard so nobody can make themselves a moderator or edit their
--      own rating / session count.
--   2. Free blocks are per block (B1–B8) only. The old "day" column is no
--      longer required, so saving a free block works.
--   3. Sessions get a real session_date. A tutor (or student) can't be booked
--      twice in the same block on the same day, bookings must be on a school
--      day in the next 4 weeks, and status changes follow the rules
--      (only the tutor confirms; "done" only on or after the date).
--   4. search_tutors returns each tutor's free blocks and only shares a phone
--      number when its owner opted in.
--   5. In-app messages per session (live updates via Realtime).
--   6. Push notifications through Expo, sent from the database with pg_net.
--   7. Moderators verify service hours and review reports.
--   8. community_stats() for the Home impact strip (aggregate counts only).
--
-- After running: make yourself a moderator with
--   update public.profiles set is_moderator = true where email = 'you@mail.strakejesuit.org';
-- ============================================================================


-- ─────────────────────────────────────────────────────────────
-- 0. Extensions
-- ─────────────────────────────────────────────────────────────
create extension if not exists pg_trgm;
-- pg_net lets the database call Expo's push API. If your project can't
-- enable it, everything else still works; pushes are simply skipped.
do $$ begin
  create extension if not exists pg_net;
exception when others then
  raise notice 'pg_net not available, push notifications will be skipped: %', sqlerrm;
end $$;


-- ─────────────────────────────────────────────────────────────
-- 1. PROFILES
-- ─────────────────────────────────────────────────────────────
alter table public.profiles add column if not exists setup_complete boolean not null default false;
alter table public.profiles add column if not exists show_phone     boolean not null default false;
alter table public.profiles add column if not exists is_moderator   boolean not null default false;

create or replace function public.is_moderator(uid uuid default auth.uid())
returns boolean
language sql stable security definer set search_path = public
as $$ select coalesce((select p.is_moderator from public.profiles p where p.id = uid), false) $$;

-- Internal triggers (ratings, session counts) mark their writes with this
-- flag so the guard below can tell them apart from a user editing their row.
create or replace function public.guard_profile_update()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  -- SQL editor / service role (no signed-in user) and internal triggers may change anything.
  if auth.uid() is null or current_setting('app.internal', true) = 'on' then
    return new;
  end if;
  if new.is_moderator is distinct from old.is_moderator and not public.is_moderator(auth.uid()) then
    raise exception 'Only a moderator can change moderator status.';
  end if;
  -- Stats are computed, never typed in.
  new.avg_rating    := old.avg_rating;
  new.review_count  := old.review_count;
  new.session_count := old.session_count;
  return new;
end;
$$;

drop trigger if exists guard_profile_update on public.profiles;
create trigger guard_profile_update
  before update on public.profiles
  for each row execute function public.guard_profile_update();

-- Recreate the stat triggers so they use the internal flag.
create or replace function public.update_tutor_rating()
returns trigger language plpgsql security definer set search_path = public as $$
declare tid uuid := coalesce(new.tutor_id, old.tutor_id);
begin
  perform set_config('app.internal', 'on', true);
  update public.profiles p set
    avg_rating   = coalesce((select round(avg(r.rating)::numeric, 2) from public.reviews r where r.tutor_id = tid), 0),
    review_count = (select count(*) from public.reviews r where r.tutor_id = tid)
  where p.id = tid;
  perform set_config('app.internal', 'off', true);
  return coalesce(new, old);
end;
$$;

drop trigger if exists on_review_change on public.reviews;
create trigger on_review_change
  after insert or delete on public.reviews
  for each row execute function public.update_tutor_rating();

create or replace function public.update_tutor_session_count()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'completed' and old.status is distinct from 'completed' then
    perform set_config('app.internal', 'on', true);
    update public.profiles set session_count = session_count + 1 where id = new.tutor_id;
    perform set_config('app.internal', 'off', true);
  end if;
  return new;
end;
$$;

drop trigger if exists on_session_complete on public.sessions;
create trigger on_session_complete
  after update on public.sessions
  for each row execute function public.update_tutor_session_count();


-- ─────────────────────────────────────────────────────────────
-- 2. FREE BLOCKS: one row per (person, block). Students' free blocks live
--    here too, keyed by their own id.
-- ─────────────────────────────────────────────────────────────
do $$
declare r record;
begin
  if exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'tutor_availability' and column_name = 'day') then
    alter table public.tutor_availability alter column day drop not null;
  end if;
  -- Drop the old (tutor_id, day, period) uniqueness.
  for r in select conname from pg_constraint
           where conrelid = 'public.tutor_availability'::regclass and contype = 'u' loop
    execute format('alter table public.tutor_availability drop constraint %I', r.conname);
  end loop;
end $$;

delete from public.tutor_availability a
using public.tutor_availability b
where a.tutor_id = b.tutor_id and a.period = b.period and a.ctid > b.ctid;

create unique index if not exists tutor_availability_person_block
  on public.tutor_availability (tutor_id, period);


-- ─────────────────────────────────────────────────────────────
-- 3. SESSIONS: real dates and fair rules
-- ─────────────────────────────────────────────────────────────
alter table public.sessions add column if not exists session_date date;
alter table public.sessions add column if not exists verified_by  uuid references public.profiles(id) on delete set null;
alter table public.sessions add column if not exists verified_at  timestamptz;

do $$ begin
  if exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'sessions' and column_name = 'day') then
    alter table public.sessions alter column day drop not null;
  end if;
end $$;

-- Older rows had no date: use the day they were booked.
update public.sessions set session_date = created_at::date where session_date is null;

-- Nobody can be double-booked in the same block on the same day.
create unique index if not exists sessions_tutor_slot_active
  on public.sessions (tutor_id, session_date, period)
  where status in ('pending', 'confirmed');
create unique index if not exists sessions_student_slot_active
  on public.sessions (student_id, session_date, period)
  where status in ('pending', 'confirmed');
create index if not exists sessions_date_idx on public.sessions (session_date);

create or replace function public.school_today()
returns date language sql stable as
$$ select (now() at time zone 'America/Chicago')::date $$;

-- New bookings: a school day in the next 4 weeks, in one of the tutor's free
-- blocks, not with yourself, and not with someone who blocked you.
create or replace function public.check_new_session()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then return new; end if;   -- seed scripts / service role

  if new.session_date is null then
    raise exception 'Pick a date for the session.';
  end if;
  if new.session_date < public.school_today() or new.session_date > public.school_today() + 28 then
    raise exception 'Sessions can be booked from today up to 4 weeks ahead.';
  end if;
  if extract(isodow from new.session_date) > 5 then
    raise exception 'Sessions are on school days (Monday to Friday).';
  end if;
  if new.tutor_id = new.student_id then
    raise exception 'You can''t book a session with yourself.';
  end if;
  if not exists (select 1 from public.tutor_availability ta
                 where ta.tutor_id = new.tutor_id and ta.period = new.period) then
    raise exception 'This tutor isn''t free in block %.', new.period;
  end if;
  if exists (select 1 from public.blocked_users bu
             where (bu.blocker_id = new.tutor_id and bu.blocked_id = new.student_id)
                or (bu.blocker_id = new.student_id and bu.blocked_id = new.tutor_id)) then
    raise exception 'This session can''t be booked.';
  end if;
  new.status := 'pending';
  new.day := to_char(new.session_date, 'Dy');
  new.verified_by := null;
  new.verified_at := null;
  return new;
end;
$$;

drop trigger if exists check_new_session on public.sessions;
create trigger check_new_session
  before insert on public.sessions
  for each row execute function public.check_new_session();

-- Changes: sessions can't be moved; only the tutor confirms or completes;
-- "done" only on or after the session date; only moderators verify hours.
create or replace function public.check_session_update()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  is_mod boolean := public.is_moderator(me);
  is_party boolean := me in (old.tutor_id, old.student_id);
begin
  if me is null then return new; end if;

  if new.tutor_id   is distinct from old.tutor_id
  or new.student_id is distinct from old.student_id
  or new.session_date is distinct from old.session_date
  or new.period     is distinct from old.period
  or new.subject    is distinct from old.subject then
    raise exception 'Sessions can''t be moved. Cancel this one and book a new time.';
  end if;

  if new.verified_by is distinct from old.verified_by or new.verified_at is distinct from old.verified_at then
    if not is_mod then raise exception 'Only a moderator can verify service hours.'; end if;
    if old.status <> 'completed' then raise exception 'Only completed sessions can be verified.'; end if;
    if new.verified_at is not null then new.verified_by := me; end if;
  end if;

  if new.status is distinct from old.status then
    if not is_party then raise exception 'Only the tutor or student can change this session.'; end if;
    if old.status in ('completed', 'cancelled') then
      raise exception 'This session is already closed.';
    end if;
    if new.status in ('confirmed', 'completed') and me <> old.tutor_id then
      raise exception 'Only the tutor can confirm a session or mark it done.';
    end if;
    if new.status = 'completed' then
      if old.status <> 'confirmed' then raise exception 'Confirm the session before marking it done.'; end if;
      if old.session_date > public.school_today() then
        raise exception 'You can mark a session done on or after %.', to_char(old.session_date, 'FMDay, Mon FMDD');
      end if;
    end if;
  end if;

  if not is_party and not is_mod then
    raise exception 'Only the tutor or student can change this session.';
  end if;
  return new;
end;
$$;

drop trigger if exists check_session_update on public.sessions;
create trigger check_session_update
  before update on public.sessions
  for each row execute function public.check_session_update();

drop policy if exists "sessions: moderators read"   on public.sessions;
drop policy if exists "sessions: moderators verify" on public.sessions;
create policy "sessions: moderators read"
  on public.sessions for select using (public.is_moderator());
create policy "sessions: moderators verify"
  on public.sessions for update using (public.is_moderator());

-- Which blocks a tutor is already booked in (dates and blocks only, no names),
-- so the booking screen can grey them out.
create or replace function public.tutor_booked_slots(tutor uuid, from_date date, to_date date)
returns table (session_date date, period integer)
language sql stable security definer set search_path = public as $$
  select s.session_date, s.period
  from public.sessions s
  where s.tutor_id = tutor
    and s.status in ('pending', 'confirmed')
    and s.session_date between from_date and to_date
$$;
revoke all on function public.tutor_booked_slots(uuid, date, date) from public;
grant execute on function public.tutor_booked_slots(uuid, date, date) to authenticated;


-- ─────────────────────────────────────────────────────────────
-- 4. SEARCH: free blocks included, phone only when shared
-- ─────────────────────────────────────────────────────────────
drop function if exists public.search_tutors(text, text, text, integer, uuid, boolean);

create function public.search_tutors(
  query_name     text    default '',
  filter_subject text    default null,
  filter_day     text    default null,   -- kept for older app versions; ignored
  filter_period  integer default null,
  student_id     uuid    default null,
  match_schedule boolean default false
)
returns table (
  id            uuid,
  full_name     text,
  email         text,
  avatar_url    text,
  bio           text,
  phone         text,
  show_phone    boolean,
  avg_rating    numeric,
  review_count  integer,
  session_count integer,
  subjects      jsonb,
  availability  jsonb,
  score         float
)
language plpgsql stable security definer set search_path = public as $$
begin
  return query
  select
    p.id, p.full_name, p.email, p.avatar_url, p.bio,
    case when p.show_phone then p.phone end,
    p.show_phone, p.avg_rating, p.review_count, p.session_count,
    coalesce((select jsonb_agg(jsonb_build_object('subject', ts.subject, 'grade', ts.grade))
              from public.tutor_subjects ts where ts.tutor_id = p.id), '[]'::jsonb),
    coalesce((select jsonb_agg(jsonb_build_object('period', ta.period) order by ta.period)
              from public.tutor_availability ta where ta.tutor_id = p.id), '[]'::jsonb),
    (
      case when coalesce(query_name, '') = '' then 1.0 else similarity(p.full_name, query_name) end
      + coalesce(p.avg_rating, 0) * 0.1
      + least(coalesce(p.session_count, 0), 50) * 0.005
      + case when search_tutors.student_id is null then 0 else (
          select count(*)::float * 0.20
          from public.tutor_availability ta
          join public.tutor_availability sa on sa.period = ta.period
          where ta.tutor_id = p.id and sa.tutor_id = search_tutors.student_id
        ) end
    )::float
  from public.profiles p
  where (p.role = 'tutor' or p.role = 'both')
    and p.id is distinct from auth.uid()
    and (coalesce(query_name, '') = '' or similarity(p.full_name, query_name) > 0.1
         or p.full_name ilike '%' || query_name || '%')
    and (filter_subject is null or exists (
          select 1 from public.tutor_subjects ts where ts.tutor_id = p.id and ts.subject = filter_subject))
    and (filter_period is null or exists (
          select 1 from public.tutor_availability ta where ta.tutor_id = p.id and ta.period = filter_period))
    and (not match_schedule or search_tutors.student_id is null or exists (
          select 1 from public.tutor_availability ta
          join public.tutor_availability sa on sa.period = ta.period
          where ta.tutor_id = p.id and sa.tutor_id = search_tutors.student_id))
    and not exists (
          select 1 from public.blocked_users bu
          where (bu.blocker_id = auth.uid() and bu.blocked_id = p.id)
             or (bu.blocker_id = p.id and bu.blocked_id = auth.uid()))
  order by 13 desc;
end;
$$;
grant execute on function public.search_tutors(text, text, text, integer, uuid, boolean) to authenticated;


-- ─────────────────────────────────────────────────────────────
-- 5. MESSAGES (one thread per session)
-- ─────────────────────────────────────────────────────────────
create table if not exists public.messages (
  id         uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  sender_id  uuid not null references public.profiles(id) on delete cascade,
  body       text not null check (char_length(btrim(body)) between 1 and 1000),
  created_at timestamptz not null default now()
);
create index if not exists messages_session_idx on public.messages (session_id, created_at);
alter table public.messages enable row level security;

create or replace function public.is_session_participant(sid uuid, uid uuid default auth.uid())
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.sessions s
                 where s.id = sid and uid in (s.tutor_id, s.student_id))
$$;

drop policy if exists "messages: participants read"  on public.messages;
drop policy if exists "messages: participants send"  on public.messages;
drop policy if exists "messages: moderators read"    on public.messages;
create policy "messages: participants read"
  on public.messages for select using (public.is_session_participant(session_id));
create policy "messages: participants send"
  on public.messages for insert
  with check (sender_id = auth.uid() and public.is_session_participant(session_id));
-- Moderators can read threads when looking into a report.
create policy "messages: moderators read"
  on public.messages for select using (public.is_moderator());

do $$ begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (select 1 from pg_publication_tables
                     where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'messages') then
    alter publication supabase_realtime add table public.messages;
  end if;
end $$;


-- ─────────────────────────────────────────────────────────────
-- 6. PUSH NOTIFICATIONS (Expo)
-- ─────────────────────────────────────────────────────────────
create table if not exists public.push_tokens (
  user_id    uuid not null references public.profiles(id) on delete cascade,
  token      text not null,
  platform   text,
  updated_at timestamptz not null default now(),
  primary key (user_id, token)
);
alter table public.push_tokens enable row level security;
drop policy if exists "push_tokens: manage own" on public.push_tokens;
create policy "push_tokens: manage own"
  on public.push_tokens for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Sends one notification to every device a person has registered. Never
-- raises: a failed push must not undo a booking or a message.
create or replace function public.send_push(target uuid, title text, body text, data jsonb default '{}')
returns void language plpgsql security definer set search_path = public as $$
declare msgs jsonb;
begin
  if target is null or to_regproc('net.http_post') is null then return; end if;
  select jsonb_agg(jsonb_build_object('to', t.token, 'title', title, 'body', body,
                                      'data', data, 'sound', 'default'))
    into msgs
  from public.push_tokens t where t.user_id = target;
  if msgs is null then return; end if;
  perform net.http_post(
    url     := 'https://exp.host/--/api/v2/push/send',
    body    := msgs,
    headers := '{"Content-Type": "application/json", "Accept": "application/json"}'::jsonb
  );
exception when others then
  raise warning 'send_push failed: %', sqlerrm;
end;
$$;
revoke all on function public.send_push(uuid, text, text, jsonb) from public, anon, authenticated;

create or replace function public.first_name(uid uuid)
returns text language sql stable security definer set search_path = public as
$$ select coalesce(nullif(split_part(full_name, ' ', 1), ''), 'Someone') from public.profiles where id = uid $$;

create or replace function public.session_when(s public.sessions)
returns text language sql stable as
$$ select to_char(s.session_date, 'Dy, Mon FMDD') || ' · Block ' || s.period $$;

create or replace function public.notify_session_change()
returns trigger language plpgsql security definer set search_path = public as $$
declare d jsonb := jsonb_build_object('type', 'session', 'sessionId', new.id);
begin
  if tg_op = 'INSERT' then
    perform public.send_push(new.tutor_id, 'New tutoring request',
      public.first_name(new.student_id) || ' wants help with ' || new.subject || ', ' || public.session_when(new), d);
  elsif new.status is distinct from old.status then
    if new.status = 'confirmed' then
      perform public.send_push(new.student_id, 'Session confirmed',
        public.first_name(new.tutor_id) || ' confirmed ' || new.subject || ', ' || public.session_when(new), d);
    elsif new.status = 'cancelled' then
      perform public.send_push(
        case when auth.uid() = new.tutor_id then new.student_id else new.tutor_id end,
        'Session cancelled',
        new.subject || ', ' || public.session_when(new) || ' was cancelled', d);
    elsif new.status = 'completed' then
      perform public.send_push(new.student_id, 'How did it go?',
        'Leave a review for ' || public.first_name(new.tutor_id) || ' to help other students', d);
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists notify_session_change on public.sessions;
create trigger notify_session_change
  after insert or update on public.sessions
  for each row execute function public.notify_session_change();

create or replace function public.notify_new_message()
returns trigger language plpgsql security definer set search_path = public as $$
declare s public.sessions;
begin
  select * into s from public.sessions where id = new.session_id;
  perform public.send_push(
    case when new.sender_id = s.tutor_id then s.student_id else s.tutor_id end,
    public.first_name(new.sender_id),
    left(new.body, 140),
    jsonb_build_object('type', 'message', 'sessionId', new.session_id));
  return new;
end;
$$;

drop trigger if exists notify_new_message on public.messages;
create trigger notify_new_message
  after insert on public.messages
  for each row execute function public.notify_new_message();


-- ─────────────────────────────────────────────────────────────
-- 7. MODERATION: reports queue
-- ─────────────────────────────────────────────────────────────
alter table public.reports add column if not exists reviewed_by uuid references public.profiles(id) on delete set null;
alter table public.reports add column if not exists reviewed_at timestamptz;

drop policy if exists "reports: moderators read"   on public.reports;
drop policy if exists "reports: moderators review" on public.reports;
create policy "reports: moderators read"
  on public.reports for select using (public.is_moderator());
create policy "reports: moderators review"
  on public.reports for update using (public.is_moderator()) with check (public.is_moderator());


-- ─────────────────────────────────────────────────────────────
-- 8. COMMUNITY STATS (Home impact strip; aggregate counts only)
-- ─────────────────────────────────────────────────────────────
create or replace function public.community_stats()
returns table (sessions_completed bigint, hours_tutored numeric, active_tutors bigint)
language sql stable security definer set search_path = public as $$
  select count(*), round(count(*) * 50 / 60.0, 1), count(distinct tutor_id)
  from public.sessions where status = 'completed'
$$;
revoke all on function public.community_stats() from public;
grant execute on function public.community_stats() to authenticated;
