-- It’s Showtime Supabase/Postgres schema
-- Run this in the Supabase SQL editor after creating a project.

create extension if not exists "pgcrypto";

create type media_type as enum ('show', 'movie');
create type library_status as enum ('watching', 'watchlist', 'paused', 'finished', 'dropped');
create type list_privacy as enum ('private', 'public', 'friends');
create type spoiler_mode as enum ('strict', 'moderate', 'off');
create type catalog_import_status as enum ('pending', 'processing', 'ready', 'failed');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  display_name text not null,
  avatar_url text,
  region text not null default 'US',
  language text not null default 'en',
  theme text not null default 'Pantone 1',
  spoiler_mode spoiler_mode not null default 'strict',
  is_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.platforms (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  logo_url text,
  created_at timestamptz not null default now()
);

create table public.genres (
  id uuid primary key default gen_random_uuid(),
  name text not null unique
);

create table public.shows (
  id uuid primary key default gen_random_uuid(),
  tmdb_id integer unique,
  title text not null,
  overview text,
  poster_url text,
  backdrop_url text,
  status text,
  first_air_date date,
  average_rating numeric(3, 2) default 0,
  import_status catalog_import_status not null default 'pending',
  import_error text,
  last_imported_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.seasons (
  id uuid primary key default gen_random_uuid(),
  show_id uuid not null references public.shows(id) on delete cascade,
  season_number integer not null,
  title text,
  poster_url text,
  air_date date,
  unique (show_id, season_number)
);

create table public.episodes (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.seasons(id) on delete cascade,
  episode_number integer not null,
  title text not null,
  overview text,
  air_date date,
  runtime_minutes integer,
  average_rating numeric(3, 2) default 0,
  created_at timestamptz not null default now(),
  unique (season_id, episode_number)
);

create table public.movies (
  id uuid primary key default gen_random_uuid(),
  tmdb_id integer unique,
  title text not null,
  overview text,
  poster_url text,
  backdrop_url text,
  release_date date,
  runtime_minutes integer,
  average_rating numeric(3, 2) default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.media_genres (
  id uuid primary key default gen_random_uuid(),
  genre_id uuid not null references public.genres(id) on delete cascade,
  media_type media_type not null,
  show_id uuid references public.shows(id) on delete cascade,
  movie_id uuid references public.movies(id) on delete cascade,
  constraint media_genres_target check (
    (media_type = 'show' and show_id is not null and movie_id is null)
    or
    (media_type = 'movie' and movie_id is not null and show_id is null)
  )
);

create table public.media_platforms (
  id uuid primary key default gen_random_uuid(),
  platform_id uuid not null references public.platforms(id) on delete cascade,
  media_type media_type not null,
  show_id uuid references public.shows(id) on delete cascade,
  movie_id uuid references public.movies(id) on delete cascade,
  region text not null default 'US',
  constraint media_platforms_target check (
    (media_type = 'show' and show_id is not null and movie_id is null)
    or
    (media_type = 'movie' and movie_id is not null and show_id is null)
  )
);

create table public.user_library_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  media_type media_type not null,
  show_id uuid references public.shows(id) on delete cascade,
  movie_id uuid references public.movies(id) on delete cascade,
  target_id uuid generated always as (coalesce(show_id, movie_id)) stored,
  status library_status not null default 'watchlist',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint library_item_target check (
    (media_type = 'show' and show_id is not null and movie_id is null)
    or
    (media_type = 'movie' and movie_id is not null and show_id is null)
  )
);

create table public.episode_watch_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  episode_id uuid not null references public.episodes(id) on delete cascade,
  watched boolean not null default false,
  watched_at timestamptz,
  rating numeric(2, 1),
  reaction_mood text,
  favorite_character text,
  note text,
  updated_at timestamptz not null default now(),
  unique (user_id, episode_id)
);

create table public.movie_watch_status (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  movie_id uuid not null references public.movies(id) on delete cascade,
  status library_status not null default 'watchlist',
  watched_at timestamptz,
  rating numeric(2, 1),
  reaction_mood text,
  note text,
  updated_at timestamptz not null default now(),
  unique (user_id, movie_id)
);

create table public.watch_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  media_type media_type not null,
  episode_id uuid references public.episodes(id) on delete cascade,
  movie_id uuid references public.movies(id) on delete cascade,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  duration_minutes integer,
  constraint watch_sessions_target check (
    (media_type = 'show' and episode_id is not null and movie_id is null)
    or
    (media_type = 'movie' and movie_id is not null and episode_id is null)
  )
);

