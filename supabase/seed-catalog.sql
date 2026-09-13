-- Minimal catalog seed for the current It’s Showtime prototype.
-- Run after schema.sql so Search, Library, and Mark watched can resolve real ids.

insert into public.shows (title, overview, poster_url, status, average_rating)
values
  ('Severance', 'A workplace mystery about memory, identity, and control.', 'https://images.unsplash.com/photo-1495567720989-cebdbdd97913?q=80&w=600&auto=format&fit=crop', 'Returning', 4.60),
  ('The Bear', 'A tense, tender restaurant drama about pressure and family.', 'https://images.unsplash.com/photo-1551218808-94e220e084d2?q=80&w=600&auto=format&fit=crop', 'Returning', 4.30),
  ('Dark', 'A layered time-travel mystery across generations.', 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=600&auto=format&fit=crop', 'Ended', 4.80),
  ('Slow Horses', 'Sharp spy chaos with a messy team and a sharper lead.', 'https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=600&auto=format&fit=crop', 'Returning', 4.20),
  ('Station Eleven', 'A limited series about art, memory, and survival.', 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?q=80&w=600&auto=format&fit=crop', 'Ended', 4.50)
on conflict (lower(title)) do update set
  overview = excluded.overview,
  poster_url = excluded.poster_url,
  status = excluded.status,
  average_rating = excluded.average_rating;

insert into public.movies (title, overview, poster_url, runtime_minutes, average_rating)
values
  ('Arrival', 'A thoughtful sci-fi story about language, grief, and first contact.', 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?q=80&w=600&auto=format&fit=crop', 116, 4.40)
on conflict (lower(title)) do update set
  overview = excluded.overview,
  poster_url = excluded.poster_url,
  runtime_minutes = excluded.runtime_minutes,
  average_rating = excluded.average_rating;

with severance as (select id from public.shows where title = 'Severance')
insert into public.seasons (show_id, season_number, title)
select id, 2, 'Season 2' from severance
on conflict (show_id, season_number) do nothing;

with bear as (select id from public.shows where title = 'The Bear')
insert into public.seasons (show_id, season_number, title)
select id, 3, 'Season 3' from bear
on conflict (show_id, season_number) do nothing;

with dark_show as (select id from public.shows where title = 'Dark')
insert into public.seasons (show_id, season_number, title)
select id, 1, 'Season 1' from dark_show
on conflict (show_id, season_number) do nothing;

insert into public.episodes (season_id, episode_number, title, runtime_minutes, average_rating)
select seasons.id, 4, 'Woe''s Hollow', 49, 4.60
from public.seasons
join public.shows on shows.id = seasons.show_id
where shows.title = 'Severance' and seasons.season_number = 2
on conflict (season_id, episode_number) do update set
  title = excluded.title,
  runtime_minutes = excluded.runtime_minutes,
  average_rating = excluded.average_rating;

insert into public.episodes (season_id, episode_number, title, runtime_minutes, average_rating)
select seasons.id, 2, 'Next', 35, 4.30
from public.seasons
join public.shows on shows.id = seasons.show_id
where shows.title = 'The Bear' and seasons.season_number = 3
on conflict (season_id, episode_number) do update set
  title = excluded.title,
  runtime_minutes = excluded.runtime_minutes,
  average_rating = excluded.average_rating;

insert into public.episodes (season_id, episode_number, title, runtime_minutes, average_rating)
select seasons.id, 9, 'Everything Is Now', 57, 4.80
from public.seasons
join public.shows on shows.id = seasons.show_id
where shows.title = 'Dark' and seasons.season_number = 1
on conflict (season_id, episode_number) do update set
  title = excluded.title,
  runtime_minutes = excluded.runtime_minutes,
  average_rating = excluded.average_rating;
