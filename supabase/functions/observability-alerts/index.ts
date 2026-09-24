import { corsHeaders, jsonResponse } from '../_shared/cors.ts';
import { logEdgeEvent } from '../_shared/observability.ts';
import { createSupabaseAdmin } from '../_shared/supabaseAdmin.ts';

async function authorize(request: Request) {
  const cronSecret = Deno.env.get('CRON_SECRET');
  const providedSecret = request.headers.get('x-cron-secret');
  return Boolean(cronSecret && providedSecret === cronSecret);
}

Deno.serve(async (request) => {
  const startedAt = Date.now();

  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  if (!(await authorize(request))) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }

  const supabase = createSupabaseAdmin();
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const [{ count: failedJobs }, { count: backlog }, { count: edgeErrors }] = await Promise.all([
    supabase.from('catalog_import_jobs').select('id', { count: 'exact', head: true }).eq('status', 'failed'),
    supabase.from('catalog_import_jobs').select('id', { count: 'exact', head: true }).in('status', ['pending', 'processing']),
    supabase
      .from('edge_function_events')
      .select('id', { count: 'exact', head: true })
      .eq('event_type', 'error')
      .gte('created_at', since),
  ]);

  const alerts = [
    failedJobs && failedJobs > 0 ? `${failedJobs} failed catalog import jobs` : null,
    backlog && backlog > 20 ? `${backlog} catalog import jobs waiting` : null,
    edgeErrors && edgeErrors > 0 ? `${edgeErrors} Edge Function errors in the last hour` : null,
  ].filter(Boolean);

  const webhookUrl = Deno.env.get('OBSERVABILITY_WEBHOOK_URL');
  if (alerts.length && webhookUrl) {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        app: 'It’s Showtime',
        severity: 'warning',
        alerts,
        metrics: { failedJobs, backlog, edgeErrors },
      }),
    });
  }

  await logEdgeEvent(supabase, {
    functionName: 'observability-alerts',
    eventType: alerts.length ? 'error' : 'success',
    statusCode: 200,
    durationMs: Date.now() - startedAt,
    metadata: { alerts, dryRun: !webhookUrl },
  });

  return jsonResponse({ ok: true, alerts, dryRun: !webhookUrl });
});
