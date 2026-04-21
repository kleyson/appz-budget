import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import { existsSync, mkdirSync, unlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { getApp, startServer, stopServer } from './setup';
import type { Hono } from 'hono';

let app: Hono;
const staticFixturePath = join(import.meta.dir, '../backend/public/e2e-static.js');

beforeAll(async () => {
  mkdirSync(join(import.meta.dir, '../backend/public'), { recursive: true });
  writeFileSync(staticFixturePath, 'window.__e2e_static_asset__ = true;');
  app = await getApp();
});

afterAll(() => {
  if (existsSync(staticFixturePath)) unlinkSync(staticFixturePath);
});

describe('Health (Hono client)', () => {
  test('GET /health returns 200', async () => {
    const res = await app.request('/health');
    expect(res.status).toBe(200);
    const data = (await res.json()) as { status: string; timestamp: string };
    expect(data.status).toBe('healthy');
    expect(data.timestamp).toBeDefined();
  });

  test('GET /api/v1/health returns 200', async () => {
    const res = await app.request('/api/v1/health');
    expect(res.status).toBe(200);
    const data = (await res.json()) as { status: string };
    expect(data.status).toBe('healthy');
  });

  test('GET /public/* serves frontend static assets', async () => {
    const res = await app.request('/public/e2e-static.js');
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/javascript');
    expect(await res.text()).toBe('window.__e2e_static_asset__ = true;');
  });
});

describe('Health (HTTP)', () => {
  let baseUrl: string;

  beforeAll(async () => {
    baseUrl = await startServer();
  });

  afterAll(async () => {
    await stopServer();
  });

  test('GET /health returns 200', async () => {
    const res = await fetch(`${baseUrl}/health`);
    expect(res.status).toBe(200);
    const data = (await res.json()) as { status: string; timestamp: string };
    expect(data.status).toBe('healthy');
    expect(data.timestamp).toBeDefined();
  });

  test('GET /api/v1/health returns 200', async () => {
    const res = await fetch(`${baseUrl}/api/v1/health`);
    expect(res.status).toBe(200);
    const data = (await res.json()) as { status: string };
    expect(data.status).toBe('healthy');
  });
});
