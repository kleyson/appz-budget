import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

// Read version from VERSION file (same logic as vite.config.ts)
function getVersion(): string {
  // Try multiple possible locations for the VERSION file
  const possiblePaths = [
    join(__dirname, '../VERSION'), // Local development (from frontend/)
    join(__dirname, '../../VERSION'), // Docker build (from /app/frontend/)
    join(process.cwd(), 'VERSION'), // Current working directory
    join(process.cwd(), '../VERSION'), // Parent of current working directory
  ];

  for (const versionFile of possiblePaths) {
    try {
      if (existsSync(versionFile)) {
        const version = readFileSync(versionFile, 'utf-8').trim();
        if (version) {
          return version;
        }
      }
    } catch (error) {
      // Continue to next path
      continue;
    }
  }

  return 'unknown';
}

export default defineConfig({
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(getVersion()),
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/hooks/**/*.ts'],
      exclude: ['src/hooks/__tests__/**'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
