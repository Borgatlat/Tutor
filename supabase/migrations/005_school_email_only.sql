-- ============================================================
-- STRAKE JESUIT TUTORS: migration 005
-- Only school email accounts can sign up
-- ============================================================
-- Run after 001–004 (SQL Editor, or `supabase db push`).
-- Safe to run more than once.
--
-- The app already checks for @mail.strakejesuit.org, but that check runs on
-- the student's phone and could be skipped by calling Supabase directly. This
-- makes the database itself refuse any other address, for email sign-ups and
-- for "Continue with Google" alike (a personal Gmail gets turned away).
-- ============================================================

create or replace function public.enforce_school_email()
returns trigger language plpgsql as $$
begin
  if new.email is null or lower(new.email) !~ '^[^@]+@mail\.strakejesuit\.org$' then
    raise exception 'Only @mail.strakejesuit.org school email accounts can sign up.';
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_school_email on auth.users;
create trigger enforce_school_email
  before insert on auth.users
  for each row execute function public.enforce_school_email();

-- Changing an account's email to a non-school address is refused too.
drop trigger if exists enforce_school_email_change on auth.users;
create trigger enforce_school_email_change
  before update of email on auth.users
  for each row when (old.email is distinct from new.email)
  execute function public.enforce_school_email();
