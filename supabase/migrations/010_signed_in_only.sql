-- ============================================================
-- STRAKE JESUIT TUTORS: migration 010
-- Tutor search only for signed-in students
-- ============================================================
-- Run after 001–009. Safe to run more than once.
--
-- Postgres lets everyone (PUBLIC) run a new function unless told otherwise,
-- and 002 only added a grant for signed-in users without taking that away.
-- So a visitor who wasn't signed in, using the app's public key, could call
-- search_tutors and list every tutor's name, school email and bio, or call
-- first_name / tutor_booked_slots with an id. Every screen that uses these
-- needs sign-in, so they're now signed-in only.
-- ============================================================

revoke execute on function public.search_tutors(text, text, text, integer, uuid, boolean) from public, anon;
grant  execute on function public.search_tutors(text, text, text, integer, uuid, boolean) to authenticated;

revoke execute on function public.first_name(uuid) from public, anon;
grant  execute on function public.first_name(uuid) to authenticated;

revoke execute on function public.tutor_booked_slots(uuid, date, date) from public, anon;
grant  execute on function public.tutor_booked_slots(uuid, date, date) to authenticated;
