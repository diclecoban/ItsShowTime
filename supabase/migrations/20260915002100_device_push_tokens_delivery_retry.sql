-- Device push tokens plus retry/backoff metadata for notification deliveries.

create table if not exists public.device_push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  expo_push_token text not null,
  platform text not null default 'unknown',
  device_name text,
  enabled boolean not null default true,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, expo_push_token)
);

alter table public.device_push_tokens enable row level security;

drop policy if exists "Users manage own device push tokens" on public.device_push_tokens;
create policy "Users manage own device push tokens"
on public.device_push_tokens
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Admins read device push tokens" on public.device_push_tokens;
create policy "Admins read device push tokens"
on public.device_push_tokens
for select
to authenticated
using (public.is_current_user_admin());

create index if not exists idx_device_push_tokens_user_enabled
on public.device_push_tokens(user_id, enabled, last_seen_at desc);

drop trigger if exists set_device_push_tokens_updated_at on public.device_push_tokens;
create trigger set_device_push_tokens_updated_at
before update on public.device_push_tokens
for each row execute function public.set_updated_at();

alter table public.notification_deliveries
add column if not exists attempts integer not null default 0,
add column if not exists max_attempts integer not null default 5,
add column if not exists next_attempt_at timestamptz not null default now(),
add column if not exists last_attempt_at timestamptz;

create index if not exists idx_notification_deliveries_retry_pickup
on public.notification_deliveries(status, next_attempt_at, attempts, created_at)
where status in ('pending', 'failed');

create or replace function public.enqueue_notification_deliveries()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.type in ('Reminder', 'Upcoming') then
    insert into public.notification_deliveries (notification_id, channel, status, next_attempt_at)
    values (new.id, 'push', 'pending', now())
    on conflict do nothing;
  end if;

  if new.type in ('Reply', 'List', 'Product') then
    insert into public.notification_deliveries (notification_id, channel, status, next_attempt_at)
    values (new.id, 'email', 'pending', now())
    on conflict do nothing;
  end if;

  return new;
end;
$$;
