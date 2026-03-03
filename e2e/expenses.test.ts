import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import { getApp, startServer, stopServer } from './setup';
import { apiHeaders, seedMonth, seedPeriod, seedCategory, seedExpense } from './helpers';
import type { Hono } from 'hono';

let app: Hono;
let monthId: number;
let periodName: string;
let categoryName: string;

beforeAll(async () => {
  app = await getApp();
  const period = await seedPeriod(app, 'Exp-Period');
  const cat = await seedCategory(app, 'Exp-Category');
  const month = await seedMonth(app, 2025, 5);
  monthId = month.id;
  periodName = period.name;
  categoryName = cat.name;
});

describe('Expenses (Hono client)', () => {
  test('list expenses', async () => {
    const res = await app.request('/api/v1/expenses', { headers: apiHeaders() });
    expect(res.status).toBe(200);
    const data = (await res.json()) as unknown[];
    expect(Array.isArray(data)).toBe(true);
  });

  test('create an expense', async () => {
    const res = await app.request('/api/v1/expenses', {
      method: 'POST',
      headers: apiHeaders(),
      body: JSON.stringify({
        expense_name: 'Groceries',
        period: periodName,
        category: categoryName,
        budget: 300,
        cost: 150,
        month_id: monthId,
      }),
    });
    expect(res.status).toBe(201);
    const data = (await res.json()) as { id: number; expense_name: string; budget: number; cost: number };
    expect(data.expense_name).toBe('Groceries');
    expect(data.budget).toBe(300);
    expect(data.cost).toBe(150);
  });

  test('create expense with purchases calculates cost', async () => {
    const res = await app.request('/api/v1/expenses', {
      method: 'POST',
      headers: apiHeaders(),
      body: JSON.stringify({
        expense_name: 'Dining Out',
        period: periodName,
        category: categoryName,
        budget: 200,
        month_id: monthId,
        purchases: [
          { name: 'Restaurant A', amount: 50 },
          { name: 'Restaurant B', amount: 30 },
        ],
      }),
    });
    expect(res.status).toBe(201);
    const data = (await res.json()) as { cost: number; purchases: Array<{ name: string; amount: number }> };
    expect(data.cost).toBe(80);
    expect(data.purchases).toHaveLength(2);
  });

  test('create expense for non-existent month fails', async () => {
    const res = await app.request('/api/v1/expenses', {
      method: 'POST',
      headers: apiHeaders(),
      body: JSON.stringify({
        expense_name: 'Bad',
        period: periodName,
        category: categoryName,
        month_id: 99999,
      }),
    });
    expect(res.status).toBe(400);
  });

  test('get expense by id', async () => {
    const exp = await seedExpense(app, monthId, {
      expense_name: 'GetById',
      period: periodName,
      category: categoryName,
    });
    const res = await app.request(`/api/v1/expenses/${exp.id}`, { headers: apiHeaders() });
    expect(res.status).toBe(200);
    const data = (await res.json()) as { expense_name: string };
    expect(data.expense_name).toBe('GetById');
  });

  test('get non-existent expense returns 404', async () => {
    const res = await app.request('/api/v1/expenses/99999', { headers: apiHeaders() });
    expect(res.status).toBe(404);
  });

  test('update an expense', async () => {
    const exp = await seedExpense(app, monthId, {
      expense_name: 'ToUpdate',
      period: periodName,
      category: categoryName,
      budget: 100,
    });
    const res = await app.request(`/api/v1/expenses/${exp.id}`, {
      method: 'PUT',
      headers: apiHeaders(),
      body: JSON.stringify({ expense_name: 'Updated', cost: 75 }),
    });
    expect(res.status).toBe(200);
    const data = (await res.json()) as { expense_name: string; cost: number };
    expect(data.expense_name).toBe('Updated');
    expect(data.cost).toBe(75);
  });

  test('delete an expense', async () => {
    const exp = await seedExpense(app, monthId, {
      expense_name: 'ToDelete',
      period: periodName,
      category: categoryName,
    });
    const res = await app.request(`/api/v1/expenses/${exp.id}`, {
      method: 'DELETE',
      headers: apiHeaders(),
    });
    expect(res.status).toBe(200);

    const getRes = await app.request(`/api/v1/expenses/${exp.id}`, { headers: apiHeaders() });
    expect(getRes.status).toBe(404);
  });

  test('cannot add expense to closed month', async () => {
    const closedMonth = await seedMonth(app, 2020, 1);
    await app.request(`/api/v1/months/${closedMonth.id}/close`, {
      method: 'POST',
      headers: apiHeaders(),
    });

    const res = await app.request('/api/v1/expenses', {
      method: 'POST',
      headers: apiHeaders(),
      body: JSON.stringify({
        expense_name: 'Blocked',
        period: periodName,
        category: categoryName,
        month_id: closedMonth.id,
      }),
    });
    expect(res.status).toBe(400);
  });

  test('reorder expenses', async () => {
    const e1 = await seedExpense(app, monthId, { expense_name: 'Reorder1', period: periodName, category: categoryName });
    const e2 = await seedExpense(app, monthId, { expense_name: 'Reorder2', period: periodName, category: categoryName });
    const e3 = await seedExpense(app, monthId, { expense_name: 'Reorder3', period: periodName, category: categoryName });

    const res = await app.request('/api/v1/expenses/reorder', {
      method: 'POST',
      headers: apiHeaders(),
      body: JSON.stringify({ expense_ids: [e3.id, e1.id, e2.id] }),
    });
    expect(res.status).toBe(200);
    const data = (await res.json()) as Array<{ id: number }>;
    expect(data[0].id).toBe(e3.id);
    expect(data[1].id).toBe(e1.id);
    expect(data[2].id).toBe(e2.id);
  });

  test('pay an expense', async () => {
    const exp = await seedExpense(app, monthId, {
      expense_name: 'ToPay',
      period: periodName,
      category: categoryName,
      budget: 100,
    });

    const res = await app.request(`/api/v1/expenses/${exp.id}/pay`, {
      method: 'POST',
      headers: apiHeaders(),
      body: JSON.stringify({ amount: 100, name: 'Full Payment' }),
    });
    expect(res.status).toBe(200);
    const data = (await res.json()) as { cost: number; purchases: Array<{ name: string; amount: number }> };
    expect(data.cost).toBe(100);
    expect(data.purchases).toHaveLength(1);
    expect(data.purchases[0].name).toBe('Full Payment');
  });

  test('filter expenses by month_id', async () => {
    const res = await app.request(`/api/v1/expenses?month_id=${monthId}`, { headers: apiHeaders() });
    expect(res.status).toBe(200);
    const data = (await res.json()) as Array<{ month_id: number }>;
    expect(data.every((e) => e.month_id === monthId)).toBe(true);
  });
});

describe('Expenses (HTTP)', () => {
  let baseUrl: string;

  beforeAll(async () => {
    baseUrl = await startServer();
  });

  afterAll(async () => {
    await stopServer();
  });

  test('create and get expense via HTTP', async () => {
    const createRes = await fetch(`${baseUrl}/api/v1/expenses`, {
      method: 'POST',
      headers: apiHeaders(),
      body: JSON.stringify({
        expense_name: 'HTTP-Expense',
        period: periodName,
        category: categoryName,
        budget: 100,
        month_id: monthId,
      }),
    });
    expect(createRes.status).toBe(201);
    const created = (await createRes.json()) as { id: number };

    const getRes = await fetch(`${baseUrl}/api/v1/expenses/${created.id}`, {
      headers: apiHeaders(),
    });
    expect(getRes.status).toBe(200);
    const data = (await getRes.json()) as { expense_name: string };
    expect(data.expense_name).toBe('HTTP-Expense');
  });
});
