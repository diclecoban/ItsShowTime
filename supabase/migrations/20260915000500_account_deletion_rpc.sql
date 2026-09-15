-- Run once in Supabase SQL Editor to enable real self-service account deletion.
-- The function is SECURITY DEFINER so authenticated users can delete only their own auth.users row.

create table if not exists public.account_deletion_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  reason text,
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id)
);

alter table public.account_deletion_requests
drop constraint if exists account_deletion_requests_user_id_fkey;

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

create or replace function public.delete_own_account(deletion_reason text default null)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;

  insert into public.account_deletion_requests (user_id, reason, processed_at)
  values (current_user_id, deletion_reason, now())
  on conflict (user_id) do update set
    reason = excluded.reason,
    processed_at = now();

  delete from auth.users
  where id = current_user_id;
end;
$$;

revoke all on function public.delete_own_account(text) from public;
grant execute on function public.delete_own_account(text) to authenticated;
