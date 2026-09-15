-- Run once to tighten data integrity for the MVP backend.

create extension if not exists pgcrypto;

create unique index if not exists uniq_lists_user_title_lower
on public.lists(user_id, lower(title));

alter table public.notifications
add column if not exists dedupe_key text generated always as (
  encode(
    digest(
      coalesce(user_id::text, '') || ':' ||
      coalesce(type, '') || ':' ||
      coalesce(title, '') || ':' ||
      coalesce(body, '') || ':' ||
      coalesce(deep_link, ''),
      'sha256'
    ),
    'hex'
  )
) stored;

create index if not exists idx_notifications_user_dedupe_recent
on public.notifications(user_id, dedupe_key, created_at desc);

create unique index if not exists uniq_notifications_unread_dedupe
on public.notifications(user_id, dedupe_key)
where read_at is null;

create index if not exists idx_episodes_air_date
on public.episodes(air_date)
where air_date is not null;

create index if not exists idx_reminders_episode_enabled
on public.reminders(episode_id, enabled);

create unique index if not exists uniq_list_items_target
on public.list_items(list_id, media_type, target_id);

create index if not exists idx_comments_show_created
on public.comments(show_id, created_at desc)
where show_id is not null;

create index if not exists idx_comments_movie_created
on public.comments(movie_id, created_at desc)
where movie_id is not null;

create index if not exists idx_comment_likes_comment
on public.comment_likes(comment_id);

create index if not exists idx_reminders_user_due
on public.reminders(user_id, remind_at)
where enabled = true;

create index if not exists idx_library_show_lookup
on public.user_library_items(user_id, show_id)
where media_type = 'show' and show_id is not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_theme_known'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
    add constraint profiles_theme_known
    check (theme in ('Pantone 1', 'Pantone 2 Light'))
    not valid;
  end if;
end $$;

alter table public.profiles
validate constraint profiles_theme_known;
