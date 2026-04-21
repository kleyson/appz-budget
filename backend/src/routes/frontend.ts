/**
 * Frontend static file serving.
 * Serves the built frontend from public/ directory with API key injection
 * into index.html for SPA routing.
 */

import { Hono } from 'hono';
import type { Context } from 'hono';
import { serveStatic } from 'hono/bun';
import { injectApiKey } from '../utils/html-injector';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

const frontendRoute = new Hono();

const backendRoot = join(import.meta.dir, '../..');
const publicDir = join(import.meta.dir, '../../public');

/**
 * Serve index.html with API key injected into the HTML.
 * Used for both / and catch-all SPA routing.
 */
async function serveIndexHtml(c: Context) {
  const indexPath = join(publicDir, 'index.html');

  if (!existsSync(indexPath)) {
    return c.json({ detail: 'Frontend not built. Run the frontend build first.' }, 404);
  }

  const html = readFileSync(indexPath, 'utf-8');
  const injected = injectApiKey(html);

  return c.html(injected);
}

// Serve static assets (JS, CSS, images, etc.) from public/
// This must come before the catch-all so that real files are served as-is.
frontendRoute.use('/public/*', serveStatic({ root: backendRoot }));
frontendRoute.use('/assets/*', serveStatic({ root: './public' }));
frontendRoute.use('/favicon.ico', serveStatic({ root: './public' }));
frontendRoute.use('/vite.svg', serveStatic({ root: './public' }));

// Root path serves index.html with injected API key
frontendRoute.get('/', async (c) => {
  return serveIndexHtml(c);
});

// Catch-all for SPA routing — any path that doesn't match an API route
// gets index.html so client-side routing can handle it.
frontendRoute.get('/*', async (c) => {
  // Skip API routes — they should 404 normally, not serve the SPA shell
  const path = c.req.path;
  if (path.startsWith('/api/')) {
    return c.json({ detail: 'Not found' }, 404);
  }

  // Try to serve as a static file first
  const filePath = join(publicDir, path);
  if (existsSync(filePath) && !filePath.endsWith('/')) {
    return serveStatic({ root: './public' })(c, async () => {});
  }

  // Default: serve index.html for SPA routing
  return serveIndexHtml(c);
});

export default frontendRoute;
