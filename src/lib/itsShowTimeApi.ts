import { supabase } from './supabase';
import { readThroughCache } from './offlineCache';
import {
  getTmdbMovieDetail,
  getTmdbSeasonDetail,
  getTmdbTvDetail,
  searchTmdb,
  tmdbBackdrop,
  tmdbPoster,
  type TmdbSearchItem,
} from './tmdb';
import { searchTvmazeShows, type TvmazeShow } from './tvmaze';
import type {
  AdminSummary,
  CrisisControl,
  CustomList,
  DiscoverItem,
  Episode,
  EpisodeReaction,
  LibraryShow,
  NotificationPreferences,
  UpcomingGroup,
} from '../types';

type CommentRow = {
  id: string;
  user_id: string;
  body: string;
  spoiler_level: string | null;
  status: 'visible' | 'reported' | 'hidden';
  report_count: number;
  is_spoiler?: boolean;
  parent_comment_id?: string | null;
  created_at: string;
  profiles: { display_name: string } | null;
};

const defaultNotificationPreferences: NotificationPreferences = {
  reminders: true,
  upcoming: true,
  replies: true,
  listActivity: true,
  productUpdates: true,
};

export const defaultCrisisControl: CrisisControl = {
  mode: 'normal',
  message: '',
  features: {
    externalSearch: true,
    catalogImport: true,
    communityWrites: true,
    notifications: true,
    realtime: true,
    newSignups: true,
    queueWorkers: true,
    support: true,
  },
};

function normalizeCrisisControl(config?: Partial<CrisisControl> | null): CrisisControl {
  return {
    ...defaultCrisisControl,
    ...(config ?? {}),
    features: {
      ...defaultCrisisControl.features,
      ...(config?.features ?? {}),
    },
  };
}

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

