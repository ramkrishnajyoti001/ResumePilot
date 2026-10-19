-- ResumePilot roles, durable workspace data, and Row Level Security.
-- Run this migration in Supabase SQL Editor before deploying.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  email text not null default '',
  phone text not null default '',
  location text not null default '',
  linkedin text not null default '',
  github text not null default '',
  portfolio text not null default '',
  professional_summary text not null default '',
  profile_data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.profiles add column if not exists profile_data jsonb not null default '{}'::jsonb;

create table if not exists public.profile_skills (
  user_id uuid not null references auth.users (id) on delete cascade,
  skill text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, skill)
);

create table if not exists public.user_roles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  role text not null check (role in ('admin', 'developer')),
  created_at timestamptz not null default now()
);

create table if not exists public.resume_drafts (
  id uuid primary key,
  owner_id uuid not null references auth.users (id) on delete cascade,
  title text not null default 'My Resume',
  target_role text not null default '',
  resume_data jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists resume_drafts_owner_id_updated_at_idx
  on public.resume_drafts (owner_id, updated_at desc);

create schema if not exists private;
revoke all on schema private from public;

create or replace function private.is_privileged()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = (select auth.uid())
      and role in ('admin', 'developer')
  );
$$;

revoke all on function private.is_privileged() from public;
grant usage on schema private to authenticated;
grant execute on function private.is_privileged() to authenticated;

alter table public.profiles enable row level security;
alter table public.profile_skills enable row level security;
alter table public.user_roles enable row level security;
alter table public.resume_drafts enable row level security;

revoke all on public.profiles, public.profile_skills, public.user_roles, public.resume_drafts from anon;
grant select, insert, update, delete on public.profiles, public.profile_skills, public.resume_drafts to authenticated;
grant select on public.user_roles to authenticated;

drop policy if exists "profiles_select_own_or_privileged" on public.profiles;
drop policy if exists "profiles_insert_own_or_privileged" on public.profiles;
drop policy if exists "profiles_update_own_or_privileged" on public.profiles;
drop policy if exists "profiles_delete_own_or_privileged" on public.profiles;
create policy "profiles_select_own_or_privileged" on public.profiles for select to authenticated using ((select auth.uid()) = id or (select private.is_privileged()));
create policy "profiles_insert_own_or_privileged" on public.profiles for insert to authenticated with check ((select auth.uid()) = id or (select private.is_privileged()));
create policy "profiles_update_own_or_privileged" on public.profiles for update to authenticated using ((select auth.uid()) = id or (select private.is_privileged())) with check ((select auth.uid()) = id or (select private.is_privileged()));
create policy "profiles_delete_own_or_privileged" on public.profiles for delete to authenticated using ((select auth.uid()) = id or (select private.is_privileged()));

drop policy if exists "profile_skills_select_own_or_privileged" on public.profile_skills;
drop policy if exists "profile_skills_insert_own_or_privileged" on public.profile_skills;
drop policy if exists "profile_skills_update_own_or_privileged" on public.profile_skills;
drop policy if exists "profile_skills_delete_own_or_privileged" on public.profile_skills;
create policy "profile_skills_select_own_or_privileged" on public.profile_skills for select to authenticated using ((select auth.uid()) = user_id or (select private.is_privileged()));
create policy "profile_skills_insert_own_or_privileged" on public.profile_skills for insert to authenticated with check ((select auth.uid()) = user_id or (select private.is_privileged()));
create policy "profile_skills_update_own_or_privileged" on public.profile_skills for update to authenticated using ((select auth.uid()) = user_id or (select private.is_privileged())) with check ((select auth.uid()) = user_id or (select private.is_privileged()));
create policy "profile_skills_delete_own_or_privileged" on public.profile_skills for delete to authenticated using ((select auth.uid()) = user_id or (select private.is_privileged()));

drop policy if exists "user_roles_select_own_or_privileged" on public.user_roles;
create policy "user_roles_select_own_or_privileged" on public.user_roles for select to authenticated using ((select auth.uid()) = user_id or (select private.is_privileged()));

drop policy if exists "resume_drafts_select_own_or_privileged" on public.resume_drafts;
drop policy if exists "resume_drafts_insert_own_or_privileged" on public.resume_drafts;
drop policy if exists "resume_drafts_update_own_or_privileged" on public.resume_drafts;
drop policy if exists "resume_drafts_delete_own_or_privileged" on public.resume_drafts;
create policy "resume_drafts_select_own_or_privileged" on public.resume_drafts for select to authenticated using ((select auth.uid()) = owner_id or (select private.is_privileged()));
create policy "resume_drafts_insert_own_or_privileged" on public.resume_drafts for insert to authenticated with check ((select auth.uid()) = owner_id or (select private.is_privileged()));
create policy "resume_drafts_update_own_or_privileged" on public.resume_drafts for update to authenticated using ((select auth.uid()) = owner_id or (select private.is_privileged())) with check ((select auth.uid()) = owner_id or (select private.is_privileged()));
create policy "resume_drafts_delete_own_or_privileged" on public.resume_drafts for delete to authenticated using ((select auth.uid()) = owner_id or (select private.is_privileged()));

-- After your own account has signed up, assign one privileged role manually:
-- insert into public.user_roles (user_id, role)
-- select id, 'developer' from auth.users where email = 'your-email@example.com'
-- on conflict (user_id) do update set role = excluded.role;
