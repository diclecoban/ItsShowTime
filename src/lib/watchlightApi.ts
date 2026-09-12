import { supabase } from './supabase';

export function requireSupabase() {
  if (!supabase) {
    throw new Error('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.');
  }

  return supabase;
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

export async function signUpWithEmail(email: string, password: string, displayName?: string) {
  const client = requireSupabase();
  const { data, error } = await client.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName,
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

export async function markNotificationRead(notificationId: string) {
  const client = requireSupabase();
  const { data, error } = await client
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', notificationId)
    .select()
    .single();

  if (error) throw error;
  return data;
}