export async function saveProfileSettings(
  userId: string,
  settings: Partial<{ theme: string; spoilerMode: 'strict' | 'moderate' | 'off' }>
) {
  const client = requireSupabase();
  const payload: { theme?: string; spoiler_mode?: 'strict' | 'moderate' | 'off' } = {};

  if (settings.theme) payload.theme = settings.theme;
  if (settings.spoilerMode) payload.spoiler_mode = settings.spoilerMode;

  const { data, error } = await client.from('profiles').update(payload).eq('id', userId).select('*').single();

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

export async function getNotificationPreferences(userId: string): Promise<NotificationPreferences> {
  const client = requireSupabase();
  const { data, error } = await client
    .from('notification_preferences')
    .select('reminders, upcoming, replies, list_activity, product_updates')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  if (!data) {
    await client.from('notification_preferences').upsert({ user_id: userId });
    return defaultNotificationPreferences;
  }

  return {
    reminders: data.reminders,
    upcoming: data.upcoming,
    replies: data.replies,
    listActivity: data.list_activity,
    productUpdates: data.product_updates,
  };
}

export async function saveNotificationPreferences(userId: string, preferences: NotificationPreferences) {
  const client = requireSupabase();
  const { error } = await client.from('notification_preferences').upsert(
    {
      user_id: userId,
      reminders: preferences.reminders,
      upcoming: preferences.upcoming,
      replies: preferences.replies,
      list_activity: preferences.listActivity,
      product_updates: preferences.productUpdates,
    },
    { onConflict: 'user_id' }
  );

  if (error) throw error;
}

export async function registerDevicePushToken({
  userId,
  expoPushToken,
  platform,
}: {
  userId: string;
  expoPushToken: string;
  platform: string;
}) {
  const client = requireSupabase();
  const { error } = await client.from('device_push_tokens').upsert(
    {
      user_id: userId,
      expo_push_token: expoPushToken,
      platform,
      enabled: true,
      last_seen_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,expo_push_token' }
  );

  if (error) throw error;
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
  const { error: functionError } = await client.functions.invoke('delete-account', {
    body: { reason: reason ?? null },
  });

  if (!functionError) {
    await signOut();
    return;
  }

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
  return readThroughCache(`library-progress:${userId}`, async () => {
    const { data, error } = await (client as any).rpc('get_library_progress', { target_user_id: userId });

    if (error) throw error;
    return (data ?? []) as LibraryShow[];
  });
}

export async function getWatchNextEpisodes(userId: string): Promise<Episode[]> {
  const client = requireSupabase();
  return readThroughCache(`watch-next:${userId}`, async () => {
    const { data, error } = await (client as any).rpc('get_watch_next_episodes', { target_user_id: userId });

    if (error) throw error;
    return (data ?? []) as Episode[];
  });
}

export async function getNotifications(userId: string, options: { limit?: number; offset?: number; generate?: boolean } = {}) {
  const client = requireSupabase();
  const crisisControl = await getAppConfig().catch(() => defaultCrisisControl);
  if (options.generate !== false && crisisControl.features.notifications && crisisControl.mode !== 'maintenance') {
    await Promise.all([createDueReminderNotifications(userId), createUpcomingEpisodeNotifications(userId)]);
  }

  const limit = options.limit ?? 20;
  const offset = options.offset ?? 0;
  return readThroughCache(`notifications:${userId}:${limit}:${offset}`, async () => {
    const { data, error } = await client
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data ?? [];
  });
}

export async function createDueReminderNotifications(userId: string) {
  const client = requireSupabase();
  const { data, error } = await client
    .from('reminders')
    .select('id, remind_at, episodes(title, episode_number, seasons(season_number, shows(title)))')
    .eq('user_id', userId)
    .eq('enabled', true)
    .lte('remind_at', new Date().toISOString());

  if (error) throw error;

  await Promise.all(
    (data ?? []).map((reminder) => {
      const episode = reminder.episodes as
        | { title: string; episode_number: number; seasons: { season_number: number; shows: { title: string } } }
        | null;
      const showTitle = episode?.seasons?.shows?.title ?? 'Your show';
      const code = episode
        ? `S${String(episode.seasons.season_number).padStart(2, '0')} | E${String(episode.episode_number).padStart(2, '0')}`
        : 'Next episode';

      return createNotification({
        userId,
        type: 'Reminder',
        title: `${showTitle} is ready`,
        body: `${code}${episode?.title ? ` - ${episode.title}` : ''}`,
        deepLink: `/shows/${encodeURIComponent(showTitle)}`,
      });
    })
  );
}

export async function createUpcomingEpisodeNotifications(userId: string) {
  const client = requireSupabase();
  const now = new Date();
  const soon = new Date(now);
  soon.setDate(now.getDate() + 2);

  const { data: libraryItems, error: libraryError } = await client
    .from('user_library_items')
    .select('show_id')
    .eq('user_id', userId)
    .eq('media_type', 'show');

  if (libraryError) throw libraryError;

  const showIds = (libraryItems ?? []).map((item) => item.show_id).filter(Boolean) as string[];
  if (!showIds.length) return;

  const { data, error } = await client
    .from('episodes')
    .select('title, episode_number, air_date, seasons!inner(season_number, shows!inner(id, title))')
    .in('seasons.shows.id', showIds)
    .gte('air_date', now.toISOString().slice(0, 10))
    .lte('air_date', soon.toISOString().slice(0, 10))
    .order('air_date', { ascending: true });

  if (error) throw error;

  await Promise.all(
    (data ?? []).map((episode) => {
      const season = episode.seasons as { season_number: number; shows: { title: string } };
      const code = `S${String(season.season_number).padStart(2, '0')} | E${String(episode.episode_number).padStart(2, '0')}`;
      return createNotification({
        userId,
        type: 'Upcoming',
        title: `${season.shows.title} airs soon`,
        body: `${code} - ${episode.title}${episode.air_date ? ` on ${episode.air_date}` : ''}`,
        deepLink: `/shows/${encodeURIComponent(season.shows.title)}`,
      });
    })
  );
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
  const reminderTimes = new Map<string, string>();
  const watchedIds = new Set<string>();

  if (episodeIds.length) {
    const [{ data: reminders, error: reminderError }, { data: progressRows, error: progressError }] = await Promise.all([
      client
        .from('reminders')
        .select('episode_id, remind_at')
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
    reminders?.forEach((reminder) => {
      reminderIds.add(reminder.episode_id);
      reminderTimes.set(reminder.episode_id, reminder.remind_at);
    });
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
      episodeId: episode.id,
      airDate: episode.air_date,
      remindAt: reminderTimes.get(episode.id) ?? null,
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
      episodeId: nextEpisode.id,
      airDate: nextEpisode.air_date,
      remindAt: reminderTimes.get(nextEpisode.id) ?? null,
      tracked: reminderIds.has(nextEpisode.id),
      image: season.shows.poster_url ?? 'https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=600&auto=format&fit=crop',
    };
  });

  return nextItems.length ? [{ day: 'Next', date: 'Queue', items: nextItems }] : [];
}

export async function getProfileStats(userId: string) {
  const client = requireSupabase();
  const { data, error } = await (client as any).rpc('get_profile_stats', { target_user_id: userId });

  if (error) throw error;
  return data;
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

export async function getCommunityComments(context: {
  kind: 'episode' | 'movie';
  title: string;
  userId?: string;
  limit?: number;
  offset?: number;
}) {
  const client = requireSupabase();
  const limit = Math.min(Math.max(context.limit ?? 20, 1), 50);
  const offset = Math.max(context.offset ?? 0, 0);
  const baseQuery = client
    .from('comments')
    .select('id, user_id, body, spoiler_level, status, report_count, is_spoiler, parent_comment_id, created_at, profiles(display_name)')
    .neq('status', 'hidden')
    .is('parent_comment_id', null)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  const lookup = context.kind === 'movie' ? await findMovieByTitle(context.title) : await findShowByTitle(context.title);
  if (!lookup) return [];

  const { data, error } =
    context.kind === 'movie'
      ? await baseQuery.eq('movie_id', lookup.id)
      : await baseQuery.eq('show_id', lookup.id);

  if (error) throw error;
  const commentIds = (data ?? []).map((comment) => comment.id);
  const likeCounts = new Map<string, number>();
  const replyCounts = new Map<string, number>();
  const likedByMe = new Set<string>();

  if (commentIds.length) {
    const [{ data: likes, error: likesError }, { data: replies, error: repliesError }] = await Promise.all([
      client
      .from('comment_likes')
      .select('comment_id, user_id')
      .in('comment_id', commentIds),
      client
        .from('comments')
        .select('parent_comment_id')
        .in('parent_comment_id', commentIds)
        .neq('status', 'hidden'),
    ]);

    if (likesError) throw likesError;
    if (repliesError) throw repliesError;

    likes?.forEach((like) => {
      likeCounts.set(like.comment_id, (likeCounts.get(like.comment_id) ?? 0) + 1);
      if (context.userId && like.user_id === context.userId) likedByMe.add(like.comment_id);
    });
    replies?.forEach((reply) => {
      if (!reply.parent_comment_id) return;
      replyCounts.set(reply.parent_comment_id, (replyCounts.get(reply.parent_comment_id) ?? 0) + 1);
    });
  }

  return (data ?? []).map((comment) => ({
    id: comment.id,
    userId: comment.user_id,
    user: (comment.profiles as { display_name: string } | null)?.display_name ?? 'Watcher',
    mood: comment.spoiler_level ?? 'Reacted',
    text: comment.body,
    likes: likeCounts.get(comment.id) ?? 0,
    replyCount: replyCounts.get(comment.id) ?? 0,
    isSpoiler: comment.is_spoiler,
    likedByMe: likedByMe.has(comment.id),
    canDelete: context.userId === comment.user_id,
    canReport: Boolean(context.userId && context.userId !== comment.user_id),
    status: comment.status,
    reportCount: comment.report_count,
    createdAt: comment.created_at,
  }));
}

export async function getCommentReplies(parentCommentId: string, userId?: string): Promise<CommunityComment[]> {
  const client = requireSupabase();
  const { data, error } = await client
    .from('comments')
    .select('id, user_id, body, spoiler_level, status, report_count, is_spoiler, parent_comment_id, created_at, profiles(display_name)')
    .eq('parent_comment_id', parentCommentId)
    .neq('status', 'hidden')
    .order('created_at', { ascending: true });

  if (error) throw error;

  const commentIds = (data ?? []).map((comment) => comment.id);
  const likeCounts = new Map<string, number>();
  const likedByMe = new Set<string>();

  if (commentIds.length) {
    const { data: likes, error: likesError } = await client
      .from('comment_likes')
      .select('comment_id, user_id')
      .in('comment_id', commentIds);

    if (likesError) throw likesError;
    likes?.forEach((like) => {
      likeCounts.set(like.comment_id, (likeCounts.get(like.comment_id) ?? 0) + 1);
      if (userId && like.user_id === userId) likedByMe.add(like.comment_id);
    });
  }

  return ((data ?? []) as CommentRow[]).map((comment) => ({
    id: comment.id,
    userId: comment.user_id,
    user: comment.profiles?.display_name ?? 'Watcher',
    mood: comment.spoiler_level ?? 'Reacted',
    text: comment.body,
    likes: likeCounts.get(comment.id) ?? 0,
    replyCount: 0,
    isSpoiler: comment.is_spoiler,
    parentCommentId: comment.parent_comment_id,
    likedByMe: likedByMe.has(comment.id),
    canDelete: userId === comment.user_id,
    canReport: Boolean(userId && userId !== comment.user_id),
    status: comment.status,
    reportCount: comment.report_count,
    createdAt: comment.created_at,
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
  const isSpoiler = /\b(spoiler|ending|finale|twist|death|dies)\b/i.test(body) || mood.toLowerCase().includes('spoiler');

  const { error } = await client.from('comments').insert({
    user_id: userId,
    media_type: context.kind === 'movie' ? 'movie' : 'show',
    body,
    spoiler_level: mood,
    show_id: context.kind === 'episode' ? lookup.id : null,
    movie_id: context.kind === 'movie' ? lookup.id : null,
    is_spoiler: isSpoiler,
  });

  if (error) throw error;
}

export async function createCommunityReply({
  userId,
  parentComment,
  body,
  mood,
}: {
  userId: string;
  parentComment: CommunityComment;
  body: string;
  mood: string;
}) {
  const client = requireSupabase();
  const isSpoiler = /\b(spoiler|ending|finale|twist|death|dies)\b/i.test(body) || mood.toLowerCase().includes('spoiler');

  const { error } = await client.from('comments').insert({
    user_id: userId,
    media_type: 'show',
    body,
    spoiler_level: mood,
    parent_comment_id: parentComment.id,
    is_spoiler: isSpoiler,
    show_id: null,
    movie_id: null,
  });

  if (error) throw error;
}

export async function toggleCommentLike(userId: string, commentId: string, liked: boolean) {
  const client = requireSupabase();

  if (liked) {
    const { error } = await client.from('comment_likes').delete().eq('user_id', userId).eq('comment_id', commentId);
    if (error) throw error;
    return false;
  }

  const { error } = await client
    .from('comment_likes')
    .upsert({ user_id: userId, comment_id: commentId }, { onConflict: 'comment_id,user_id' });

  if (error) throw error;
  return true;
}

export async function deleteCommunityComment(userId: string, commentId: string) {
  const client = requireSupabase();
  const { error } = await client.from('comments').delete().eq('id', commentId).eq('user_id', userId);

  if (error) throw error;
}

export async function reportCommunityComment(userId: string, commentId: string, reason = 'spoiler') {
  const client = requireSupabase();
  const { error } = await client
    .from('comment_reports')
    .upsert({ user_id: userId, comment_id: commentId, reason }, { onConflict: 'comment_id,user_id' });

  if (error) throw error;

  const { count, error: countError } = await client
    .from('comment_reports')
    .select('id', { count: 'exact', head: true })
    .eq('comment_id', commentId);

  if (countError) throw countError;

  const nextStatus = (count ?? 0) >= 3 ? 'hidden' : 'reported';
  const { error: updateError } = await client
    .from('comments')
    .update({ status: nextStatus, report_count: count ?? 1 })
    .eq('id', commentId);

  if (updateError) throw updateError;
}

export async function startWatchSession({
  userId,
  episodeId,
  movieId,
}: {
  userId: string;
  episodeId?: string;
  movieId?: string;
}) {
  const client = requireSupabase();
  const { data, error } = await client
    .from('watch_sessions')
    .insert({
      user_id: userId,
      media_type: episodeId ? 'show' : 'movie',
      episode_id: episodeId ?? null,
      movie_id: movieId ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function endWatchSession(sessionId: string, durationMinutes?: number) {
  const client = requireSupabase();
  const { data, error } = await client
    .from('watch_sessions')
    .update({
      ended_at: new Date().toISOString(),
      duration_minutes: durationMinutes,
    })
    .eq('id', sessionId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function recordCompletedEpisodeSession(userId: string, episodeId: string, durationMinutes?: number | null) {
  const startedAt = new Date(Date.now() - (durationMinutes ?? 44) * 60 * 1000).toISOString();
  const client = requireSupabase();
  const { data, error } = await client
    .from('watch_sessions')
    .insert({
      user_id: userId,
      media_type: 'show',
      episode_id: episodeId,
      started_at: startedAt,
      ended_at: new Date().toISOString(),
      duration_minutes: durationMinutes ?? 44,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getShowDetailByTitle(title: string, userId?: string) {
  const client = requireSupabase();
  const { data: show, error: showError } = await client
    .from('shows')
    .select('id, title, overview, poster_url, backdrop_url, status, average_rating, import_status, import_error')
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
      importStatus: show.import_status,
      importError: show.import_error,
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
  return saveProfileSettings(userId, { theme });
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
  const term = query.trim();
  if (!term) return [];

  const client = requireSupabase();
  const { data, error } = await client.functions.invoke('search-tvmaze', {
    body: { query: term },
  });

  if (error) {
    return searchCachedTvmazeShows(term);
  }

  return (data?.results ?? []) as Awaited<ReturnType<typeof searchTvmazeShows>>;
}

async function searchCachedTvmazeShows(query: string) {
  const term = query.trim();
  if (!term) return [];

  const client = requireSupabase();
  const normalizedQuery = term.toLowerCase();
  const { data: cached, error: cacheError } = await client
    .from('search_cache')
    .select('payload')
    .eq('query', normalizedQuery)
    .eq('media_type', 'Shows')
    .eq('source', 'tvmaze')
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();

  if (cacheError) throw cacheError;
  if (cached?.payload) return cached.payload as unknown as Awaited<ReturnType<typeof searchTvmazeShows>>;

  const results = await searchTvmazeShows(term);
  const { error } = await client.from('search_cache').upsert(
    {
      query: normalizedQuery,
      media_type: 'Shows',
      source: 'tvmaze',
      payload: results,
      result_count: results.length,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
    { onConflict: 'query,media_type,source' }
  );

  if (error) throw error;
  return results;
}

export async function getRecommendationSignals(userId: string) {
  const client = requireSupabase();
  const { data, error } = await (client as any).rpc('refresh_user_recommendation_signals', { target_user_id: userId });

  if (error) throw error;
  return (data ?? { topMoods: [], completedShowCount: 0, watchedEpisodeCount: 0 }) as {
    topMoods: string[];
    completedShowCount: number;
    watchedEpisodeCount: number;
  };
}

export async function getDiscoverShows(genres: string[] = [], services: string[] = [], userId?: string): Promise<DiscoverItem[]> {
  const signals = userId ? await getRecommendationSignals(userId).catch(() => null) : null;
  const normalizedGenres = genres.map((genre) => genre.toLowerCase());
  const moodSeeds = (signals?.topMoods ?? []).map((mood) => mood.toLowerCase());
  const seeds = [...normalizedGenres, ...moodSeeds, 'drama', 'comedy', 'mystery', 'thriller', 'romance'].filter(Boolean);
  const batches = await Promise.all(seeds.slice(0, 5).map((seed) => searchCachedTvmazeShows(seed).catch(() => [])));
  const seen = new Set<number>();
  const shows = batches
    .flat()
    .filter((show) => {
      if (seen.has(show.id)) return false;
      seen.add(show.id);
      return Boolean(show.image?.original ?? show.image?.medium);
    })
    .map((show) => {
      const summary = show.summary?.replace(/<[^>]+>/g, '').toLowerCase() ?? '';
      const title = show.name.toLowerCase();
      const preferenceHits = normalizedGenres.filter((genre) => summary.includes(genre) || title.includes(genre)).length;
      const moodHits = moodSeeds.filter((mood) => summary.includes(mood) || title.includes(mood)).length;
      const ratingScore = show.rating.average ?? 0;
      const freshnessScore = show.premiered ? Math.max(0, Number(show.premiered.slice(0, 4)) - 2010) / 4 : 1;
      const historyDepth = Math.min(signals?.watchedEpisodeCount ?? 0, 40) / 4;
      return { show, score: preferenceHits * 22 + moodHits * 18 + ratingScore * 5 + freshnessScore + historyDepth };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 12)
    .map((item) => item.show);

  return shows.map((show, index) => {
    const rating = show.rating.average ? show.rating.average / 2 : null;
    const preferenceGenre = genres[index % Math.max(genres.length, 1)];
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
      reason: preferenceGenre
        ? `Picked from your ${preferenceGenre} taste profile${serviceHint ? ` and ${serviceHint} preference` : ''}.`
        : signals?.topMoods?.[0]
          ? `Picked from your ${signals.topMoods[0]} reaction pattern.`
          : 'Picked from the live TVmaze catalog.',
      match: rating
        ? `${Math.min(98, Math.round(rating * 18 + (preferenceGenre ? 8 : 0) + Math.min(signals?.completedShowCount ?? 0, 5)))}% match`
        : 'New pick',
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

export async function getShowImportStatus(showTitle: string) {
  const client = requireSupabase();
  const { data, error } = await client
    .from('shows')
    .select('id, import_status, import_error, last_imported_at')
    .eq('title', showTitle)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function importExternalShow(show: TvmazeShow, userId?: string) {
  const client = requireSupabase();
  const { data, error } = await client.functions.invoke('request-catalog-import', {
    body: { show, requestedBy: userId },
  });

  if (error) throw error;
  if (!data?.show?.id) throw new Error('Catalog import could not be queued.');

  return data.show as { id: string };
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

export async function getEpisodeRuntime(episodeId: string) {
  const client = requireSupabase();
  const { data, error } = await client.from('episodes').select('runtime_minutes').eq('id', episodeId).maybeSingle();

  if (error) throw error;
  return data?.runtime_minutes ?? 44;
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
  await recordCompletedEpisodeSession(userId, episodeId, await getEpisodeRuntime(episodeId)).catch(() => undefined);
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
  const crisisControl = await getAppConfig().catch(() => defaultCrisisControl);
  if (!crisisControl.features.notifications || crisisControl.mode === 'maintenance') return null;

  const preferences = await getNotificationPreferences(userId).catch(() => defaultNotificationPreferences);
  const allowed =
    (type === 'Reminder' && preferences.reminders) ||
    (type === 'Upcoming' && preferences.upcoming) ||
    (type === 'Reply' && preferences.replies) ||
    (type === 'List' && preferences.listActivity) ||
    (type !== 'Reminder' && type !== 'Upcoming' && type !== 'Reply' && type !== 'List');

  if (!allowed) return null;

  const normalizedBody = body ?? '';
  const normalizedDeepLink = deepLink ?? '';
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
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
  episodeId,
  airDate,
  enabled,
}: {
  userId: string;
  showTitle: string;
  code: string;
  episodeId?: string;
  airDate?: string | null;
  enabled: boolean;
}) {
  const client = requireSupabase();
  const episode = episodeId ? { id: episodeId } : await findEpisodeByShowAndCode(showTitle, code);
  if (!episode.id) return null;

  const airDateReminder = airDate ? new Date(`${airDate}T09:00:00`).toISOString() : null;
  const remindAt = airDateReminder ?? new Date(Date.now() + 60 * 60 * 1000).toISOString();
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
    .select('id, title, description, privacy, list_items(id, media_type, shows(title, poster_url, status), movies(title, poster_url, runtime_minutes))')
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
      description: list.description ?? undefined,
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

export async function getAdminSummary(): Promise<AdminSummary> {
  const client = requireSupabase();
  const { data, error } = await (client as any).rpc('get_admin_summary');

  if (error) throw error;
  return data as AdminSummary;
}

export async function getAppConfig(): Promise<CrisisControl> {
  const client = requireSupabase();
  const { data, error } = await (client as any).rpc('get_app_config');

  if (error) throw error;
  return normalizeCrisisControl(data as Partial<CrisisControl>);
}

export async function updateCrisisControl(config: CrisisControl, incidentMessage: string) {
  const client = requireSupabase();
  const { data, error } = await client.functions.invoke('admin-actions', {
    body: {
      action: 'set_crisis_control',
      mode: config.mode,
      message: config.message,
      features: config.features,
      incidentMessage,
    },
  });

  if (error) throw error;
  return normalizeCrisisControl((data as { crisisControl?: Partial<CrisisControl> })?.crisisControl);
}

export async function retryCatalogImport(jobId: string) {
  const client = requireSupabase();
  const { error } = await client.functions.invoke('admin-actions', {
    body: { action: 'retry_import', jobId },
  });

  if (error) throw error;
}

export async function hideReportedComment(commentId: string) {
  const client = requireSupabase();
  const { error } = await client.functions.invoke('admin-actions', {
    body: { action: 'hide_comment', commentId },
  });

  if (error) throw error;
}

export async function clearSearchCache(cacheId?: string) {
  const client = requireSupabase();
  const { error } = await client.functions.invoke('admin-actions', {
    body: { action: 'clear_cache', cacheId },
  });

  if (error) throw error;
}

export async function runDatabaseMaintenance() {
  const client = requireSupabase();
  const { data, error } = await client.functions.invoke('database-maintenance', {
    body: {},
  });

  if (error) throw error;
  return data as { ok: boolean; cleanup: Record<string, number | string> };
}

export async function createSupportIntent(userId?: string) {
  const client = requireSupabase();
  const { data, error } = await client.functions.invoke('create-support-intent', {
    body: {
      campaignSlug: 'movie-catalog-budget',
      source: 'buymeacoffee',
      metadata: { surface: 'movies_locked_page', userId },
    },
  });

  if (error) throw error;
  return data as { ok: boolean; intentId: string; redirectUrl: string };
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
