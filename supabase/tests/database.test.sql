-- Database tests: every security rule and trigger the app relies on, run as
-- the real roles (a tutor, a student, a moderator, an outsider and a
-- signed-out visitor). Run with `npm run test:db`; any failure stops the run.
\set ON_ERROR_STOP on
\set QUIET on
\set VERBOSITY terse
\pset tuples_only on
\pset format unaligned

-- ok(condition, label): passes or stops the run.
create function pg_temp.ok(cond boolean, label text) returns void language plpgsql as $$
begin
  if cond is not true then raise exception 'FAIL: %', label; end if;
  raise notice 'ok - %', label;
end $$;

-- fails(sql, label, pattern): the statement must be refused with an error
-- matching pattern.
create function pg_temp.fails(stmt text, label text, pattern text default '%') returns void language plpgsql as $$
begin
  begin
    execute stmt;
  exception when others then
    if sqlerrm not ilike pattern then
      raise exception 'FAIL: % (wrong error: %)', label, sqlerrm;
    end if;
    raise notice 'ok - % (refused: %)', label, sqlerrm;
    return;
  end;
  raise exception 'FAIL: % (it was allowed)', label;
end $$;

-- sign_in(uid): who auth.uid() returns ('' = signed out).
create function pg_temp.sign_in(uid text) returns void language sql as
  $$ select set_config('request.jwt.claim.sub', uid, false) $$;

\set A '''aaaaaaaa-0000-0000-0000-000000000001'''
\set B '''bbbbbbbb-0000-0000-0000-000000000002'''
\set M '''cccccccc-0000-0000-0000-000000000003'''
\set C '''dddddddd-0000-0000-0000-000000000004'''
\set D '''eeeeeeee-0000-0000-0000-000000000005'''

insert into auth.users(id, email) values (:A,'a@x'), (:B,'b@x'), (:M,'m@x'), (:C,'c@x'), (:D,'d@x');
insert into public.profiles(id, email, full_name, role, phone) values
  (:A, 'a@x', 'Alex Kim',     'tutor',   '7135550100'),
  (:B, 'b@x', 'Ben Lee',      'student', '7135550111'),
  (:M, 'm@x', 'Ms Moderator', 'student', null),
  (:C, 'c@x', 'Cal Out',      'student', null);
update public.profiles set is_moderator = true where id = :M;

-- A school day a few days ahead, and a Saturday.
create temp table d as
  select (select g::date from generate_series(public.school_today() + 3, public.school_today() + 10, '1 day') g
          where extract(isodow from g) <= 5 limit 1) as day,
         (select g::date from generate_series(public.school_today() + 1, public.school_today() + 8, '1 day') g
          where extract(isodow from g) = 6 limit 1) as saturday;
grant select on d to authenticated;
create temp table ids (name text primary key, id uuid);
grant all on ids to authenticated;


\echo '--- signed out'
select pg_temp.sign_in('');
set role anon;
select pg_temp.fails('select id from public.profiles', 'visitors cannot list profiles', '%permission denied%');
select pg_temp.fails('select public.delete_my_account()', 'visitors cannot delete accounts', '%permission denied%');
reset role;


\echo '--- new user D finishing sign-up (the app''s upsert)'
select pg_temp.sign_in(:D);
set role authenticated;
insert into public.profiles(id, email, full_name, role) values (:D, 'd@x', 'Dana Ng', 'student')
  on conflict (id) do update set email = excluded.email, full_name = excluded.full_name, role = excluded.role;
update public.profiles set bio = 'New here', phone = '7135550199' where id = :D;
select pg_temp.ok((select phone from public.get_my_profile()) = '7135550199', 'D reads own phone through get_my_profile');
reset role;


\echo '--- tutor A'
select pg_temp.sign_in(:A);
set role authenticated;
insert into public.tutor_availability(tutor_id, period) values (:A, 3), (:A, 5);
select pg_temp.fails(format('insert into public.tutor_availability(tutor_id, period) values (%L, 3)', :A),
                     'the same free block twice', '%duplicate%');
insert into public.tutor_subjects(tutor_id, subject) values (:A, 'SAT Math');
insert into public.push_tokens(user_id, token, platform) values (:A, 'ExponentPushToken[A]', 'ios');
select pg_temp.fails(format('update public.profiles set is_moderator = true where id = %L', :A),
                     'making yourself a moderator', '%moderator%');
