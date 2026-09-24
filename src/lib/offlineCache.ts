const isWebStorageAvailable = typeof window !== 'undefined' && Boolean(window.localStorage);
const CACHE_VERSION = 2;
const DEFAULT_TTL_MS = 1000 * 60 * 10;

type CacheEntry<T> = {
  version?: number;
  savedAt: string;
  expiresAt?: string;
  value: T;
};

export async function readThroughCache<T>(
  key: string,
  loader: () => Promise<T>,
  options: { ttlMs?: number; version?: number } = {}
): Promise<T> {
  const version = options.version ?? CACHE_VERSION;
  const ttlMs = options.ttlMs ?? DEFAULT_TTL_MS;

  try {
    const fresh = await loader();
    if (isWebStorageAvailable) {
      const now = Date.now();
      window.localStorage.setItem(
        key,
        JSON.stringify({
          version,
          savedAt: new Date(now).toISOString(),
          expiresAt: new Date(now + ttlMs).toISOString(),
          value: fresh,
        } satisfies CacheEntry<T>)
      );
    }
    return fresh;
  } catch (error) {
    if (isWebStorageAvailable) {
      const cached = window.localStorage.getItem(key);
      if (cached) {
        try {
          const parsed = JSON.parse(cached) as CacheEntry<T>;
          const expiresAt = parsed.expiresAt ? new Date(parsed.expiresAt).getTime() : 0;
          const isCurrentVersion = parsed.version === version;
          const isFresh = expiresAt > Date.now();

          if (isCurrentVersion && isFresh) return parsed.value;
          window.localStorage.removeItem(key);
        } catch {
          window.localStorage.removeItem(key);
        }
      }
    }
    throw error;
  }
}
