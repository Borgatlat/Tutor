-- Stand-ins for the parts of Supabase the migrations rely on (auth, storage,
-- realtime, pg_net), so they can run on a plain Postgres in tests and CI.
do $$ begin create role anon nologin; exception when duplicate_object then null; end $$; do $$ begin create role authenticated nologin; exception when duplicate_object then null; end $$; do $$ begin create role service_role nologin bypassrls; exception when duplicate_object then null; end $$;
grant usage on schema public to anon, authenticated, service_role;
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;

create schema extensions; create extension pgcrypto with schema extensions;
create schema auth;
create table auth.users (
  instance_id uuid, id uuid primary key, aud text, role text, email text unique,
  encrypted_password text, email_confirmed_at timestamptz,
  raw_app_meta_data jsonb, raw_user_meta_data jsonb,
  created_at timestamptz, updated_at timestamptz,
  confirmation_token text, email_change text, email_change_token_new text, recovery_token text
);
create table auth.identities (
  id uuid primary key, user_id uuid references auth.users on delete cascade, provider_id text not null,
  identity_data jsonb, provider text, last_sign_in_at timestamptz, created_at timestamptz, updated_at timestamptz,
  email text generated always as (lower(identity_data->>'email')) stored
);
create function auth.uid() returns uuid language sql stable as
  $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
grant usage on schema auth to anon, authenticated, service_role;

create schema storage;
create table storage.buckets (id text primary key, name text, public boolean);
create table storage.objects (id uuid default gen_random_uuid(), bucket_id text, name text);
alter table storage.objects enable row level security;
create function storage.foldername(name text) returns text[] language sql immutable as
  $$ select string_to_array(name, '/') $$;

create publication supabase_realtime;

-- pg_net stand-in: records every push request so tests can inspect them.
create schema net;
create table net.requests (id bigserial, url text, body jsonb, headers jsonb, at timestamptz default now());
create function net.http_post(url text, body jsonb default '{}', params jsonb default '{}',
                              headers jsonb default '{}', timeout_milliseconds int default 5000)
returns bigint language sql as
  $$ insert into net.requests(url, body, headers) values (url, body, headers) returning id $$;
grant usage on schema net to authenticated, service_role;
grant all on net.requests to authenticated, service_role;
grant usage on sequence net.requests_id_seq to authenticated, service_role;

-- Vault stand-in: the Resend key and sender the email functions read.
create schema vault;
create table vault.decrypted_secrets (name text primary key, decrypted_secret text);
insert into vault.decrypted_secrets values
  ('resend_api_key', 're_test_key'),
  ('resend_from', 'Strake Jesuit Tutors <tutors@example.com>');
insert into vault.decrypted_secrets values ('openai_api_key', 'sk-test');

-- pgsql-http stand-in for Ollie: answers with whatever a test puts in
-- extensions.http_reply (no row = 503) and records each request.
create domain extensions.http_method as text;
create type extensions.http_header as (field varchar, value varchar);
create type extensions.http_request as (
  method extensions.http_method, uri varchar, headers extensions.http_header[],
  content_type varchar, content varchar);
create type extensions.http_response as (
  status integer, content_type varchar, headers extensions.http_header[], content varchar);
create table extensions.http_log (uri text, headers text, content text, at timestamptz default now());
create table extensions.http_reply (status integer, content text);
create function extensions.http_header(field varchar, value varchar)
returns extensions.http_header language sql immutable as
  $$ select row(field, value)::extensions.http_header $$;
create function extensions.http_set_curlopt(curlopt varchar, value varchar)
returns boolean language sql as $$ select true $$;
create function extensions.http(r extensions.http_request)
returns extensions.http_response language plpgsql as $$
declare rep extensions.http_reply;
begin
  insert into extensions.http_log (uri, headers, content) values (r.uri, r.headers::text, r.content);
  select * into rep from extensions.http_reply limit 1;
  if rep.status is null then return row(503, 'text/plain', null, 'unavailable')::extensions.http_response; end if;
  return row(rep.status, 'application/json', null, rep.content)::extensions.http_response;
end $$;