update public.profiles set session_count = 999, bio = 'hi' where id = :A;
reset role;
select pg_temp.ok((select session_count = 0 and bio = 'hi' from public.profiles where id = :A),
                  'stats can''t be edited by hand, the bio can');


\echo '--- student B'
select pg_temp.sign_in(:B);
set role authenticated;
insert into public.tutor_availability(tutor_id, period) values (:B, 3);
insert into public.push_tokens(user_id, token, platform) values (:B, 'ExponentPushToken[B]', 'android');

select pg_temp.fails('select phone from public.profiles', 'reading phone numbers from profiles', '%permission denied%');
select pg_temp.fails('select * from public.profiles', 'select * on profiles (includes phone)', '%permission denied%');
select pg_temp.ok((select count(*) from public.profiles where full_name <> '') >= 4, 'profiles are readable without phone');
select pg_temp.ok(public.shared_phone(:A) is null, 'A''s phone stays private until shared');
select pg_temp.ok((select phone is null and show_phone = false from public.search_tutors(student_id => :B) where id = :A),
                  'search hides A''s phone');
select pg_temp.ok((select availability = '[{"period": 3}, {"period": 5}]'::jsonb
                   from public.search_tutors(student_id => :B, match_schedule => true) where id = :A),
                  'match my schedule finds A with free blocks');

insert into public.sessions(tutor_id, student_id, subject, period, session_date)
  select :A, :B, 'SAT Math', 3, day from d;
insert into ids select 'first', id from public.sessions where student_id = :B;
select pg_temp.ok((select status = 'pending' and day is not null from public.sessions where id = (select id from ids)), 'B booked A, pending');
select pg_temp.fails(format('insert into public.sessions(tutor_id, student_id, subject, period, session_date) select %L, %L, %L, 3, day from d', :A, :B, 'SAT Math'),
                     'double-booking a block', '%duplicate%');
select pg_temp.fails(format('insert into public.sessions(tutor_id, student_id, subject, period, session_date) select %L, %L, %L, 5, saturday from d', :A, :B, 'SAT Math'),
                     'booking a Saturday', '%school days%');
select pg_temp.fails(format('insert into public.sessions(tutor_id, student_id, subject, period, session_date) values (%L, %L, %L, 5, public.school_today() - 7)', :A, :B, 'SAT Math'),
                     'booking in the past', '%4 weeks%');
select pg_temp.fails(format('insert into public.sessions(tutor_id, student_id, subject, period, session_date) select %L, %L, %L, 1, day from d', :A, :B, 'SAT Math'),
                     'booking a block the tutor isn''t free', '%isn''t free%');
select pg_temp.fails(format('insert into public.sessions(tutor_id, student_id, subject, period, session_date) select %L, %L, %L, 3, day from d', :B, :B, 'SAT Math'),
                     'booking yourself', '%yourself%');
select pg_temp.fails('update public.sessions set status = ''confirmed''', 'a student confirming', '%tutor%');
select pg_temp.fails(format('insert into public.reviews(session_id, reviewer_id, tutor_id, rating) select id, %L, %L, 5 from ids', :B, :A),
                     'reviewing before the session happened', '%row-level security%');
select pg_temp.ok((select count(*) = 1 from public.tutor_booked_slots(:A, public.school_today(), public.school_today() + 28)),
                  'A''s booked block shows as busy');
insert into public.messages(session_id, sender_id, body) select id, :B, 'Hi! Can we go over problem set 3?' from ids;
reset role;


\echo '--- outsider C'
select pg_temp.sign_in(:C);
set role authenticated;
insert into public.tutor_availability(tutor_id, period) values (:C, 2);
reset role;
select pg_temp.sign_in(:B);
set role authenticated;
select pg_temp.fails(format('insert into public.sessions(tutor_id, student_id, subject, period, session_date) select %L, %L, %L, 2, day from d', :C, :B, 'SAT Math'),
                     'booking someone who isn''t tutoring', '%isn''t tutoring%');
reset role;
select pg_temp.sign_in(:C);
set role authenticated;
select pg_temp.ok((select count(*) = 0 from public.sessions), 'C can''t see other people''s sessions');
select pg_temp.ok((select count(*) = 0 from public.messages), 'C can''t read their chat');
select pg_temp.fails(format('insert into public.messages(session_id, sender_id, body) select id, %L, %L from ids', :C, 'hey'),
                     'C posting in their chat', '%row-level security%');
insert into public.reports(reporter_id, reported_user_id, reason) values (:C, :A, 'Spam');
reset role;


