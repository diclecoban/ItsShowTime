-- Keep realtime focused on user-scoped operational surfaces.

do $$
begin
  if exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'comments'
  ) then
    alter publication supabase_realtime drop table public.comments;
  end if;

  if exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'comment_likes'
  ) then
    alter publication supabase_realtime drop table public.comment_likes;
  end if;
end $$;

drop policy if exists "Users can read catalog import jobs" on public.catalog_import_jobs;
create policy "Users can read own catalog import jobs"
on public.catalog_import_jobs
for select
to authenticated
using (created_by = auth.uid() or public.is_current_user_admin());
