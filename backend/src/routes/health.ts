/**
 * Health check routes.
 */

import { Hono } from 'hono';

const health = new Hono();

health.get('/health', (c) =>
  c.json({ status: 'healthy', timestamp: new Date().toISOString() }),
);

health.get('/api/v1/health', (c) =>
  c.json({ status: 'healthy', timestamp: new Date().toISOString() }),
);

export default health;
