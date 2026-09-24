-- One RPC for the Watch Next rail instead of multiple frontend round trips.

create or replace function public.get_watch_next_episodes(target_user_id uuid)
returns jsonb
language sql
security invoker
set search_path = public
as $$
  with library as (
    select uli.updated_at, sh.id as show_id, sh.title, sh.poster_url
    from public.user_library_items uli
    join public.shows sh on sh.id = uli.show_id
    where uli.user_id = target_user_id and uli.media_type = 'show'
  ),
  all_episodes as (
    select
      l.show_id,
      l.title as show_title,
      l.poster_url,
      l.updated_at,
      e.id as episode_id,
      se.season_number,
      e.episode_number,
      e.title as episode_title,
      e.average_rating,
      row_number() over (partition by l.show_id order by se.season_number, e.episode_number) as episode_sort
    from library l
    join public.seasons se on se.show_id = l.show_id
    join public.episodes e on e.season_id = se.id
  ),
  watched as (
    select episode_id
    from public.episode_watch_progress
    where user_id = target_user_id and watched = true
  ),
  totals as (
    select
      ae.show_id,
      count(ae.episode_id)::integer as total_episodes,
      count(w.episode_id)::integer as watched_episodes
    from all_episodes ae
    left join watched w on w.episode_id = ae.episode_id
    group by ae.show_id
  ),
  next_episode as (
    select distinct on (ae.show_id)
      ae.*
    from all_episodes ae
    left join watched w on w.episode_id = ae.episode_id
    where w.episode_id is null
    order by ae.show_id, ae.season_number, ae.episode_number
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', abs(('x' || substr(md5(ne.episode_id::text), 1, 8))::bit(32)::int),
    'backendId', ne.episode_id,
    'show', ne.show_title,
    'code', concat('S', lpad(ne.season_number::text, 2, '0'), ' | E', lpad(ne.episode_number::text, 2, '0')),
    'title', ne.episode_title,
    'tag', case when t.watched_episodes > 0 then 'KEEP WATCHING' else 'START WATCHING' end,
    'progress', case when t.total_episodes > 0 then round((t.watched_episodes::numeric / t.total_episodes) * 100)::integer else 0 end,
    'watchedEpisodes', t.watched_episodes,
    'totalEpisodes', t.total_episodes,
    'averageRating', coalesce(ne.average_rating, 0),
    'image', coalesce(ne.poster_url, 'https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=600&auto=format&fit=crop'),
    'watched', false
  ) order by ne.updated_at desc), '[]'::jsonb)
  from next_episode ne
  join totals t on t.show_id = ne.show_id;
$$;
