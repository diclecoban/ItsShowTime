import { createClient } from '@supabase/supabase-js';
import { existsSync, readFileSync } from 'node:fs';
import { performance } from 'node:perf_hooks';

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

async function time(label, task, warnAtMs) {
  const startedAt = performance.now();
  const result = await task();
  const durationMs = Math.round(performance.now() - startedAt);
  const status = durationMs > warnAtMs ? 'WARN' : 'OK';
  console.log(`${status} ${label}: ${durationMs}ms`);
  return { result, durationMs };
}

async function main() {
  const url = requireEnv(supabaseUrl, 'VITE_SUPABASE_URL');
  const key = requireEnv(anonKey, 'VITE_SUPABASE_ANON_KEY');
  const email = requireEnv(testEmail, 'TEST_USER_EMAIL');
  const password = requireEnv(testPassword, 'TEST_USER_PASSWORD');

  const anon = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: sessionData, error: signInError } = await anon.auth.signInWithPassword({ email, password });
  assert(!signInError, `test user sign in failed: ${signInError?.message}`);
  assert(sessionData.session, 'test user session missing');

  const userId = sessionData.session.user.id;
  const authed = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      headers: {
        Authorization: `Bearer ${sessionData.session.access_token}`,
      },
    },
  });

  await time('get_library_progress RPC', async () => {
    const { error } = await authed.rpc('get_library_progress', { target_user_id: userId });
    assert(!error, `get_library_progress failed: ${error?.message}`);
  }, 900);

  await time('get_watch_next_episodes RPC', async () => {
    const { error } = await authed.rpc('get_watch_next_episodes', { target_user_id: userId });
    assert(!error, `get_watch_next_episodes failed: ${error?.message}`);
  }, 900);

  await time('get_profile_stats RPC', async () => {
    const { error } = await authed.rpc('get_profile_stats', { target_user_id: userId });
    assert(!error, `get_profile_stats failed: ${error?.message}`);
  }, 900);

  await time('notifications first page', async () => {
    const { error } = await authed
      .from('notifications')
      .select('id, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(0, 19);
    assert(!error, `notifications query failed: ${error?.message}`);
  }, 700);

  await time('search-tvmaze Edge Function', async () => {
    const { data, error } = await authed.functions.invoke('search-tvmaze', {
      body: { query: 'girls' },
    });
    assert(!error, `search-tvmaze failed: ${error?.message}`);
    assert(Array.isArray(data?.results), 'search-tvmaze did not return results array');
  }, 1800);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
