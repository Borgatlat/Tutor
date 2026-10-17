-- ============================================================
-- STRAKE JESUIT TUTORS: migration 004
-- Community Time (CT) and lunch as free times
-- ============================================================
-- Run after 001–003 (SQL Editor, or `supabase db push`).
-- Safe to run more than once.
--
-- Blocks B1–B8 are stored as 1–8. Community Time (9:10–10:00 on Regular
-- Order days) is stored as 9, A Lunch as 10 and B Lunch as 11, so they use
-- the same `period` column; the app shows them by name.
-- ============================================================

alter table public.tutor_availability   drop constraint if exists tutor_availability_period_check;
alter table public.tutor_availability   add  constraint tutor_availability_period_check   check (period between 1 and 11);

alter table public.student_availability drop constraint if exists student_availability_period_check;
alter table public.student_availability add  constraint student_availability_period_check check (period between 1 and 11);

alter table public.sessions             drop constraint if exists sessions_period_check;
alter table public.sessions             add  constraint sessions_period_check             check (period between 1 and 11);

-- Push notifications say "Community Time" / "A Lunch", not "Block 9".
create or replace function public.block_name(p integer)
returns text language sql immutable as
$$ select case p when 9 then 'Community Time' when 10 then 'A Lunch' when 11 then 'B Lunch'
                 else 'Block ' || p end $$;

create or replace function public.session_when(s public.sessions)
returns text language sql stable as
$$ select to_char(s.session_date, 'Dy, Mon FMDD') || ' · ' || public.block_name(s.period) $$;
