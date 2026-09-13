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
