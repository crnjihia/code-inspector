import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['../tests/extension/**/*.test.ts'],
    exclude: ['../tests/extension/suite/**', '**/node_modules/**'],
    environment: 'node'
  }
});
