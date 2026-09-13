-- Run once to improve catalog search and prevent duplicate catalog titles.

create extension if not exists pg_trgm;

create unique index if not exists uniq_shows_title_lower on public.shows(lower(title));
create unique index if not exists uniq_movies_title_lower on public.movies(lower(title));

create index if not exists idx_shows_title_trgm on public.shows using gin (title gin_trgm_ops);
create index if not exists idx_movies_title_trgm on public.movies using gin (title gin_trgm_ops);
