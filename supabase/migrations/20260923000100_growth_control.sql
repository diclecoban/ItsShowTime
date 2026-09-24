-- Keep operational tables bounded as usage grows.

create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;
create extension if not exists supabase_vault with schema vault;

create index if not exists idx_notifications_cleanup
on public.notifications(user_id, read_at, created_at);

create index if not exists idx_activity_feed_cleanup
on public.activity_feed(user_id, created_at desc);

create index if not exists idx_edge_rate_limits_cleanup
on public.edge_rate_limits(window_start);

create index if not exists idx_search_cache_cleanup
on public.search_cache(expires_at);

create index if not exists idx_catalog_import_jobs_cleanup
on public.catalog_import_jobs(status, finished_at, created_at);

create or replace function public.run_growth_cleanup()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  deleted_expired_cache integer := 0;
  deleted_read_notifications integer := 0;
  deleted_deliveries integer := 0;
  deleted_edge_events integer := 0;
  deleted_rate_limits integer := 0;
  deleted_import_jobs integer := 0;
  deleted_activity_items integer := 0;
begin
  delete from public.search_cache
  where expires_at < now() - interval '1 day';
  get diagnostics deleted_expired_cache = row_count;

  delete from public.notifications
  where read_at is not null
    and created_at < now() - interval '90 days';
  get diagnostics deleted_read_notifications = row_count;

  delete from public.notification_deliveries
  where (
      status in ('sent', 'skipped')
      and updated_at < now() - interval '45 days'
    )
    or (
      status = 'failed'
      and updated_at < now() - interval '90 days'
    );
  get diagnostics deleted_deliveries = row_count;

  delete from public.edge_function_events
  where created_at < now() - interval '30 days';
  get diagnostics deleted_edge_events = row_count;

  delete from public.edge_rate_limits
  where window_start < now() - interval '7 days';
  get diagnostics deleted_rate_limits = row_count;

  delete from public.catalog_import_jobs
  where (
      status = 'ready'
      and coalesce(finished_at, updated_at, created_at) < now() - interval '30 days'
    )
    or (
      status = 'failed'
      and coalesce(finished_at, updated_at, created_at) < now() - interval '90 days'
    );
  get diagnostics deleted_import_jobs = row_count;

  with ranked_activity as (
    select
      id,
      row_number() over (partition by user_id order by created_at desc) as user_rank
    from public.activity_feed
  )
  delete from public.activity_feed af
  using ranked_activity ra
  where af.id = ra.id
    and (
      ra.user_rank > 300
      or af.created_at < now() - interval '180 days'
    );
  get diagnostics deleted_activity_items = row_count;

  return jsonb_build_object(
    'deletedExpiredCache', deleted_expired_cache,
    'deletedReadNotifications', deleted_read_notifications,
    'deletedNotificationDeliveries', deleted_deliveries,
    'deletedEdgeEvents', deleted_edge_events,
    'deletedRateLimits', deleted_rate_limits,
    'deletedImportJobs', deleted_import_jobs,
    'deletedActivityItems', deleted_activity_items,
    'ranAt', now()
  );
end;
$$;

revoke all on function public.run_growth_cleanup() from anon, authenticated;
grant execute on function public.run_growth_cleanup() to service_role;

