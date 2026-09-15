-- Lightweight observability for Edge Functions and admin operational health.

create table if not exists public.edge_function_events (
  id uuid primary key default gen_random_uuid(),
  function_name text not null,
  event_type text not null check (
    event_type in ('success', 'error', 'cache_hit', 'cache_miss', 'rate_limited', 'queued', 'processed')
  ),
  status_code integer,
  duration_ms integer,
  user_id uuid references public.profiles(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.edge_function_events enable row level security;

drop policy if exists "Admins read edge function events" on public.edge_function_events;
create policy "Admins read edge function events"
on public.edge_function_events
for select
to authenticated
using (public.is_current_user_admin());

create index if not exists idx_edge_function_events_function_created
on public.edge_function_events(function_name, created_at desc);

create index if not exists idx_edge_function_events_type_created
on public.edge_function_events(event_type, created_at desc);

create index if not exists idx_edge_function_events_slow
on public.edge_function_events(duration_ms desc, created_at desc)
where duration_ms is not null;

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
  )
  select case
    when not public.is_current_user_admin() then '{}'::jsonb
    else jsonb_build_object(
      'operations', jsonb_build_object(
        'failedJobs', (select count(*)::integer from public.catalog_import_jobs where status = 'failed'),
        'pendingJobs', (select count(*)::integer from public.catalog_import_jobs where status = 'pending'),
        'processingJobs', (select count(*)::integer from public.catalog_import_jobs where status = 'processing'),
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
