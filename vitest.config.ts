import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/features/**/*.ts', 'src/shared/**/*.ts'],
      exclude: ['**/*.test.ts', '**/__tests__/**', '**/components/**'],
      thresholds: {
        lines: 25,
      },
    },
  },
});
