-- ============================================================
-- STRAKE JESUIT TUTORS: migration 004
-- Community Time (CT) as a free block
-- ============================================================
-- Run after 001–003 (SQL Editor, or `supabase db push`).
-- Safe to run more than once.
--
-- Community Time runs 9:10–9:50 every weekday. It's stored as block 9 so it
-- uses the same `period` column as B1–B8; the app shows it as "CT".
-- ============================================================

alter table public.tutor_availability   drop constraint if exists tutor_availability_period_check;
alter table public.tutor_availability   add  constraint tutor_availability_period_check   check (period between 1 and 9);

alter table public.student_availability drop constraint if exists student_availability_period_check;
alter table public.student_availability add  constraint student_availability_period_check check (period between 1 and 9);

alter table public.sessions             drop constraint if exists sessions_period_check;
alter table public.sessions             add  constraint sessions_period_check             check (period between 1 and 9);

-- "Block 9" reads as "Community Time" in push notifications.
create or replace function public.block_name(p integer)
returns text language sql immutable as
$$ select case when p = 9 then 'Community Time' else 'Block ' || p end $$;

create or replace function public.session_when(s public.sessions)
returns text language sql stable as
$$ select to_char(s.session_date, 'Dy, Mon FMDD') || ' · ' || public.block_name(s.period) $$;
