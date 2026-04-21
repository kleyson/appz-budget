/**
 * E2E test setup — server lifecycle and app access helpers.
 *
 * NOTE: DB creation and env vars are handled by preload.ts (via bunfig.toml).
 * Do NOT create/delete the test DB in individual test files.
 */

// ─── HTTP server lifecycle ──────────────────────────────────────────────────

let server: ReturnType<typeof Bun.serve> | null = null;
let baseUrl = '';
type ServerFetch = Parameters<typeof Bun.serve>[0]['fetch'];

export async function startServer(): Promise<string> {
  const { app } = await import('../backend/src/app');

  server = startOnAvailablePort(app.fetch);

  baseUrl = `http://localhost:${server.port}`;
  return baseUrl;
}

function startOnAvailablePort(fetch: ServerFetch): ReturnType<typeof Bun.serve> {
  const maxAttempts = 30;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const port = 40_000 + Math.floor(Math.random() * 20_000);

    try {
      return Bun.serve({ port, fetch });
    } catch (error) {
      const code =
        typeof error === 'object' && error !== null && 'code' in error
          ? (error as { code?: string }).code
          : undefined;
      if (code !== 'EADDRINUSE') {
        throw error;
      }
    }
  }

  throw new Error(`Failed to start test server after ${maxAttempts} attempts`);
}

export function getBaseUrl(): string {
  return baseUrl;
}

export async function stopServer(): Promise<void> {
  if (server) {
    server.stop(true);
    server = null;
  }
}

// ─── Hono test client ───────────────────────────────────────────────────────

export async function getApp() {
  const { app } = await import('../backend/src/app');
  return app;
}
