-- Run once on an existing It’s Showtime database before testing Library/Watch backend writes.

alter table public.user_library_items
add column if not exists target_id uuid generated always as (coalesce(show_id, movie_id)) stored;

alter table public.list_items
add column if not exists target_id uuid generated always as (coalesce(show_id, movie_id)) stored;

create unique index if not exists uniq_library_item
on public.user_library_items(user_id, media_type, target_id);

create unique index if not exists uniq_list_item
on public.list_items(list_id, media_type, target_id);

create table if not exists public.account_deletion_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  reason text,
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id)
);

alter table public.account_deletion_requests enable row level security;

drop policy if exists "Users request own account deletion" on public.account_deletion_requests;
drop policy if exists "Users read own account deletion request" on public.account_deletion_requests;

create policy "Users request own account deletion"
on public.account_deletion_requests
for insert
with check (auth.uid() = user_id);

create policy "Users read own account deletion request"
on public.account_deletion_requests
for select
using (auth.uid() = user_id);
