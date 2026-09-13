const tmdbAccessToken = import.meta.env.VITE_TMDB_ACCESS_TOKEN;
const tmdbBaseUrl = 'https://api.themoviedb.org/3';
const tmdbImageBaseUrl = 'https://image.tmdb.org/t/p/w500';
const tmdbBackdropBaseUrl = 'https://image.tmdb.org/t/p/w1280';

export type TmdbSearchItem = {
  id: number;
  media_type: 'movie' | 'tv' | 'person';
  title?: string;
  name?: string;
  overview?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  release_date?: string;
  first_air_date?: string;
  vote_average?: number;
};

export type TmdbTvDetail = {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  status: string;
  first_air_date: string | null;
  vote_average: number;
  seasons: Array<{
    season_number: number;
    name: string;
    poster_path: string | null;
    air_date: string | null;
  }>;
};

export type TmdbMovieDetail = {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string | null;
  runtime: number | null;
  vote_average: number;
};

export type TmdbSeasonDetail = {
  id: number;
  season_number: number;
  name: string;
  poster_path: string | null;
  air_date: string | null;
  episodes: Array<{
    episode_number: number;
    name: string;
    overview: string;
    air_date: string | null;
    runtime: number | null;
    vote_average: number;
  }>;
};

function requireTmdbToken() {
  if (!tmdbAccessToken) {
    throw new Error('TMDB is not configured. Add VITE_TMDB_ACCESS_TOKEN to .env.');
  }

  return tmdbAccessToken;
}

async function tmdbFetch<T>(path: string, params: Record<string, string> = {}) {
  const token = requireTmdbToken();
  const url = new URL(`${tmdbBaseUrl}${path}`);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
      accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`TMDB request failed: ${response.status}`);
  }

  return (await response.json()) as T;
}

export function tmdbPoster(path?: string | null) {
  return path ? `${tmdbImageBaseUrl}${path}` : null;
}

export function tmdbBackdrop(path?: string | null) {
  return path ? `${tmdbBackdropBaseUrl}${path}` : null;
}

export async function searchTmdb(query: string) {
  const term = query.trim();
  if (!term) return [];

  const data = await tmdbFetch<{ results: TmdbSearchItem[] }>('/search/multi', {
    query: term,
    include_adult: 'false',
    language: 'en-US',
    page: '1',
  });

  return data.results.filter((item) => item.media_type === 'movie' || item.media_type === 'tv');
}

export async function getTmdbTvDetail(tmdbId: number) {
  return tmdbFetch<TmdbTvDetail>(`/tv/${tmdbId}`, { language: 'en-US' });
}

export async function getTmdbMovieDetail(tmdbId: number) {
  return tmdbFetch<TmdbMovieDetail>(`/movie/${tmdbId}`, { language: 'en-US' });
}

export async function getTmdbSeasonDetail(tmdbId: number, seasonNumber: number) {
  return tmdbFetch<TmdbSeasonDetail>(`/tv/${tmdbId}/season/${seasonNumber}`, { language: 'en-US' });
}