create table public.lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  privacy list_privacy not null default 'private',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.list_items (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references public.lists(id) on delete cascade,
  media_type media_type not null,
  show_id uuid references public.shows(id) on delete cascade,
  movie_id uuid references public.movies(id) on delete cascade,
  target_id uuid generated always as (coalesce(show_id, movie_id)) stored,
  note text,
  added_at timestamptz not null default now(),
  constraint list_items_target check (
    (media_type = 'show' and show_id is not null and movie_id is null)
    or
    (media_type = 'movie' and movie_id is not null and show_id is null)
  )
);

create table public.follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  constraint follows_not_self check (follower_id <> following_id)
);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  media_type media_type not null,
  show_id uuid references public.shows(id) on delete cascade,
  movie_id uuid references public.movies(id) on delete cascade,
  episode_id uuid references public.episodes(id) on delete cascade,
  body text not null,
  spoiler_level text not null default 'episode',
  status text not null default 'visible',
  report_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint comments_target check (
    (media_type = 'show' and show_id is not null and movie_id is null)
    or
    (media_type = 'movie' and movie_id is not null and show_id is null)
  ),
  constraint comments_status_known check (status in ('visible', 'reported', 'hidden'))
);

create table public.comment_reports (
  id uuid primary key default gen_random_uuid(),
  comment_id uuid not null references public.comments(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  reason text not null default 'spoiler',
  created_at timestamptz not null default now(),
  unique (comment_id, user_id)
);

create table public.comment_likes (
  comment_id uuid not null references public.comments(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (comment_id, user_id)
);

create table public.user_streaming_services (
  user_id uuid not null references public.profiles(id) on delete cascade,
  platform_id uuid not null references public.platforms(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, platform_id)
);

create table public.user_genres (
  user_id uuid not null references public.profiles(id) on delete cascade,
  genre_id uuid not null references public.genres(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, genre_id)
);

create table public.notification_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  reminders boolean not null default true,
  upcoming boolean not null default true,
  replies boolean not null default true,
  list_activity boolean not null default true,
  product_updates boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  deep_link text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.search_cache (
  id uuid primary key default gen_random_uuid(),
  query text not null,
  media_type text not null default 'Shows',
  source text not null default 'tvmaze',
  payload jsonb not null,
  result_count integer not null default 0,
  expires_at timestamptz not null default (now() + interval '7 days'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (query, media_type, source)
);

create table public.support_campaigns (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text,
  target_amount_cents integer not null default 0,
  currency text not null default 'USD',
  current_amount_cents integer not null default 0,
  status text not null default 'active' check (status in ('active', 'paused', 'funded', 'archived')),
  external_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.support_intents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  campaign_id uuid references public.support_campaigns(id) on delete set null,
  source text not null default 'buymeacoffee',
  amount_cents integer,
  currency text not null default 'USD',
  status text not null default 'opened' check (status in ('opened', 'completed', 'cancelled')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.edge_rate_limits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  function_name text not null,
  window_start timestamptz not null,
  request_count integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, function_name, window_start)
);

create table public.account_deletion_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  reason text,
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id)
);

create table public.reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  episode_id uuid not null references public.episodes(id) on delete cascade,
  remind_at timestamptz not null,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  unique (user_id, episode_id)
);

