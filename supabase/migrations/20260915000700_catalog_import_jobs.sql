-- Persist catalog import state and queue TVmaze episode imports.

do $$
begin
  if not exists (select 1 from pg_type where typname = 'catalog_import_status') then
    create type catalog_import_status as enum ('pending', 'processing', 'ready', 'failed');
  end if;
end $$;

alter table public.shows
add column if not exists import_status catalog_import_status not null default 'pending',
add column if not exists import_error text,
add column if not exists last_imported_at timestamptz;

create table if not exists public.catalog_import_jobs (
  id uuid primary key default gen_random_uuid(),
  show_id uuid not null references public.shows(id) on delete cascade,
  source text not null default 'tvmaze',
  external_id integer not null,
  status catalog_import_status not null default 'pending',
  error text,
  attempts integer not null default 0,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  started_at timestamptz,
  finished_at timestamptz,
  unique (source, external_id)
);

alter table public.catalog_import_jobs enable row level security;

drop policy if exists "Users can read catalog import jobs" on public.catalog_import_jobs;
create policy "Users can read catalog import jobs"
on public.catalog_import_jobs
for select
to authenticated
using (true);

drop policy if exists "Users can create catalog import jobs" on public.catalog_import_jobs;
create policy "Users can create catalog import jobs"
on public.catalog_import_jobs
for insert
to authenticated
with check (auth.uid() = created_by);

create index if not exists idx_catalog_import_jobs_status
on public.catalog_import_jobs(status, created_at);

create index if not exists idx_shows_import_status
on public.shows(import_status);

drop trigger if exists set_catalog_import_jobs_updated_at on public.catalog_import_jobs;
create trigger set_catalog_import_jobs_updated_at
before update on public.catalog_import_jobs
for each row execute function public.set_updated_at();
