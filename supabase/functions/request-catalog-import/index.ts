import { corsHeaders, jsonResponse } from '../_shared/cors.ts';
import { logEdgeEvent } from '../_shared/observability.ts';
import { createSupabaseAdmin } from '../_shared/supabaseAdmin.ts';

type TvmazeShow = {
  id: number;
  name: string;
  summary: string | null;
  image: { medium: string; original: string } | null;
  status: string;
  premiered: string | null;
  rating: { average: number | null };
};

function cleanHtml(value?: string | null) {
  return value?.replace(/<[^>]+>/g, '') ?? null;
}

async function getUserId(request: Request, supabase: ReturnType<typeof createSupabaseAdmin>) {
  const authorization = request.headers.get('Authorization');
  if (!authorization) return null;

  const token = authorization.replace('Bearer ', '');
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user.id;
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
  const userId = await getUserId(request, supabase);
  if (!userId) return jsonResponse({ error: 'Unauthorized' }, 401);

  const body = (await request.json().catch(() => ({}))) as { show?: TvmazeShow };
  const show = body.show;

  if (!show?.id || !show.name) {
    return jsonResponse({ error: 'A TVmaze show payload is required' }, 400);
  }

  const showPayload = {
    tmdb_id: show.id,
    title: show.name,
    overview: cleanHtml(show.summary),
    poster_url: show.image?.original ?? show.image?.medium ?? null,
    status: show.status,
    first_air_date: show.premiered,
    average_rating: show.rating.average ? Number((show.rating.average / 2).toFixed(2)) : null,
    import_status: 'pending',
    import_error: null,
  };

  const { data: showRow, error: showError } = await supabase
    .from('shows')
    .upsert(showPayload, { onConflict: 'tmdb_id' })
    .select('id, title, import_status')
    .single();

  if (showError) {
    await logEdgeEvent(supabase, {
      functionName: 'request-catalog-import',
      eventType: 'error',
      statusCode: 500,
      durationMs: Date.now() - startedAt,
      userId,
      metadata: { title: show.name, error: showError.message },
    });
    return jsonResponse({ error: showError.message }, 500);
  }

  const { data: job, error: jobError } = await supabase
    .from('catalog_import_jobs')
    .upsert(
      {
        show_id: showRow.id,
        source: 'tvmaze',
        external_id: show.id,
        status: 'pending',
        error: null,
        created_by: userId,
      },
      { onConflict: 'source,external_id' }
    )
    .select('id, status')
    .single();

  if (jobError) {
    await logEdgeEvent(supabase, {
      functionName: 'request-catalog-import',
      eventType: 'error',
      statusCode: 500,
      durationMs: Date.now() - startedAt,
      userId,
      metadata: { title: show.name, showId: showRow.id, error: jobError.message },
    });
    return jsonResponse({ error: jobError.message }, 500);
  }

  const functionUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/process-catalog-imports`;
  const cronSecret = Deno.env.get('CRON_SECRET');
  if (cronSecret) {
    EdgeRuntime.waitUntil(
      fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-cron-secret': cronSecret,
        },
        body: JSON.stringify({ job: { showId: showRow.id, tvmazeId: show.id } }),
      }).catch(() => undefined)
    );
  }

  await logEdgeEvent(supabase, {
    functionName: 'request-catalog-import',
    eventType: 'queued',
    statusCode: 200,
    durationMs: Date.now() - startedAt,
    userId,
    metadata: { title: show.name, showId: showRow.id, jobId: job.id, status: job.status },
  });
  return jsonResponse({ ok: true, show: showRow, job });
});
