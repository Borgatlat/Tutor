-- ============================================================================
-- Judge account for the Congressional App Challenge
-- ============================================================================
-- Sign-up only accepts school emails, so judges get one prepared account.
--
-- 1. Supabase Dashboard → Authentication → Users → Add user → Create new user
--      Email:    cac.judge@mail.strakejesuit.org
--      Password: a strong password (put it ONLY in the submission form,
--                never in GitHub)
--      Auto Confirm User: on
-- 2. SQL Editor → New query → paste this file → Run.
--
-- The judge is a tutor and a student (so every screen has something to
-- show) and a moderator (so they can see Insights and verify hours). If the
-- demo data (seed_demo.sql) is loaded, they also get sessions with the demo
-- students and tutors, including one ready for check-in today.
-- Safe to re-run: it refreshes the judge's sessions to current dates.
-- ============================================================================

-- n school days from today (negative = in the past), Monday to Friday only.
create or replace function pg_temp.school_day(n int) returns date language plpgsql as $$
declare d date := (now() at time zone 'America/Chicago')::date; step int := sign(n)::int; left_ int := abs(n);
begin
  if n = 0 then
    while extract(isodow from d) > 5 loop d := d + 1; end loop;
    return d;
  end if;
  while left_ > 0 loop
    d := d + step;
    if extract(isodow from d) <= 5 then left_ := left_ - 1; end if;
  end loop;
  return d;
end $$;

do $$
declare
  judge uuid;
  alex  uuid := '11111111-0000-4000-8000-000000000001';
  james uuid := '22222222-0000-4000-8000-000000000001';
  ben   uuid := '22222222-0000-4000-8000-000000000002';
  noah  uuid := '22222222-0000-4000-8000-000000000003';
begin
  select id into judge from auth.users where lower(email) = 'cac.judge@mail.strakejesuit.org';
  if judge is null then
    raise exception 'Create the judge account first: Authentication → Users → Add user → cac.judge@mail.strakejesuit.org (Auto Confirm on).';
  end if;

  insert into public.profiles (id, email, full_name, role)
  values (judge, 'cac.judge@mail.strakejesuit.org', 'App Challenge Judge', 'both')
  on conflict (id) do nothing;
  update public.profiles
     set full_name = 'App Challenge Judge', role = 'both', setup_complete = true, is_moderator = true,
         bio = 'Judge account for the Congressional App Challenge. Tutors SAT Math and Algebra 2.'
   where id = judge;

  insert into public.tutor_subjects (tutor_id, subject, grade)
  values (judge, 'SAT Math', '780'), (judge, 'Algebra 2', 'A')
  on conflict do nothing;
  insert into public.tutor_availability (tutor_id, period)
  select judge, p from unnest(array[1, 9, 3, 6]) p
  on conflict do nothing;

  -- Sessions with the demo accounts, if the demo data is loaded.
  if exists (select 1 from public.profiles where id in (alex, james, ben, noah) having count(*) = 4) then
    delete from public.sessions where id::text like '55555555-%';
    insert into public.sessions (id, tutor_id, student_id, subject, period, session_date, notes, status, student_confirmed_at) values
      -- The judge tutors James today: tap "Check-in code" to see check-in.
      ('55555555-0000-4000-8000-000000000001', judge, james, 'Algebra 2', 9, pg_temp.school_day(0),  'Logarithm review',  'confirmed', null),
      -- A finished session confirmed by both (shows in the hours log).
      ('55555555-0000-4000-8000-000000000002', judge, ben,   'SAT Math',  3, pg_temp.school_day(-2), 'Practice section', 'completed', now() - interval '2 days'),
      -- A request waiting for the judge to confirm.
      ('55555555-0000-4000-8000-000000000003', judge, noah,  'Algebra 2', 6, pg_temp.school_day(2),  'Exponent rules',   'pending',   null),
      -- The judge as a student, booked with Alex.
      ('55555555-0000-4000-8000-000000000004', alex,  judge, 'SAT Math',  1, pg_temp.school_day(1),  'Timing strategy',  'confirmed', null);
  end if;
end $$;
