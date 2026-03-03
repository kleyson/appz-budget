/**
 * API Key authentication middleware.
 * Validates the X-API-Key header against the configured API key.
 */

import type { Context, Next } from 'hono';
import { config } from '../config';

export async function apiKeyAuth(c: Context, next: Next) {
  const apiKey = c.req.header('X-API-Key');
  if (!apiKey || apiKey !== config.apiKey) {
    return c.json({ detail: 'Invalid or missing API key' }, 403);
  }
  await next();
}
