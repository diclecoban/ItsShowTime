import { createClient } from '@supabase/supabase-js';
import { existsSync, readFileSync } from 'node:fs';

if (existsSync('.env')) {
  for (const line of readFileSync('.env', 'utf8').split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!match || process.env[match[1]]) continue;
    process.env[match[1]] = match[2].replace(/^["']|["']$/g, '');
  }
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
const testEmail = process.env.TEST_USER_EMAIL;
const testPassword = process.env.TEST_USER_PASSWORD;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function requireEnv(value, name) {
  assert(Boolean(value), `${name} is required`);
  return value;
}

async function main() {
  const url = requireEnv(supabaseUrl, 'VITE_SUPABASE_URL');
  const key = requireEnv(anonKey, 'VITE_SUPABASE_ANON_KEY');
  const email = requireEnv(testEmail, 'TEST_USER_EMAIL');
  const password = requireEnv(testPassword, 'TEST_USER_PASSWORD');

  const anon = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: anonymousCache, error: anonymousCacheError } = await anon.from('search_cache').select('id').limit(1);
  assert(
    anonymousCacheError || !anonymousCache?.length,
    'anon should not receive search_cache rows'
  );

  const { data: sessionData, error: signInError } = await anon.auth.signInWithPassword({ email, password });
  assert(!signInError, `test user sign in failed: ${signInError?.message}`);
  assert(sessionData.session, 'test user session missing');

  const authed = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      headers: {
        Authorization: `Bearer ${sessionData.session.access_token}`,
      },
    },
  });

  const { data: searchData, error: searchError } = await authed.functions.invoke('search-tvmaze', {
    body: { query: 'girls' },
  });
  assert(!searchError, `search-tvmaze failed: ${searchError?.message}`);
  assert(Array.isArray(searchData?.results), 'search-tvmaze did not return results array');

  const userId = sessionData.session.user.id;
  const { data: profileStats, error: profileStatsError } = await authed.rpc('get_profile_stats', {
    target_user_id: userId,
  });
  assert(!profileStatsError, `get_profile_stats failed: ${profileStatsError?.message}`);
  assert(typeof profileStats?.episodes === 'number', 'get_profile_stats did not return numeric episodes');

  const { data: libraryProgress, error: libraryProgressError } = await authed.rpc('get_library_progress', {
    target_user_id: userId,
  });
  assert(!libraryProgressError, `get_library_progress failed: ${libraryProgressError?.message}`);
  assert(Array.isArray(libraryProgress), 'get_library_progress did not return an array');

  const { data: adminSummary, error: adminSummaryError } = await authed.rpc('get_admin_summary');
  assert(!adminSummaryError, `get_admin_summary failed: ${adminSummaryError?.message}`);
  assert(!adminSummary?.importJobs, 'non-admin user should not receive admin summary payload');

  const { error: cacheInsertError } = await authed.from('search_cache').insert({
    query: `rls-write-test-${Date.now()}`,
    media_type: 'Shows',
    source: 'tvmaze',
    payload: [],
    result_count: 0,
  });
  assert(cacheInsertError, 'non-admin user should not write search_cache directly');

  const { error: adminError } = await authed.functions.invoke('admin-actions', {
    body: { action: 'clear_cache', cacheId: '00000000-0000-0000-0000-000000000000' },
  });
  assert(adminError, 'non-admin user should not execute admin-actions');

  console.log('Backend smoke/RLS tests passed.');
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
