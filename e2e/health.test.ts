import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import { getApp, startServer, stopServer } from './setup';
import type { Hono } from 'hono';

let app: Hono;

beforeAll(async () => {
  app = await getApp();
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