create or replace function public.get_admin_summary()
returns jsonb
language sql
security definer
set search_path = public
as $$
  with recent_events as (
    select *
    from public.edge_function_events
    where created_at >= now() - interval '24 hours'
  ),
  table_counts as (
    select 'notifications' as table_name, count(*)::integer as row_count from public.notifications
    union all select 'notification_deliveries', count(*)::integer from public.notification_deliveries
    union all select 'comments', count(*)::integer from public.comments
    union all select 'activity_feed', count(*)::integer from public.activity_feed
    union all select 'search_cache', count(*)::integer from public.search_cache
    union all select 'catalog_import_jobs', count(*)::integer from public.catalog_import_jobs
    union all select 'edge_function_events', count(*)::integer from public.edge_function_events
    union all select 'edge_rate_limits', count(*)::integer from public.edge_rate_limits
  )
  select case
    when not public.is_current_user_admin() then '{}'::jsonb
    else jsonb_build_object(
      'operations', jsonb_build_object(
        'failedJobs', (select count(*)::integer from public.catalog_import_jobs where status = 'failed'),
        'pendingJobs', (select count(*)::integer from public.catalog_import_jobs where status = 'pending'),
        'processingJobs', (select count(*)::integer from public.catalog_import_jobs where status = 'processing'),
        'expiredCacheEntries', (select count(*)::integer from public.search_cache where expires_at < now()),
        'staleReadNotifications', (select count(*)::integer from public.notifications where read_at is not null and created_at < now() - interval '90 days'),
        'oldEdgeEvents', (select count(*)::integer from public.edge_function_events where created_at < now() - interval '30 days'),
        'oldDeliveries', (
          select count(*)::integer
          from public.notification_deliveries
          where (
              status in ('sent', 'skipped')
              and updated_at < now() - interval '45 days'
            )
            or (
              status = 'failed'
              and updated_at < now() - interval '90 days'
            )
        ),
        'cacheHits24h', (select count(*)::integer from recent_events where function_name = 'search-tvmaze' and event_type = 'cache_hit'),
        'cacheMisses24h', (select count(*)::integer from recent_events where function_name = 'search-tvmaze' and event_type = 'cache_miss'),
        'cacheHitRate24h', (
          select case
            when count(*) filter (where function_name = 'search-tvmaze' and event_type in ('cache_hit', 'cache_miss')) = 0 then 0
            else round(
              (
                count(*) filter (where function_name = 'search-tvmaze' and event_type = 'cache_hit')
              )::numeric * 100 /
              count(*) filter (where function_name = 'search-tvmaze' and event_type in ('cache_hit', 'cache_miss'))
            )::integer
          end
          from recent_events
        ),
        'rateLimitedSearches24h', (select count(*)::integer from recent_events where function_name = 'search-tvmaze' and event_type = 'rate_limited'),
        'edgeErrors24h', (select count(*)::integer from recent_events where event_type = 'error'),
        'slowEvents24h', (select count(*)::integer from recent_events where coalesce(duration_ms, 0) >= 1000),
        'avgSearchMs24h', (select coalesce(round(avg(duration_ms))::integer, 0) from recent_events where function_name = 'search-tvmaze' and duration_ms is not null),
        'avgImportMs24h', (select coalesce(round(avg(duration_ms))::integer, 0) from recent_events where function_name in ('request-catalog-import', 'process-catalog-imports') and duration_ms is not null)
      ),
      'tableGrowth', coalesce((
        select jsonb_agg(jsonb_build_object(
          'tableName', tc.table_name,
          'rowCount', tc.row_count
        ) order by tc.row_count desc)
        from table_counts tc
      ), '[]'::jsonb),
      'edgeEvents', coalesce((
        select jsonb_agg(jsonb_build_object(
          'id', efe.id,
          'functionName', efe.function_name,
          'eventType', efe.event_type,
          'statusCode', efe.status_code,
          'durationMs', efe.duration_ms,
          'createdAt', efe.created_at,
          'metadata', efe.metadata
        ) order by efe.created_at desc)
        from (select * from public.edge_function_events order by created_at desc limit 8) efe
      ), '[]'::jsonb),
      'importJobs', coalesce((
        select jsonb_agg(jsonb_build_object(
          'id', cij.id,
          'title', coalesce(sh.title, 'Unknown show'),
          'status', cij.status,
          'source', cij.source,
          'attempts', cij.attempts,
          'error', cij.error
        ) order by cij.created_at desc)
        from (select * from public.catalog_import_jobs order by created_at desc limit 8) cij
        left join public.shows sh on sh.id = cij.show_id
      ), '[]'::jsonb),
      'reportedComments', coalesce((
        select jsonb_agg(jsonb_build_object(
          'id', c.id,
          'title', coalesce(sh.title, m.title, 'Unknown title'),
          'body', c.body,
          'reportCount', c.report_count,
          'status', c.status
        ) order by c.report_count desc)
        from (select * from public.comments where report_count > 0 order by report_count desc limit 8) c
        left join public.shows sh on sh.id = c.show_id
        left join public.movies m on m.id = c.movie_id
      ), '[]'::jsonb),
      'deletionRequests', coalesce((
        select jsonb_agg(jsonb_build_object(
          'id', adr.id,
          'reason', adr.reason,
          'processedAt', adr.processed_at,
          'createdAt', adr.created_at
        ) order by adr.created_at desc)
        from (select * from public.account_deletion_requests order by created_at desc limit 8) adr
      ), '[]'::jsonb),
      'cacheEntries', coalesce((
        select jsonb_agg(jsonb_build_object(
          'id', sc.id,
          'query', sc.query,
          'resultCount', sc.result_count,
          'expiresAt', sc.expires_at
        ) order by sc.updated_at desc)
        from (select * from public.search_cache order by updated_at desc limit 8) sc
      ), '[]'::jsonb),
      'support', (
        select jsonb_build_object(
          'title', sp.title,
          'currentAmountCents', sp.current_amount_cents,
          'targetAmountCents', sp.target_amount_cents,
          'currency', sp.currency,
          'openedIntents', (select count(*) from public.support_intents where status = 'opened')
        )
        from public.support_campaigns sp
        where sp.slug = 'movie-catalog-budget'
        limit 1
      )
    )
  end;
$$;

select cron.unschedule('database-maintenance-daily')
where exists (
  select 1 from cron.job where jobname = 'database-maintenance-daily'
);

select cron.schedule(
  'database-maintenance-daily',
  '17 3 * * *',
  $cron$
    select
      net.http_post(
        url := concat((select decrypted_secret from vault.decrypted_secrets where name = 'itsshowtime_project_url'), '/functions/v1/database-maintenance'),
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'itsshowtime_cron_secret')
        ),
        body := '{}'::jsonb
      );
  $cron$
);
