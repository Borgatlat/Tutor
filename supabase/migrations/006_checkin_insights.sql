-- ============================================================
-- STRAKE JESUIT TUTORS: migration 006
-- Two-sided check-in, and Insights for moderators
-- ============================================================
-- Run after 001–005 (SQL Editor, or `supabase db push`).
-- Safe to run more than once.
--
--   1. Check-in: at the session the tutor gets a 4-digit code and the student
--      types it in. That completes the session and records that the student
--      confirmed it, so service hours are confirmed by both people.
--   2. Insights: a moderator-only summary of tutoring at school, including
--      the subjects students search for but can't find a tutor in.
--   3. Hours count a block as 60 minutes, Community Time as 50 and lunch as
--      25, matching the app (community_stats used 50 for everything).
-- ============================================================


-- ─────────────────────────────────────────────────────────────
-- Minutes of service per session, by block (same as blockMinutes in the app)
-- ─────────────────────────────────────────────────────────────
create or replace function public.block_minutes(p integer)
returns integer language sql immutable as
$$ select case p when 9 then 50 when 10 then 25 when 11 then 25 else 60 end $$;

create or replace function public.community_stats()
returns table (sessions_completed bigint, hours_tutored numeric, active_tutors bigint)
language sql stable security definer set search_path = public as $$
  select count(*), round(coalesce(sum(public.block_minutes(period)), 0) / 60.0, 1), count(distinct tutor_id)
  from public.sessions where status = 'completed'
$$;


-- ─────────────────────────────────────────────────────────────
-- 1. Check-in
-- ─────────────────────────────────────────────────────────────
alter table public.sessions add column if not exists student_confirmed_at timestamptz;

-- Codes live here, out of reach of the API (RLS on, no policies): only the
-- functions below read or write them.
create table if not exists public.session_checkins (
  session_id uuid primary key references public.sessions(id) on delete cascade,
  code       text not null,
  expires_at timestamptz not null,
  attempts   integer not null default 0
);
alter table public.session_checkins enable row level security;

-- The tutor's code for a session happening today (or one they forgot to close).
create or replace function public.start_checkin(session uuid)
returns text language plpgsql volatile security definer set search_path = public as $$
declare
  s public.sessions;
  new_code text := lpad((floor(random() * 10000))::int::text, 4, '0');
begin
  select * into s from public.sessions where id = session;
  if s.id is null or s.tutor_id is distinct from auth.uid() then
    raise exception 'Only the tutor can start check-in.';
  end if;
  if s.status <> 'confirmed' then raise exception 'Only a confirmed session can be checked in.'; end if;
  if s.session_date > public.school_today() then
    raise exception 'Check-in opens on the day of the session.';
  end if;
  insert into public.session_checkins (session_id, code, expires_at, attempts)
  values (s.id, new_code, now() + interval '10 minutes', 0)
  on conflict (session_id) do update
    set code = excluded.code, expires_at = excluded.expires_at, attempts = 0;
  return new_code;
end;
$$;

-- The student types the tutor's code: 'ok' when it matched, 'wrong' when it
-- didn't. Five wrong tries and the code stops working, so it can't be
-- guessed; the tutor just makes a new one.
drop function if exists public.confirm_checkin(uuid, text);
create function public.confirm_checkin(session uuid, code text)
returns text language plpgsql volatile security definer set search_path = public as $$
declare
  s public.sessions;
  c public.session_checkins;
begin
  select * into s from public.sessions where id = session;
  if s.id is null or s.student_id is distinct from auth.uid() then
    raise exception 'Only the student in this session can check in.';
  end if;
  if s.status <> 'confirmed' then raise exception 'This session isn''t waiting for check-in.'; end if;

  select * into c from public.session_checkins where session_id = s.id;
  if c.session_id is null or c.expires_at < now() or c.attempts >= 5 then
    raise exception 'That code has expired. Ask your tutor for a new one.';
  end if;
  if c.code <> trim(confirm_checkin.code) then
    update public.session_checkins set attempts = attempts + 1 where session_id = s.id;
    return 'wrong';
  end if;

  perform set_config('app.checkin', 'on', true);
  update public.sessions set status = 'completed', student_confirmed_at = now() where id = s.id;
  perform set_config('app.checkin', 'off', true);
  delete from public.session_checkins where session_id = s.id;
  return 'ok';
end;
$$;

revoke execute on function public.start_checkin(uuid)         from public, anon;
revoke execute on function public.confirm_checkin(uuid, text) from public, anon;
grant  execute on function public.start_checkin(uuid)         to authenticated;
grant  execute on function public.confirm_checkin(uuid, text) to authenticated;

-- Same rules as migration 002, plus: student_confirmed_at only changes through
-- confirm_checkin, which is also the one way a student can complete a session.
create or replace function public.check_session_update()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  is_mod boolean := public.is_moderator(me);
  is_party boolean := me in (old.tutor_id, old.student_id);
  checkin boolean := coalesce(current_setting('app.checkin', true), '') = 'on';
