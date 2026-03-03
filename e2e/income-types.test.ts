import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import { getApp, startServer, stopServer } from './setup';
import { apiHeaders, seedIncomeType, seedPeriod, seedMonth, seedIncome } from './helpers';
import type { Hono } from 'hono';

let app: Hono;

beforeAll(async () => {
  app = await getApp();
});

describe('Income Types (Hono client)', () => {
  test('list income types', async () => {
    const res = await app.request('/api/v1/income-types', { headers: apiHeaders() });
    expect(res.status).toBe(200);
    const data = (await res.json()) as unknown[];
    expect(Array.isArray(data)).toBe(true);
  });

  test('create an income type', async () => {
    const res = await app.request('/api/v1/income-types', {
      method: 'POST',
      headers: apiHeaders(),
      body: JSON.stringify({ name: 'Salary', color: '#10b981' }),
    });
    expect(res.status).toBe(201);
    const data = (await res.json()) as { id: number; name: string };
    expect(data.name).toBe('Salary');
  });

  test('create duplicate income type fails', async () => {
    const res = await app.request('/api/v1/income-types', {
      method: 'POST',
      headers: apiHeaders(),
      body: JSON.stringify({ name: 'Salary' }),
    });
    expect(res.status).toBe(400);
  });

  test('get income type by id', async () => {
    const it = await seedIncomeType(app, 'Freelance');
    const res = await app.request(`/api/v1/income-types/${it.id}`, { headers: apiHeaders() });
    expect(res.status).toBe(200);
    const data = (await res.json()) as { name: string };
    expect(data.name).toBe('Freelance');
  });

  test('get non-existent income type returns 404', async () => {
    const res = await app.request('/api/v1/income-types/99999', { headers: apiHeaders() });
    expect(res.status).toBe(404);
  });

  test('update an income type', async () => {
    const it = await seedIncomeType(app, 'Bonus');
    const res = await app.request(`/api/v1/income-types/${it.id}`, {
      method: 'PUT',
      headers: apiHeaders(),
      body: JSON.stringify({ name: 'Annual Bonus', color: '#ff0' }),
    });
    expect(res.status).toBe(200);
    const data = (await res.json()) as { name: string };
    expect(data.name).toBe('Annual Bonus');
  });

  test('delete income type with no dependencies', async () => {
    const it = await seedIncomeType(app, 'ToDeleteIT');
    const res = await app.request(`/api/v1/income-types/${it.id}`, {
      method: 'DELETE',
      headers: apiHeaders(),
    });
    expect(res.status).toBe(200);
  });

  test('delete income type with dependent incomes fails (409)', async () => {
    const it = await seedIncomeType(app, 'HasIncomes');
    const period = await seedPeriod(app, 'IT-DepPeriod');
    const month = await seedMonth(app, 2025, 4);
    await seedIncome(app, month.id, {
      income_type_id: it.id,
      period: period.name,
      budget: 5000,
    });

    const res = await app.request(`/api/v1/income-types/${it.id}`, {
      method: 'DELETE',
      headers: apiHeaders(),
    });
    expect(res.status).toBe(409);
  });
});

describe('Income Types (HTTP)', () => {
  let baseUrl: string;

  beforeAll(async () => {
    baseUrl = await startServer();
  });

  afterAll(async () => {
    await stopServer();
  });

  test('create and list income types via HTTP', async () => {
    const createRes = await fetch(`${baseUrl}/api/v1/income-types`, {
      method: 'POST',
      headers: apiHeaders(),
      body: JSON.stringify({ name: 'HTTP-Income-Type' }),
    });
    expect(createRes.status).toBe(201);

    const listRes = await fetch(`${baseUrl}/api/v1/income-types`, { headers: apiHeaders() });
    expect(listRes.status).toBe(200);
    const data = (await listRes.json()) as Array<{ name: string }>;
    expect(data.some((it) => it.name === 'HTTP-Income-Type')).toBe(true);
  });
});
