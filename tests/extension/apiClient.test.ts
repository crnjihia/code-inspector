import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ApiClient } from '../../extension/src/services/apiClient';

describe('ApiClient', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('sends refactor request with authorization header', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ refactored: 'function refactored() {}' })
    });
    global.fetch = mockFetch as any;

    const client = new ApiClient('http://localhost:3000', 'test-token', 'inst-123');
    const result = await client.refactor({
      code: 'function old() {}',
      language: 'typescript',
      filePath: '/path/test.ts'
    });

    expect(result).toBe('function refactored() {}');
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3000/refactor',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer test-token',
          'X-Instance-Id': 'inst-123'
        })
      })
    );
  });

  it('handles error when refactor endpoint fails', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => 'Internal Server Error'
    }) as any;

    const client = new ApiClient('http://localhost:3000');
    await expect(
      client.refactor({
        code: 'bad',
        language: 'js',
        filePath: 'bad.js'
      })
    ).rejects.toThrow('Refactor request failed (500)');
  });
});
