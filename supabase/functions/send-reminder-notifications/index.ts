import { corsHeaders, jsonResponse } from '../_shared/cors.ts';
import { createSupabaseAdmin } from '../_shared/supabaseAdmin.ts';

function codeForEpisode(seasonNumber: number, episodeNumber: number) {
  return `S${String(seasonNumber).padStart(2, '0')} | E${String(episodeNumber).padStart(2, '0')}`;
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    const cronSecret = Deno.env.get('CRON_SECRET');
    if (cronSecret && request.headers.get('x-cron-secret') !== cronSecret) {
      return jsonResponse({ error: 'Unauthorized' }, 401);
    }

    const supabase = createSupabaseAdmin();
    const { data, error } = await supabase
      .from('reminders')
      .select('user_id, remind_at, episodes(title, episode_number, seasons(season_number, shows(title)))')
      .eq('enabled', true)
      .lte('remind_at', new Date().toISOString());

    if (error) throw error;

    const userIds = [...new Set((data ?? []).map((reminder) => reminder.user_id))];
    const { data: preferences } = userIds.length
      ? await supabase.from('notification_preferences').select('user_id, reminders').in('user_id', userIds)
      : { data: [] };
    const remindersEnabledByUser = new Map((preferences ?? []).map((preference) => [preference.user_id, preference.reminders]));

    for (const reminder of data ?? []) {
      const episode = reminder.episodes as
        | { title: string; episode_number: number; seasons: { season_number: number; shows: { title: string } } }
        | null;

      if (!episode) continue;
      if (remindersEnabledByUser.get(reminder.user_id) === false) continue;

      const showTitle = episode.seasons.shows.title;
      const code = codeForEpisode(episode.seasons.season_number, episode.episode_number);
      const { error: notificationError } = await supabase.from('notifications').insert({
        user_id: reminder.user_id,
        type: 'Reminder',
        title: `${showTitle} is ready`,
        body: `${code} - ${episode.title}`,
        deep_link: `/shows/${encodeURIComponent(showTitle)}`,
      });

      if (notificationError && notificationError.code !== '23505') throw notificationError;
    }

    return jsonResponse({ ok: true, processed: data?.length ?? 0 });
  } catch (error) {
    return jsonResponse({ error: error instanceof Error ? error.message : 'Reminder processing failed' }, 500);
  }
});
