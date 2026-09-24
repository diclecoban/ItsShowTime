import { corsHeaders, jsonResponse } from '../_shared/cors.ts';
import { createSupabaseAdmin } from '../_shared/supabaseAdmin.ts';

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    const authorization = request.headers.get('Authorization');
    if (!authorization) return jsonResponse({ error: 'Missing authorization header' }, 401);

    const supabase = createSupabaseAdmin();
    const token = authorization.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabase.auth.getUser(token);

    if (userError || !userData.user) {
      return jsonResponse({ error: 'Invalid session' }, 401);
    }

    const reason = await request.json().then((body) => body?.reason as string | undefined).catch(() => undefined);

    const { data: deletionRequest } = await supabase
      .from('account_deletion_requests')
      .upsert(
        {
          user_id: userData.user.id,
          reason: reason ?? 'Requested from app',
          processed_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      )
      .select('id')
      .maybeSingle();

    await supabase.from('account_deletion_audit').insert({
      user_id: userData.user.id,
      request_id: deletionRequest?.id ?? null,
      action: 'requested',
      metadata: { reason: reason ?? 'Requested from app' },
    });

    const { error: deleteError } = await supabase.auth.admin.deleteUser(userData.user.id);
    if (deleteError) throw deleteError;

    await supabase.from('account_deletion_audit').insert({
      user_id: userData.user.id,
      request_id: deletionRequest?.id ?? null,
      action: 'deleted',
    });

    return jsonResponse({ ok: true });
  } catch (error) {
    return jsonResponse({ error: error instanceof Error ? error.message : 'Account deletion failed' }, 500);
  }
});
