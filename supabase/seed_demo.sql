-- ============================================================================
-- Demo data for judges and the demo video
-- ============================================================================
-- Run AFTER supabase_schema.sql and migrations/002, in:
--   Supabase Dashboard → SQL Editor → New query → paste → Run
--
-- Creates demo accounts you can sign in with (password for all of them:
-- DemoTutor2026!):
--
--   james.smith.demo@mail.strakejesuit.org    student (use this for the demo)
--   alex.kim.demo@mail.strakejesuit.org       tutor   (top tutor, has chats)
--   mr.thompson.demo@mail.strakejesuit.org    teacher moderator
--   + 5 more tutors and 2 more students
--
-- Dates are relative to the day you run it, so sessions always look current.
-- Safe to re-run: it deletes the previous demo accounts first (everything
-- they own is removed with them). Real accounts are never touched; demo
-- emails all end in ".demo@mail.strakejesuit.org".
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

-- Remove earlier demo data (cascades to profiles, sessions, messages, reviews).
delete from auth.users where email like '%.demo@mail.strakejesuit.org';

do $$
declare
  pw text := extensions.crypt('DemoTutor2026!', extensions.gen_salt('bf'));
  u record;
begin
  for u in
    select * from (values
      ('11111111-0000-4000-8000-000000000001'::uuid, 'alex.kim.demo',      'Alex Kim',       'tutor',   'Senior. 800 on SAT Math, took AP Calc BC as a junior. I like breaking problems into small steps.'),
      ('11111111-0000-4000-8000-000000000002'::uuid, 'luke.patel.demo',    'Luke Patel',     'tutor',   'Junior. SAT English and essays are my thing. Happy to read drafts and work on timing.'),
      ('11111111-0000-4000-8000-000000000003'::uuid, 'michael.reyes.demo', 'Michael Reyes',  'both',    'Native Spanish speaker, also strong in US History. Still working on Chemistry myself.'),
      ('11111111-0000-4000-8000-000000000004'::uuid, 'daniel.okafor.demo', 'Daniel Okafor',  'tutor',   'Senior on the math team. Geometry, Precalc and AP Calc BC.'),
      ('11111111-0000-4000-8000-000000000005'::uuid, 'ethan.nguyen.demo',  'Ethan Nguyen',   'tutor',   'Chemistry and Biology, plus AP Chem. Pre-med track, love explaining reactions.'),
      ('11111111-0000-4000-8000-000000000006'::uuid, 'matthew.garcia.demo','Matthew Garcia', 'tutor',   'Sophomore who just finished Algebra 2 and Physics. New to tutoring and excited to help.'),
      ('22222222-0000-4000-8000-000000000001'::uuid, 'james.smith.demo',   'James Smith',    'student', 'Junior working on SAT prep and Calculus.'),
      ('22222222-0000-4000-8000-000000000002'::uuid, 'ben.lee.demo',       'Ben Lee',        'student', 'Freshman, Geometry and Biology.'),
      ('22222222-0000-4000-8000-000000000003'::uuid, 'noah.brooks.demo',   'Noah Brooks',    'student', 'Sophomore, Chemistry is tough this year.'),
      ('33333333-0000-4000-8000-000000000001'::uuid, 'mr.thompson.demo',   'Mr. Thompson',   'student', 'NHS moderator. I verify service hours.')
    ) as t(id, handle, full_name, role, bio)
  loop
    insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
                            raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
                            confirmation_token, email_change, email_change_token_new, recovery_token)
    values ('00000000-0000-0000-0000-000000000000', u.id, 'authenticated', 'authenticated',
            u.handle || '@mail.strakejesuit.org', pw, now(),
            '{"provider":"email","providers":["email"]}',
            jsonb_build_object('full_name', u.full_name, 'role', u.role),
            now(), now(), '', '', '', '');

    insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), u.id, u.id::text,
            jsonb_build_object('sub', u.id::text, 'email', u.handle || '@mail.strakejesuit.org', 'email_verified', true),
            'email', now(), now(), now());

    insert into public.profiles (id, email, full_name, role, bio, setup_complete)
    values (u.id, u.handle || '@mail.strakejesuit.org', u.full_name, u.role, u.bio, true)
    on conflict (id) do update
      set email = excluded.email, full_name = excluded.full_name, role = excluded.role,
          bio = excluded.bio, setup_complete = true;
  end loop;
