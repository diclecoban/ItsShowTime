-- Admin actions plus support/budget tracking.

create table if not exists public.support_campaigns (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text,
  target_amount_cents integer not null default 0,
  currency text not null default 'USD',
  current_amount_cents integer not null default 0,
  status text not null default 'active' check (status in ('active', 'paused', 'funded', 'archived')),
  external_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.support_intents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  campaign_id uuid references public.support_campaigns(id) on delete set null,
  source text not null default 'buymeacoffee',
  amount_cents integer,
  currency text not null default 'USD',
  status text not null default 'opened' check (status in ('opened', 'completed', 'cancelled')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.support_campaigns (slug, title, description, target_amount_cents, currency, external_url)
values (
  'movie-catalog-budget',
  'Movie catalog budget',
  'Funding target for unlocking broader movie catalog access in It’s Showtime.',
  50000,
  'USD',
  'https://buymeacoffee.com/diclesara'
)
on conflict (slug) do update
set
  title = excluded.title,
  description = excluded.description,
  target_amount_cents = excluded.target_amount_cents,
  currency = excluded.currency,
  external_url = excluded.external_url,
  updated_at = now();

alter table public.support_campaigns enable row level security;
alter table public.support_intents enable row level security;

drop policy if exists "Anyone can read active support campaigns" on public.support_campaigns;
create policy "Anyone can read active support campaigns"
on public.support_campaigns
for select
to anon, authenticated
using (status = 'active' or public.is_current_user_admin());

drop policy if exists "Users create own support intents" on public.support_intents;
create policy "Users create own support intents"
on public.support_intents
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users read own support intents" on public.support_intents;
create policy "Users read own support intents"
on public.support_intents
for select
to authenticated
using (auth.uid() = user_id or public.is_current_user_admin());

drop policy if exists "Admins update support campaigns" on public.support_campaigns;
create policy "Admins update support campaigns"
on public.support_campaigns
for update
to authenticated
using (public.is_current_user_admin())
with check (public.is_current_user_admin());

drop policy if exists "Authenticated users write search cache" on public.search_cache;
drop policy if exists "Authenticated users update search cache" on public.search_cache;

drop policy if exists "Admins manage search cache" on public.search_cache;
create policy "Admins manage search cache"
on public.search_cache
for all
to authenticated
using (public.is_current_user_admin())
with check (public.is_current_user_admin());

create index if not exists idx_support_campaigns_status on public.support_campaigns(status);
create index if not exists idx_support_intents_user_created on public.support_intents(user_id, created_at desc);
create index if not exists idx_support_intents_campaign on public.support_intents(campaign_id, status);

drop trigger if exists set_support_campaigns_updated_at on public.support_campaigns;
create trigger set_support_campaigns_updated_at
before update on public.support_campaigns
for each row execute function public.set_updated_at();

drop trigger if exists set_support_intents_updated_at on public.support_intents;
create trigger set_support_intents_updated_at
before update on public.support_intents
for each row execute function public.set_updated_at();
