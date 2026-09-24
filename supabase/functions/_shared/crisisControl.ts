import type { createSupabaseAdmin } from './supabaseAdmin.ts';

export type CrisisControl = {
  mode: 'normal' | 'degraded' | 'maintenance' | 'readonly';
  message: string;
  features: Record<string, boolean>;
};

const fallbackConfig: CrisisControl = {
  mode: 'normal',
  message: '',
  features: {
    externalSearch: true,
    catalogImport: true,
    communityWrites: true,
    notifications: true,
    realtime: true,
    newSignups: true,
    queueWorkers: true,
    support: true,
  },
};

export async function getCrisisControl(supabase: ReturnType<typeof createSupabaseAdmin>) {
  const { data, error } = await supabase.rpc('get_app_config');
  if (error || !data) return fallbackConfig;

  return {
    ...fallbackConfig,
    ...(data as Partial<CrisisControl>),
    features: {
      ...fallbackConfig.features,
      ...((data as Partial<CrisisControl>).features ?? {}),
    },
  };
}

export function isFeatureEnabled(config: CrisisControl, feature: string) {
  if (config.mode === 'maintenance') return false;
  if (config.mode === 'readonly' && ['catalogImport', 'communityWrites', 'notifications'].includes(feature)) return false;
  return config.features[feature] !== false;
}
