import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import { getApp, startServer, stopServer } from './setup';
import { apiHeaders, seedMonth, seedPeriod, seedCategory, seedExpense, seedIncomeType, seedIncome } from './helpers';
import type { Hono } from 'hono';

let app: Hono;
let monthId: number;

beforeAll(async () => {
  app = await getApp();

  const period = await seedPeriod(app, 'Sum-Period');
  const cat = await seedCategory(app, 'Sum-Category');
  const it = await seedIncomeType(app, 'Sum-Salary');
  const month = await seedMonth(app, 2023, 3);
  monthId = month.id;

  await seedExpense(app, monthId, { expense_name: 'Rent', period: period.name, category: cat.name, budget: 1500, cost: 1500 });
  await seedExpense(app, monthId, { expense_name: 'Food', period: period.name, category: cat.name, budget: 500, cost: 400 });
  await seedIncome(app, monthId, { income_type_id: it.id, period: period.name, budget: 5000, amount: 5200 });
});

describe('Summary (Hono client)', () => {
  test('GET /api/v1/summary/totals', async () => {
    const res = await app.request(`/api/v1/summary/totals?month_id=${monthId}`, {
      headers: apiHeaders(),
    });
    expect(res.status).toBe(200);
    const data = (await res.json()) as {
      total_budget_expenses: number;
      total_current_expenses: number;
      total_budget_income: number;
      total_current_income: number;
      total_budget: number;
      total_current: number;
    };
    expect(data.total_budget_expenses).toBe(2000);
    expect(data.total_current_expenses).toBe(1900);
    expect(data.total_budget_income).toBe(5000);
    expect(data.total_current_income).toBe(5200);
    expect(data.total_budget).toBe(3000);
    expect(data.total_current).toBe(3300);
  });

  test('GET /api/v1/summary/totals without filters', async () => {
    const res = await app.request('/api/v1/summary/totals', { headers: apiHeaders() });
    expect(res.status).toBe(200);
    const data = (await res.json()) as { total_budget_expenses: number };
    expect(typeof data.total_budget_expenses).toBe('number');
  });

  test('GET /api/v1/summary/by-period', async () => {
    const res = await app.request(`/api/v1/summary/by-period?month_id=${monthId}`, {
      headers: apiHeaders(),
    });
    expect(res.status).toBe(200);
    const data = (await res.json()) as {
      periods: Array<{ period: string; total_income: number; total_expenses: number }>;
      grand_total_income: number;
      grand_total_expenses: number;
    };
    expect(Array.isArray(data.periods)).toBe(true);
    expect(typeof data.grand_total_income).toBe('number');
  });

  test('GET /api/v1/summary/expenses-by-period', async () => {
    const res = await app.request(`/api/v1/summary/expenses-by-period?month_id=${monthId}`, {
      headers: apiHeaders(),
    });
    expect(res.status).toBe(200);
    const data = (await res.json()) as Array<{
      period: string;
      budget: number;
      total: number;
      over_budget: boolean;
    }>;
    expect(Array.isArray(data)).toBe(true);
  });

  test('GET /api/v1/summary/monthly-trends', async () => {
    const res = await app.request('/api/v1/summary/monthly-trends?num_months=6', {
      headers: apiHeaders(),
    });
    expect(res.status).toBe(200);
    const data = (await res.json()) as {
      months: Array<{ month_name: string; total_income: number; total_expenses: number }>;
      average_income: number;
      average_expenses: number;
      average_savings_rate: number;
    };
    expect(Array.isArray(data.months)).toBe(true);
    expect(typeof data.average_income).toBe('number');
  });

  test('GET /api/v1/summary/insights', async () => {
    const res = await app.request(`/api/v1/summary/insights?month_id=${monthId}`, {
      headers: apiHeaders(),
    });
    expect(res.status).toBe(200);
    const data = (await res.json()) as {
      insights: Array<{ type: string; icon: string; message: string }>;
      savings_projection: number;
      budget_health: string;
      over_budget_count: number;
      total_categories: number;
    };
    expect(Array.isArray(data.insights)).toBe(true);
    expect(typeof data.savings_projection).toBe('number');
    expect(['good', 'warning', 'critical']).toContain(data.budget_health);
    expect(data.total_categories).toBeGreaterThan(0);
  });

  test('GET /api/v1/summary/insights without month returns default', async () => {
    const res = await app.request('/api/v1/summary/insights', { headers: apiHeaders() });
    expect(res.status).toBe(200);
  });
});

describe('Summary (HTTP)', () => {
  let baseUrl: string;

  beforeAll(async () => {
    baseUrl = await startServer();
  });

  afterAll(async () => {
    await stopServer();
  });

  test('GET totals via HTTP', async () => {
    const res = await fetch(`${baseUrl}/api/v1/summary/totals?month_id=${monthId}`, {
      headers: apiHeaders(),
    });
    expect(res.status).toBe(200);
    const data = (await res.json()) as { total_current_expenses: number };
    expect(typeof data.total_current_expenses).toBe('number');
  });

  test('GET insights via HTTP', async () => {
    const res = await fetch(`${baseUrl}/api/v1/summary/insights`, {
      headers: apiHeaders(),
    });
    expect(res.status).toBe(200);
  });
});
