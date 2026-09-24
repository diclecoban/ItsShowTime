import { corsHeaders, jsonResponse } from '../_shared/cors.ts';
import { logEdgeEvent } from '../_shared/observability.ts';
import { createSupabaseAdmin } from '../_shared/supabaseAdmin.ts';

async function isAdminRequest(request: Request, supabase: ReturnType<typeof createSupabaseAdmin>) {
  const cronSecret = Deno.env.get('CRON_SECRET');
  const providedSecret = request.headers.get('x-cron-secret');
  if (cronSecret && providedSecret === cronSecret) return true;

  const authorization = request.headers.get('Authorization');
  if (!authorization) return false;

  const token = authorization.replace('Bearer ', '');
  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData.user) return false;

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', userData.user.id)
    .maybeSingle();

  return Boolean(!profileError && profile?.is_admin);
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
  const isAllowed = await isAdminRequest(request, supabase);
  if (!isAllowed) return jsonResponse({ error: 'Admin access required' }, 403);

  const { data, error } = await supabase.rpc('run_growth_cleanup');
  if (error) {
    await logEdgeEvent(supabase, {
      functionName: 'database-maintenance',
      eventType: 'error',
      statusCode: 500,
      durationMs: Date.now() - startedAt,
      metadata: { error: error.message },
    });
    return jsonResponse({ error: error.message }, 500);
  }

  await logEdgeEvent(supabase, {
    functionName: 'database-maintenance',
    eventType: 'success',
    statusCode: 200,
    durationMs: Date.now() - startedAt,
    metadata: data ?? {},
  });

  return jsonResponse({ ok: true, cleanup: data });
});
