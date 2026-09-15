import type { createSupabaseAdmin } from './supabaseAdmin.ts';

type SupabaseAdmin = ReturnType<typeof createSupabaseAdmin>;

type EdgeEvent = {
  functionName: string;
  eventType: 'success' | 'error' | 'cache_hit' | 'cache_miss' | 'rate_limited' | 'queued' | 'processed';
  statusCode?: number;
  durationMs?: number;
  userId?: string | null;
  metadata?: Record<string, unknown>;
};

export async function logEdgeEvent(supabase: SupabaseAdmin, event: EdgeEvent) {
  const { error } = await supabase.from('edge_function_events').insert({
    function_name: event.functionName,
    event_type: event.eventType,
    status_code: event.statusCode ?? null,
    duration_ms: event.durationMs ?? null,
    user_id: event.userId ?? null,
    metadata: event.metadata ?? {},
  });

  if (error) {
    console.warn('observability insert failed', error.message);
  }
}
