# It’s Showtime Supabase Backend

This folder now follows the Supabase CLI shape:

- `config.toml` stores local Supabase project settings.
- `migrations/` contains timestamped SQL migrations in run order.
- `functions/` contains Edge Functions that need server-side privileges.

## Local Backend

```sh
npm run supabase:start
npm run supabase:db:push
npm run supabase:types
```

## Linked Supabase Project

After logging in and linking the live project:

```sh
supabase login
supabase link --project-ref YOUR_PROJECT_REF
npm run supabase:db:push
npm run supabase:types:linked
```

## Edge Functions

The app has three server-side function entry points:

- `delete-account`: deletes the authenticated Supabase Auth user with the service role.
- `process-catalog-imports`: imports TVmaze episodes for a known show.
- `send-reminder-notifications`: creates due reminder notifications.

Deploy them with:

```sh
supabase functions deploy delete-account
supabase functions deploy process-catalog-imports
supabase functions deploy send-reminder-notifications
```

Set required secrets before deploying:

```sh
supabase secrets set SUPABASE_URL=YOUR_SUPABASE_URL
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
supabase secrets set CRON_SECRET=YOUR_PRIVATE_CRON_SECRET
```

Never expose `SUPABASE_SERVICE_ROLE_KEY` in the frontend `.env`.
