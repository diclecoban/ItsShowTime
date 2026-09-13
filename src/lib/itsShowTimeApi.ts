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
import type { CustomList, DiscoverItem, Episode, EpisodeReaction, LibraryShow, UpcomingGroup } from '../types';

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

export async function getLibraryShows(userId: string): Promise<LibraryShow[]> {
  const client = requireSupabase();
  const { data: libraryItems, error } = await client
    .from('user_library_items')
    .select('id, status, shows(id, title, poster_url)')
    .eq('user_id', userId)
    .eq('media_type', 'show')
    .order('updated_at', { ascending: false });

  if (error) throw error;

  const showRows = (libraryItems ?? [])
    .map((item) => item.shows as { id: string; title: string; poster_url: string | null } | null)
    .filter(Boolean) as Array<{ id: string; title: string; poster_url: string | null }>;
  const showIds = showRows.map((show) => show.id);

  if (!showIds.length) return [];

  const { data: seasons, error: seasonsError } = await client
    .from('seasons')
    .select('id, show_id, season_number, episodes(id, episode_number, title)')
    .in('show_id', showIds)
    .order('season_number', { ascending: true });

  if (seasonsError) throw seasonsError;

  const episodeIds = (seasons ?? []).flatMap((season) =>
    ((season.episodes as Array<{ id: string }> | null) ?? []).map((episode) => episode.id)
  );
  const watchedIds = new Set<string>();

  if (episodeIds.length) {
    const { data: progressRows, error: progressError } = await client
      .from('episode_watch_progress')
      .select('episode_id')
      .eq('user_id', userId)
      .eq('watched', true)
      .in('episode_id', episodeIds);

    if (progressError) throw progressError;
    progressRows?.forEach((row) => watchedIds.add(row.episode_id));
  }

  return (libraryItems ?? [])
    .filter((item) => item.shows)
    .map((item) => {
      const show = item.shows as { id: string; title: string; poster_url: string | null };
      const showSeasons = (seasons ?? []).filter((season) => season.show_id === show.id);
      const showEpisodes = showSeasons.flatMap((season) =>
        ((season.episodes as Array<{ id: string; episode_number: number; title: string }> | null) ?? []).map((episode) => ({
          ...episode,
          seasonNumber: season.season_number,
        }))
      );
      const watchedEpisodes = showEpisodes.filter((episode) => watchedIds.has(episode.id)).length;
      const totalEpisodes = showEpisodes.length;
      const nextEpisode = showEpisodes.find((episode) => !watchedIds.has(episode.id));
      const progress = totalEpisodes ? Math.round((watchedEpisodes / totalEpisodes) * 100) : 0;
      const status =
        item.status === 'finished'
          ? 'Finished'
          : item.status === 'paused'
            ? 'Paused'
            : item.status === 'dropped'
              ? 'Dropped'
              : 'Watching';

      return {
        title: show.title,
        status: progress === 100 && totalEpisodes > 0 ? 'Finished' : status,
        progress,
        watchedEpisodes,
        totalEpisodes,
        next: nextEpisode
          ? `S${String(nextEpisode.seasonNumber).padStart(2, '0')} | E${String(nextEpisode.episode_number).padStart(2, '0')}`
          : totalEpisodes
            ? 'Finished'
            : 'Importing episodes',
        meta: totalEpisodes ? `${watchedEpisodes} of ${totalEpisodes} watched` : 'Episode data is syncing',
        image: show.poster_url ?? 'https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=600&auto=format&fit=crop',
      } satisfies LibraryShow;
    });
}

function numericIdFromString(value: string) {
  return value.split('').reduce((total, char) => total + char.charCodeAt(0), 0);
}

