import { supabase } from './supabase';
import {
  getTmdbMovieDetail,
  getTmdbSeasonDetail,
  getTmdbTvDetail,
  searchTmdb,
  tmdbBackdrop,
  tmdbPoster,
  type TmdbSearchItem,
} from './tmdb';
import { getTvmazeEpisodes, searchTvmazeShows, type TvmazeShow } from './tvmaze';

export function requireSupabase() {
  if (!supabase) {
    throw new Error('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.');
  }

  return supabase;
}

function throwSupabaseError(error: unknown) {
  if (!error) return;

  if (typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
    throw new Error(error.message);
  }

  throw new Error('Supabase request failed.');
}

export async function getCurrentSession() {
  const client = requireSupabase();
  const { data, error } = await client.auth.getSession();

  if (error) throw error;
  return data.session;
}

export async function signInWithEmail(email: string, password: string) {
  const client = requireSupabase();
  const { data, error } = await client.auth.signInWithPassword({ email, password });

  if (error) throw error;
  return data;
}

export type SignUpProfile = {
  displayName: string;
  username: string;
};

export async function signUpWithEmail(email: string, password: string, profile: SignUpProfile) {
  const client = requireSupabase();
  const { data, error } = await client.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: profile.displayName,
        username: profile.username,
      },
    },
  });

  if (error) throw error;
  return data;
}

export async function signOut() {
  const client = requireSupabase();
  const { error } = await client.auth.signOut();

  if (error) throw error;
}

export async function getProfile(userId: string) {
  const client = requireSupabase();
  const { data, error } = await client.from('profiles').select('*').eq('id', userId).single();

  if (error) throw error;
  return data;
}

export async function getUserPreferences(userId: string) {
  const client = requireSupabase();
  const [{ data: genreRows, error: genreError }, { data: serviceRows, error: serviceError }] = await Promise.all([
    client.from('user_genres').select('genres(name)').eq('user_id', userId),
    client.from('user_streaming_services').select('platforms(name)').eq('user_id', userId),
  ]);

  if (genreError) throw genreError;
  if (serviceError) throw serviceError;

  return {
    genres: (genreRows ?? []).map((row) => row.genres?.name).filter(Boolean) as string[],
    services: (serviceRows ?? []).map((row) => row.platforms?.name).filter(Boolean) as string[],
  };
}

export async function saveOnboardingPreferences({
  userId,
  genres,
  services,
  starterShows,
}: {
  userId: string;
  genres: string[];
  services: string[];
  starterShows: string[];
}) {
  const client = requireSupabase();
  const [{ data: genreRows, error: genreError }, { data: platformRows, error: platformError }] = await Promise.all([
    client.from('genres').select('id, name').in('name', genres),
    client.from('platforms').select('id, name').in('name', services),
  ]);

  if (genreError) throw genreError;
  if (platformError) throw platformError;

  await Promise.all([
    client.from('user_genres').delete().eq('user_id', userId),
    client.from('user_streaming_services').delete().eq('user_id', userId),
  ]);

  const genreInserts = (genreRows ?? []).map((genre) => ({ user_id: userId, genre_id: genre.id }));
  const serviceInserts = (platformRows ?? []).map((platform) => ({ user_id: userId, platform_id: platform.id }));

  const writes = [];
  if (genreInserts.length) writes.push(client.from('user_genres').insert(genreInserts));
  if (serviceInserts.length) writes.push(client.from('user_streaming_services').insert(serviceInserts));

  const { data: showRows, error: showError } = await client.from('shows').select('id, title').in('title', starterShows);
  if (showError) throw showError;

  if (showRows?.length) {
    writes.push(
      client.from('user_library_items').upsert(
        showRows.map((show) => ({
          user_id: userId,
          media_type: 'show' as const,
          show_id: show.id,
          status: 'watching' as const,
        })),
        { onConflict: 'user_id,media_type,target_id' }
      )
    );
  }

  const results = await Promise.all(writes);
  const failedWrite = results.find((result) => result.error);
  if (failedWrite?.error) throw failedWrite.error;
}