create table public.catalog_import_jobs (
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

create table public.activity_feed (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  actor_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index idx_seasons_show_id on public.seasons(show_id);
create index idx_episodes_season_id on public.episodes(season_id);
create index idx_library_user_status on public.user_library_items(user_id, status);
create unique index uniq_library_item on public.user_library_items(user_id, media_type, target_id);
create index idx_episode_progress_user on public.episode_watch_progress(user_id);
create index idx_movie_status_user on public.movie_watch_status(user_id);
create index idx_lists_user on public.lists(user_id);
create index idx_list_items_list on public.list_items(list_id);
create unique index uniq_list_item on public.list_items(list_id, media_type, target_id);
create index idx_comments_episode on public.comments(episode_id, created_at desc);
create index idx_comments_status_created on public.comments(status, created_at desc);
create index idx_comment_reports_comment on public.comment_reports(comment_id);
create index idx_notifications_user on public.notifications(user_id, created_at desc);
create index idx_search_cache_lookup on public.search_cache(query, media_type, source, expires_at);
create index idx_support_campaigns_status on public.support_campaigns(status);
create index idx_support_intents_user_created on public.support_intents(user_id, created_at desc);
create index idx_support_intents_campaign on public.support_intents(campaign_id, status);
create index idx_edge_rate_limits_user_function on public.edge_rate_limits(user_id, function_name, window_start desc);
create index idx_reminders_user_enabled on public.reminders(user_id, enabled);
create index idx_catalog_import_jobs_status on public.catalog_import_jobs(status, created_at);
create index idx_shows_import_status on public.shows(import_status);
create index idx_watch_sessions_user_started on public.watch_sessions(user_id, started_at desc);
create index idx_watch_sessions_open_episode on public.watch_sessions(user_id, episode_id) where ended_at is null and episode_id is not null;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_profiles_updated_at before update on public.profiles
for each row execute function public.set_updated_at();

create trigger set_shows_updated_at before update on public.shows
for each row execute function public.set_updated_at();

create trigger set_movies_updated_at before update on public.movies
for each row execute function public.set_updated_at();

create trigger set_library_updated_at before update on public.user_library_items
for each row execute function public.set_updated_at();

create trigger set_episode_progress_updated_at before update on public.episode_watch_progress
for each row execute function public.set_updated_at();

create trigger set_movie_status_updated_at before update on public.movie_watch_status
for each row execute function public.set_updated_at();

create trigger set_lists_updated_at before update on public.lists
for each row execute function public.set_updated_at();

create trigger set_comments_updated_at before update on public.comments
for each row execute function public.set_updated_at();

create trigger set_notification_preferences_updated_at before update on public.notification_preferences
for each row execute function public.set_updated_at();

create trigger set_search_cache_updated_at before update on public.search_cache
for each row execute function public.set_updated_at();

create trigger set_support_campaigns_updated_at before update on public.support_campaigns
for each row execute function public.set_updated_at();

create trigger set_support_intents_updated_at before update on public.support_intents
for each row execute function public.set_updated_at();

create trigger set_edge_rate_limits_updated_at before update on public.edge_rate_limits
for each row execute function public.set_updated_at();

create trigger set_catalog_import_jobs_updated_at before update on public.catalog_import_jobs
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username, display_name, avatar_url, region, language)
  values (
    new.id,
    new.raw_user_meta_data ->> 'username',
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'avatar_url',
    coalesce(new.raw_user_meta_data ->> 'region', 'US'),
    coalesce(new.raw_user_meta_data ->> 'language', 'en')
  );
  return new;
end;
$$;

create or replace function public.is_current_user_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.delete_own_account(deletion_reason text default null)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;

  insert into public.account_deletion_requests (user_id, reason, processed_at)
  values (current_user_id, deletion_reason, now())
  on conflict (user_id) do update set
    reason = excluded.reason,
    processed_at = now();

  delete from auth.users
  where id = current_user_id;
end;
$$;

revoke all on function public.delete_own_account(text) from public;
grant execute on function public.delete_own_account(text) to authenticated;

alter table public.profiles enable row level security;
alter table public.user_library_items enable row level security;
alter table public.episode_watch_progress enable row level security;
alter table public.movie_watch_status enable row level security;
alter table public.watch_sessions enable row level security;
alter table public.lists enable row level security;
alter table public.list_items enable row level security;
alter table public.follows enable row level security;
alter table public.comments enable row level security;
alter table public.comment_reports enable row level security;
alter table public.comment_likes enable row level security;
alter table public.user_streaming_services enable row level security;
alter table public.user_genres enable row level security;
alter table public.notification_preferences enable row level security;
alter table public.notifications enable row level security;
alter table public.search_cache enable row level security;
alter table public.support_campaigns enable row level security;
alter table public.support_intents enable row level security;
alter table public.edge_rate_limits enable row level security;
alter table public.account_deletion_requests enable row level security;
alter table public.reminders enable row level security;
alter table public.catalog_import_jobs enable row level security;
alter table public.activity_feed enable row level security;

alter table public.platforms enable row level security;
alter table public.genres enable row level security;
alter table public.shows enable row level security;
alter table public.seasons enable row level security;
alter table public.episodes enable row level security;
alter table public.movies enable row level security;
alter table public.media_genres enable row level security;
alter table public.media_platforms enable row level security;

create policy "Catalog is readable by everyone" on public.platforms for select using (true);
create policy "Genres are readable by everyone" on public.genres for select using (true);
create policy "Shows are readable by everyone" on public.shows for select using (true);
create policy "Seasons are readable by everyone" on public.seasons for select using (true);
create policy "Episodes are readable by everyone" on public.episodes for select using (true);
create policy "Movies are readable by everyone" on public.movies for select using (true);
create policy "Media genres are readable by everyone" on public.media_genres for select using (true);
create policy "Media platforms are readable by everyone" on public.media_platforms for select using (true);

create policy "Profiles are readable for social surfaces" on public.profiles for select using (true);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);

