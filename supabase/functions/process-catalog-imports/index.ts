import { corsHeaders, jsonResponse } from '../_shared/cors.ts';
import { logEdgeEvent } from '../_shared/observability.ts';
import { createSupabaseAdmin } from '../_shared/supabaseAdmin.ts';

type TvmazeEpisode = {
  name: string;
  season: number;
  number: number;
  summary: string | null;
  airdate: string | null;
  runtime: number | null;
  rating: { average: number | null };
};

type CatalogJob = {
  id: string;
  show_id: string;
  external_id: number;
  attempts: number | null;
};

function cleanHtml(value?: string | null) {
  return value?.replace(/<[^>]+>/g, '') ?? null;
}

async function authorize(request: Request, supabase: ReturnType<typeof createSupabaseAdmin>) {
  const cronSecret = Deno.env.get('CRON_SECRET');
  const providedSecret = request.headers.get('x-cron-secret');

  if (cronSecret && providedSecret === cronSecret) return { ok: true, userId: null };

  const authorization = request.headers.get('Authorization');
  if (!authorization) return { ok: false, userId: null };

  const token = authorization.replace('Bearer ', '');
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) return { ok: false, userId: null };
  return { ok: true, userId: data.user.id };
}

async function importJob(supabase: ReturnType<typeof createSupabaseAdmin>, job: CatalogJob) {
  await supabase
    .from('catalog_import_jobs')
    .update({
      status: 'processing',
      error: null,
      attempts: (job.attempts ?? 0) + 1,
      started_at: new Date().toISOString(),
      finished_at: null,
    })
    .eq('id', job.id);

  await supabase
    .from('shows')
    .update({ import_status: 'processing', import_error: null })
    .eq('id', job.show_id);

  const response = await fetch(`https://api.tvmaze.com/shows/${job.external_id}/episodes`);
  if (!response.ok) throw new Error(`TVmaze request failed: ${response.status}`);

  const episodes = (await response.json()) as TvmazeEpisode[];
  const seasonNumbers = [...new Set(episodes.map((episode) => episode.season))];

  for (const seasonNumber of seasonNumbers) {
    const { data: season, error: seasonError } = await supabase
      .from('seasons')
      .upsert(
        {
          show_id: job.show_id,
          season_number: seasonNumber,
          title: `Season ${seasonNumber}`,
        },
        { onConflict: 'show_id,season_number' }
      )
      .select('id')
      .single();

    if (seasonError) throw seasonError;

    const rows = episodes
      .filter((episode) => episode.season === seasonNumber)
      .map((episode) => ({
        season_id: season.id,
        episode_number: episode.number,
        title: episode.name,
        overview: cleanHtml(episode.summary),
        air_date: episode.airdate,
        runtime_minutes: episode.runtime,
        average_rating: episode.rating.average ? Number((episode.rating.average / 2).toFixed(2)) : null,
      }));

    if (rows.length) {
      const { error: episodeError } = await supabase
        .from('episodes')
        .upsert(rows, { onConflict: 'season_id,episode_number' });

      if (episodeError) throw episodeError;
    }
  }

  await supabase
    .from('catalog_import_jobs')
    .update({
      status: 'ready',
      error: null,
      finished_at: new Date().toISOString(),
    })
    .eq('id', job.id);

  await supabase
    .from('shows')
    .update({ import_status: 'ready', import_error: null, last_imported_at: new Date().toISOString() })
    .eq('id', job.show_id);

  return episodes.length;
}

Deno.serve(async (request) => {
  const startedAt = Date.now();
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const supabase = createSupabaseAdmin();
  const auth = await authorize(request, supabase);
  if (!auth.ok) return jsonResponse({ error: 'Unauthorized' }, 401);

  let body: { job?: { tvmazeId?: number; showId?: string }; limit?: number } = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const limit = Math.min(Math.max(body.limit ?? 5, 1), 10);
  let jobs: CatalogJob[] = [];

  if (body.job?.tvmazeId && body.job?.showId) {
    const { data, error } = await supabase
      .from('catalog_import_jobs')
      .upsert(
        {
          show_id: body.job.showId,
          source: 'tvmaze',
          external_id: body.job.tvmazeId,
          status: 'pending',
          error: null,
          created_by: auth.userId,
        },
        { onConflict: 'source,external_id' }
      )
      .select('id, show_id, external_id, attempts')
      .single();

    if (error) {
      await logEdgeEvent(supabase, {
        functionName: 'process-catalog-imports',
        eventType: 'error',
        statusCode: 500,
        durationMs: Date.now() - startedAt,
        userId: auth.userId,
        metadata: { error: error.message, mode: 'single_job_upsert' },
      });
      return jsonResponse({ error: error.message }, 500);
    }
    jobs = data ? [data] : [];
  } else {
    const { data, error } = await supabase
      .from('catalog_import_jobs')
      .select('id, show_id, external_id, attempts')
      .eq('source', 'tvmaze')
      .in('status', ['pending', 'failed'])
      .lt('attempts', 3)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) {
      await logEdgeEvent(supabase, {
        functionName: 'process-catalog-imports',
        eventType: 'error',
        statusCode: 500,
        durationMs: Date.now() - startedAt,
        userId: auth.userId,
        metadata: { error: error.message, mode: 'queue_select' },
      });
      return jsonResponse({ error: error.message }, 500);
    }
    jobs = data ?? [];
  }

  const results = [];
  for (const job of jobs) {
    try {
      const importedEpisodes = await importJob(supabase, job);
      results.push({ jobId: job.id, status: 'ready', importedEpisodes });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Catalog import failed';
      await supabase
        .from('catalog_import_jobs')
        .update({ status: 'failed', error: message, finished_at: new Date().toISOString() })
        .eq('id', job.id);
      await supabase
        .from('shows')
        .update({ import_status: 'failed', import_error: message })
        .eq('id', job.show_id);
      await logEdgeEvent(supabase, {
        functionName: 'process-catalog-imports',
        eventType: 'error',
        statusCode: 500,
        durationMs: Date.now() - startedAt,
        userId: auth.userId,
        metadata: { jobId: job.id, showId: job.show_id, error: message },
      });
      results.push({ jobId: job.id, status: 'failed', error: message });
    }
  }

  await logEdgeEvent(supabase, {
    functionName: 'process-catalog-imports',
    eventType: 'processed',
    statusCode: 200,
    durationMs: Date.now() - startedAt,
    userId: auth.userId,
    metadata: { processed: results.length, failed: results.filter((result) => result.status === 'failed').length },
  });

  return jsonResponse({ ok: true, processed: results.length, results });
});
