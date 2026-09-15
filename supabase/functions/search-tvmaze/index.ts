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

async function authorize(request: Request, supabase: ReturnType<typeof createSupabaseAdmin>) {
  const authorization = request.headers.get('Authorization');
  if (!authorization) return null;

  const token = authorization.replace('Bearer ', '');
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user.id;
}

async function enforceRateLimit(supabase: ReturnType<typeof createSupabaseAdmin>, userId: string) {
  const windowStart = new Date();
  windowStart.setSeconds(0, 0);

  const lookup = {
    user_id: userId,
    function_name: 'search-tvmaze',
    window_start: windowStart.toISOString(),
  };
  const { data: existing, error: existingError } = await supabase
    .from('edge_rate_limits')
    .select('id, request_count')
    .match(lookup)
    .maybeSingle();

  if (existingError) throw existingError;

  if (!existing) {
    const { error } = await supabase.from('edge_rate_limits').insert(lookup);
    if (error) throw error;
    return true;
  }

  const nextCount = (existing.request_count ?? 0) + 1;
  const { error: updateError } = await supabase
    .from('edge_rate_limits')
    .update({ request_count: nextCount })
    .eq('id', existing.id);

  if (updateError) throw updateError;
  return nextCount <= 20;
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
  const userId = await authorize(request, supabase);
  if (!userId) return jsonResponse({ error: 'Unauthorized' }, 401);

  const body = (await request.json().catch(() => ({}))) as { query?: string };
  const term = body.query?.trim();
  if (!term) return jsonResponse({ results: [], cached: false });

  const normalizedQuery = term.toLowerCase();
  const { data: cached, error: cacheError } = await supabase
    .from('search_cache')
    .select('payload')
    .eq('query', normalizedQuery)
    .eq('media_type', 'Shows')
    .eq('source', 'tvmaze')
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();

  if (cacheError) {
    await logEdgeEvent(supabase, {
      functionName: 'search-tvmaze',
      eventType: 'error',
      statusCode: 500,
      durationMs: Date.now() - startedAt,
      userId,
      metadata: { query: normalizedQuery, error: cacheError.message },
    });
    return jsonResponse({ error: cacheError.message }, 500);
  }
  if (cached?.payload) {
    await logEdgeEvent(supabase, {
      functionName: 'search-tvmaze',
      eventType: 'cache_hit',
      statusCode: 200,
      durationMs: Date.now() - startedAt,
      userId,
      metadata: { query: normalizedQuery },
    });
    return jsonResponse({ results: cached.payload, cached: true });
  }

  await logEdgeEvent(supabase, {
    functionName: 'search-tvmaze',
    eventType: 'cache_miss',
    statusCode: 200,
    durationMs: Date.now() - startedAt,
    userId,
    metadata: { query: normalizedQuery },
  });

  const isAllowed = await enforceRateLimit(supabase, userId).catch(() => false);
  if (!isAllowed) {
    await logEdgeEvent(supabase, {
      functionName: 'search-tvmaze',
      eventType: 'rate_limited',
      statusCode: 429,
      durationMs: Date.now() - startedAt,
      userId,
      metadata: { query: normalizedQuery },
    });
    return jsonResponse({ error: 'Search rate limit exceeded' }, 429);
  }

  const response = await fetch(`https://api.tvmaze.com/search/shows?q=${encodeURIComponent(term)}`);
  if (!response.ok) {
    await logEdgeEvent(supabase, {
      functionName: 'search-tvmaze',
      eventType: 'error',
      statusCode: 502,
      durationMs: Date.now() - startedAt,
      userId,
      metadata: { query: normalizedQuery, upstreamStatus: response.status },
    });
    return jsonResponse({ error: `TVmaze request failed: ${response.status}` }, 502);
  }

  const data = (await response.json()) as Array<{ show: TvmazeShow }>;
  const results = data.map((item) => item.show);
  const { error } = await supabase.from('search_cache').upsert(
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

  if (error) {
    await logEdgeEvent(supabase, {
      functionName: 'search-tvmaze',
      eventType: 'error',
      statusCode: 500,
      durationMs: Date.now() - startedAt,
      userId,
      metadata: { query: normalizedQuery, error: error.message },
    });
    return jsonResponse({ error: error.message }, 500);
  }
  await logEdgeEvent(supabase, {
    functionName: 'search-tvmaze',
    eventType: 'success',
    statusCode: 200,
    durationMs: Date.now() - startedAt,
    userId,
    metadata: { query: normalizedQuery, resultCount: results.length },
  });
  return jsonResponse({ results, cached: false });
});
