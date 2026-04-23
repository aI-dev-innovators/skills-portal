-- Analytics & Catalog schema for Skills Portal
-- Run this script in Supabase SQL editor.

create extension if not exists pgcrypto;

create table if not exists public.users (
  user_id text primary key,
  email text not null unique,
  display_name text,
  provider text,
  created_at timestamptz not null default now(),
  last_login_at timestamptz,
  last_seen_at timestamptz,
  is_active boolean not null default true
);

create table if not exists public.repositories (
  repository_id text primary key,
  repository_name text not null,
  full_name text not null,
  github_url text not null,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.repository_tags (
  id bigint generated always as identity primary key,
  repository_id text references public.repositories(repository_id) on delete cascade,
  tag text not null
);

create table if not exists public.skills (
  skill_id text primary key,
  skill_name text not null,
  category text,
  repository_id text not null references public.repositories(repository_id) on delete cascade,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.login_events (
  login_event_id uuid primary key default gen_random_uuid(),
  user_id text not null references public.users(user_id) on delete cascade,
  login_at timestamptz not null default now(),
  ip_address text,
  user_agent text,
  session_id text not null,
  login_status text not null check (login_status in ('ok', 'failed'))
);

create table if not exists public.skill_views (
  skill_view_id uuid primary key default gen_random_uuid(),
  user_id text not null references public.users(user_id) on delete cascade,
  skill_id text not null references public.skills(skill_id) on delete cascade,
  repository_id text not null references public.repositories(repository_id) on delete cascade,
  viewed_at timestamptz not null default now(),
  duration_seconds integer not null default 0,
  source_page text not null,
  session_id text not null
);

create table if not exists public.repository_views (
  repository_view_id uuid primary key default gen_random_uuid(),
  user_id text not null references public.users(user_id) on delete cascade,
  repository_id text not null references public.repositories(repository_id) on delete cascade,
  viewed_at timestamptz not null default now(),
  duration_seconds integer not null default 0,
  source_page text not null,
  session_id text not null
);

create table if not exists public.skill_feedback (
  skill_feedback_id uuid primary key default gen_random_uuid(),
  user_id text not null references public.users(user_id) on delete cascade,
  skill_id text not null references public.skills(skill_id) on delete cascade,
  repository_id text not null references public.repositories(repository_id) on delete cascade,
  helpful_vote text check (helpful_vote in ('helpful', 'not-helpful')),
  suggestion text,
  source_page text not null,
  session_id text not null,
  submitted_at timestamptz not null default now(),
  check (helpful_vote is not null or length(trim(coalesce(suggestion, ''))) > 0)
);

create index if not exists idx_login_events_user_time
  on public.login_events(user_id, login_at desc);

create index if not exists idx_skill_views_user_skill_time
  on public.skill_views(user_id, skill_id, viewed_at desc);

create index if not exists idx_repository_views_user_repo_time
  on public.repository_views(user_id, repository_id, viewed_at desc);

create index if not exists idx_skill_feedback_user_skill_time
  on public.skill_feedback(user_id, skill_id, submitted_at desc);

alter table public.users enable row level security;
alter table public.repositories enable row level security;
alter table public.skills enable row level security;
alter table public.login_events enable row level security;
alter table public.skill_views enable row level security;
alter table public.repository_views enable row level security;
alter table public.skill_feedback enable row level security;

-- Keep policies explicit and closed by default.
drop policy if exists users_authenticated_read on public.users;
create policy users_authenticated_read
  on public.users
  for select
  to authenticated
  using (true);

drop policy if exists repositories_authenticated_read on public.repositories;
create policy repositories_authenticated_read
  on public.repositories
  for select
  to authenticated
  using (true);

drop policy if exists skills_authenticated_read on public.skills;
create policy skills_authenticated_read
  on public.skills
  for select
  to authenticated
  using (true);

-- Writes should come from backend service role.

drop function if exists public.analytics_top_skills(integer);
create or replace function public.analytics_top_skills(top_limit integer default 10)
returns table(skill_name text, views bigint)
language sql
security definer
as $$
  select s.skill_name, count(*)::bigint as views
  from public.skill_views sv
  join public.skills s on s.skill_id = sv.skill_id
  group by s.skill_name
  order by views desc
  limit greatest(top_limit, 1);
$$;

drop function if exists public.analytics_top_repositories(integer);
create or replace function public.analytics_top_repositories(top_limit integer default 10)
returns table(repository_name text, views bigint)
language sql
security definer
as $$
  select r.repository_name, count(*)::bigint as views
  from public.repository_views rv
  join public.repositories r on r.repository_id = rv.repository_id
  group by r.repository_name
  order by views desc
  limit greatest(top_limit, 1);
$$;

drop function if exists public.analytics_active_users(integer);
create or replace function public.analytics_active_users(top_limit integer default 50)
returns table(email text, last_login_at timestamptz)
language sql
security definer
as $$
  select u.email, max(le.login_at) as last_login_at
  from public.users u
  join public.login_events le on le.user_id = u.user_id
  group by u.email
  order by last_login_at desc
  limit greatest(top_limit, 1);
$$;
