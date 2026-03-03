/**
 * E2E test setup — server lifecycle and app access helpers.
 *
 * NOTE: DB creation and env vars are handled by preload.ts (via bunfig.toml).
 * Do NOT create/delete the test DB in individual test files.
 */

// ─── HTTP server lifecycle ──────────────────────────────────────────────────

let server: ReturnType<typeof Bun.serve> | null = null;
let baseUrl = '';

export async function startServer(): Promise<string> {
  const { app } = await import('../backend/src/app');

  server = Bun.serve({
    port: 0,
    fetch: app.fetch,
  });

  baseUrl = `http://localhost:${server.port}`;
  return baseUrl;
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
