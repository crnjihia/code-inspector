/** Local in-memory cache for extension client.
 *  Persistent caching is managed by the backend Redis layer.
 */
interface CacheEntry {
  value: any;
  expiry: number;
}

const cache = new Map<string, CacheEntry>();

export function setCache(key: string, value: any, ttlSec: number): void {
  const expiry = Date.now() + ttlSec * 1000;
  cache.set(key, { value, expiry });
}

export function getCache(key: string): any | undefined {
  const entry = cache.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expiry) {
    cache.delete(key);
    return undefined;
  }
  return entry.value;
}

export function clearLocalCache(): void {
  cache.clear();
}
