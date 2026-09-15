-- RPC payloads for expensive app surfaces plus lightweight Edge Function rate limiting.

create table if not exists public.edge_rate_limits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  function_name text not null,
  window_start timestamptz not null,
  request_count integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, function_name, window_start)
);

alter table public.edge_rate_limits enable row level security;

drop policy if exists "Admins read edge rate limits" on public.edge_rate_limits;
create policy "Admins read edge rate limits"
on public.edge_rate_limits
for select
to authenticated
using (public.is_current_user_admin());

create index if not exists idx_edge_rate_limits_user_function
on public.edge_rate_limits(user_id, function_name, window_start desc);

drop trigger if exists set_edge_rate_limits_updated_at on public.edge_rate_limits;
create trigger set_edge_rate_limits_updated_at
before update on public.edge_rate_limits
for each row execute function public.set_updated_at();

create or replace function public.get_profile_stats(target_user_id uuid)
returns jsonb
language sql
security definer
set search_path = public
as $$
  with recursive watched_episode_rows as (
    select
      ewp.id,
      ewp.watched_at,
      coalesce(e.runtime_minutes, 44) as runtime_minutes,
      s.show_id
    from public.episode_watch_progress ewp
    join public.episodes e on e.id = ewp.episode_id
    join public.seasons s on s.id = e.season_id
    where ewp.user_id = target_user_id and ewp.watched = true
  ),
  watched_movie_rows as (
    select coalesce(m.runtime_minutes, 112) as runtime_minutes
    from public.movie_watch_status mws
    join public.movies m on m.id = mws.movie_id
    where mws.user_id = target_user_id and mws.status = 'finished'
  ),
  library_show_rows as (
    select show_id
    from public.user_library_items
    where user_id = target_user_id and media_type = 'show' and show_id is not null
  ),
  episode_totals as (
    select s.show_id, count(e.id)::integer as total_episodes
    from public.seasons s
    join public.episodes e on e.season_id = s.id
    where s.show_id in (select show_id from library_show_rows)
    group by s.show_id
  ),
  watched_totals as (
    select show_id, count(id)::integer as watched_episodes
    from watched_episode_rows
    group by show_id
  ),
  totals as (
    select
      (select count(*) from watched_episode_rows)::integer as episodes,
      coalesce((select sum(runtime_minutes) from watched_episode_rows), 0)::integer +
        coalesce((select sum(runtime_minutes) from watched_movie_rows), 0)::integer as total_minutes,
      (select count(*) from library_show_rows)::integer as library_shows,
      (
        select count(*)::integer
        from episode_totals et
        left join watched_totals wt on wt.show_id = et.show_id
        where et.total_episodes > 0 and coalesce(wt.watched_episodes, 0) >= et.total_episodes
      ) as completed_shows,
      (
        select count(*)::integer
        from public.episode_watch_progress
        where user_id = target_user_id and reaction_mood is not null
      ) as reactions,
      (
        select count(*)::integer
        from public.comments
        where user_id = target_user_id
      ) as comments
  ),
  recursive_streak(day, streak) as (
    select current_date::date, 0
    union all
    select (day - 1)::date, streak + 1
    from recursive_streak
    where exists (
      select 1 from watched_episode_rows
      where watched_at::date = recursive_streak.day
    )
  )
  select jsonb_build_object(
    'episodes', totals.episodes,
    'totalTime', concat(floor(totals.total_minutes / 1440), 'd ', round((totals.total_minutes % 1440)::numeric / 60), 'h'),
    'streak', concat(coalesce((select max(streak) from recursive_streak), 0), 'd'),
    'libraryShows', totals.library_shows,
    'completedShows', totals.completed_shows,
    'reactions', totals.reactions,
    'comments', totals.comments
  )
  from totals;
$$;

create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

select cron.unschedule('process-catalog-imports-every-minute')
where exists (
  select 1 from cron.job where jobname = 'process-catalog-imports-every-minute'
);

select cron.schedule(
  'process-catalog-imports-every-minute',
  '* * * * *',
  $cron$
    select
      net.http_post(
        url := 'https://qlvoxdzzbkzkxcxhwbvv.supabase.co/functions/v1/process-catalog-imports',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'x-cron-secret', current_setting('app.settings.cron_secret', true)
        ),
        body := jsonb_build_object('limit', 5)
      );
  $cron$
);

create or replace function public.get_library_progress(target_user_id uuid)
returns jsonb
language sql
security definer
set search_path = public
as $$
  with library as (
    select uli.id, uli.status, uli.updated_at, sh.id as show_id, sh.title, sh.poster_url
    from public.user_library_items uli
    join public.shows sh on sh.id = uli.show_id
    where uli.user_id = target_user_id and uli.media_type = 'show'
  ),
  episodes as (
    select l.id as library_id, s.season_number, e.id, e.episode_number, e.title
    from library l
    left join public.seasons s on s.show_id = l.show_id
    left join public.episodes e on e.season_id = s.id
  ),
  progress as (
    select episode_id
    from public.episode_watch_progress
    where user_id = target_user_id and watched = true
  ),
  rolled as (
    select
      l.id,
      l.title,
      l.poster_url,
      l.status,
      l.updated_at,
      count(e.id)::integer as total_episodes,
      count(p.episode_id)::integer as watched_episodes
    from library l
    left join episodes e on e.library_id = l.id
    left join progress p on p.episode_id = e.id
    group by l.id, l.title, l.poster_url, l.status, l.updated_at
  ),
  next_episodes as (
    select distinct on (e.library_id)
      e.library_id,
      e.season_number,
      e.episode_number
    from episodes e
    left join progress p on p.episode_id = e.id
    where e.id is not null and p.episode_id is null
    order by e.library_id, e.season_number, e.episode_number
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'title', r.title,
    'status', case
      when r.total_episodes > 0 and r.watched_episodes >= r.total_episodes then 'Finished'
      when r.status = 'finished' then 'Finished'
      when r.status = 'paused' then 'Paused'
      when r.status = 'dropped' then 'Dropped'
      else 'Watching'
    end,
    'progress', case when r.total_episodes > 0 then round((r.watched_episodes::numeric / r.total_episodes) * 100)::integer else 0 end,
    'watchedEpisodes', r.watched_episodes,
    'totalEpisodes', r.total_episodes,
    'next', case
      when ne.episode_number is not null then concat('S', lpad(ne.season_number::text, 2, '0'), ' | E', lpad(ne.episode_number::text, 2, '0'))
      when r.total_episodes > 0 then 'Finished'
      else 'Importing episodes'
    end,
    'meta', case when r.total_episodes > 0 then concat(r.watched_episodes, ' of ', r.total_episodes, ' watched') else 'Episode data is syncing' end,
    'image', coalesce(r.poster_url, 'https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=600&auto=format&fit=crop')
  ) order by r.updated_at desc), '[]'::jsonb)
  from rolled r
  left join next_episodes ne on ne.library_id = r.id;
$$;

create or replace function public.get_admin_summary()
returns jsonb
language sql
security definer
set search_path = public
as $$
  select case
    when not public.is_current_user_admin() then '{}'::jsonb
    else jsonb_build_object(
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