\echo '--- tutor A runs the session'
select pg_temp.sign_in(:A);
set role authenticated;
update public.sessions set status = 'confirmed' where id = (select id from ids where name = 'first');
select pg_temp.fails('update public.sessions set status = ''completed'' where id in (select id from ids)', 'completing before the day', '%%');
select pg_temp.fails('update public.sessions set period = 5 where id in (select id from ids)', 'moving a session', '%%');
select pg_temp.ok((select count(*) = 1 from public.messages), 'A reads the chat');
update public.profiles set show_phone = true where id = :A;
reset role;

select pg_temp.sign_in('');
update public.sessions set session_date = public.school_today() - 1 where id = (select id from ids where name = 'first');   -- time passes

select pg_temp.sign_in(:A);
set role authenticated;
update public.sessions set status = 'completed' where id = (select id from ids where name = 'first');
select pg_temp.fails('update public.sessions set verified_at = now() where id in (select id from ids)', 'a tutor verifying their own hours', '%moderator%');
reset role;
select pg_temp.ok((select session_count = 1 from public.profiles where id = :A), 'completing counts the session');


\echo '--- student B after the session'
select pg_temp.sign_in(:B);
set role authenticated;
select pg_temp.ok(public.shared_phone(:A) = '7135550100', 'A''s phone is shared once A switches it on');
select pg_temp.ok((select phone = '7135550100' from public.search_tutors() where id = :A), 'search shows a shared phone');
select pg_temp.fails(format('insert into public.reviews(session_id, reviewer_id, tutor_id, rating) select id, %L, %L, 5 from ids', :B, :D),
                     'reviewing a different tutor for the session', '%row-level security%');
insert into public.reviews(session_id, reviewer_id, tutor_id, rating, comment)
  select id, :B, :A, 5, 'Really clear explanations' from ids;
reset role;
select pg_temp.ok((select avg_rating = 5 and review_count = 1 from public.profiles where id = :A), 'the review updates A''s rating');

select pg_temp.sign_in(:C);
set role authenticated;
select pg_temp.fails(format('insert into public.reviews(session_id, reviewer_id, tutor_id, rating) select id, %L, %L, 1 from ids', :C, :A),
                     'a fake review from someone who wasn''t there', '%row-level security%');
select pg_temp.ok(public.shared_phone(:A) = '7135550100', 'C sees the shared number too');
insert into public.blocked_users(blocker_id, blocked_id) values (:C, :A);
select pg_temp.ok(public.shared_phone(:A) is null, 'blocking hides the number');
reset role;


\echo '--- moderator M'
select pg_temp.sign_in(:M);
set role authenticated;
update public.sessions set verified_at = now() where id = (select id from ids where name = 'first');
select pg_temp.ok((select verified_by = :M from public.sessions where id = (select id from ids where name = 'first')), 'M verifies the hours');
update public.reports set reviewed = true, reviewed_by = :M, reviewed_at = now() where reporter_id = :C;
select pg_temp.ok((select count(*) = 1 from public.reports where reviewed and reporter_id = :C), 'M reviews the report');
select pg_temp.ok((select count(*) = 1 from public.messages where session_id = (select id from ids where name = 'first')), 'M can read a reported chat');
select pg_temp.ok((select sessions_completed >= 1 and hours_tutored > 0 from public.community_stats()), 'community stats count it');
reset role;

select pg_temp.ok((select count(*) >= 3 from net.requests where url like '%exp.host%'), 'push notifications were sent');


\echo '--- deleting accounts'
select pg_temp.sign_in(:B);
set role authenticated;
select public.delete_my_account();
reset role;
select pg_temp.ok(not exists (select 1 from auth.users where id = :B), 'B''s login is gone');
select pg_temp.ok(not exists (select 1 from public.profiles where id = :B), 'B''s profile is gone');
select pg_temp.ok(not exists (select 1 from public.sessions where id in (select id from ids)), 'B''s sessions and chat are gone');
select pg_temp.ok(not exists (select 1 from public.push_tokens where user_id = :B), 'B''s phone stops getting pushes');
select pg_temp.ok((select review_count = 0 and avg_rating = 0 from public.profiles where id = :A), 'A''s rating drops B''s review');

select pg_temp.sign_in(:M);
set role authenticated;
select public.delete_my_account();
reset role;
select pg_temp.ok((select reviewed and reviewed_by is null from public.reports where reporter_id = :C), 'a deleted moderator leaves the report reviewed');

\echo 'All database tests passed.'
