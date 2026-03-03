import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import { getApp, startServer, stopServer } from './setup';
import { apiHeaders, seedMonth, seedPeriod, seedIncomeType, seedIncome } from './helpers';
import type { Hono } from 'hono';

let app: Hono;
let monthId: number;
let periodName: string;
let incomeTypeId: number;

beforeAll(async () => {
  app = await getApp();
  const period = await seedPeriod(app, 'Inc-Period');
  const it = await seedIncomeType(app, 'Inc-Salary');
  const month = await seedMonth(app, 2023, 5);
  monthId = month.id;
  periodName = period.name;
  incomeTypeId = it.id;
});

describe('Incomes (Hono client)', () => {
  test('list incomes', async () => {
    const res = await app.request('/api/v1/incomes', { headers: apiHeaders() });
    expect(res.status).toBe(200);
    const data = (await res.json()) as unknown[];
    expect(Array.isArray(data)).toBe(true);
  });

  test('create an income', async () => {
    const res = await app.request('/api/v1/incomes', {
      method: 'POST',
      headers: apiHeaders(),
      body: JSON.stringify({
        income_type_id: incomeTypeId,
        period: periodName,
        budget: 5000,
        amount: 5200,
        month_id: monthId,
      }),
    });
    expect(res.status).toBe(201);
    const data = (await res.json()) as { id: number; budget: number; amount: number };
    expect(data.budget).toBe(5000);
    expect(data.amount).toBe(5200);
  });

  test('create income for non-existent month fails', async () => {
    const res = await app.request('/api/v1/incomes', {
      method: 'POST',
      headers: apiHeaders(),
      body: JSON.stringify({
        income_type_id: incomeTypeId,
        period: periodName,
        month_id: 99999,
      }),
    });
    expect(res.status).toBe(400);
  });

  test('create income for non-existent income type fails', async () => {
    const res = await app.request('/api/v1/incomes', {
      method: 'POST',
      headers: apiHeaders(),
      body: JSON.stringify({
        income_type_id: 99999,
        period: periodName,
        month_id: monthId,
      }),
    });
    expect(res.status).toBe(400);
  });

  test('get income by id', async () => {
    const income = await seedIncome(app, monthId, {
      income_type_id: incomeTypeId,
      period: periodName,
      budget: 1000,
    });
    const res = await app.request(`/api/v1/incomes/${income.id}`, { headers: apiHeaders() });
    expect(res.status).toBe(200);
    const data = (await res.json()) as { budget: number };
    expect(data.budget).toBe(1000);
  });

  test('get non-existent income returns 404', async () => {
    const res = await app.request('/api/v1/incomes/99999', { headers: apiHeaders() });
    expect(res.status).toBe(404);
  });

  test('update an income', async () => {
    const income = await seedIncome(app, monthId, {
      income_type_id: incomeTypeId,
      period: periodName,
      budget: 2000,
    });
    const res = await app.request(`/api/v1/incomes/${income.id}`, {
      method: 'PUT',
      headers: apiHeaders(),
      body: JSON.stringify({ amount: 2500 }),
    });
    expect(res.status).toBe(200);
    const data = (await res.json()) as { amount: number };
    expect(data.amount).toBe(2500);
  });

  test('delete an income', async () => {
    const income = await seedIncome(app, monthId, {
      income_type_id: incomeTypeId,
      period: periodName,
    });
    const res = await app.request(`/api/v1/incomes/${income.id}`, {
      method: 'DELETE',
      headers: apiHeaders(),
    });
    expect(res.status).toBe(200);

    const getRes = await app.request(`/api/v1/incomes/${income.id}`, { headers: apiHeaders() });
    expect(getRes.status).toBe(404);
  });

  test('cannot add income to closed month', async () => {
    const closedMonth = await seedMonth(app, 2024, 6);
    await app.request(`/api/v1/months/${closedMonth.id}/close`, {
      method: 'POST',
      headers: apiHeaders(),
    });

    const res = await app.request('/api/v1/incomes', {
      method: 'POST',
      headers: apiHeaders(),
      body: JSON.stringify({
        income_type_id: incomeTypeId,
        period: periodName,
        month_id: closedMonth.id,
      }),
    });
    expect(res.status).toBe(400);
  });

  test('filter incomes by month_id', async () => {
    const res = await app.request(`/api/v1/incomes?month_id=${monthId}`, { headers: apiHeaders() });
    expect(res.status).toBe(200);
    const data = (await res.json()) as Array<{ month_id: number }>;
    expect(data.every((i) => i.month_id === monthId)).toBe(true);
  });
});

describe('Incomes (HTTP)', () => {
  let baseUrl: string;

  beforeAll(async () => {
    baseUrl = await startServer();
  });

  afterAll(async () => {
    await stopServer();
  });

  test('create and get income via HTTP', async () => {
    const createRes = await fetch(`${baseUrl}/api/v1/incomes`, {
      method: 'POST',
      headers: apiHeaders(),
      body: JSON.stringify({
        income_type_id: incomeTypeId,
        period: periodName,
        budget: 3000,
        month_id: monthId,
      }),
    });
    expect(createRes.status).toBe(201);
    const created = (await createRes.json()) as { id: number };

    const getRes = await fetch(`${baseUrl}/api/v1/incomes/${created.id}`, {
      headers: apiHeaders(),
    });
    expect(getRes.status).toBe(200);
  });
});