export async function getWatchNextEpisodes(userId: string): Promise<Episode[]> {
  const client = requireSupabase();
  const { data: libraryItems, error } = await client
    .from('user_library_items')
    .select('status, shows(id, title, poster_url)')
    .eq('user_id', userId)
    .eq('media_type', 'show')
    .order('updated_at', { ascending: false });

  if (error) throw error;

  const showRows = (libraryItems ?? [])
    .map((item) => item.shows as { id: string; title: string; poster_url: string | null } | null)
    .filter(Boolean) as Array<{ id: string; title: string; poster_url: string | null }>;
  const showIds = showRows.map((show) => show.id);

  if (!showIds.length) return [];

  const { data: seasons, error: seasonsError } = await client
    .from('seasons')
    .select('id, show_id, season_number, episodes(id, episode_number, title, average_rating)')
    .in('show_id', showIds)
    .order('season_number', { ascending: true });

  if (seasonsError) throw seasonsError;

  const episodeIds = (seasons ?? []).flatMap((season) =>
    ((season.episodes as Array<{ id: string }> | null) ?? []).map((episode) => episode.id)
  );
  const watchedIds = new Set<string>();

  if (episodeIds.length) {
    const { data: progressRows, error: progressError } = await client
      .from('episode_watch_progress')
      .select('episode_id')
      .eq('user_id', userId)
      .eq('watched', true)
      .in('episode_id', episodeIds);

    if (progressError) throw progressError;
    progressRows?.forEach((row) => watchedIds.add(row.episode_id));
  }

  return (libraryItems ?? [])
    .filter((item) => item.shows)
    .flatMap((item) => {
      const show = item.shows as { id: string; title: string; poster_url: string | null };
      const showEpisodes = (seasons ?? [])
        .filter((season) => season.show_id === show.id)
        .flatMap((season) =>
          ((season.episodes as Array<{ id: string; episode_number: number; title: string; average_rating: number | null }> | null) ?? [])
            .map((episode) => ({
              ...episode,
              seasonNumber: season.season_number,
            }))
        )
        .sort((a, b) => (a.seasonNumber - b.seasonNumber) || (a.episode_number - b.episode_number));
      const watchedEpisodes = showEpisodes.filter((episode) => watchedIds.has(episode.id)).length;
      const totalEpisodes = showEpisodes.length;
      const nextEpisode = showEpisodes.find((episode) => !watchedIds.has(episode.id));

      if (!nextEpisode) return [];

      return {
        id: numericIdFromString(nextEpisode.id),
        show: show.title,
        code: `S${String(nextEpisode.seasonNumber).padStart(2, '0')} | E${String(nextEpisode.episode_number).padStart(2, '0')}`,
        title: nextEpisode.title,
        tag: watchedEpisodes ? 'KEEP WATCHING' : 'START WATCHING',
        progress: totalEpisodes ? Math.round((watchedEpisodes / totalEpisodes) * 100) : 0,
        watchedEpisodes,
        totalEpisodes,
        averageRating: nextEpisode.average_rating ?? 0,
        image: show.poster_url ?? 'https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=600&auto=format&fit=crop',
        watched: false,
      } satisfies Episode;
    });
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

export async function getUpcomingGroups(userId: string): Promise<UpcomingGroup[]> {
  const client = requireSupabase();
  const today = new Date();
  const end = new Date(today);
  end.setDate(today.getDate() + 14);

  const { data: libraryItems, error: libraryError } = await client
    .from('user_library_items')
    .select('show_id')
    .eq('user_id', userId)
    .eq('media_type', 'show');

  if (libraryError) throw libraryError;

  const showIds = (libraryItems ?? []).map((item) => item.show_id).filter(Boolean) as string[];
  if (!showIds.length) return [];

  const { data: allEpisodes, error: allEpisodesError } = await client
    .from('episodes')
    .select('id, title, episode_number, air_date, seasons!inner(season_number, shows!inner(id, title, poster_url))')
    .in('seasons.shows.id', showIds)
    .order('air_date', { ascending: true, nullsFirst: false });

  if (allEpisodesError) throw allEpisodesError;

  const { data: episodes, error: episodesError } = await client
    .from('episodes')
    .select('id, title, episode_number, air_date, seasons!inner(season_number, shows!inner(id, title, poster_url))')
    .in('seasons.shows.id', showIds)
    .gte('air_date', today.toISOString().slice(0, 10))
    .lte('air_date', end.toISOString().slice(0, 10))
    .order('air_date', { ascending: true });

  if (episodesError) throw episodesError;

  const episodeIds = (allEpisodes ?? []).map((episode) => episode.id);
  const reminderIds = new Set<string>();
  const watchedIds = new Set<string>();

  if (episodeIds.length) {
    const [{ data: reminders, error: reminderError }, { data: progressRows, error: progressError }] = await Promise.all([
      client
        .from('reminders')
        .select('episode_id')
        .eq('user_id', userId)
        .eq('enabled', true)
        .in('episode_id', episodeIds),
      client
        .from('episode_watch_progress')
        .select('episode_id')
        .eq('user_id', userId)
        .eq('watched', true)
        .in('episode_id', episodeIds),
    ]);

    if (reminderError) throw reminderError;
    if (progressError) throw progressError;
    reminders?.forEach((reminder) => reminderIds.add(reminder.episode_id));
    progressRows?.forEach((row) => watchedIds.add(row.episode_id));
  }

  const groups = new Map<string, UpcomingGroup>();
  (episodes ?? []).forEach((episode) => {
    const airDate = episode.air_date ? new Date(`${episode.air_date}T12:00:00`) : new Date();
    const day = airDate.toLocaleDateString('en-US', { weekday: 'short' });
    const date = airDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const key = `${day}-${date}`;
    const season = episode.seasons as { season_number: number; shows: { title: string; poster_url: string | null } };

    if (!groups.has(key)) {
      groups.set(key, { day, date, items: [] });
    }

    groups.get(key)?.items.push({
      show: season.shows.title,
      code: `S${String(season.season_number).padStart(2, '0')} | E${String(episode.episode_number).padStart(2, '0')}`,
      title: episode.title,
      time: 'Release day',
      platform: 'TVmaze',
      tracked: reminderIds.has(episode.id),
      image: season.shows.poster_url ?? 'https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=600&auto=format&fit=crop',
    });
  });

  const upcomingGroups = [...groups.values()];
  if (upcomingGroups.length) return upcomingGroups;

  const nextItems = (libraryItems ?? []).flatMap((item) => {
    const showEpisodes = (allEpisodes ?? [])
      .filter((episode) => {
        const season = episode.seasons as { shows: { id: string } };
        return season.shows.id === item.show_id;
      })
      .sort((a, b) => {
        const seasonA = a.seasons as { season_number: number };
        const seasonB = b.seasons as { season_number: number };
        return (seasonA.season_number - seasonB.season_number) || (a.episode_number - b.episode_number);
      });
    const nextEpisode = showEpisodes.find((episode) => !watchedIds.has(episode.id));

    if (!nextEpisode) return [];

    const season = nextEpisode.seasons as { season_number: number; shows: { title: string; poster_url: string | null } };
    return {
      show: season.shows.title,
      code: `S${String(season.season_number).padStart(2, '0')} | E${String(nextEpisode.episode_number).padStart(2, '0')}`,
      title: nextEpisode.title,
      time: nextEpisode.air_date ? `Aired ${nextEpisode.air_date}` : 'Next to watch',
      platform: 'Library',
      tracked: reminderIds.has(nextEpisode.id),
      image: season.shows.poster_url ?? 'https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=600&auto=format&fit=crop',
    };
  });

  return nextItems.length ? [{ day: 'Next', date: 'Queue', items: nextItems }] : [];
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

export async function createCommunityComment({
  userId,
  context,
  body,
  mood,
}: {
  userId: string;
  context: { kind: 'episode' | 'movie'; title: string };
  body: string;
  mood: string;
}) {
  const client = requireSupabase();
  const lookup = context.kind === 'movie' ? await findMovieByTitle(context.title) : await findShowByTitle(context.title);
  if (!lookup) throw new Error('Could not find this title in the catalog.');

  const { error } = await client.from('comments').insert({
    user_id: userId,
    body,
    spoiler_level: mood,
    show_id: context.kind === 'episode' ? lookup.id : null,
    movie_id: context.kind === 'movie' ? lookup.id : null,
  });

  if (error) throw error;
}

export async function getShowDetailByTitle(title: string, userId?: string) {
  const client = requireSupabase();
  const { data: show, error: showError } = await client
    .from('shows')
    .select('id, title, overview, poster_url, backdrop_url, status, average_rating')
    .eq('title', title)
    .maybeSingle();

  if (showError) throw showError;
  if (!show) return null;

  const { data, error } = await client
    .from('seasons')
    .select('season_number, title, episodes(id, episode_number, title, average_rating)')
    .eq('show_id', show.id)
    .order('season_number', { ascending: true });

  if (error) throw error;

  const episodeIds = (data ?? []).flatMap((season) =>
    ((season.episodes as Array<{ id: string }> | null) ?? []).map((episode) => episode.id)
  );
  const watchedIds = new Set<string>();

  if (userId && episodeIds.length) {
    const { data: watchedRows, error: watchedError } = await client
      .from('episode_watch_progress')
      .select('episode_id')
      .eq('user_id', userId)
      .eq('watched', true)
      .in('episode_id', episodeIds);

    if (watchedError) throw watchedError;
    watchedRows?.forEach((row) => watchedIds.add(row.episode_id));
  }

  return {
    show: {
      title: show.title,
      overview: show.overview ?? 'Track seasons, episodes, and spoiler-safe reactions for this show.',
      status: show.status ?? 'Series',
      posterUrl: show.poster_url ?? 'https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=600&auto=format&fit=crop',
      backdropUrl: show.backdrop_url,
      averageRating: show.average_rating ?? 0,
    },
    seasons: (data ?? []).map((season) => ({
      season: season.title ?? `Season ${season.season_number}`,
      seasonNumber: season.season_number,
      episodes: ((season.episodes as Array<{ id: string; episode_number: number; title: string; average_rating: number | null }> | null) ?? [])
      .sort((a, b) => a.episode_number - b.episode_number)
      .map((episode) => ({
        id: episode.id,
        code: `E${String(episode.episode_number).padStart(2, '0')}`,
        fullCode: `S${String(season.season_number).padStart(2, '0')} | E${String(episode.episode_number).padStart(2, '0')}`,
        seasonNumber: season.season_number,
        title: episode.title,
        watched: watchedIds.has(episode.id),
        averageRating: episode.average_rating ?? 0,
      })),
    })),
  };
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

export async function getDiscoverShows(genres: string[] = [], services: string[] = []): Promise<DiscoverItem[]> {
  const seeds = [...genres, 'drama', 'comedy', 'mystery', 'thriller', 'romance'].filter(Boolean);
  const batches = await Promise.all(seeds.slice(0, 5).map((seed) => searchTvmazeShows(seed).catch(() => [])));
  const seen = new Set<number>();
  const shows = batches
    .flat()
    .filter((show) => {
      if (seen.has(show.id)) return false;
      seen.add(show.id);
      return Boolean(show.image?.original ?? show.image?.medium);
    })
    .slice(0, 12);

  return shows.map((show, index) => {
    const rating = show.rating.average ? show.rating.average / 2 : null;
    const serviceHint = services[index % Math.max(services.length, 1)];
    const fit = [
      show.status ?? 'Series',
      show.premiered?.slice(0, 4) ?? 'New',
      serviceHint ?? 'TVmaze',
    ].filter(Boolean);

    return {
      title: show.name,
      meta: `${show.status ?? 'Series'} - ${show.premiered?.slice(0, 4) ?? 'Upcoming'} - ${
        rating ? rating.toFixed(1) : 'New'
      } rating`,
      body: show.summary?.replace(/<[^>]+>/g, '') ?? 'A fresh recommendation pulled from the live TVmaze catalog.',
      reason: genres.length ? `Picked from your ${genres[0]} taste profile.` : 'Picked from the live TVmaze catalog.',
      match: rating ? `${Math.round(rating * 20)}% match` : 'New pick',
      fit,
      image:
        show.image?.original ??
        show.image?.medium ??
        'https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=900&auto=format&fit=crop',
      source: 'tvmaze',
      tmdbId: show.id,
    };
  });
}

export async function importExternalShow(show: TvmazeShow) {
  const client = requireSupabase();
  const showPayload = {
    tmdb_id: show.id,
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
  const seasons = [...new Set(episodes.map((episode) => episode.season))];

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

export async function markEpisodeWatched(userId: string, episodeId: string, rating?: number, reaction?: Partial<EpisodeReaction>) {
  const client = requireSupabase();
  const { data, error } = await client
    .from('episode_watch_progress')
    .upsert(
      {
        user_id: userId,
        episode_id: episodeId,
        watched: true,
        watched_at: new Date().toISOString(),
        rating: reaction?.rating ?? rating,
        reaction_mood: reaction?.mood,
        favorite_character: reaction?.favoriteCharacter,
        note: reaction?.note,
      },
      { onConflict: 'user_id,episode_id' }
    )
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function saveEpisodeReaction({
  userId,
  showTitle,
  code,
  reaction,
}: {
  userId: string;
  showTitle: string;
  code: string;
  reaction: EpisodeReaction;
}) {
  const episode = await findEpisodeByShowAndCode(showTitle, code);
  if (!episode) throw new Error('Could not find this episode in the catalog.');

  return markEpisodeWatched(userId, episode.id, reaction.rating, reaction);
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

export async function createNotification({
  userId,
  type,
  title,
  body,
  deepLink,
}: {
  userId: string;
  type: string;
  title: string;
  body?: string;
  deepLink?: string;
}) {
  const client = requireSupabase();
  const normalizedBody = body ?? '';
  const normalizedDeepLink = deepLink ?? '';
  const since = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  const { data: duplicate, error: duplicateError } = await client
    .from('notifications')
    .select('id')
    .eq('user_id', userId)
    .eq('type', type)
    .eq('title', title)
    .eq('body', normalizedBody)
    .eq('deep_link', normalizedDeepLink)
    .gte('created_at', since)
    .limit(1)
    .maybeSingle();

  if (duplicateError) throw duplicateError;
  if (duplicate) return duplicate;

  const { data, error } = await client
    .from('notifications')
    .insert({
      user_id: userId,
      type,
      title,
      body: normalizedBody,
      deep_link: normalizedDeepLink,
    })
    .select()
    .single();

  if (error) {
    if ('code' in error && error.code === '23505') {
      const { data: existing, error: existingError } = await client
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .eq('type', type)
        .eq('title', title)
        .eq('body', normalizedBody)
        .eq('deep_link', normalizedDeepLink)
        .is('read_at', null)
        .limit(1)
        .maybeSingle();

      if (existingError) throw existingError;
      if (existing) return existing;
    }

    throw error;
  }
  return data;
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

export async function getHydratedLists(userId: string): Promise<CustomList[]> {
  const client = requireSupabase();
  const { data, error } = await client
    .from('lists')
    .select('id, title, privacy, list_items(id, media_type, shows(title, poster_url, status), movies(title, poster_url, runtime_minutes))')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) throw error;

  return (data ?? []).map((list) => {
    const items = ((list.list_items as Array<{
      media_type: 'show' | 'movie';
      shows: { title: string; poster_url: string | null; status: string | null } | null;
      movies: { title: string; poster_url: string | null; runtime_minutes: number | null } | null;
    }> | null) ?? []).map((item) => {
      const target = item.media_type === 'show' ? item.shows : item.movies;
      return {
        title: target?.title ?? 'Untitled',
        meta:
          item.media_type === 'show'
            ? `Show - ${item.shows?.status ?? 'Series'}`
            : `Movie - ${item.movies?.runtime_minutes ?? 110} min`,
        image:
          target?.poster_url ??
          'https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=600&auto=format&fit=crop',
      };
    });

    return {
      title: list.title,
      count: `${items.length} titles`,
      privacy: list.privacy === 'public' ? 'Public' : 'Private',
      images: items.slice(0, 3).map((item) => item.image),
      items,
    };
  });
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

export async function addShowTitleToList(userId: string, listTitle: string, showTitle: string) {
  const client = requireSupabase();
  const [{ data: list, error: listError }, show] = await Promise.all([
    client.from('lists').select('id').eq('user_id', userId).eq('title', listTitle).maybeSingle(),
    findShowByTitle(showTitle),
  ]);

  if (listError) throw listError;
  if (!list || !show) return null;

  const { data, error } = await client
    .from('list_items')
    .upsert(
      {
        list_id: list.id,
        media_type: 'show',
        show_id: show.id,
      },
      { onConflict: 'list_id,media_type,target_id' }
    )
    .select()
    .single();

  if (error) throw error;
  return data;
}
