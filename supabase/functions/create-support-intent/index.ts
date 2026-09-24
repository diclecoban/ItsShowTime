import { corsHeaders, jsonResponse } from '../_shared/cors.ts';
import { getCrisisControl, isFeatureEnabled } from '../_shared/crisisControl.ts';
import { createSupabaseAdmin } from '../_shared/supabaseAdmin.ts';

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const supabase = createSupabaseAdmin();
  const crisisControl = await getCrisisControl(supabase);
  if (!isFeatureEnabled(crisisControl, 'support')) {
    return jsonResponse({ error: crisisControl.message || 'Support links are temporarily paused.' }, 503);
  }

  const authorization = request.headers.get('Authorization');
  let userId: string | null = null;

  if (authorization) {
    const token = authorization.replace('Bearer ', '');
    const { data } = await supabase.auth.getUser(token);
    userId = data.user?.id ?? null;
  }

  const body = (await request.json().catch(() => ({}))) as {
    campaignSlug?: string;
    amountCents?: number;
    source?: string;
    metadata?: Record<string, unknown>;
  };
  const campaignSlug = body.campaignSlug ?? 'movie-catalog-budget';

  const { data: campaign, error: campaignError } = await supabase
    .from('support_campaigns')
    .select('id, external_url')
    .eq('slug', campaignSlug)
    .eq('status', 'active')
    .maybeSingle();

  if (campaignError) return jsonResponse({ error: campaignError.message }, 500);
  if (!campaign) return jsonResponse({ error: 'Support campaign is not active' }, 404);

  const { data, error } = await supabase
    .from('support_intents')
    .insert({
      user_id: userId,
      campaign_id: campaign.id,
      source: body.source ?? 'buymeacoffee',
      amount_cents: body.amountCents ?? null,
      currency: 'USD',
      status: 'opened',
      metadata: body.metadata ?? {},
    })
    .select('id')
    .single();

  if (error) return jsonResponse({ error: error.message }, 500);

  return jsonResponse({
    ok: true,
    intentId: data.id,
    redirectUrl: campaign.external_url ?? 'https://buymeacoffee.com/diclesara',
  });
});