end $$;

update public.profiles set is_moderator = true where email = 'mr.thompson.demo@mail.strakejesuit.org';

-- Subjects (with grades where the tutor chose to share one)
insert into public.tutor_subjects (tutor_id, subject, grade) values
  ('11111111-0000-4000-8000-000000000001', 'SAT Math', '800'),
  ('11111111-0000-4000-8000-000000000001', 'AP Calculus BC', '5'),
  ('11111111-0000-4000-8000-000000000001', 'Algebra 2', 'A'),
  ('11111111-0000-4000-8000-000000000002', 'SAT English', '760'),
  ('11111111-0000-4000-8000-000000000002', 'English 3', 'A'),
  ('11111111-0000-4000-8000-000000000002', 'AP English Language', '5'),
  ('11111111-0000-4000-8000-000000000003', 'Spanish 2', null),
  ('11111111-0000-4000-8000-000000000003', 'AP Spanish Language', '5'),
  ('11111111-0000-4000-8000-000000000003', 'US History', 'A'),
  ('11111111-0000-4000-8000-000000000004', 'Geometry', 'A'),
  ('11111111-0000-4000-8000-000000000004', 'Precalculus', 'A'),
  ('11111111-0000-4000-8000-000000000004', 'AP Calculus BC', '5'),
  ('11111111-0000-4000-8000-000000000005', 'Chemistry', 'A'),
  ('11111111-0000-4000-8000-000000000005', 'AP Chemistry', '5'),
  ('11111111-0000-4000-8000-000000000005', 'Biology', 'A'),
  ('11111111-0000-4000-8000-000000000006', 'Algebra 2', 'A'),
  ('11111111-0000-4000-8000-000000000006', 'Physics', 'A')
on conflict do nothing;

