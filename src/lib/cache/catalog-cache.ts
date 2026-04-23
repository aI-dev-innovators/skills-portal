type CacheValue<T> = {
  value: T;
  expiresAt: number;
};

class TtlMemoryCache {
  private readonly values = new Map<string, CacheValue<unknown>>();

  get<T>(key: string): T | null {
    const hit = this.values.get(key);
    if (!hit) return null;
    if (hit.expiresAt < Date.now()) {
      this.values.delete(key);
      return null;
    }
    return hit.value as T;
  }

  set<T>(key: string, value: T, ttlMs: number): void {
    this.values.set(key, {
      value,
      expiresAt: Date.now() + ttlMs
    });
  }

  delete(key: string): void {
    this.values.delete(key);
  }
}

const cache = new TtlMemoryCache();

export const CATALOG_TTL = {
  repositories: 10 * 60 * 1000,
  skills: 10 * 60 * 1000,
  users: 30 * 60 * 1000,
  github: 10 * 60 * 1000
};

export function getCatalogCache<T>(key: string): T | null {
  return cache.get<T>(key);
}

export function setCatalogCache<T>(key: string, value: T, ttlMs: number): void {
  cache.set(key, value, ttlMs);
}

export function invalidateCatalogCache(key: string): void {
  cache.delete(key);
}

export function invalidateCatalogByPrefix(prefix: string): void {
  for (const key of (cache as unknown as { values?: Map<string, CacheValue<unknown>> }).values?.keys?.() || []) {
    if (key.startsWith(prefix)) {
      cache.delete(key);
    }
  }
}