begin
  if me is null then return new; end if;

  if new.tutor_id   is distinct from old.tutor_id
  or new.student_id is distinct from old.student_id
  or new.session_date is distinct from old.session_date
  or new.period     is distinct from old.period
  or new.subject    is distinct from old.subject then
    raise exception 'Sessions can''t be moved. Cancel this one and book a new time.';
  end if;

  if new.student_confirmed_at is distinct from old.student_confirmed_at and not checkin then
    raise exception 'Students confirm a session by checking in with the tutor''s code.';
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
    if new.status in ('confirmed', 'completed') and me <> old.tutor_id
       and not (checkin and new.status = 'completed') then
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


-- ─────────────────────────────────────────────────────────────
-- 2. Insights
-- ─────────────────────────────────────────────────────────────
-- Subject searches, with no names attached, so moderators can see where
-- students look for help and find nobody.
create table if not exists public.search_events (
  id         bigint generated always as identity primary key,
  subject    text not null,
  period     integer,
  results    integer not null default 0,
  created_at timestamptz not null default now()
);
alter table public.search_events enable row level security;
create index if not exists search_events_created_idx on public.search_events (created_at);

create or replace function public.log_search(subject text, period integer default null, results integer default 0)
returns void language sql volatile security definer set search_path = public as $$
  insert into public.search_events (subject, period, results)
  select log_search.subject, log_search.period, greatest(coalesce(log_search.results, 0), 0)
  where auth.uid() is not null and length(coalesce(log_search.subject, '')) between 1 and 80
$$;
revoke execute on function public.log_search(text, integer, integer) from public, anon;
grant  execute on function public.log_search(text, integer, integer) to authenticated;

-- Everything the Insights tab shows, for the last `days` days (moderators only).
create or replace function public.insights(days integer default 30)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  since date := public.school_today() - days;
  this_week date := date_trunc('week', public.school_today())::date;
begin
  if not public.is_moderator() then
    raise exception 'Only moderators can see insights.';
  end if;

  return jsonb_build_object(
    'days', days,
    'totals', (
      select jsonb_build_object(
        'sessions',  count(*),
        'hours',     round(coalesce(sum(public.block_minutes(s.period)), 0) / 60.0, 1),
        'tutors',    count(distinct s.tutor_id),
        'students',  count(distinct s.student_id),
        'confirmed', count(*) filter (where s.student_confirmed_at is not null))
      from public.sessions s
      where s.status = 'completed' and coalesce(s.session_date, s.created_at::date) >= since),
    'weekly', (
      select coalesce(jsonb_agg(jsonb_build_object('week', w.week, 'sessions', w.n) order by w.week), '[]'::jsonb)
      from (
        select wk::date as week,
               (select count(*) from public.sessions s
                 where s.status = 'completed'
                   and coalesce(s.session_date, s.created_at::date) >= wk::date
                   and coalesce(s.session_date, s.created_at::date) <  wk::date + 7) as n
        from generate_series(this_week - 49, this_week, interval '7 days') wk
      ) w),
    'blocks', (
      select coalesce(jsonb_agg(jsonb_build_object('period', b.period, 'sessions', b.n) order by b.n desc, b.period), '[]'::jsonb)
      from (
        select s.period, count(*) as n from public.sessions s
        where s.status <> 'cancelled' and coalesce(s.session_date, s.created_at::date) >= since
        group by s.period
      ) b),
    'subjects', (
      select coalesce(jsonb_agg(jsonb_build_object('subject', x.subject, 'sessions', x.n, 'tutors', x.tutors) order by x.n desc, x.subject), '[]'::jsonb)
      from (
        select s.subject, count(*) as n,
               (select count(*) from public.tutor_subjects ts
                  join public.profiles p on p.id = ts.tutor_id and p.role in ('tutor', 'both')
                 where ts.subject = s.subject) as tutors
        from public.sessions s
        where s.status <> 'cancelled' and coalesce(s.session_date, s.created_at::date) >= since
        group by s.subject
        order by n desc, s.subject
        limit 8
      ) x),
    'unmet', (
      select coalesce(jsonb_agg(jsonb_build_object('subject', u.subject, 'searches', u.n, 'tutors', u.tutors) order by u.n desc, u.subject), '[]'::jsonb)
      from (
        select e.subject, count(*) as n,
               (select count(*) from public.tutor_subjects ts
                  join public.profiles p on p.id = ts.tutor_id and p.role in ('tutor', 'both')
                 where ts.subject = e.subject) as tutors
        from public.search_events e
        where e.results = 0 and e.created_at >= since
        group by e.subject
        order by n desc, e.subject
        limit 8
      ) u)
  );
end;
$$;
revoke execute on function public.insights(integer) from public, anon;
grant  execute on function public.insights(integer) to authenticated;
