import { describe, it, expect } from 'vitest';
import { computeHash } from '../../extension/src/utils/hash';

describe('computeHash', () => {
  it('computes deterministic SHA-256 hash', () => {
    const input = 'function test() { return 1; }';
    const hash1 = computeHash(input);
    const hash2 = computeHash(input);

    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64);
  });

  it('produces different hashes for different inputs', () => {
    const hash1 = computeHash('codeA\njavascript\nselection');
    const hash2 = computeHash('codeB\njavascript\nselection');
    expect(hash1).not.toBe(hash2);
  });
});
