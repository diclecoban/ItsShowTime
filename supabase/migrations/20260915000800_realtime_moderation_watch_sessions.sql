-- Add moderation primitives, watch session reliability, and realtime publication.

alter table public.comments
add column if not exists status text not null default 'visible',
add column if not exists report_count integer not null default 0;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'comments_status_known'
      and conrelid = 'public.comments'::regclass
  ) then
    alter table public.comments
    add constraint comments_status_known
    check (status in ('visible', 'reported', 'hidden'))
    not valid;
  end if;
end $$;

alter table public.comments
validate constraint comments_status_known;

create table if not exists public.comment_reports (
  id uuid primary key default gen_random_uuid(),
  comment_id uuid not null references public.comments(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  reason text not null default 'spoiler',
  created_at timestamptz not null default now(),
  unique (comment_id, user_id)
);

alter table public.comment_reports enable row level security;

drop policy if exists "Users can report comments" on public.comment_reports;
create policy "Users can report comments"
on public.comment_reports
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can read own comment reports" on public.comment_reports;
create policy "Users can read own comment reports"
on public.comment_reports
for select
to authenticated
using (auth.uid() = user_id);

create index if not exists idx_comment_reports_comment
on public.comment_reports(comment_id);

create index if not exists idx_comments_status_created
on public.comments(status, created_at desc);

create index if not exists idx_watch_sessions_user_started
on public.watch_sessions(user_id, started_at desc);

create index if not exists idx_watch_sessions_open_episode
on public.watch_sessions(user_id, episode_id)
where ended_at is null and episode_id is not null;

create or replace function public.add_table_to_supabase_realtime(table_name text)
returns void
language plpgsql
security definer
as $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = table_name
  ) then
    execute format('alter publication supabase_realtime add table public.%I', table_name);
  end if;
end;
$$;

select public.add_table_to_supabase_realtime('notifications');
select public.add_table_to_supabase_realtime('comments');
select public.add_table_to_supabase_realtime('comment_likes');
select public.add_table_to_supabase_realtime('user_library_items');
select public.add_table_to_supabase_realtime('episode_watch_progress');
select public.add_table_to_supabase_realtime('catalog_import_jobs');

drop function public.add_table_to_supabase_realtime(text);
