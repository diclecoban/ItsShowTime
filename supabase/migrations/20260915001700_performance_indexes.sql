-- Indexes for the hottest user-facing and worker queries.

create index if not exists idx_notifications_user_created
on public.notifications(user_id, created_at desc);

create index if not exists idx_notifications_user_read_created
on public.notifications(user_id, read_at, created_at desc);

create index if not exists idx_episode_watch_progress_user_watched_episode
on public.episode_watch_progress(user_id, watched, episode_id);

create index if not exists idx_catalog_import_jobs_worker_pickup
on public.catalog_import_jobs(source, status, attempts, created_at)
where status in ('pending', 'failed');

create index if not exists idx_search_cache_lookup
on public.search_cache(query, media_type, source, expires_at);
