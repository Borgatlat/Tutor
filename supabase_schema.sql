-- ============================================================
-- STRAKE JESUIT TUTOR MARKETPLACE — Complete Supabase Schema
-- ============================================================
-- Paste this entire file into:
--   Supabase Dashboard → SQL Editor → New query → Run
-- ============================================================


-- ─────────────────────────────────────────────────────────────
-- 0. Extensions
-- ─────────────────────────────────────────────────────────────
create extension if not exists pg_trgm;


-- ─────────────────────────────────────────────────────────────
-- 1. PROFILES
--    One row per user, linked to auth.users
-- ─────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  email           text not null,
  full_name       text not null default '',
  role            text not null default 'student'
                    check (role in ('student', 'tutor', 'both')),
  bio             text,
  phone           text,
  avatar_url      text,
  -- Denormalised stats (updated by triggers)
  avg_rating      numeric(3,2) default 0,
  review_count    integer      default 0,
  session_count   integer      default 0,
  created_at      timestamptz  default now()
);

alter table public.profiles enable row level security;

-- Anyone logged-in can read any profile
create policy "profiles: read all"
  on public.profiles for select
  using (true);

-- Users can only insert / update their own row
create policy "profiles: insert own"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles: update own"
  on public.profiles for update
  using (auth.uid() = id);


-- ─────────────────────────────────────────────────────────────
-- 2. TUTOR SUBJECTS
-- ─────────────────────────────────────────────────────────────
create table if not exists public.tutor_subjects (
  id         bigint generated always as identity primary key,
  tutor_id   uuid not null references public.profiles(id) on delete cascade,
  subject    text not null,
  grade      text,                        -- e.g. "A+", "1540", "95%"
  unique (tutor_id, subject)
);

alter table public.tutor_subjects enable row level security;

create policy "tutor_subjects: read all"
  on public.tutor_subjects for select
  using (true);

create policy "tutor_subjects: write own"
  on public.tutor_subjects for all
  using (auth.uid() = tutor_id)
  with check (auth.uid() = tutor_id);


-- ─────────────────────────────────────────────────────────────
-- 3. TUTOR AVAILABILITY
-- ─────────────────────────────────────────────────────────────
create table if not exists public.tutor_availability (
  id         bigint generated always as identity primary key,
  tutor_id   uuid not null references public.profiles(id) on delete cascade,
  day        text not null check (day in ('Mon','Tue','Wed','Thu','Fri')),
  period     integer not null check (period between 1 and 8),
  unique (tutor_id, day, period)
);

alter table public.tutor_availability enable row level security;

create policy "availability: read all"
  on public.tutor_availability for select
  using (true);

create policy "availability: write own"
  on public.tutor_availability for all
  using (auth.uid() = tutor_id)
  with check (auth.uid() = tutor_id);


-- ─────────────────────────────────────────────────────────────
-- 4. SESSIONS
-- ─────────────────────────────────────────────────────────────
create table if not exists public.sessions (
  id          uuid primary key default gen_random_uuid(),
  tutor_id    uuid not null references public.profiles(id) on delete cascade,
  student_id  uuid not null references public.profiles(id) on delete cascade,
  subject     text not null,
  day         text not null check (day in ('Mon','Tue','Wed','Thu','Fri')),
  period      integer not null check (period between 1 and 8),
  notes       text,
  status      text not null default 'pending'
                check (status in ('pending','confirmed','completed','cancelled')),
  created_at  timestamptz default now()
);

alter table public.sessions enable row level security;

-- Tutor or student involved can read their sessions
create policy "sessions: read own"
  on public.sessions for select
  using (auth.uid() = tutor_id or auth.uid() = student_id);

-- Only students can create sessions
create policy "sessions: student insert"
  on public.sessions for insert
  with check (auth.uid() = student_id);

-- Tutor or student can update status
create policy "sessions: update own"
  on public.sessions for update
  using (auth.uid() = tutor_id or auth.uid() = student_id);


-- ─────────────────────────────────────────────────────────────
-- 5. REVIEWS
-- ─────────────────────────────────────────────────────────────
create table if not exists public.reviews (
  id           uuid primary key default gen_random_uuid(),
  session_id   uuid not null references public.sessions(id) on delete cascade,
  reviewer_id  uuid not null references public.profiles(id) on delete cascade,
  tutor_id     uuid not null references public.profiles(id) on delete cascade,
  rating       integer not null check (rating between 1 and 5),
  comment      text,
  created_at   timestamptz default now(),
  unique (session_id, reviewer_id)  -- one review per session per user
);

