-- Schedule catalog imports with pg_cron + pg_net using secrets stored in Supabase Vault.

create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;
create extension if not exists supabase_vault with schema vault;

select cron.unschedule('process-catalog-imports-every-minute')
where exists (
  select 1 from cron.job where jobname = 'process-catalog-imports-every-minute'
);

select cron.schedule(
  'process-catalog-imports-every-minute',
  '* * * * *',
  $cron$
    select
      net.http_post(
        url := (select decrypted_secret from vault.decrypted_secrets where name = 'itsshowtime_project_url') || '/functions/v1/process-catalog-imports',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'itsshowtime_cron_secret')
        ),
        body := jsonb_build_object('limit', 5)
      );
  $cron$
);
