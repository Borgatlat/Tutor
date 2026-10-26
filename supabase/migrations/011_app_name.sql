-- ============================================================
-- TUTORS FOR OTHERS: migration 011
-- The app's new name in session emails
-- ============================================================
-- Run after 001-010. Safe to run more than once.
-- The app is now called Tutors for Others (after the Jesuit motto "men and
-- women for others"). Same send_email as 007, with the new name in the
-- default sender and the footer. To change the sender you set in the Vault:
--   select vault.update_secret((select id from vault.secrets where name = 'resend_from'),
--                              'Tutors for Others <tutors@your-verified-domain>');
-- ============================================================

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
      'from',    coalesce(nullif(sender, ''), 'Tutors for Others <onboarding@resend.dev>'),
      'to',      jsonb_build_array(p.email),
      'subject', subject,
      'text',    'Hi ' || public.first_name(p.id) || ',' || chr(10) || chr(10)
                 || body || chr(10) || chr(10)
                 || 'Open the app: https://tutor-delta-one.vercel.app' || chr(10) || chr(10)
                 || '--' || chr(10)
                 || 'You''re getting this because you turned on email updates in Tutors for Others, '
                 || 'a peer tutoring app by BetterU LLC. To stop these emails, open the app and turn off '
                 || 'Profile > Email updates.'
    )
  );
exception when others then
  raise warning 'send_email failed: %', sqlerrm;
end;
$$;
revoke all on function public.send_email(uuid, text, text) from public, anon, authenticated;