export async function requestAccountDeletion(reason?: string) {
  const client = requireSupabase();
  const { error } = await client.rpc('delete_own_account', { deletion_reason: reason ?? null });

  throwSupabaseError(error);
  await signOut();
}

export async function getLibraryItems(userId: string) {
  const client = requireSupabase();
  const { data, error } = await client
    .from('user_library_items')
    .select('*, shows(*), movies(*)')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function getNotifications(userId: string) {
  const client = requireSupabase();
  const { data, error } = await client
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function getReminders(userId: string) {
  const client = requireSupabase();
  const { data, error } = await client
    .from('reminders')
    .select('enabled, episodes(title, episode_number, seasons(season_number, shows(title)))')
    .eq('user_id', userId);

  if (error) throw error;
  return data;
}

export async function getProfileStats(userId: string) {
  const client = requireSupabase();
  const [{ count: watchedEpisodes, error: episodeError }, { data: watchedMovies, error: movieError }] = await Promise.all([
    client.from('episode_watch_progress').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('watched', true),
    client.from('movie_watch_status').select('movies(runtime_minutes)').eq('user_id', userId).eq('status', 'finished'),
  ]);

  if (episodeError) throw episodeError;
  if (movieError) throw movieError;

  const movieMinutes = (watchedMovies ?? []).reduce((total, row) => {
    const movie = row.movies as { runtime_minutes: number | null } | null;
    return total + (movie?.runtime_minutes ?? 112);
  }, 0);
  const totalMinutes = (watchedEpisodes ?? 0) * 44 + movieMinutes;
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.round((totalMinutes % 1440) / 60);

  return {
    episodes: watchedEpisodes ?? 0,
    totalTime: `${days}d ${hours}h`,
    streak: watchedEpisodes ? `${Math.max(1, Math.min(30, watchedEpisodes))}d` : '0d',
  };
}

export async function getRecentActivity(userId: string) {
  const client = requireSupabase();
  const { data, error } = await client
    .from('episode_watch_progress')
    .select('id, watched_at, episodes(title, episode_number, seasons(season_number, shows(title)))')
    .eq('user_id', userId)
    .eq('watched', true)
    .not('watched_at', 'is', null)
    .order('watched_at', { ascending: false })
    .limit(5);

  if (error) throw error;

  return (data ?? []).map((row) => {
    const episode = row.episodes as
      | { title: string; episode_number: number; seasons: { season_number: number; shows: { title: string } } }
      | null;
    const watchedAt = row.watched_at ? new Date(row.watched_at) : null;

    return {
      id: row.id,
      title: episode?.seasons?.shows?.title ?? 'Unknown show',
      subtitle: episode
        ? `Watched S${String(episode.seasons.season_number).padStart(2, '0')} E${String(episode.episode_number).padStart(2, '0')} - ${episode.title}`
        : 'Watched an episode',
      time: watchedAt
        ? watchedAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        : 'Recently',
    };
  });
}

export async function getCommunityComments(context: { kind: 'episode' | 'movie'; title: string }) {
  const client = requireSupabase();
  const baseQuery = client
    .from('comments')
    .select('id, body, spoiler_level, profiles(display_name), comment_likes(count)')
    .order('created_at', { ascending: false })
    .limit(20);

  const lookup = context.kind === 'movie' ? await findMovieByTitle(context.title) : await findShowByTitle(context.title);
  if (!lookup) return [];

  const { data, error } =
    context.kind === 'movie'
      ? await baseQuery.eq('movie_id', lookup.id)
      : await baseQuery.eq('show_id', lookup.id);

  if (error) throw error;

  return (data ?? []).map((comment) => ({
    id: comment.id,
    user: (comment.profiles as { display_name: string } | null)?.display_name ?? 'Watcher',
    mood: comment.spoiler_level ?? 'Reacted',
    text: comment.body,
    likes: Array.isArray(comment.comment_likes) ? comment.comment_likes.length : 0,
  }));
}

export async function getShowSeasonsByTitle(title: string) {
  const client = requireSupabase();
  const show = await findShowByTitle(title);
  if (!show) return [];

  const { data, error } = await client
    .from('seasons')
    .select('season_number, title, episodes(episode_number, title, average_rating)')
    .eq('show_id', show.id)
    .order('season_number', { ascending: true });

  if (error) throw error;

  return (data ?? []).map((season) => ({
    season: season.title ?? `Season ${season.season_number}`,
    episodes: ((season.episodes as Array<{ episode_number: number; title: string; average_rating: number | null }> | null) ?? [])
      .sort((a, b) => a.episode_number - b.episode_number)
      .map((episode) => ({
        code: `E${String(episode.episode_number).padStart(2, '0')}`,
        title: episode.title,
        watched: false,
        averageRating: episode.average_rating ?? 0,
      })),
  }));
}

export async function saveProfileTheme(userId: string, theme: string) {
  const client = requireSupabase();
  const { error } = await client.from('profiles').update({ theme }).eq('id', userId);

  if (error) throw error;
}

export async function searchCatalog(query: string, mediaType: 'All' | 'Shows' | 'Movies' = 'All') {
  const client = requireSupabase();
  const term = query.trim();
  const showQuery = client
    .from('shows')
    .select('title, overview, poster_url, status, average_rating')
    .ilike('title', `%${term}%`)
    .limit(12);
  const movieQuery = client
    .from('movies')
    .select('title, overview, poster_url, runtime_minutes, average_rating')
    .ilike('title', `%${term}%`)
    .limit(12);

  const [showResult, movieResult] = await Promise.all([
    mediaType === 'Movies' ? Promise.resolve({ data: [], error: null }) : showQuery,
    mediaType === 'Shows' ? Promise.resolve({ data: [], error: null }) : movieQuery,
  ]);

  if (showResult.error) throw showResult.error;
  if (movieResult.error) throw movieResult.error;

  return {
    shows: showResult.data ?? [],
    movies: movieResult.data ?? [],
  };
}

export async function searchExternalCatalog(query: string) {
  return searchTvmazeShows(query);
}

export async function importExternalShow(show: TvmazeShow) {
  const client = requireSupabase();
  const showPayload = {
    title: show.name,
    overview: show.summary?.replace(/<[^>]+>/g, '') ?? null,
    poster_url: show.image?.original ?? show.image?.medium ?? null,
    status: show.status,
    first_air_date: show.premiered,
    average_rating: show.rating.average ? Number((show.rating.average / 2).toFixed(2)) : null,
  };
  const existingShow = await findShowByTitle(show.name);
  const { data: showRow, error: showError } = existingShow
    ? await client.from('shows').update(showPayload).eq('id', existingShow.id).select('id').single()
    : await client.from('shows').insert(showPayload).select('id').single();

  if (showError) throw showError;

  const episodes = await getTvmazeEpisodes(show.id);
  const seasons = [...new Set(episodes.map((episode) => episode.season))].slice(0, 3);

  for (const seasonNumber of seasons) {
    const { data: seasonRow, error: seasonError } = await client
      .from('seasons')
      .upsert(
        {
          show_id: showRow.id,
          season_number: seasonNumber,
          title: `Season ${seasonNumber}`,
        },
        { onConflict: 'show_id,season_number' }
      )
      .select('id')
      .single();

    if (seasonError) throw seasonError;

    const episodeRows = episodes
      .filter((episode) => episode.season === seasonNumber)
      .map((episode) => ({
        season_id: seasonRow.id,
        episode_number: episode.number,
        title: episode.name,
        overview: episode.summary?.replace(/<[^>]+>/g, '') ?? null,
        air_date: episode.airdate,
        runtime_minutes: episode.runtime,
        average_rating: episode.rating.average ? Number((episode.rating.average / 2).toFixed(2)) : null,
      }));

    if (episodeRows.length) {
      const { error: episodeError } = await client
        .from('episodes')
        .upsert(episodeRows, { onConflict: 'season_id,episode_number' });

      if (episodeError) throw episodeError;
    }
  }

  return showRow;
}

export async function importTmdbItem(item: TmdbSearchItem) {
  if (item.media_type === 'tv') {
    return importTmdbShow(item.id);
  }

  if (item.media_type === 'movie') {
    return importTmdbMovie(item.id);
  }

  return null;
}

export async function importTmdbShow(tmdbId: number) {
  const client = requireSupabase();
  const show = await getTmdbTvDetail(tmdbId);
  const { data: showRow, error: showError } = await client
    .from('shows')
    .upsert(
      {
        tmdb_id: show.id,
        title: show.name,
        overview: show.overview,
        poster_url: tmdbPoster(show.poster_path),
        backdrop_url: tmdbBackdrop(show.backdrop_path),
        status: show.status,
        first_air_date: show.first_air_date || null,
        average_rating: Number((show.vote_average / 2).toFixed(2)),
      },
      { onConflict: 'tmdb_id' }
    )
    .select('id')
    .single();

  if (showError) throw showError;

  const seasons = show.seasons.filter((season) => season.season_number > 0).slice(0, 3);

  for (const season of seasons) {
    const { data: seasonRow, error: seasonError } = await client
      .from('seasons')
      .upsert(
        {
          show_id: showRow.id,
          season_number: season.season_number,
          title: season.name,
          poster_url: tmdbPoster(season.poster_path),
          air_date: season.air_date || null,
        },
        { onConflict: 'show_id,season_number' }
      )
      .select('id')
      .single();

    if (seasonError) throw seasonError;

    const seasonDetail = await getTmdbSeasonDetail(show.id, season.season_number);
    const episodeRows = seasonDetail.episodes.map((episode) => ({
      season_id: seasonRow.id,
      episode_number: episode.episode_number,
      title: episode.name,
      overview: episode.overview,
      air_date: episode.air_date || null,
      runtime_minutes: episode.runtime,
      average_rating: Number((episode.vote_average / 2).toFixed(2)),
    }));

    if (episodeRows.length) {
      const { error: episodeError } = await client
        .from('episodes')
        .upsert(episodeRows, { onConflict: 'season_id,episode_number' });

      if (episodeError) throw episodeError;
    }
  }

  return showRow;
}

export async function importTmdbMovie(tmdbId: number) {
  const client = requireSupabase();
  const movie = await getTmdbMovieDetail(tmdbId);
  const { data, error } = await client
    .from('movies')
    .upsert(
      {
        tmdb_id: movie.id,
        title: movie.title,
        overview: movie.overview,
        poster_url: tmdbPoster(movie.poster_path),
        backdrop_url: tmdbBackdrop(movie.backdrop_path),
        release_date: movie.release_date || null,
        runtime_minutes: movie.runtime,
        average_rating: Number((movie.vote_average / 2).toFixed(2)),
      },
      { onConflict: 'tmdb_id' }
    )
    .select('id')
    .single();

  if (error) throw error;
  return data;
}

export async function findShowByTitle(title: string) {
  const client = requireSupabase();
  const { data, error } = await client.from('shows').select('id, title').eq('title', title).maybeSingle();

  if (error) throw error;
  return data;
}

export async function findMovieByTitle(title: string) {
  const client = requireSupabase();
  const { data, error } = await client.from('movies').select('id, title').eq('title', title).maybeSingle();

  if (error) throw error;
  return data;
}

export async function findEpisodeByShowAndCode(showTitle: string, code: string) {
  const client = requireSupabase();
  const [seasonPart, episodePart] = code.split('|').map((part) => part.trim());
  const seasonNumber = Number.parseInt(seasonPart?.replace(/\D/g, '') || '1', 10);
  const episodeNumber = Number.parseInt(episodePart?.replace(/\D/g, '') || '1', 10);

  const { data, error } = await client
    .from('episodes')
    .select('id, seasons!inner(season_number, shows!inner(title))')
    .eq('episode_number', episodeNumber)
    .eq('seasons.season_number', seasonNumber)
    .eq('seasons.shows.title', showTitle)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function addShowToLibrary(userId: string, showId: string) {
  const client = requireSupabase();
  const { data, error } = await client
    .from('user_library_items')
    .upsert(
      {
        user_id: userId,
        media_type: 'show',
        show_id: showId,
        status: 'watching',
      },
      { onConflict: 'user_id,media_type,target_id' }
    )
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function addMovieToLibrary(userId: string, movieId: string) {
  const client = requireSupabase();
  const { data, error } = await client
    .from('user_library_items')
    .upsert(
      {
        user_id: userId,
        media_type: 'movie',
        movie_id: movieId,
        status: 'watchlist',
      },
      { onConflict: 'user_id,media_type,target_id' }
    )
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function markEpisodeWatched(userId: string, episodeId: string, rating?: number) {
  const client = requireSupabase();
  const { data, error } = await client
    .from('episode_watch_progress')
    .upsert(
      {
        user_id: userId,
        episode_id: episodeId,
        watched: true,
        watched_at: new Date().toISOString(),
        rating,
      },
      { onConflict: 'user_id,episode_id' }
    )
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function markMovieWatched(userId: string, movieId: string, rating?: number) {
  const client = requireSupabase();
  const { data, error } = await client
    .from('movie_watch_status')
    .upsert(
      {
        user_id: userId,
        movie_id: movieId,
        status: 'finished',
        watched_at: new Date().toISOString(),
        rating,
      },
      { onConflict: 'user_id,movie_id' }
    )
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function setNotificationRead(notificationId: string, read: boolean) {
  const client = requireSupabase();
  const { data, error } = await client
    .from('notifications')
    .update({ read_at: read ? new Date().toISOString() : null })
    .eq('id', notificationId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function markAllNotificationsRead(userId: string) {
  const client = requireSupabase();
  const { error } = await client
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', userId)
    .is('read_at', null);

  if (error) throw error;
}

export async function toggleReminderForEpisode({
  userId,
  showTitle,
  code,
  enabled,
}: {
  userId: string;
  showTitle: string;
  code: string;
  enabled: boolean;
}) {
  const client = requireSupabase();
  const episode = await findEpisodeByShowAndCode(showTitle, code);
  if (!episode) return null;

  const remindAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
  const { data, error } = await client
    .from('reminders')
    .upsert(
      {
        user_id: userId,
        episode_id: episode.id,
        remind_at: remindAt,
        enabled,
      },
      { onConflict: 'user_id,episode_id' }
    )
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function createList(userId: string, title: string, description?: string) {
  const client = requireSupabase();
  const { data, error } = await client
    .from('lists')
    .insert({
      user_id: userId,
      title,
      description,
      privacy: 'private',
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getLists(userId: string) {
  const client = requireSupabase();
  const { data, error } = await client
    .from('lists')
    .select('*, list_items(*)')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function toggleListPrivacy(userId: string, title: string, privacy: 'private' | 'public') {
  const client = requireSupabase();
  const { data, error } = await client
    .from('lists')
    .update({ privacy })
    .eq('user_id', userId)
    .eq('title', title)
    .select()
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function addMovieTitleToList(userId: string, listTitle: string, movieTitle: string) {
  const client = requireSupabase();
  const [{ data: list, error: listError }, movie] = await Promise.all([
    client.from('lists').select('id').eq('user_id', userId).eq('title', listTitle).maybeSingle(),
    findMovieByTitle(movieTitle),
  ]);

  if (listError) throw listError;
  if (!list || !movie) return null;

  const { data, error } = await client
    .from('list_items')
    .upsert(
      {
        list_id: list.id,
        media_type: 'movie',
        movie_id: movie.id,
      },
      { onConflict: 'list_id,media_type,target_id' }
    )
    .select()
    .single();

  if (error) throw error;
  return data;
}