alter table public.reviews enable row level security;

create policy "reviews: read all"
  on public.reviews for select
  using (true);

create policy "reviews: insert own"
  on public.reviews for insert
  with check (auth.uid() = reviewer_id);


-- ─────────────────────────────────────────────────────────────
-- 6. TRIGGERS — keep denormalised stats up to date
-- ─────────────────────────────────────────────────────────────

-- 6a. Update avg_rating + review_count when a review is added/deleted
create or replace function public.update_tutor_rating()
returns trigger language plpgsql security definer as $$
begin
  update public.profiles
  set
    avg_rating   = (select round(avg(rating)::numeric, 2) from public.reviews where tutor_id = coalesce(new.tutor_id, old.tutor_id)),
    review_count = (select count(*)                       from public.reviews where tutor_id = coalesce(new.tutor_id, old.tutor_id))
  where id = coalesce(new.tutor_id, old.tutor_id);
  return coalesce(new, old);
end;
$$;

drop trigger if exists on_review_change on public.reviews;
create trigger on_review_change
  after insert or delete on public.reviews
  for each row execute function public.update_tutor_rating();

-- 6b. Update session_count when a session is marked completed
create or replace function public.update_tutor_session_count()
returns trigger language plpgsql security definer as $$
begin
  if new.status = 'completed' and (old.status is null or old.status <> 'completed') then
    update public.profiles
    set session_count = session_count + 1
    where id = new.tutor_id;
  end if;
  return new;
end;
$$;

drop trigger if exists on_session_complete on public.sessions;
create trigger on_session_complete
  after update on public.sessions
  for each row execute function public.update_tutor_session_count();


-- ─────────────────────────────────────────────────────────────
-- 7. SEARCH FUNCTION
--    → Canonical definition is in section 10 (student_availability)
--      where it gains student_id + match_schedule params.
--      Nothing to create here; the later CREATE OR REPLACE wins.
-- ─────────────────────────────────────────────────────────────


-- ─────────────────────────────────────────────────────────────
-- 8. STORAGE BUCKET for avatars
-- ─────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Anyone can view avatars (public bucket)
create policy "avatars: public read"
  on storage.objects for select
  using (bucket_id = 'avatars');

-- Users can upload / replace their own avatar
create policy "avatars: upload own"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "avatars: update own"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );


-- ─────────────────────────────────────────────────────────────
-- 9. AUTO-CONFIRM school emails (optional — remove if you want
--    manual review of every sign-up)
-- ─────────────────────────────────────────────────────────────
-- The app enforces @mail.strakejesuit.org on the client.
-- Supabase will still send the OTP verification email as required
-- by Apple. No extra SQL needed for that.


-- ─────────────────────────────────────────────────────────────
-- 10. STUDENT AVAILABILITY
--     Stores each student's free periods so the search algorithm
--     can boost and filter tutors who share those slots.
-- ─────────────────────────────────────────────────────────────
create table if not exists public.student_availability (
  student_id uuid    not null references public.profiles(id) on delete cascade,
  day        text    not null,
  period     integer not null check (period between 1 and 8),
  primary key (student_id, day, period)
);

alter table public.student_availability enable row level security;

-- Users manage their own rows
create policy "student_availability: manage own"
  on public.student_availability for all
  using  (auth.uid() = student_id)
  with check (auth.uid() = student_id);

create index if not exists student_avail_student_idx on public.student_availability (student_id);


-- ─────────────────────────────────────────────────────────────
-- Also add period constraint to tutor_availability for consistency
-- ─────────────────────────────────────────────────────────────
-- (Safe to run even if constraint already exists — caught by the
--  "if not exists" pattern on the table above)


