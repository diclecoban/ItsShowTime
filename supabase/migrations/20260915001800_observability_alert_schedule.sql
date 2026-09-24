-- Scheduled observability check. Posts to OBSERVABILITY_WEBHOOK_URL when that Edge secret exists.

create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;
create extension if not exists supabase_vault with schema vault;

select cron.unschedule('observability-alerts-every-five-minutes')
where exists (
  select 1 from cron.job where jobname = 'observability-alerts-every-five-minutes'
);

select cron.schedule(
  'observability-alerts-every-five-minutes',
  '*/5 * * * *',
  $cron$
    select
      net.http_post(
        url := concat((select decrypted_secret from vault.decrypted_secrets where name = 'itsshowtime_project_url'), '/functions/v1/observability-alerts'),
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'itsshowtime_cron_secret')
        ),
        body := '{}'::jsonb
      );
  $cron$
);
