-- Enable nested comment replies and recommendation scoring from live user behavior.

alter table public.comments
drop constraint if exists comments_target;

alter table public.comments
add constraint comments_target check (
  (parent_comment_id is not null and show_id is null and movie_id is null and episode_id is null)
  or
  (media_type = 'show' and show_id is not null and movie_id is null)
  or
  (media_type = 'movie' and movie_id is not null and show_id is null)
);

create table if not exists public.user_recommendation_signals (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  top_moods text[] not null default '{}',
  completed_show_count integer not null default 0,
  watched_episode_count integer not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.user_recommendation_signals enable row level security;

drop policy if exists "Users read own recommendation signals" on public.user_recommendation_signals;
create policy "Users read own recommendation signals"
on public.user_recommendation_signals
for select
to authenticated
using (auth.uid() = user_id);

create or replace function public.refresh_user_recommendation_signals(target_user_id uuid)
returns jsonb
language sql
security invoker
set search_path = public
as $$
  with mood_counts as (
    select reaction_mood, count(*) as count
    from public.episode_watch_progress
    where user_id = target_user_id and reaction_mood is not null
    group by reaction_mood
    order by count desc
    limit 5
  ),
  watched as (
    select ewp.episode_id, se.show_id
    from public.episode_watch_progress ewp
    join public.episodes e on e.id = ewp.episode_id
    join public.seasons se on se.id = e.season_id
    where ewp.user_id = target_user_id and ewp.watched = true
  ),
  totals as (
    select se.show_id, count(e.id)::integer as total_episodes
    from public.seasons se
    join public.episodes e on e.season_id = se.id
    group by se.show_id
  ),
  completed as (
    select w.show_id
    from watched w
    join totals t on t.show_id = w.show_id
    group by w.show_id, t.total_episodes
    having count(w.episode_id) >= t.total_episodes
  ),
  payload as (
    select
      coalesce(array_agg(reaction_mood order by count desc), '{}'::text[]) as top_moods,
      (select count(*)::integer from completed) as completed_show_count,
      (select count(*)::integer from watched) as watched_episode_count
    from mood_counts
  )
  insert into public.user_recommendation_signals (user_id, top_moods, completed_show_count, watched_episode_count)
  select target_user_id, top_moods, completed_show_count, watched_episode_count
  from payload
  on conflict (user_id) do update set
    top_moods = excluded.top_moods,
    completed_show_count = excluded.completed_show_count,
    watched_episode_count = excluded.watched_episode_count,
    updated_at = now()
  returning jsonb_build_object(
    'topMoods', top_moods,
    'completedShowCount', completed_show_count,
    'watchedEpisodeCount', watched_episode_count
  );
$$;

create or replace function public.enqueue_notification_deliveries()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.type in ('Reminder', 'Upcoming') then
    insert into public.notification_deliveries (notification_id, channel)
    values (new.id, 'push')
    on conflict do nothing;
  end if;

  if new.type in ('Reply', 'List', 'Product') then
    insert into public.notification_deliveries (notification_id, channel)
    values (new.id, 'email')
    on conflict do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists enqueue_notification_deliveries on public.notifications;
create trigger enqueue_notification_deliveries
after insert on public.notifications
for each row execute function public.enqueue_notification_deliveries();

select cron.unschedule('process-notification-deliveries-every-five-minutes')
where exists (
  select 1 from cron.job where jobname = 'process-notification-deliveries-every-five-minutes'
);

select cron.schedule(
  'process-notification-deliveries-every-five-minutes',
  '*/5 * * * *',
  $cron$
    select
      net.http_post(
        url := concat((select decrypted_secret from vault.decrypted_secrets where name = 'itsshowtime_project_url'), '/functions/v1/process-notification-deliveries'),
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'itsshowtime_cron_secret')
        ),
        body := '{}'::jsonb
      );
  $cron$
);
