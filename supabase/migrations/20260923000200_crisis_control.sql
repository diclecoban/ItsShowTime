-- Emergency controls for degraded mode, feature flags, and incident history.

create table if not exists public.app_config (
  key text primary key,
  value jsonb not null,
  description text,
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.incident_logs (
  id uuid primary key default gen_random_uuid(),
  severity text not null default 'info' check (severity in ('info', 'warning', 'critical')),
  action text not null,
  message text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.app_config enable row level security;
alter table public.incident_logs enable row level security;

drop policy if exists "Authenticated users read app config" on public.app_config;
create policy "Authenticated users read app config"
on public.app_config
for select
to authenticated
using (true);

drop policy if exists "Admins manage app config" on public.app_config;
create policy "Admins manage app config"
on public.app_config
for all
to authenticated
using (public.is_current_user_admin())
with check (public.is_current_user_admin());

drop policy if exists "Admins read incidents" on public.incident_logs;
create policy "Admins read incidents"
on public.incident_logs
for select
to authenticated
using (public.is_current_user_admin());

drop policy if exists "Admins write incidents" on public.incident_logs;
create policy "Admins write incidents"
on public.incident_logs
for insert
to authenticated
with check (public.is_current_user_admin());

create index if not exists idx_incident_logs_created
on public.incident_logs(created_at desc);

insert into public.app_config (key, value, description)
values (
  'crisis_control',
  jsonb_build_object(
    'mode', 'normal',
    'message', '',
    'features', jsonb_build_object(
      'externalSearch', true,
      'catalogImport', true,
      'communityWrites', true,
      'notifications', true,
      'realtime', true,
      'newSignups', true,
      'queueWorkers', true,
      'support', true
    )
  ),
  'Runtime kill switches and degraded-mode controls.'
)
on conflict (key) do nothing;

create or replace function public.get_app_config()
returns jsonb
language sql
security definer
set search_path = public
as $$
  select value
  from public.app_config
  where key = 'crisis_control';
$$;

create or replace function public.set_crisis_control(
  next_mode text,
  next_message text,
  next_features jsonb,
  incident_message text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  current_config jsonb;
  merged_config jsonb;
  severity_value text;
begin
  if not public.is_current_user_admin() then
    raise exception 'Admin access required';
  end if;

  if next_mode not in ('normal', 'degraded', 'maintenance', 'readonly') then
    raise exception 'Unsupported app mode: %', next_mode;
  end if;

  select value into current_config
  from public.app_config
  where key = 'crisis_control';

  merged_config := jsonb_build_object(
    'mode', next_mode,
    'message', coalesce(next_message, ''),
    'features', coalesce(current_config->'features', '{}'::jsonb) || coalesce(next_features, '{}'::jsonb)
  );

  insert into public.app_config (key, value, description, updated_by, updated_at)
  values ('crisis_control', merged_config, 'Runtime kill switches and degraded-mode controls.', auth.uid(), now())
  on conflict (key) do update
  set value = excluded.value,
      updated_by = excluded.updated_by,
      updated_at = now();

  severity_value := case
    when next_mode = 'normal' then 'info'
    when next_mode = 'degraded' then 'warning'
    else 'critical'
  end;

  insert into public.incident_logs (severity, action, message, metadata, created_by)
  values (
    severity_value,
    'crisis_control_updated',
    coalesce(nullif(incident_message, ''), 'Crisis control updated.'),
    merged_config,
    auth.uid()
  );

  return merged_config;
end;
$$;

create or replace function public.log_system_incident(
  incident_severity text,
  incident_action text,
  incident_message text,
  incident_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id uuid;
begin
  if incident_severity not in ('info', 'warning', 'critical') then
    incident_severity := 'info';
  end if;

  insert into public.incident_logs (severity, action, message, metadata, created_by)
  values (incident_severity, incident_action, incident_message, coalesce(incident_metadata, '{}'::jsonb), auth.uid())
  returning id into new_id;

  return new_id;
end;
$$;

revoke all on function public.set_crisis_control(text, text, jsonb, text) from anon, authenticated;
grant execute on function public.set_crisis_control(text, text, jsonb, text) to service_role;

grant execute on function public.get_app_config() to anon, authenticated, service_role;
grant execute on function public.log_system_incident(text, text, text, jsonb) to authenticated, service_role;

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
      'crisisControl', (select value from public.app_config where key = 'crisis_control'),
      'incidents', coalesce((
        select jsonb_agg(jsonb_build_object(
          'id', il.id,
          'severity', il.severity,
          'action', il.action,
          'message', il.message,
          'metadata', il.metadata,
          'createdAt', il.created_at
        ) order by il.created_at desc)
        from (select * from public.incident_logs order by created_at desc limit 8) il
      ), '[]'::jsonb),
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
