import { corsHeaders, jsonResponse } from '../_shared/cors.ts';
import { getCrisisControl, isFeatureEnabled } from '../_shared/crisisControl.ts';
import { logEdgeEvent } from '../_shared/observability.ts';
import { createSupabaseAdmin } from '../_shared/supabaseAdmin.ts';

type Delivery = {
  id: string;
  channel: 'push' | 'email';
  attempts: number;
  max_attempts: number;
  notifications: {
    user_id: string;
    title: string;
    body: string | null;
  } | null;
};

async function authorize(request: Request) {
  const cronSecret = Deno.env.get('CRON_SECRET');
  const providedSecret = request.headers.get('x-cron-secret');
  return Boolean(cronSecret && providedSecret === cronSecret);
}

function nextBackoff(attempts: number) {
  const minutes = Math.min(60, Math.pow(2, Math.max(attempts, 1)));
  return new Date(Date.now() + minutes * 60 * 1000).toISOString();
}

async function sendPush(supabase: ReturnType<typeof createSupabaseAdmin>, delivery: Delivery) {
  const userId = delivery.notifications?.user_id;
  if (!userId) return { skipped: true };

  const { data: tokens, error } = await supabase
    .from('device_push_tokens')
    .select('expo_push_token')
    .eq('user_id', userId)
    .eq('enabled', true)
    .order('last_seen_at', { ascending: false });

  if (error) throw error;
  if (!tokens?.length) return { skipped: true };

  const response = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Accept-Encoding': 'gzip, deflate',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      to: tokens.map((token) => token.expo_push_token),
      title: delivery.notifications?.title,
      body: delivery.notifications?.body,
    }),
  });

  return { skipped: false, ok: response.ok, messageId: response.headers.get('x-request-id') };
}

async function sendEmail(supabase: ReturnType<typeof createSupabaseAdmin>, delivery: Delivery) {
  const apiKey = Deno.env.get('RESEND_API_KEY');
  const fromEmail = Deno.env.get('SUPPORT_FROM_EMAIL') ?? 'It’s Showtime <onboarding@resend.dev>';
  const userId = delivery.notifications?.user_id;
  const { data } = userId ? await supabase.auth.admin.getUserById(userId) : { data: null };
  const toEmail = data?.user?.email;
  if (!apiKey || !toEmail) return { skipped: true };

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: fromEmail,
      to: toEmail,
      subject: delivery.notifications?.title,
      text: delivery.notifications?.body ?? delivery.notifications?.title,
    }),
  });
  const payload = await response.json().catch(() => ({}));

  return { skipped: false, ok: response.ok, messageId: payload?.id as string | undefined };
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
  const crisisControl = await getCrisisControl(supabase);
  if (!isFeatureEnabled(crisisControl, 'notifications')) {
    await logEdgeEvent(supabase, {
      functionName: 'process-notification-deliveries',
      eventType: 'worker_paused',
      statusCode: 200,
      durationMs: Date.now() - startedAt,
      metadata: { mode: crisisControl.mode },
    });
    return jsonResponse({ ok: true, paused: true, results: [] });
  }

  const { data, error } = await supabase
    .from('notification_deliveries')
    .select('id, channel, attempts, max_attempts, notifications(user_id, title, body)')
    .eq('status', 'pending')
    .lte('next_attempt_at', new Date().toISOString())
    .order('next_attempt_at', { ascending: true })
    .limit(20);

  if (error) {
    await logEdgeEvent(supabase, {
      functionName: 'process-notification-deliveries',
      eventType: 'error',
      statusCode: 500,
      durationMs: Date.now() - startedAt,
      metadata: { error: error.message },
    });
    return jsonResponse({ error: error.message }, 500);
  }

  const results = [];
  for (const delivery of (data ?? []) as unknown as Delivery[]) {
    try {
      const result = delivery.channel === 'push' ? await sendPush(supabase, delivery) : await sendEmail(supabase, delivery);
      if (result.skipped) {
        await supabase
          .from('notification_deliveries')
          .update({
            attempts: delivery.attempts + 1,
            last_attempt_at: new Date().toISOString(),
            next_attempt_at: nextBackoff(delivery.attempts + 1),
          })
          .eq('id', delivery.id);
        results.push({ id: delivery.id, status: 'pending', skipped: true });
        continue;
      }

      if (!result.ok) throw new Error(`${delivery.channel} provider failed`);
      await supabase
        .from('notification_deliveries')
        .update({
          status: 'sent',
          attempts: delivery.attempts + 1,
          last_attempt_at: new Date().toISOString(),
          sent_at: new Date().toISOString(),
          provider_message_id: result.messageId ?? null,
          error: null,
        })
        .eq('id', delivery.id);
      results.push({ id: delivery.id, status: 'sent' });
    } catch (sendError) {
      const message = sendError instanceof Error ? sendError.message : 'Delivery failed';
      const attempts = delivery.attempts + 1;
      await supabase
        .from('notification_deliveries')
        .update({
          status: attempts >= delivery.max_attempts ? 'failed' : 'pending',
          attempts,
          last_attempt_at: new Date().toISOString(),
          next_attempt_at: nextBackoff(attempts),
          error: message,
        })
        .eq('id', delivery.id);
      results.push({ id: delivery.id, status: 'failed', error: message });
    }
  }

  await logEdgeEvent(supabase, {
    functionName: 'process-notification-deliveries',
    eventType: 'processed',
    statusCode: 200,
    durationMs: Date.now() - startedAt,
    metadata: { processed: results.length, failed: results.filter((result) => result.status === 'failed').length },
  });

  return jsonResponse({ ok: true, processed: results.length, results });
});
