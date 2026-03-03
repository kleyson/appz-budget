/**
 * Reusable test utilities for E2E tests.
 */

import type { Hono } from 'hono';

const API_KEY = 'test-api-key';

// ─── Headers ────────────────────────────────────────────────────────────────

export function apiHeaders(token?: string): Record<string, string> {
  const headers: Record<string, string> = {
    'X-API-Key': API_KEY,
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

// ─── Auth helpers ───────────────────────────────────────────────────────────

export async function registerUser(
  app: Hono,
  email = 'test@example.com',
  password = 'testpass123',
  fullName = 'Test User',
) {
  const res = await app.request('/api/v1/auth/register', {
    method: 'POST',
    headers: apiHeaders(),
    body: JSON.stringify({ email, password, full_name: fullName }),
  });
  return res;
}

export async function loginUser(
  app: Hono,
  email = 'test@example.com',
  password = 'testpass123',
) {
  const res = await app.request('/api/v1/auth/login', {
    method: 'POST',
    headers: apiHeaders(),
    body: JSON.stringify({ email, password }),
  });
  return res;
}

export async function getToken(
  app: Hono,
  email = 'test@example.com',
  password = 'testpass123',
): Promise<string> {
  const res = await loginUser(app, email, password);
  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

export async function registerAndGetToken(
  app: Hono,
  email = 'test@example.com',
  password = 'testpass123',
  fullName = 'Test User',
): Promise<string> {
  await registerUser(app, email, password, fullName);
  return getToken(app, email, password);
}

// ─── HTTP fetch helpers (for real server tests) ─────────────────────────────

export async function httpRegisterUser(
  baseUrl: string,
  email = 'test@example.com',
  password = 'testpass123',
  fullName = 'Test User',
) {
  return fetch(`${baseUrl}/api/v1/auth/register`, {
    method: 'POST',
    headers: apiHeaders(),
    body: JSON.stringify({ email, password, full_name: fullName }),
  });
}

export async function httpLoginUser(
  baseUrl: string,
  email = 'test@example.com',
  password = 'testpass123',
) {
  return fetch(`${baseUrl}/api/v1/auth/login`, {
    method: 'POST',
    headers: apiHeaders(),
    body: JSON.stringify({ email, password }),
  });
}

export async function httpGetToken(
  baseUrl: string,
  email = 'test@example.com',
  password = 'testpass123',
): Promise<string> {
  const res = await httpLoginUser(baseUrl, email, password);
  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

export async function httpRegisterAndGetToken(
  baseUrl: string,
  email = 'test@example.com',
  password = 'testpass123',
  fullName = 'Test User',
): Promise<string> {
  await httpRegisterUser(baseUrl, email, password, fullName);
  return httpGetToken(baseUrl, email, password);
}

// ─── Seed data helpers ──────────────────────────────────────────────────────

export async function seedCategory(app: Hono, name: string, color = '#8b5cf6') {
  const res = await app.request('/api/v1/categories', {
    method: 'POST',
    headers: apiHeaders(),
    body: JSON.stringify({ name, color }),
  });
  return (await res.json()) as { id: number; name: string; color: string };
}

export async function seedPeriod(app: Hono, name: string, color = '#8b5cf6') {
  const res = await app.request('/api/v1/periods', {
    method: 'POST',
    headers: apiHeaders(),
    body: JSON.stringify({ name, color }),
  });
  return (await res.json()) as { id: number; name: string; color: string };
}

export async function seedIncomeType(app: Hono, name: string, color = '#10b981') {
  const res = await app.request('/api/v1/income-types', {
    method: 'POST',
    headers: apiHeaders(),
    body: JSON.stringify({ name, color }),
  });
  return (await res.json()) as { id: number; name: string; color: string };
}

export async function seedMonth(app: Hono, year: number, month: number) {
  const res = await app.request('/api/v1/months', {
    method: 'POST',
    headers: apiHeaders(),
    body: JSON.stringify({ year, month }),
  });
  return (await res.json()) as { id: number; name: string; year: number; month: number };
}

export async function seedExpense(
  app: Hono,
  monthId: number,
  data: {
    expense_name: string;
    period: string;
    category: string;
    budget?: number;
    cost?: number;
  },
) {
  const res = await app.request('/api/v1/expenses', {
    method: 'POST',
    headers: apiHeaders(),
    body: JSON.stringify({ month_id: monthId, ...data }),
  });
  return (await res.json()) as { id: number; expense_name: string };
}

export async function seedIncome(
  app: Hono,
  monthId: number,
  data: {
    income_type_id: number;
    period: string;
    budget?: number;
    amount?: number;
  },
) {
  const res = await app.request('/api/v1/incomes', {
    method: 'POST',
    headers: apiHeaders(),
    body: JSON.stringify({ month_id: monthId, ...data }),
  });
  return (await res.json()) as { id: number };
}
