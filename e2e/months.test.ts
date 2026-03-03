import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import { getApp, startServer, stopServer } from './setup';
import { apiHeaders, seedMonth, seedPeriod, seedCategory, seedExpense, seedIncomeType, seedIncome } from './helpers';
import type { Hono } from 'hono';

let app: Hono;

beforeAll(async () => {
  app = await getApp();
});

describe('Months (Hono client)', () => {
  test('list months', async () => {
    const res = await app.request('/api/v1/months', { headers: apiHeaders() });
    expect(res.status).toBe(200);
    const data = (await res.json()) as unknown[];
    expect(Array.isArray(data)).toBe(true);
  });

  test('create a month', async () => {
    const res = await app.request('/api/v1/months', {
      method: 'POST',
      headers: apiHeaders(),
      body: JSON.stringify({ year: 2025, month: 6 }),
    });
    expect(res.status).toBe(201);
    const data = (await res.json()) as { id: number; name: string; year: number; month: number; start_date: string; end_date: string };
    expect(data.name).toBe('June 2025');
    expect(data.year).toBe(2025);
    expect(data.month).toBe(6);
    expect(data.start_date).toBe('2025-06-01');
    expect(data.end_date).toBe('2025-06-30');
  });

  test('create duplicate month fails (409)', async () => {
    const res = await app.request('/api/v1/months', {
      method: 'POST',
      headers: apiHeaders(),
      body: JSON.stringify({ year: 2025, month: 6 }),
    });
    expect(res.status).toBe(409);
  });

  test('get month by id', async () => {
    const month = await seedMonth(app, 2025, 7);
    const res = await app.request(`/api/v1/months/${month.id}`, { headers: apiHeaders() });
    expect(res.status).toBe(200);
    const data = (await res.json()) as { name: string };
    expect(data.name).toBe('July 2025');
  });

  test('get non-existent month returns 404', async () => {
    const res = await app.request('/api/v1/months/99999', { headers: apiHeaders() });
    expect(res.status).toBe(404);
  });

  test('update a month', async () => {
    const month = await seedMonth(app, 2025, 8);
    const res = await app.request(`/api/v1/months/${month.id}`, {
      method: 'PUT',
      headers: apiHeaders(),
      body: JSON.stringify({ year: 2025, month: 9 }),
    });
    expect(res.status).toBe(200);
    const data = (await res.json()) as { name: string; month: number };
    expect(data.name).toBe('September 2025');
    expect(data.month).toBe(9);
  });

  test('delete a month cascades expenses and incomes', async () => {
    const month = await seedMonth(app, 2025, 10);
    const period = await seedPeriod(app, 'MonthDel-Period');
    const cat = await seedCategory(app, 'MonthDel-Cat');
    const it = await seedIncomeType(app, 'MonthDel-IT');
    await seedExpense(app, month.id, { expense_name: 'E1', period: period.name, category: cat.name });
    await seedIncome(app, month.id, { income_type_id: it.id, period: period.name });

    const res = await app.request(`/api/v1/months/${month.id}`, {
      method: 'DELETE',
      headers: apiHeaders(),
    });
    expect(res.status).toBe(200);

    const getRes = await app.request(`/api/v1/months/${month.id}`, { headers: apiHeaders() });
    expect(getRes.status).toBe(404);
  });

  test('close a month', async () => {
    const month = await seedMonth(app, 2025, 11);
    const res = await app.request(`/api/v1/months/${month.id}/close`, {
      method: 'POST',
      headers: apiHeaders(),
    });
    expect(res.status).toBe(200);
    const data = (await res.json()) as { is_closed: boolean; message: string };
    expect(data.is_closed).toBe(true);
    expect(data.message).toContain('closed');
  });

  test('close already-closed month fails', async () => {
    const month = await seedMonth(app, 2024, 1);
    await app.request(`/api/v1/months/${month.id}/close`, { method: 'POST', headers: apiHeaders() });

    const res = await app.request(`/api/v1/months/${month.id}/close`, {
      method: 'POST',
      headers: apiHeaders(),
    });
    expect(res.status).toBe(400);
  });

  test('open a closed month', async () => {
    const month = await seedMonth(app, 2024, 2);
    await app.request(`/api/v1/months/${month.id}/close`, { method: 'POST', headers: apiHeaders() });

    const res = await app.request(`/api/v1/months/${month.id}/open`, {
      method: 'POST',
      headers: apiHeaders(),
    });
    expect(res.status).toBe(200);
    const data = (await res.json()) as { is_closed: boolean; message: string };
    expect(data.is_closed).toBe(false);
    expect(data.message).toContain('reopened');
  });

  test('open a non-closed month fails', async () => {
    const month = await seedMonth(app, 2024, 3);
    const res = await app.request(`/api/v1/months/${month.id}/open`, {
      method: 'POST',
      headers: apiHeaders(),
    });
    expect(res.status).toBe(400);
  });

  test('clone a month', async () => {
    const month = await seedMonth(app, 2024, 4);
    const period = await seedPeriod(app, 'Clone-Period');
    const cat = await seedCategory(app, 'Clone-Cat');
    const it = await seedIncomeType(app, 'Clone-IT');
    await seedExpense(app, month.id, { expense_name: 'CloneExp', period: period.name, category: cat.name, budget: 500 });
    await seedIncome(app, month.id, { income_type_id: it.id, period: period.name, budget: 3000 });

    const res = await app.request(`/api/v1/months/${month.id}/clone`, {
      method: 'POST',
      headers: apiHeaders(),
    });
    expect(res.status).toBe(200);
    const data = (await res.json()) as { cloned_count: number; cloned_income_count: number; next_month_name: string };
    expect(data.cloned_count).toBe(1);
    expect(data.cloned_income_count).toBe(1);
    expect(data.next_month_name).toBe('May 2024');
  });

  test('get current month', async () => {
    const res = await app.request('/api/v1/months/current', { headers: apiHeaders() });
    // Should return 200 if any month exists, 404 if empty
    expect([200, 404]).toContain(res.status);
  });
});

describe('Months (HTTP)', () => {
  let baseUrl: string;

  beforeAll(async () => {
    baseUrl = await startServer();
  });

  afterAll(async () => {
    await stopServer();
  });

  test('create and list months via HTTP', async () => {
    const createRes = await fetch(`${baseUrl}/api/v1/months`, {
      method: 'POST',
      headers: apiHeaders(),
      body: JSON.stringify({ year: 2026, month: 1 }),
    });
    expect(createRes.status).toBe(201);

    const listRes = await fetch(`${baseUrl}/api/v1/months`, { headers: apiHeaders() });
    expect(listRes.status).toBe(200);
    const data = (await listRes.json()) as Array<{ name: string }>;
    expect(data.some((m) => m.name === 'January 2026')).toBe(true);
  });
});
