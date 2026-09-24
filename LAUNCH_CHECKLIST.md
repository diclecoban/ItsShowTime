# It’s Showtime Launch Checklist

## Web Launch

- [ ] Choose production domain.
- [ ] Deploy the web build.
- [ ] Add production URL to Supabase Auth redirect URLs.
- [ ] Verify `/privacy` and `/terms` are reachable without signing in.
- [ ] Run `npx vite build`.
- [ ] Run `npm run test:backend`.
- [ ] Run `npm run test:performance`.
- [ ] Run `npm run supabase:db:lint`.

## Supabase

- [ ] Confirm RLS is enabled on all user-owned tables.
- [ ] Confirm scheduled jobs are active for catalog imports, reminders, delivery processing, and observability alerts.
- [ ] Add Edge Function secrets:
  - [ ] `CRON_SECRET`
  - [ ] `RESEND_API_KEY`
  - [ ] `SUPPORT_FROM_EMAIL`
  - [ ] `OBSERVABILITY_WEBHOOK_URL`
- [ ] Confirm backups/PITR settings match the expected launch risk.
- [ ] Confirm Supabase plan limits are enough for expected auth, database, storage, and Edge Function usage.

## CI

- [ ] Add GitHub Actions secrets:
  - [ ] `VITE_SUPABASE_URL`
  - [ ] `VITE_SUPABASE_ANON_KEY`
  - [ ] `TEST_USER_EMAIL`
  - [ ] `TEST_USER_PASSWORD`
  - [ ] `SUPABASE_ACCESS_TOKEN`
  - [ ] `SUPABASE_DB_PASSWORD`
  - [ ] `SUPABASE_PROJECT_ID`
- [ ] Verify CI passes on a fresh push.

## Native App

- [ ] Create or connect the Expo/EAS project.
- [ ] Set `VITE_EXPO_PROJECT_ID`.
- [ ] Confirm iOS bundle id: `com.itsshowtime.app`.
- [ ] Confirm Android package: `com.itsshowtime.app`.
- [ ] Test push permission on a physical iOS device.
- [ ] Test push permission on a physical Android device.
- [ ] Confirm device tokens appear in `device_push_tokens`.
- [ ] Confirm notification deliveries move from `pending` to `sent`.

## Store Readiness

- [ ] Final app icon.
- [ ] Final splash assets.
- [ ] Store screenshots.
- [ ] App description.
- [ ] Support email.
- [ ] Privacy Policy URL.
- [ ] Terms URL.
- [ ] Content/community moderation notes.

## Support And Payments

- [ ] Confirm BuyMeACoffee/support URL.
- [ ] Decide whether support is donation-only or tied to future features.
- [ ] Add payment provider webhook only if support should create paid entitlements later.
