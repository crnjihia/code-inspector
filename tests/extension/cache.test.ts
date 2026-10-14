import { describe, it, expect, beforeEach } from 'vitest';
import { getCache, setCache, clearLocalCache } from '../../extension/src/services/cache';

describe('Extension In-Memory Cache', () => {
  beforeEach(() => {
    clearLocalCache();
  });

  it('stores and retrieves cached entries', () => {
    setCache('key1', { result: 'ok' }, 60);
    const cached = getCache('key1');
    expect(cached).toEqual({ result: 'ok' });
  });

  it('returns undefined for non-existent keys', () => {
    expect(getCache('nonexistent')).toBeUndefined();
  });

  it('expires entries after TTL', async () => {
    setCache('expiring', 'val', 0.001); // 1ms
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(getCache('expiring')).toBeUndefined();
  });
});
