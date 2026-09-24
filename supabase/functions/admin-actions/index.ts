import { corsHeaders, jsonResponse } from '../_shared/cors.ts';
import { createSupabaseAdmin } from '../_shared/supabaseAdmin.ts';

type AdminAction =
  | { action: 'retry_import'; jobId: string }
  | { action: 'hide_comment'; commentId: string }
  | { action: 'clear_cache'; cacheId?: string; query?: string }
  | {
      action: 'set_crisis_control';
      mode: 'normal' | 'degraded' | 'maintenance' | 'readonly';
      message?: string;
      features?: Record<string, boolean>;
      incidentMessage?: string;
    };

async function getAdminUserId(request: Request, supabase: ReturnType<typeof createSupabaseAdmin>) {
  const authorization = request.headers.get('Authorization');
  if (!authorization) return null;

  const token = authorization.replace('Bearer ', '');
  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData.user) return null;

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', userData.user.id)
    .maybeSingle();

  if (profileError || !profile?.is_admin) return null;
  return userData.user.id;
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const supabase = createSupabaseAdmin();
  const adminUserId = await getAdminUserId(request, supabase);
  if (!adminUserId) return jsonResponse({ error: 'Admin access required' }, 403);

  const body = (await request.json().catch(() => ({}))) as Partial<AdminAction>;

  if (body.action === 'set_crisis_control' && body.mode) {
    const { data, error } = await supabase.rpc('set_crisis_control', {
      next_mode: body.mode,
      next_message: body.message ?? '',
      next_features: body.features ?? {},
      incident_message: body.incidentMessage ?? null,
    });

    if (error) return jsonResponse({ error: error.message }, 500);
    return jsonResponse({ ok: true, crisisControl: data });
  }

  if (body.action === 'retry_import' && body.jobId) {
    const { data: job, error } = await supabase
      .from('catalog_import_jobs')
      .update({
        status: 'pending',
        error: null,
        attempts: 0,
        started_at: null,
        finished_at: null,
      })
      .eq('id', body.jobId)
      .select('id, show_id, external_id')
      .single();

    if (error) return jsonResponse({ error: error.message }, 500);

    await supabase
      .from('shows')
      .update({ import_status: 'pending', import_error: null })
      .eq('id', job.show_id);

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
          body: JSON.stringify({ job: { showId: job.show_id, tvmazeId: job.external_id } }),
        }).catch(() => undefined)
      );
    }

    return jsonResponse({ ok: true, jobId: job.id });
  }

  if (body.action === 'hide_comment' && body.commentId) {
    const { error } = await supabase
      .from('comments')
      .update({ status: 'hidden' })
      .eq('id', body.commentId);

    if (error) return jsonResponse({ error: error.message }, 500);
    return jsonResponse({ ok: true, commentId: body.commentId });
  }

  if (body.action === 'clear_cache') {
    let query = supabase.from('search_cache').delete();
    if (body.cacheId) query = query.eq('id', body.cacheId);
    else if (body.query) query = query.eq('query', body.query.trim().toLowerCase());
    else query = query.not('id', 'is', null);

    const { error } = await query;
    if (error) return jsonResponse({ error: error.message }, 500);
    return jsonResponse({ ok: true });
  }

  return jsonResponse({ error: 'Unsupported admin action' }, 400);
});
