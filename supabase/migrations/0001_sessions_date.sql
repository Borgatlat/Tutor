-- ============================================================================
-- Bring the database in line with the app.
--
-- Written against the LIVE database, not supabase_schema.sql, which has drifted:
--   * live search_tutors takes 4 args (filter_day, filter_period, filter_subject,
--     query_name) while the client calls it with 6 -> every search 404s, which is
--     why the app looks empty even though real tutors exist
--   * student_availability does not exist live, though the committed schema
--     defines it and the committed function joins it
--   * tutor_availability.day exists but is always null; the block schedule has
--     no day dimension
--   * sessions.day still exists and the app never writes it
--
-- Run with:  supabase db execute --file supabase/migrations/0001_sessions_date.sql
--   (or paste into the SQL editor in the Supabase dashboard)
-- Safe to run more than once.
-- ============================================================================

begin;

-- ─── 1. sessions: a booking is a DATE plus a block ──────────────────────────

alter table public.sessions
  add column if not exists session_date date;

-- Backfill from the old weekday name where there is one: the next occurrence of
-- that weekday on or after the row's creation date.
update public.sessions s
set session_date = (
  case
    when s.day in ('Mon','Tue','Wed','Thu','Fri') then
      (s.created_at::date
        + ((array_position(array['Sun','Mon','Tue','Wed','Thu','Fri','Sat'], s.day) - 1
            - extract(dow from s.created_at)::int + 7) % 7))
    else s.created_at::date
  end
)
where s.session_date is null
  and exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'sessions' and column_name = 'day'
  );

update public.sessions set session_date = current_date where session_date is null;

alter table public.sessions alter column session_date set not null;

alter table public.sessions drop constraint if exists sessions_day_check;
alter table public.sessions drop column if exists day;

create index if not exists sessions_date_idx on public.sessions (session_date);


-- ─── 2. Drop the dead day dimension on availability ─────────────────────────
-- Every role stores free blocks in tutor_availability; `day` is always null.

alter table public.tutor_availability drop column if exists day;

-- Never created in this project. The committed schema defines it and the old
-- function joined it, which is why schedule matching could never have worked.
drop table if exists public.student_availability;


-- ─── 3. search_tutors: one signature, matching the client ───────────────────
-- Removes filter_day, adds student_id and match_schedule (both already sent by
-- src/lib/supabase.js). Schedule overlap now joins tutor_availability to
-- itself, because that one table holds blocks for students and tutors alike.

drop function if exists public.search_tutors(text, text, text, integer, uuid, boolean);
drop function if exists public.search_tutors(text, integer, text, text);
drop function if exists public.search_tutors(text, text, integer, uuid, boolean);

create or replace function public.search_tutors(
  query_name     text    default '',
  filter_subject text    default null,
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
  avg_rating    numeric,
  review_count  integer,
  session_count integer,
  subjects      jsonb,
  shared_blocks integer,
  score         float
)
language plpgsql security definer as $$
begin
  return query
  select
    p.id,
    p.full_name,
    p.email,
    p.avatar_url,
    p.bio,
    p.phone,
    p.avg_rating,
    p.review_count,
    p.session_count,
    coalesce(
      (select jsonb_agg(jsonb_build_object('subject', ts.subject, 'grade', ts.grade))
       from public.tutor_subjects ts where ts.tutor_id = p.id),
      '[]'::jsonb
    ) as subjects,
    -- Surfaced so the UI can say WHY a tutor ranked where they did.
    coalesce((
      select count(*)::int
      from public.tutor_availability ta
      join public.tutor_availability sa on sa.period = ta.period
      where ta.tutor_id = p.id
        and sa.tutor_id = search_tutors.student_id
    ), 0) as shared_blocks,
    (
      case when query_name = '' then 1.0
           else similarity(p.full_name, query_name)
      end
      + coalesce(p.avg_rating, 0) * 0.1
      + least(coalesce(p.session_count, 0), 50) * 0.005
      + case
          when search_tutors.student_id is null then 0
          else coalesce((
            select count(*)::float * 0.20
            from public.tutor_availability ta
            join public.tutor_availability sa on sa.period = ta.period
            where ta.tutor_id = p.id
              and sa.tutor_id = search_tutors.student_id
          ), 0)
        end
    ) as score
  from public.profiles p
  where
    (p.role = 'tutor' or p.role = 'both')
    and (query_name = '' or similarity(p.full_name, query_name) > 0.1)
    and (
      filter_subject is null
      or exists (
        select 1 from public.tutor_subjects ts
        where ts.tutor_id = p.id and ts.subject = filter_subject
      )
    )
    and (
      filter_period is null
      or exists (
        select 1 from public.tutor_availability ta
        where ta.tutor_id = p.id and ta.period = filter_period
      )
    )
    -- "Match my schedule": tutor must share at least one free block.
    and (
      not match_schedule
      or search_tutors.student_id is null
      or exists (
        select 1
        from public.tutor_availability ta
        join public.tutor_availability sa on sa.period = ta.period
        where ta.tutor_id = p.id
          and sa.tutor_id = search_tutors.student_id
      )
    )
    -- Never return someone either side has blocked.
    and not exists (
      select 1 from public.blocked_users bu
      where (bu.blocker_id = auth.uid() and bu.blocked_id = p.id)
         or (bu.blocker_id = p.id       and bu.blocked_id = auth.uid())
    )
    -- A tutor is not their own search result.
    and (search_tutors.student_id is null or p.id <> search_tutors.student_id)
  order by score desc;
end;
$$;

commit;