create policy "Users manage own library" on public.user_library_items for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage own episode progress" on public.episode_watch_progress for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage own movie status" on public.movie_watch_status for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage own watch sessions" on public.watch_sessions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage own platform preferences" on public.user_streaming_services for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage own genre preferences" on public.user_genres for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage own notification preferences" on public.notification_preferences for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage own notifications" on public.notifications for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Authenticated users read search cache" on public.search_cache for select to authenticated using (expires_at > now());
create policy "Admins manage search cache" on public.search_cache for all to authenticated using (public.is_current_user_admin()) with check (public.is_current_user_admin());
create policy "Anyone can read active support campaigns" on public.support_campaigns for select to anon, authenticated using (status = 'active' or public.is_current_user_admin());
create policy "Admins update support campaigns" on public.support_campaigns for update to authenticated using (public.is_current_user_admin()) with check (public.is_current_user_admin());
create policy "Users create own support intents" on public.support_intents for insert to authenticated with check (auth.uid() = user_id);
create policy "Users read own support intents" on public.support_intents for select to authenticated using (auth.uid() = user_id or public.is_current_user_admin());
create policy "Admins read edge rate limits" on public.edge_rate_limits for select to authenticated using (public.is_current_user_admin());
create policy "Users request own account deletion" on public.account_deletion_requests for insert with check (auth.uid() = user_id);
create policy "Users read own account deletion request" on public.account_deletion_requests for select using (auth.uid() = user_id);
create policy "Admins read account deletion requests" on public.account_deletion_requests for select to authenticated using (public.is_current_user_admin());
create policy "Users manage own reminders" on public.reminders for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can read own catalog import jobs" on public.catalog_import_jobs for select to authenticated using (created_by = auth.uid() or public.is_current_user_admin());
create policy "Users can create catalog import jobs" on public.catalog_import_jobs for insert to authenticated with check (auth.uid() = created_by);

create policy "Users manage own lists" on public.lists for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users read public lists" on public.lists for select using (privacy = 'public' or auth.uid() = user_id);
create policy "Users read public list items" on public.list_items for select using (
  exists (
    select 1 from public.lists
    where lists.id = list_items.list_id
    and lists.privacy = 'public'
  )
);
create policy "Users manage own list items" on public.list_items for all using (
  exists (
    select 1 from public.lists
    where lists.id = list_items.list_id
    and lists.user_id = auth.uid()
  )
) with check (
  exists (
    select 1 from public.lists
    where lists.id = list_items.list_id
    and lists.user_id = auth.uid()
  )
);

create policy "Users manage own follows" on public.follows for all using (auth.uid() = follower_id) with check (auth.uid() = follower_id);

create policy "Users can read comments" on public.comments for select using (true);
create policy "Users can create comments" on public.comments for insert with check (auth.uid() = user_id);
create policy "Users update own comments" on public.comments for update using (auth.uid() = user_id);
create policy "Users delete own comments" on public.comments for delete using (auth.uid() = user_id);

create policy "Users can report comments" on public.comment_reports for insert to authenticated with check (auth.uid() = user_id);
create policy "Users can read own comment reports" on public.comment_reports for select to authenticated using (auth.uid() = user_id);
create policy "Users manage own comment likes" on public.comment_likes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users read own activity feed" on public.activity_feed for select using (auth.uid() = user_id);

insert into public.platforms (name) values
  ('Netflix'),
  ('Apple TV+'),
  ('Max'),
  ('Hulu'),
  ('Paramount+')
on conflict (name) do nothing;

insert into public.genres (name) values
  ('Drama'),
  ('Mystery'),
  ('Comedy'),
  ('Sci-fi'),
  ('Thriller'),
  ('Limited')
on conflict (name) do nothing;