-- ─────────────────────────────────────────────────────────────
-- Updated search_tutors RPC
--   • student_id  → adds per-overlap score boost (0.2 per shared slot)
--   • match_schedule → hard-filter: only return tutors with ≥1 overlap
-- ─────────────────────────────────────────────────────────────
create or replace function public.search_tutors(
  query_name     text    default '',
  filter_subject text    default null,
  filter_day     text    default null,
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
    (
      -- Name similarity
      case when query_name = '' then 1.0
           else similarity(p.full_name, query_name)
      end
      -- Rating + experience bonus
      + coalesce(p.avg_rating, 0) * 0.1
      + least(coalesce(p.session_count, 0), 50) * 0.005
      -- Schedule overlap boost: +0.20 per shared free period
      + case
          when student_id is null then 0
          else (
            select count(*)::float * 0.20
            from public.tutor_availability ta
            join public.student_availability sa
              on  ta.day    = sa.day
              and ta.period = sa.period
            where ta.tutor_id  = p.id
              and sa.student_id = search_tutors.student_id
          )
        end
    ) as score
  from public.profiles p
  where
    -- Only tutors or both
    (p.role = 'tutor' or p.role = 'both')
    -- Name filter
    and (
      query_name = ''
      or similarity(p.full_name, query_name) > 0.1
    )
    -- Subject filter
    and (
      filter_subject is null
      or exists (
        select 1 from public.tutor_subjects ts
        where ts.tutor_id = p.id and ts.subject = filter_subject
      )
    )
    -- Day + period filter
    and (
      filter_day is null
      or exists (
        select 1 from public.tutor_availability ta
        where ta.tutor_id = p.id
          and (filter_day    is null or ta.day    = filter_day)
          and (filter_period is null or ta.period = filter_period)
      )
    )
    -- "Match my schedule" hard filter: tutor must share ≥1 period with student
    and (
      not match_schedule
      or student_id is null
      or exists (
        select 1
        from public.tutor_availability ta
        join public.student_availability sa
          on  ta.day    = sa.day
          and ta.period = sa.period
        where ta.tutor_id  = p.id
          and sa.student_id = search_tutors.student_id
      )
    )
    -- Exclude blocked users (mutual)
    and not exists (
      select 1 from public.blocked_users bu
      where (bu.blocker_id = auth.uid() and bu.blocked_id = p.id)
         or (bu.blocker_id = p.id       and bu.blocked_id = auth.uid())
    )
  order by score desc;
end;
$$;


-- ─────────────────────────────────────────────────────────────
-- 11. REPORTS  (Apple App Store guideline 5.1.1 / UGC compliance)
-- ─────────────────────────────────────────────────────────────
create table if not exists public.reports (
  id               uuid primary key default gen_random_uuid(),
  reporter_id      uuid not null references public.profiles(id) on delete cascade,
  reported_user_id uuid not null references public.profiles(id) on delete cascade,
  reason           text not null,
  details          text,
  reviewed         boolean not null default false,
  created_at       timestamptz not null default now()
);

-- RLS
alter table public.reports enable row level security;

-- Any signed-in user can file a report
create policy "reports: insert own"
  on public.reports for insert
  with check (auth.uid() = reporter_id);

-- Reporter can see their own reports
create policy "reports: select own"
  on public.reports for select
  using (auth.uid() = reporter_id);

-- Index for admin review queue
create index if not exists reports_reviewed_idx on public.reports (reviewed, created_at desc);


-- ─────────────────────────────────────────────────────────────
-- 11. BLOCKED USERS  (Apple App Store guideline 5.1.1 / UGC compliance)
-- ─────────────────────────────────────────────────────────────
create table if not exists public.blocked_users (
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id)
);

-- RLS
alter table public.blocked_users enable row level security;

-- Users can manage their own block list
create policy "blocked_users: manage own"
  on public.blocked_users for all
  using  (auth.uid() = blocker_id)
  with check (auth.uid() = blocker_id);

-- Index for fast lookup during search
create index if not exists blocked_users_blocker_idx on public.blocked_users (blocker_id);


-- Blocked-user RPC version superseded by the comprehensive
-- search_tutors in section 10. No duplicate needed here.


-- ─────────────────────────────────────────────────────────────
-- Done! Tables created:
--   profiles, tutor_subjects, tutor_availability, student_availability,
--   sessions, reviews, reports, blocked_users
-- Storage bucket: avatars
-- RPC function:   search_tutors(query_name, filter_subject, filter_day,
--                               filter_period, student_id, match_schedule)
-- ─────────────────────────────────────────────────────────────
