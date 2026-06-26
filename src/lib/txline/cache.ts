type CacheEntry<T> = {
  expiresAt: number;
  promise: Promise<T>;
};

const cache = new Map<string, CacheEntry<unknown>>();

export function getCached<T>(key: string, ttlMs: number, fetcher: () => Promise<T>): Promise<T> {
  const now = Date.now();
  const current = cache.get(key);

  if (current && current.expiresAt > now) {
    return current.promise as Promise<T>;
  }

  const promise = fetcher().catch((error) => {
    cache.delete(key);
    throw error;
  });

  cache.set(key, {
    expiresAt: now + ttlMs,
    promise,
  });

  return promise;
}

export function clearTxlineCache() {
  cache.clear();
}
