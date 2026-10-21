-- ============================================================
-- STRAKE JESUIT TUTORS: migration 007
-- Email notifications (Resend), opt-in only
-- ============================================================
-- Run after 001–006 (SQL Editor, or `supabase db push`).
-- Safe to run more than once.
--
-- Emails go out only to people who ticked "I agree to receive emails about my
-- tutoring sessions from BetterU LLC" (profiles.email_opt_in, off by default).
-- Every opt-in and opt-out is recorded with the time and wording shown.
-- Each email says who sent it, why, and how to turn emails off.
--
-- Setup (once): keep the Resend key out of GitHub by storing it in the Vault:
--   select vault.create_secret('re_…your key…', 'resend_api_key');
--   select vault.create_secret('Strake Jesuit Tutors <tutors@your-verified-domain>', 'resend_from');
-- and make sure the pg_net extension is on (Database → Extensions).
-- Without the key, nothing is sent and nothing breaks.
-- ============================================================

alter table public.profiles add column if not exists email_opt_in    boolean not null default false;
alter table public.profiles add column if not exists email_opt_in_at timestamptz;
-- (Not added to the column grant in 003: other students can't see these.)

-- The record of consent: who, yes or no, when, and the exact words they saw.
create table if not exists public.email_consents (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  opted_in   boolean not null,
  wording    text not null,
  created_at timestamptz not null default now()
);
alter table public.email_consents enable row level security;
drop policy if exists "email_consents: read own" on public.email_consents;
create policy "email_consents: read own"
  on public.email_consents for select using (auth.uid() = user_id);

create or replace function public.email_consent_wording()
returns text language sql immutable as $$
  select 'I agree to receive emails about my tutoring sessions (new requests, confirmations and cancellations) from BetterU LLC. I can turn them off anytime in Profile.'
$$;

create or replace function public.record_email_consent()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' and not new.email_opt_in then return new; end if;
  if tg_op = 'UPDATE' and new.email_opt_in is not distinct from old.email_opt_in then return new; end if;
  new.email_opt_in_at := case when new.email_opt_in then now() end;
  return new;
end;
$$;

create or replace function public.log_email_consent()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' and not new.email_opt_in then return new; end if;
  if tg_op = 'UPDATE' and new.email_opt_in is not distinct from old.email_opt_in then return new; end if;
  insert into public.email_consents (user_id, opted_in, wording)
  values (new.id, new.email_opt_in, public.email_consent_wording());
  return new;
end;
$$;

drop trigger if exists record_email_consent on public.profiles;
create trigger record_email_consent
  before insert or update of email_opt_in on public.profiles
  for each row execute function public.record_email_consent();

drop trigger if exists log_email_consent on public.profiles;
create trigger log_email_consent
  after insert or update of email_opt_in on public.profiles
  for each row execute function public.log_email_consent();


-- Sends one email through Resend, only to someone who opted in. Never raises:
-- a failed email must not undo a booking.
create or replace function public.send_email(target uuid, subject text, body text)
returns void language plpgsql security definer set search_path = public as $$
declare
  p       public.profiles;
  api_key text;
  sender  text;
begin
  if target is null or to_regproc('net.http_post') is null or to_regclass('vault.decrypted_secrets') is null then
    return;
  end if;
  select * into p from public.profiles where id = target;
  if p.id is null or not p.email_opt_in or coalesce(p.email, '') = '' then return; end if;

  execute 'select decrypted_secret from vault.decrypted_secrets where name = $1' into api_key using 'resend_api_key';
  execute 'select decrypted_secret from vault.decrypted_secrets where name = $1' into sender  using 'resend_from';
  if coalesce(api_key, '') = '' then return; end if;

  perform net.http_post(
    url     := 'https://api.resend.com/emails',
    headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || api_key),
    body    := jsonb_build_object(
      'from',    coalesce(nullif(sender, ''), 'Strake Jesuit Tutors <onboarding@resend.dev>'),
      'to',      jsonb_build_array(p.email),
      'subject', subject,
      'text',    'Hi ' || public.first_name(p.id) || ',' || chr(10) || chr(10)
                 || body || chr(10) || chr(10)
                 || 'Open the app: https://tutor-delta-one.vercel.app' || chr(10) || chr(10)
                 || '--' || chr(10)
                 || 'You''re getting this because you turned on email updates in Strake Jesuit Tutors, '
                 || 'a peer tutoring app by BetterU LLC. To stop these emails, open the app and turn off '
                 || 'Profile > Email updates.'
    )
  );
exception when others then
  raise warning 'send_email failed: %', sqlerrm;
end;
$$;
revoke all on function public.send_email(uuid, text, text) from public, anon, authenticated;


-- Same notifications as before (002), now also by email for people who opted in.
create or replace function public.notify_session_change()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  d jsonb := jsonb_build_object('type', 'session', 'sessionId', new.id);
  who uuid;
  msg text;
begin
  if tg_op = 'INSERT' then
    msg := public.first_name(new.student_id) || ' wants help with ' || new.subject || ', ' || public.session_when(new);
    perform public.send_push(new.tutor_id, 'New tutoring request', msg, d);
    perform public.send_email(new.tutor_id, 'New tutoring request: ' || new.subject,
      msg || '. Open the app to confirm or decline.');
  elsif new.status is distinct from old.status then
    if new.status = 'confirmed' then
      msg := public.first_name(new.tutor_id) || ' confirmed ' || new.subject || ', ' || public.session_when(new);
      perform public.send_push(new.student_id, 'Session confirmed', msg, d);
      perform public.send_email(new.student_id, 'Session confirmed: ' || new.subject, msg || '.');
    elsif new.status = 'cancelled' then
      who := case when auth.uid() = new.tutor_id then new.student_id else new.tutor_id end;
      msg := new.subject || ', ' || public.session_when(new) || ' was cancelled';
      perform public.send_push(who, 'Session cancelled', msg, d);
      perform public.send_email(who, 'Session cancelled: ' || new.subject, msg || '.');
    elsif new.status = 'completed' then
      perform public.send_push(new.student_id, 'How did it go?',
        'Leave a review for ' || public.first_name(new.tutor_id) || ' to help other students', d);
    end if;
  end if;
  return new;
end;
$$;