-- Free blocks (students' too: "Match my schedule" uses them)
insert into public.tutor_availability (tutor_id, period)
select t.id::uuid, b from (values
  ('11111111-0000-4000-8000-000000000001', array[2,3,5]),
  ('11111111-0000-4000-8000-000000000002', array[1,6]),
  ('11111111-0000-4000-8000-000000000003', array[4,7]),
  ('11111111-0000-4000-8000-000000000004', array[2,4,6]),
  ('11111111-0000-4000-8000-000000000005', array[3,8]),
  ('11111111-0000-4000-8000-000000000006', array[5,7]),
  ('22222222-0000-4000-8000-000000000001', array[3,5,6]),
  ('22222222-0000-4000-8000-000000000002', array[2,4]),
  ('22222222-0000-4000-8000-000000000003', array[3,8])
) as t(id, blocks), unnest(t.blocks) as b
on conflict do nothing;

-- Sessions: past (done, some verified), upcoming (confirmed), and requests.
-- Inserted from the SQL editor, so the booking rules (which apply to app
-- users) don't block past dates here.
insert into public.sessions (id, tutor_id, student_id, subject, period, session_date, notes, status, verified_at, verified_by) values
  -- Alex: 12 past sessions → "Top tutor" and "10+ hours"
  ('44444444-0000-4000-8000-000000000001', '11111111-0000-4000-8000-000000000001', '22222222-0000-4000-8000-000000000001', 'SAT Math',       3, pg_temp.school_day(-15), 'Heart of Algebra section', 'completed', now(), '33333333-0000-4000-8000-000000000001'),
  ('44444444-0000-4000-8000-000000000002', '11111111-0000-4000-8000-000000000001', '22222222-0000-4000-8000-000000000001', 'SAT Math',       3, pg_temp.school_day(-12), 'Practice test review',     'completed', now(), '33333333-0000-4000-8000-000000000001'),
  ('44444444-0000-4000-8000-000000000003', '11111111-0000-4000-8000-000000000001', '22222222-0000-4000-8000-000000000002', 'Algebra 2',      2, pg_temp.school_day(-11), null,                       'completed', now(), '33333333-0000-4000-8000-000000000001'),
  ('44444444-0000-4000-8000-000000000004', '11111111-0000-4000-8000-000000000001', '22222222-0000-4000-8000-000000000001', 'AP Calculus BC', 5, pg_temp.school_day(-10), 'Related rates',            'completed', now(), '33333333-0000-4000-8000-000000000001'),
  ('44444444-0000-4000-8000-000000000005', '11111111-0000-4000-8000-000000000001', '22222222-0000-4000-8000-000000000003', 'Algebra 2',      3, pg_temp.school_day(-9),  null,                       'completed', now(), '33333333-0000-4000-8000-000000000001'),
  ('44444444-0000-4000-8000-000000000006', '11111111-0000-4000-8000-000000000001', '22222222-0000-4000-8000-000000000001', 'SAT Math',       5, pg_temp.school_day(-8),  null,                       'completed', now(), '33333333-0000-4000-8000-000000000001'),
  ('44444444-0000-4000-8000-000000000007', '11111111-0000-4000-8000-000000000001', '22222222-0000-4000-8000-000000000002', 'Algebra 2',      2, pg_temp.school_day(-7),  null,                       'completed', now(), '33333333-0000-4000-8000-000000000001'),
  ('44444444-0000-4000-8000-000000000008', '11111111-0000-4000-8000-000000000001', '22222222-0000-4000-8000-000000000001', 'AP Calculus BC', 3, pg_temp.school_day(-6),  'Series tests',             'completed', now(), '33333333-0000-4000-8000-000000000001'),
  ('44444444-0000-4000-8000-000000000009', '11111111-0000-4000-8000-000000000001', '22222222-0000-4000-8000-000000000003', 'SAT Math',       5, pg_temp.school_day(-5),  null,                       'completed', null,  null),
  ('44444444-0000-4000-8000-000000000010', '11111111-0000-4000-8000-000000000001', '22222222-0000-4000-8000-000000000001', 'SAT Math',       3, pg_temp.school_day(-4),  null,                       'completed', null,  null),
  ('44444444-0000-4000-8000-000000000011', '11111111-0000-4000-8000-000000000001', '22222222-0000-4000-8000-000000000002', 'Algebra 2',      2, pg_temp.school_day(-3),  null,                       'completed', null,  null),
  ('44444444-0000-4000-8000-000000000012', '11111111-0000-4000-8000-000000000001', '22222222-0000-4000-8000-000000000001', 'AP Calculus BC', 5, pg_temp.school_day(-2),  null,                       'completed', null,  null),
  -- Others
  ('44444444-0000-4000-8000-000000000013', '11111111-0000-4000-8000-000000000002', '22222222-0000-4000-8000-000000000001', 'SAT English',    6, pg_temp.school_day(-6),  'Essay timing',             'completed', now(), '33333333-0000-4000-8000-000000000001'),
  ('44444444-0000-4000-8000-000000000014', '11111111-0000-4000-8000-000000000002', '22222222-0000-4000-8000-000000000003', 'English 3',      1, pg_temp.school_day(-4),  null,                       'completed', null,  null),
  ('44444444-0000-4000-8000-000000000015', '11111111-0000-4000-8000-000000000004', '22222222-0000-4000-8000-000000000002', 'Geometry',       4, pg_temp.school_day(-5),  'Proofs',                   'completed', now(), '33333333-0000-4000-8000-000000000001'),
  ('44444444-0000-4000-8000-000000000016', '11111111-0000-4000-8000-000000000004', '22222222-0000-4000-8000-000000000002', 'Geometry',       2, pg_temp.school_day(-2),  null,                       'completed', null,  null),
  ('44444444-0000-4000-8000-000000000017', '11111111-0000-4000-8000-000000000005', '22222222-0000-4000-8000-000000000003', 'Chemistry',      3, pg_temp.school_day(-3),  'Stoichiometry',            'completed', null,  null),
  ('44444444-0000-4000-8000-000000000018', '11111111-0000-4000-8000-000000000003', '22222222-0000-4000-8000-000000000001', 'Spanish 2',      4, pg_temp.school_day(-1),  null,                       'completed', null,  null),
  -- Upcoming and requests (James is the demo student)
  ('44444444-0000-4000-8000-000000000019', '11111111-0000-4000-8000-000000000001', '22222222-0000-4000-8000-000000000001', 'SAT Math',       3, pg_temp.school_day(1),   'Practice test section 3', 'confirmed', null, null),
  ('44444444-0000-4000-8000-000000000020', '11111111-0000-4000-8000-000000000005', '22222222-0000-4000-8000-000000000001', 'Chemistry',      3, pg_temp.school_day(3),   'Gas laws',                'pending',   null, null),
  ('44444444-0000-4000-8000-000000000021', '11111111-0000-4000-8000-000000000001', '22222222-0000-4000-8000-000000000003', 'Algebra 2',      5, pg_temp.school_day(2),   'Logarithms',              'pending',   null, null),
  ('44444444-0000-4000-8000-000000000022', '11111111-0000-4000-8000-000000000004', '22222222-0000-4000-8000-000000000002', 'Geometry',       4, pg_temp.school_day(4),   null,                      'confirmed', null, null)
on conflict (id) do nothing;

-- Reviews (the rating triggers update each tutor's average)
insert into public.reviews (session_id, reviewer_id, tutor_id, rating, comment) values
  ('44444444-0000-4000-8000-000000000001', '22222222-0000-4000-8000-000000000001', '11111111-0000-4000-8000-000000000001', 5, 'Explained every step. My practice score went up 60 points.'),
  ('44444444-0000-4000-8000-000000000003', '22222222-0000-4000-8000-000000000002', '11111111-0000-4000-8000-000000000001', 5, 'Super patient with logs.'),
  ('44444444-0000-4000-8000-000000000005', '22222222-0000-4000-8000-000000000003', '11111111-0000-4000-8000-000000000001', 5, 'Great at finding where I was stuck.'),
  ('44444444-0000-4000-8000-000000000004', '22222222-0000-4000-8000-000000000001', '11111111-0000-4000-8000-000000000001', 5, 'Related rates finally make sense.'),
  ('44444444-0000-4000-8000-000000000013', '22222222-0000-4000-8000-000000000001', '11111111-0000-4000-8000-000000000002', 5, 'Helped me finish essays on time.'),
  ('44444444-0000-4000-8000-000000000014', '22222222-0000-4000-8000-000000000003', '11111111-0000-4000-8000-000000000002', 4, 'Good feedback on my thesis.'),
  ('44444444-0000-4000-8000-000000000015', '22222222-0000-4000-8000-000000000002', '11111111-0000-4000-8000-000000000004', 5, 'Proofs are way less scary now.'),
  ('44444444-0000-4000-8000-000000000017', '22222222-0000-4000-8000-000000000003', '11111111-0000-4000-8000-000000000005', 5, 'Best chem explanation I have had.')
on conflict do nothing;

-- A chat on James's upcoming session with Alex
insert into public.messages (session_id, sender_id, body, created_at) values
  ('44444444-0000-4000-8000-000000000019', '22222222-0000-4000-8000-000000000001', 'Hey Alex! Can we do section 3 of the practice test? I keep running out of time.', now() - interval '3 hours'),
  ('44444444-0000-4000-8000-000000000019', '11111111-0000-4000-8000-000000000001', 'For sure. Bring the test and we will work on pacing. Meet in the library?', now() - interval '2 hours 50 minutes'),
  ('44444444-0000-4000-8000-000000000019', '22222222-0000-4000-8000-000000000001', 'Library works. See you then!', now() - interval '2 hours 45 minutes');

-- Recompute session counts from the completed sessions above.
select set_config('app.internal', 'on', true);
update public.profiles p
set session_count = (select count(*) from public.sessions s where s.tutor_id = p.id and s.status = 'completed')
where p.email like '%.demo@mail.strakejesuit.org';

select full_name, role, session_count, avg_rating, review_count
from public.profiles
where email like '%.demo@mail.strakejesuit.org'
order by role desc, session_count desc;
