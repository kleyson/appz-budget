import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import { getApp, startServer, stopServer } from './setup';
import { apiHeaders, seedCategory, seedMonth, seedExpense, seedPeriod } from './helpers';
import type { Hono } from 'hono';

let app: Hono;

beforeAll(async () => {
  app = await getApp();
});

describe('Categories (Hono client)', () => {
  test('list categories', async () => {
    const res = await app.request('/api/v1/categories', { headers: apiHeaders() });
    expect(res.status).toBe(200);
    const data = (await res.json()) as unknown[];
    expect(Array.isArray(data)).toBe(true);
  });

  test('create a category', async () => {
    const res = await app.request('/api/v1/categories', {
      method: 'POST',
      headers: apiHeaders(),
      body: JSON.stringify({ name: 'Food', color: '#ff0000' }),
    });
    expect(res.status).toBe(201);
    const data = (await res.json()) as { id: number; name: string; color: string };
    expect(data.name).toBe('Food');
    expect(data.color).toBe('#ff0000');
  });

  test('create duplicate category fails', async () => {
    const res = await app.request('/api/v1/categories', {
      method: 'POST',
      headers: apiHeaders(),
      body: JSON.stringify({ name: 'Food' }),
    });
    expect(res.status).toBe(400);
  });

  test('get category by id', async () => {
    const cat = await seedCategory(app, 'Transport', '#00ff00');
    const res = await app.request(`/api/v1/categories/${cat.id}`, { headers: apiHeaders() });
    expect(res.status).toBe(200);
    const data = (await res.json()) as { name: string };
    expect(data.name).toBe('Transport');
  });

  test('get non-existent category returns 404', async () => {
    const res = await app.request('/api/v1/categories/99999', { headers: apiHeaders() });
    expect(res.status).toBe(404);
  });

  test('update a category', async () => {
    const cat = await seedCategory(app, 'Utils');
    const res = await app.request(`/api/v1/categories/${cat.id}`, {
      method: 'PUT',
      headers: apiHeaders(),
      body: JSON.stringify({ name: 'Utilities', color: '#bbb' }),
    });
    expect(res.status).toBe(200);
    const data = (await res.json()) as { name: string; color: string };
    expect(data.name).toBe('Utilities');
    expect(data.color).toBe('#bbb');
  });

  test('delete a category with no dependencies', async () => {
    const cat = await seedCategory(app, 'ToDelete');
    const res = await app.request(`/api/v1/categories/${cat.id}`, {
      method: 'DELETE',
      headers: apiHeaders(),
    });
    expect(res.status).toBe(200);

    const getRes = await app.request(`/api/v1/categories/${cat.id}`, { headers: apiHeaders() });
    expect(getRes.status).toBe(404);
  });

  test('delete category with dependent expenses fails (409)', async () => {
    const cat = await seedCategory(app, 'HasExpenses');
    const period = await seedPeriod(app, 'CatDep-Period');
    const month = await seedMonth(app, 2025, 1);
    await seedExpense(app, month.id, {
      expense_name: 'Rent',
      period: period.name,
      category: cat.name,
      budget: 1000,
    });

    const res = await app.request(`/api/v1/categories/${cat.id}`, {
      method: 'DELETE',
      headers: apiHeaders(),
    });
    expect(res.status).toBe(409);
  });

  test('category summary', async () => {
    const res = await app.request('/api/v1/categories/summary', { headers: apiHeaders() });
    expect(res.status).toBe(200);
    const data = (await res.json()) as Array<{ category: string; budget: number; total: number }>;
    expect(Array.isArray(data)).toBe(true);
  });
});

describe('Categories (HTTP)', () => {
  let baseUrl: string;

  beforeAll(async () => {
    baseUrl = await startServer();
  });

  afterAll(async () => {
    await stopServer();
  });

  test('create and list categories via HTTP', async () => {
    const createRes = await fetch(`${baseUrl}/api/v1/categories`, {
      method: 'POST',
      headers: apiHeaders(),
      body: JSON.stringify({ name: 'HTTP-Cat', color: '#123456' }),
    });
    expect(createRes.status).toBe(201);

    const listRes = await fetch(`${baseUrl}/api/v1/categories`, {
      headers: apiHeaders(),
    });
    expect(listRes.status).toBe(200);
    const data = (await listRes.json()) as Array<{ name: string }>;
    expect(data.some((c) => c.name === 'HTTP-Cat')).toBe(true);
  });
});
