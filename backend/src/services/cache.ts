import { createClient } from 'redis';

// In-memory fallback for local development
export class InMemoryCache {
  private store = new Map<string, { value: any; expiry: number }>();

  async get(key: string): Promise<any | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiry) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  async set(key: string, value: any, ttlSec: number): Promise<void> {
    const expiry = Date.now() + ttlSec * 1000;
    this.store.set(key, { value, expiry });
  }

  clear(): void {
    this.store.clear();
  }
}

const redisUrl = process.env.REDIS_URL ?? '';
let client: ReturnType<typeof createClient> | null = null;
let fallback: InMemoryCache = new InMemoryCache();

if (redisUrl) {
  try {
    client = createClient({ url: redisUrl });
    client.on('error', (err) => {
      console.warn('Redis connection warning, using fallback:', err.message);
    });
    client.connect().catch((err) => {
      console.warn('Redis connect failed, using fallback:', err.message);
      client = null;
    });
  } catch {
    client = null;
  }
}

export async function getCache(key: string): Promise<any | null> {
  if (client) {
    try {
      const data = await client.get(key);
      return data ? JSON.parse(data) : null;
    } catch {
      return fallback.get(key);
    }
  }
  return fallback.get(key);
}

export async function setCache(key: string, value: any, ttlSec: number): Promise<void> {
  const serialized = JSON.stringify(value);
  if (client) {
    try {
      await client.set(key, serialized, { EX: ttlSec });
      return;
    } catch {
      await fallback.set(key, value, ttlSec);
      return;
    }
  }
  await fallback.set(key, value, ttlSec);
}

export async function clearAllCache(): Promise<void> {
  if (client) {
    try {
      await client.flushAll();
    } catch {
      // ignore
    }
  }
  fallback.clear();
}
