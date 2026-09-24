-- Product readiness data additions: comment threads, spoiler metadata, notification delivery, and deletion audit.

alter table public.comments
add column if not exists parent_comment_id uuid references public.comments(id) on delete cascade,
add column if not exists is_spoiler boolean not null default false;

create index if not exists idx_comments_parent_created
on public.comments(parent_comment_id, created_at desc)
where parent_comment_id is not null;

create index if not exists idx_comments_status_created
on public.comments(status, created_at desc);

create table if not exists public.notification_deliveries (
  id uuid primary key default gen_random_uuid(),
  notification_id uuid not null references public.notifications(id) on delete cascade,
  channel text not null check (channel in ('push', 'email')),
  status text not null default 'pending' check (status in ('pending', 'sent', 'failed')),
  provider_message_id text,
  error text,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.notification_deliveries enable row level security;

drop policy if exists "Users read own notification deliveries" on public.notification_deliveries;
create policy "Users read own notification deliveries"
on public.notification_deliveries
for select
to authenticated
using (
  exists (
    select 1 from public.notifications
    where notifications.id = notification_deliveries.notification_id
      and notifications.user_id = auth.uid()
  )
);

drop policy if exists "Admins manage notification deliveries" on public.notification_deliveries;
create policy "Admins manage notification deliveries"
on public.notification_deliveries
for all
to authenticated
using (public.is_current_user_admin())
with check (public.is_current_user_admin());

create index if not exists idx_notification_deliveries_status_created
on public.notification_deliveries(channel, status, created_at desc);

drop trigger if exists set_notification_deliveries_updated_at on public.notification_deliveries;
create trigger set_notification_deliveries_updated_at
before update on public.notification_deliveries
for each row execute function public.set_updated_at();

create table if not exists public.account_deletion_audit (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  request_id uuid references public.account_deletion_requests(id) on delete set null,
  action text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.account_deletion_audit enable row level security;

drop policy if exists "Admins read account deletion audit" on public.account_deletion_audit;
create policy "Admins read account deletion audit"
on public.account_deletion_audit
for select
to authenticated
using (public.is_current_user_admin());

create index if not exists idx_account_deletion_audit_created
on public.account_deletion_audit(created_at desc);
