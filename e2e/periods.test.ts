import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import { getApp, startServer, stopServer } from './setup';
import { apiHeaders, seedPeriod, seedMonth, seedExpense, seedCategory } from './helpers';
import type { Hono } from 'hono';

let app: Hono;

beforeAll(async () => {
  app = await getApp();
});

describe('Periods (Hono client)', () => {
  test('list periods', async () => {
    const res = await app.request('/api/v1/periods', { headers: apiHeaders() });
    expect(res.status).toBe(200);
    const data = (await res.json()) as unknown[];
    expect(Array.isArray(data)).toBe(true);
  });

  test('create a period', async () => {
    const res = await app.request('/api/v1/periods', {
      method: 'POST',
      headers: apiHeaders(),
      body: JSON.stringify({ name: 'Monthly', color: '#ff0000' }),
    });
    expect(res.status).toBe(201);
    const data = (await res.json()) as { id: number; name: string };
    expect(data.name).toBe('Monthly');
  });

  test('create duplicate period fails', async () => {
    const res = await app.request('/api/v1/periods', {
      method: 'POST',
      headers: apiHeaders(),
      body: JSON.stringify({ name: 'Monthly' }),
    });
    expect(res.status).toBe(400);
  });

  test('get period by id', async () => {
    const period = await seedPeriod(app, 'Weekly');
    const res = await app.request(`/api/v1/periods/${period.id}`, { headers: apiHeaders() });
    expect(res.status).toBe(200);
    const data = (await res.json()) as { name: string };
    expect(data.name).toBe('Weekly');
  });

  test('get non-existent period returns 404', async () => {
    const res = await app.request('/api/v1/periods/99999', { headers: apiHeaders() });
    expect(res.status).toBe(404);
  });

  test('update a period', async () => {
    const period = await seedPeriod(app, 'Bi-Weekly');
    const res = await app.request(`/api/v1/periods/${period.id}`, {
      method: 'PUT',
      headers: apiHeaders(),
      body: JSON.stringify({ name: 'Biweekly', color: '#abc' }),
    });
    expect(res.status).toBe(200);
    const data = (await res.json()) as { name: string };
    expect(data.name).toBe('Biweekly');
  });

  test('delete a period with no dependencies', async () => {
    const period = await seedPeriod(app, 'ToDeletePeriod');
    const res = await app.request(`/api/v1/periods/${period.id}`, {
      method: 'DELETE',
      headers: apiHeaders(),
    });
    expect(res.status).toBe(200);
  });

  test('delete period with dependent expenses fails (409)', async () => {
    const period = await seedPeriod(app, 'HasExpPeriod');
    const cat = await seedCategory(app, 'PeriodDep-Cat');
    const month = await seedMonth(app, 2025, 3);
    await seedExpense(app, month.id, {
      expense_name: 'Internet',
      period: period.name,
      category: cat.name,
    });

    const res = await app.request(`/api/v1/periods/${period.id}`, {
      method: 'DELETE',
      headers: apiHeaders(),
    });
    expect(res.status).toBe(409);
  });
});

describe('Periods (HTTP)', () => {
  let baseUrl: string;

  beforeAll(async () => {
    baseUrl = await startServer();
  });

  afterAll(async () => {
    await stopServer();
  });

  test('create and list periods via HTTP', async () => {
    const createRes = await fetch(`${baseUrl}/api/v1/periods`, {
      method: 'POST',
      headers: apiHeaders(),
      body: JSON.stringify({ name: 'HTTP-Period' }),
    });
    expect(createRes.status).toBe(201);

    const listRes = await fetch(`${baseUrl}/api/v1/periods`, { headers: apiHeaders() });
    expect(listRes.status).toBe(200);
    const data = (await listRes.json()) as Array<{ name: string }>;
    expect(data.some((p) => p.name === 'HTTP-Period')).toBe(true);
  });
});
