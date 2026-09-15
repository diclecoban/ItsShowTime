-- Add notification preferences, search cache, and admin-readable operational views.

create table if not exists public.notification_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  reminders boolean not null default true,
  upcoming boolean not null default true,
  replies boolean not null default true,
  list_activity boolean not null default true,
  product_updates boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles
add column if not exists is_admin boolean not null default false;

create or replace function public.is_current_user_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

create table if not exists public.search_cache (
  id uuid primary key default gen_random_uuid(),
  query text not null,
  media_type text not null default 'Shows',
  source text not null default 'tvmaze',
  payload jsonb not null,
  result_count integer not null default 0,
  expires_at timestamptz not null default (now() + interval '7 days'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (query, media_type, source)
);

alter table public.notification_preferences enable row level security;
alter table public.search_cache enable row level security;

drop policy if exists "Users manage own notification preferences" on public.notification_preferences;
create policy "Users manage own notification preferences"
on public.notification_preferences
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Authenticated users read search cache" on public.search_cache;
create policy "Authenticated users read search cache"
on public.search_cache
for select
to authenticated
using (expires_at > now());

drop policy if exists "Authenticated users write search cache" on public.search_cache;
create policy "Authenticated users write search cache"
on public.search_cache
for insert
to authenticated
with check (true);

drop policy if exists "Authenticated users update search cache" on public.search_cache;
create policy "Authenticated users update search cache"
on public.search_cache
for update
to authenticated
using (true)
with check (true);

create index if not exists idx_search_cache_lookup
on public.search_cache(query, media_type, source, expires_at);

create index if not exists idx_deletion_requests_created
on public.account_deletion_requests(created_at desc);

drop policy if exists "Admins read account deletion requests" on public.account_deletion_requests;
create policy "Admins read account deletion requests"
on public.account_deletion_requests
for select
to authenticated
using (public.is_current_user_admin());

drop policy if exists "Admins read all notification preferences" on public.notification_preferences;
create policy "Admins read all notification preferences"
on public.notification_preferences
for select
to authenticated
using (public.is_current_user_admin());

drop trigger if exists set_notification_preferences_updated_at on public.notification_preferences;
create trigger set_notification_preferences_updated_at
before update on public.notification_preferences
for each row execute function public.set_updated_at();

drop trigger if exists set_search_cache_updated_at on public.search_cache;
create trigger set_search_cache_updated_at
before update on public.search_cache
for each row execute function public.set_updated_at();
